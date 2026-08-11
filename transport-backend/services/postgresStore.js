const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

let pool = null;
let readyPromise = null;
let envLoaded = false;

function loadLocalEnv() {
  if (envLoaded) return;

  envLoaded = true;

  if (process.env.ISP_DISABLE_LOCAL_ENV === "1") return;

  const envPath = path.join(__dirname, "..", ".env");

  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) return;

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}

function getDatabaseUrl() {
  loadLocalEnv();

  return (
    process.env.ISP_DATABASE_URL ||
    process.env.DATABASE_URL ||
    ""
  ).trim();
}

function isPostgresEnabled() {
  return Boolean(getDatabaseUrl());
}

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: getDatabaseUrl(),
      max: Number(process.env.ISP_PG_POOL_MAX || 20),
      idleTimeoutMillis: Number(process.env.ISP_PG_IDLE_TIMEOUT_MS || 30000),
      connectionTimeoutMillis: Number(process.env.ISP_PG_CONNECT_TIMEOUT_MS || 5000),
      keepAlive: true,
    });

    pool.on("error", (error) => {
      console.error("Unexpected PostgreSQL pool error:", error.message);
    });
  }

  return pool;
}

async function ensurePostgresStore() {
  if (!isPostgresEnabled()) {
    return false;
  }

  if (!readyPromise) {
    readyPromise = getPool().query(`
      CREATE TABLE IF NOT EXISTS isp_collections (
        name text PRIMARY KEY,
        items jsonb NOT NULL DEFAULT '[]'::jsonb,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
  }

  await readyPromise;
  return true;
}

async function readPostgresCollection(collection) {
  await ensurePostgresStore();

  const result = await getPool().query(
    "SELECT items FROM isp_collections WHERE name = $1",
    [collection]
  );

  if (!result.rows.length) {
    await writePostgresCollection(collection, []);
    return [];
  }

  return Array.isArray(result.rows[0].items)
    ? result.rows[0].items
    : [];
}

async function writePostgresCollection(collection, items) {
  await ensurePostgresStore();

  await getPool().query(
    `
      INSERT INTO isp_collections (name, items, updated_at)
      VALUES ($1, $2::jsonb, now())
      ON CONFLICT (name)
      DO UPDATE SET
        items = EXCLUDED.items,
        updated_at = now()
    `,
    [collection, JSON.stringify(items)]
  );
}

module.exports = {
  ensurePostgresStore,
  getDatabaseUrl,
  getPool,
  isPostgresEnabled,
  readPostgresCollection,
  writePostgresCollection,
};
