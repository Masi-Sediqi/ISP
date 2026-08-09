const {
  ensurePostgresStore,
  getPool,
} = require("../services/postgresStore");

async function main() {
  await ensurePostgresStore();
  await getPool().query("TRUNCATE TABLE isp_collections");
  console.log("PostgreSQL app data cleared.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
