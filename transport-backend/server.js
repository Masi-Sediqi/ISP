import express from "express";
import cors from "cors";
import pg from "pg";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index <= 0) continue;
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(path.join(projectRoot, ".env"));
loadEnvFile(path.join(__dirname, ".env"));

const PORT = Number(process.env.PORT || process.env.ISP_API_PORT || 5050);
const pool = new Pool(
  process.env.DATABASE_URL || process.env.ISP_DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL || process.env.ISP_DATABASE_URL }
    : {
        host: process.env.PGHOST || "127.0.0.1",
        port: Number(process.env.PGPORT || 5432),
        database: process.env.PGDATABASE || "afghanpower",
        user: process.env.PGUSER || "afghanpower",
        password: process.env.PGPASSWORD || "",
      }
);

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_records (
      collection_name text NOT NULL,
      record_id text NOT NULL,
      record_data jsonb NOT NULL DEFAULT '{}'::jsonb,
      actor_id text,
      owner_id text,
      updated_at timestamptz NOT NULL DEFAULT now(),
      deleted_at timestamptz,
      PRIMARY KEY (collection_name, record_id)
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS app_records_collection_idx ON app_records (collection_name, updated_at)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS app_records_owner_idx ON app_records (owner_id)`);
}

function safeCollection(value) {
  const collection = String(value || "").trim();
  if (!collection || collection.length > 120 || !/^[A-Za-z0-9_-]+$/.test(collection)) {
    const error = new Error("Invalid collection name.");
    error.status = 400;
    throw error;
  }
  return collection;
}

function identityOf(record) {
  const value = record?.id ?? record?._id ?? record?.uuid ?? record?.recordId ?? record?.accountId;
  return String(value ?? "").trim();
}

async function getCollection(collection, { includeDeleted = false } = {}) {
  const result = await pool.query(
    `SELECT record_data FROM app_records
     WHERE collection_name = $1 ${includeDeleted ? "" : "AND deleted_at IS NULL"}
     ORDER BY updated_at ASC`,
    [collection]
  );
  return result.rows.map((row) => row.record_data).filter(Boolean);
}

async function applyChanges(client, collection, body = {}) {
  const upserts = Array.isArray(body.upserts) ? body.upserts : [];
  const deletes = Array.isArray(body.deletes) ? body.deletes : [];
  const identities = Array.isArray(body.identities) ? body.identities : [];
  const actorId = String(body.actorId || "") || null;
  const ownerId = String(body.ownerId || body.actorId || "") || null;
  const now = new Date().toISOString();

  for (let index = 0; index < upserts.length; index += 1) {
    const record = upserts[index];
    const recordId = String(identities[index] || identityOf(record));
    if (!recordId) throw Object.assign(new Error("A record is missing its identity."), { status: 400 });
    await client.query(
      `INSERT INTO app_records
       (collection_name, record_id, record_data, actor_id, owner_id, updated_at, deleted_at)
       VALUES ($1,$2,$3::jsonb,$4,$5,$6,NULL)
       ON CONFLICT (collection_name, record_id) DO UPDATE SET
         record_data = EXCLUDED.record_data,
         actor_id = EXCLUDED.actor_id,
         owner_id = EXCLUDED.owner_id,
         updated_at = EXCLUDED.updated_at,
         deleted_at = NULL`,
      [collection, recordId, JSON.stringify(record ?? {}), actorId, ownerId, now]
    );
  }

  for (const value of deletes) {
    const recordId = String(value || "").trim();
    if (!recordId) continue;
    await client.query(
      `INSERT INTO app_records
       (collection_name, record_id, record_data, actor_id, owner_id, updated_at, deleted_at)
       VALUES ($1,$2,'{}'::jsonb,$3,$4,$5,$5)
       ON CONFLICT (collection_name, record_id) DO UPDATE SET
         record_data = '{}'::jsonb,
         actor_id = EXCLUDED.actor_id,
         owner_id = EXCLUDED.owner_id,
         updated_at = EXCLUDED.updated_at,
         deleted_at = EXCLUDED.deleted_at`,
      [collection, recordId, actorId, ownerId, now]
    );
  }

  return { upserted: upserts.length, deleted: deletes.length };
}

const app = express();
app.disable("x-powered-by");
app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

app.get("/api/health", async (_req, res, next) => {
  try {
    const count = await pool.query(`SELECT COUNT(DISTINCT collection_name)::int AS count FROM app_records WHERE deleted_at IS NULL`);
    res.json({ ok: true, database: "postgresql", collectionCount: count.rows[0]?.count || 0 });
  } catch (error) { next(error); }
});

app.get("/api/collections/:collection", async (req, res, next) => {
  try { res.json(await getCollection(safeCollection(req.params.collection))); }
  catch (error) { next(error); }
});

app.post("/api/collections/:collection/changes", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const collection = safeCollection(req.params.collection);
    await client.query("BEGIN");
    const result = await applyChanges(client, collection, req.body);
    await client.query("COMMIT");
    res.json({ ok: true, ...result });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    next(error);
  } finally { client.release(); }
});

app.get("/api/backup/rows", async (_req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT collection_name, record_id, record_data, actor_id, owner_id, updated_at, deleted_at
      FROM app_records ORDER BY collection_name ASC, record_id ASC
    `);
    res.json(result.rows);
  } catch (error) { next(error); }
});

app.post("/api/backup/restore", async (req, res, next) => {
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const current = await client.query(`SELECT collection_name, record_id FROM app_records WHERE deleted_at IS NULL`);
    const wanted = new Set(rows.map((row) => `${row.collection_name}\u0000${row.record_id}`));
    const now = new Date().toISOString();

    for (const row of rows) {
      if (!row?.collection_name || !row?.record_id) continue;
      await client.query(
        `INSERT INTO app_records
         (collection_name, record_id, record_data, actor_id, owner_id, updated_at, deleted_at)
         VALUES ($1,$2,$3::jsonb,$4,$5,$6,$7)
         ON CONFLICT (collection_name, record_id) DO UPDATE SET
           record_data=EXCLUDED.record_data, actor_id=EXCLUDED.actor_id,
           owner_id=EXCLUDED.owner_id, updated_at=EXCLUDED.updated_at,
           deleted_at=EXCLUDED.deleted_at`,
        [String(row.collection_name), String(row.record_id), JSON.stringify(row.record_data || {}), row.actor_id || null, row.owner_id || null, row.updated_at || now, row.deleted_at || null]
      );
    }

    let archivedExtraRows = 0;
    for (const row of current.rows) {
      const key = `${row.collection_name}\u0000${row.record_id}`;
      if (wanted.has(key)) continue;
      await client.query(
        `UPDATE app_records SET record_data='{}'::jsonb, updated_at=$3, deleted_at=$3
         WHERE collection_name=$1 AND record_id=$2`,
        [row.collection_name, row.record_id, now]
      );
      archivedExtraRows += 1;
    }

    await client.query("COMMIT");
    res.json({ restoredRows: rows.length, archivedExtraRows, verified: true });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    next(error);
  } finally { client.release(); }
});

// Compatibility CRUD for pages that use /api/<collection> directly (for example Cars).
app.get("/api/:collection", async (req, res, next) => {
  try { res.json(await getCollection(safeCollection(req.params.collection))); }
  catch (error) { next(error); }
});

app.post("/api/:collection", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const collection = safeCollection(req.params.collection);
    const record = { ...(req.body || {}) };
    if (!identityOf(record)) record.id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    await client.query("BEGIN");
    await applyChanges(client, collection, { upserts: [record], identities: [identityOf(record)] });
    await client.query("COMMIT");
    res.status(201).json(record);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    next(error);
  } finally { client.release(); }
});

app.put("/api/:collection/:id", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const collection = safeCollection(req.params.collection);
    const current = await client.query(`SELECT record_data FROM app_records WHERE collection_name=$1 AND record_id=$2 AND deleted_at IS NULL`, [collection, String(req.params.id)]);
    const record = { ...(current.rows[0]?.record_data || {}), ...(req.body || {}), id: current.rows[0]?.record_data?.id ?? req.params.id };
    await client.query("BEGIN");
    await applyChanges(client, collection, { upserts: [record], identities: [String(req.params.id)] });
    await client.query("COMMIT");
    res.json(record);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    next(error);
  } finally { client.release(); }
});

app.delete("/api/:collection/:id", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const collection = safeCollection(req.params.collection);
    await client.query("BEGIN");
    await applyChanges(client, collection, { deletes: [String(req.params.id)] });
    await client.query("COMMIT");
    res.status(204).end();
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    next(error);
  } finally { client.release(); }
});

const distDir = path.join(projectRoot, "dist");
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^(?!\/api(?:\/|$)).*/, (_req, res) => res.sendFile(path.join(distDir, "index.html")));
}

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(Number(error?.status) || 500).json({ error: error?.message || "Server error" });
});

initDb()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => console.log(`Afghan Power API listening on port ${PORT}`));
  })
  .catch((error) => {
    console.error("Database init failed:", error);
    process.exit(1);
  });
