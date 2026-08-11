const fs = require("fs-extra");
const path = require("path");
const { Client } = require("pg");
const {
  ensurePostgresStore,
  getDatabaseUrl,
  getPool,
  isPostgresEnabled,
  writePostgresCollection,
} = require("../services/postgresStore");

const DATA_DIR = process.env.ISP_DATA_DIR || "C:/ISP Smart";

function quoteIdentifier(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

async function ensureTargetDatabaseExists() {
  const connectionString = getDatabaseUrl();
  const targetUrl = new URL(connectionString);
  const databaseName = decodeURIComponent(targetUrl.pathname.replace(/^\//, ""));

  if (!databaseName) {
    throw new Error("ISP_DATABASE_URL does not contain a database name.");
  }

  const maintenanceUrl = new URL(targetUrl.toString());
  maintenanceUrl.pathname = "/postgres";

  const client = new Client({
    connectionString: maintenanceUrl.toString(),
    connectionTimeoutMillis: Number(process.env.ISP_PG_CONNECT_TIMEOUT_MS || 5000),
  });

  await client.connect();

  try {
    const existing = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [databaseName]
    );

    if (!existing.rows.length) {
      await client.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
      console.log(`Created PostgreSQL database: ${databaseName}`);
    }
  } finally {
    await client.end();
  }
}

async function importJsonWhenDatabaseIsEmpty() {
  const pool = getPool();
  const existing = await pool.query("SELECT COUNT(*)::int AS count FROM isp_collections");

  if (Number(existing.rows[0]?.count || 0) > 0) {
    console.log(
      `PostgreSQL already contains ${existing.rows[0].count} collection(s); existing database data was kept.`
    );
    return;
  }

  if (!(await fs.pathExists(DATA_DIR))) {
    console.log(`JSON data directory was not found (${DATA_DIR}); PostgreSQL will start empty.`);
    return;
  }

  const files = (await fs.readdir(DATA_DIR))
    .filter((file) => path.extname(file).toLowerCase() === ".json")
    .sort();

  if (!files.length) {
    console.log("No JSON collections were found to migrate; PostgreSQL will start empty.");
    return;
  }

  let importedCollections = 0;
  let importedRecords = 0;

  for (const file of files) {
    const collection = path.basename(file, ".json");
    const fullPath = path.join(DATA_DIR, file);
    const data = await fs.readJson(fullPath);
    const items = Array.isArray(data) ? data : [];

    await writePostgresCollection(collection, items);
    importedCollections += 1;
    importedRecords += items.length;
    console.log(`Imported ${collection}: ${items.length} record(s)`);
  }

  console.log(
    `Initial PostgreSQL migration completed: ${importedCollections} collection(s), ${importedRecords} record(s).`
  );
}

async function main() {
  if (!isPostgresEnabled()) {
    throw new Error(
      "PostgreSQL is not configured. Set ISP_DATABASE_URL in transport-backend/.env, for example: postgres://postgres:root@localhost:5432/afghanpower_db1"
    );
  }

  await ensureTargetDatabaseExists();
  await ensurePostgresStore();

  const connection = await getPool().query(
    "SELECT current_database() AS database, current_user AS user, now() AS server_time"
  );

  console.log(
    `PostgreSQL connected: database=${connection.rows[0].database}, user=${connection.rows[0].user}`
  );

  await importJsonWhenDatabaseIsEmpty();

  const result = await getPool().query(
    "SELECT COUNT(*)::int AS count FROM isp_collections"
  );

  console.log(`PostgreSQL is ready (${result.rows[0].count} collection(s)).`);
  await getPool().end();
}

main().catch((error) => {
  console.error("PostgreSQL preparation failed:", error.message);
  console.error(
    "Make sure PostgreSQL is installed/running and transport-backend/.env contains the correct username, password, host and port."
  );
  process.exit(1);
});
