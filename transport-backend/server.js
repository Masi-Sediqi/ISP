const express = require("express");
const cors = require("cors");
const fs = require("fs-extra");
const path = require("path");
const { answerAdvancedReport } = require("./advancedReport");

const app = express();
const DEFAULT_PORT = Number(process.env.TRANSPORT_API_PORT || 5000);
const DEFAULT_HOST = process.env.TRANSPORT_API_HOST || "127.0.0.1";
const LEGACY_DATA_DIR = "C:/TransportSystem/data";
let activeDataDir = process.env.TRANSPORT_DATA_DIR || LEGACY_DATA_DIR;
const writeQueues = new Map();
const COLLECTIONS = new Set([
  "cars",
  "drivers",
  "travels",
  "customers",
  "customerTravels",
  "customerPayments",
  "transactions",
  "carRepairs",
  "travelExpenses",
  "destinations",
  "settings",
  "accounts",
  "financeBudgets",
]);

app.use(cors());
app.use(express.json({ limit: "10mb" }));

function dataFile(collection) {
  return path.join(activeDataDir, `${collection}.json`);
}

async function ensureDataDirectory() {
  await fs.ensureDir(activeDataDir);

  const targetFiles = await fs.readdir(activeDataDir).catch(() => []);
  if (activeDataDir !== LEGACY_DATA_DIR && targetFiles.length === 0 && await fs.pathExists(LEGACY_DATA_DIR)) {
    const legacyFiles = await fs.readdir(LEGACY_DATA_DIR);
    await Promise.all(
      legacyFiles
        .filter((file) => file.endsWith(".json"))
        .map((file) => fs.copy(path.join(LEGACY_DATA_DIR, file), path.join(activeDataDir, file), { overwrite: false }))
    );
  }
}

async function writeCollection(collection, items) {
  const previous = writeQueues.get(collection) || Promise.resolve();
  const next = previous.then(async () => {
    await ensureDataDirectory();
    const file = dataFile(collection);
    const tempFile = `${file}.${process.pid}.tmp`;
    const backupFile = `${file}.bak`;

    if (await fs.pathExists(file)) {
      await fs.copy(file, backupFile, { overwrite: true });
    }

    await fs.writeJson(tempFile, items, { spaces: 2 });
    await fs.move(tempFile, file, { overwrite: true });
  });

  writeQueues.set(collection, next.catch(() => {}));
  return next;
}

async function readCollection(collection) {
  const file = dataFile(collection);
  await ensureDataDirectory();
  if (!(await fs.pathExists(file))) await writeCollection(collection, []);
  return fs.readJson(file);
}

async function readOperationalData() {
  const names = [
    "cars",
    "drivers",
    "travels",
    "customers",
    "customerTravels",
    "customerPayments",
    "transactions",
    "carRepairs",
    "travelExpenses",
    "destinations",
    "financeBudgets",
  ];
  const entries = await Promise.all(
    names.map(async (name) => [name, await readCollection(name)])
  );
  return Object.fromEntries(entries);
}

app.get("/api/advanced-report/status", (req, res) => {
  res.json({
    ready: true,
    mode: process.env.OPENAI_API_KEY ? "openai" : "local",
    model: process.env.OPENAI_API_KEY
      ? process.env.OPENAI_MODEL || "gpt-5.4-mini"
      : null,
  });
});

app.post("/api/advanced-report/chat", async (req, res) => {
  try {
    const question = String(req.body?.question || "").trim();
    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }
    const history = Array.isArray(req.body?.history) ? req.body.history : [];
    const data = await readOperationalData();
    res.json(await answerAdvancedReport(question, history, data));
  } catch (error) {
    console.error("Advanced report error:", error);
    res.status(500).json({ error: "Unable to analyze system data" });
  }
});

app.param("collection", (req, res, next, collection) => {
  if (!COLLECTIONS.has(collection)) return res.status(404).json({ error: "Unknown collection" });
  next();
});

app.get("/api/:collection", async (req, res, next) => {
  try {
    res.json(await readCollection(req.params.collection));
  } catch (error) {
    next(error);
  }
});

app.put("/api/:collection", async (req, res, next) => {
  try {
    if (!Array.isArray(req.body)) return res.status(400).json({ error: "Expected an array" });
    await writeCollection(req.params.collection, req.body);
    res.json(req.body);
  } catch (error) {
    next(error);
  }
});

app.post("/api/:collection", async (req, res, next) => {
  try {
    const items = await readCollection(req.params.collection);
    const item = { id: Date.now(), ...req.body };
    items.push(item);
    await writeCollection(req.params.collection, items);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

app.put("/api/:collection/:id", async (req, res, next) => {
  try {
    const items = await readCollection(req.params.collection);
    const id = Number(req.params.id);
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return res.status(404).json({ error: "Item not found" });
    items[index] = { ...items[index], ...req.body, id };
    await writeCollection(req.params.collection, items);
    res.json(items[index]);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/:collection/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const items = (await readCollection(req.params.collection)).filter((item) => item.id !== id);
    await writeCollection(req.params.collection, items);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res) => {
  console.error(error);
  res.status(500).json({ error: "Unable to access data file" });
});

function startServer(options = {}) {
  const port = options.port ?? DEFAULT_PORT;
  const host = options.host ?? DEFAULT_HOST;
  activeDataDir = options.dataDir || activeDataDir;

  return new Promise((resolve, reject) => {
    const server = app.listen(port, host, () => {
      const address = server.address();
      console.log(`Server running on http://${host}:${address.port}; data directory: ${activeDataDir}`);
      resolve({ server, port: address.port, host, dataDir: activeDataDir });
    });
    server.on("error", reject);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { app, startServer };
