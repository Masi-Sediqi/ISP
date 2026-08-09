const fs = require("fs-extra");
const path = require("path");
const {
  ensurePostgresStore,
  writePostgresCollection,
} = require("../services/postgresStore");

const DATA_DIR =
  process.env.ISP_DATA_DIR || "C:/ISP Smart";

async function main() {
  await ensurePostgresStore();

  const files = (await fs.readdir(DATA_DIR))
    .filter(
      (file) =>
        path.extname(file).toLowerCase() === ".json"
    )
    .sort();

  for (const file of files) {
    const collection = path.basename(file, ".json");
    const fullPath = path.join(DATA_DIR, file);
    const data = await fs.readJson(fullPath);
    const items = Array.isArray(data) ? data : [];

    await writePostgresCollection(collection, items);
    console.log(
      `Imported ${collection}: ${items.length} record(s)`
    );
  }

  console.log("Migration completed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
