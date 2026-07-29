const express = require("express");
const cors = require("cors");
const fs = require("fs-extra");
const path = require("path");
const { answerAdvancedReport } = require("./advancedReport");

const app = express();

const DEFAULT_PORT = Number(process.env.ISP_API_PORT || 5000);
const DEFAULT_HOST = process.env.ISP_API_HOST || "127.0.0.1";
const DEFAULT_DATA_DIR = "C:/ISP";

let activeDataDir = process.env.ISP_DATA_DIR || DEFAULT_DATA_DIR;
const writeQueues = new Map();

const COLLECTIONS = new Set([
  "settings",
  "accounts",
  "userRoles",

  "suppliers",
  "supplierPurchases",
  "supplierPayments",

  "assets",
  "assetCategories",
  "assetMovements",

  "customers",
  "packages",
  "customerPackages",
  "customerDevices",

  "customerPayments",
  "customerTravels",
  "customerDeviceBuybacks",

  "employeeTypes",
  "employees",
  "employeePayrolls",
  "employeeEarnings",
  "employeePayments",

  "towerAssets",
  "towerLinks",
  "deviceTransfers",
  "towerAssetTransfers",
  "deviceHistory",

  "disconnections",
  "securityDeposits",

  "transactions",
  "financeCategories",
  "financeBudgets",
  "reports",

  "travels",
  "travelExpenses",
  "cars",
  "carRepairs",
]);

app.use(cors());
app.use(express.json({ limit: "10mb" }));

function dataFile(collection) {
  return path.join(activeDataDir, `${collection}.json`);
}

async function ensureDataDirectory() {
  await fs.ensureDir(activeDataDir);
}

async function ensureCollectionFile(collection) {
  await ensureDataDirectory();

  const file = dataFile(collection);

  if (!(await fs.pathExists(file))) {
    await fs.writeJson(file, [], { spaces: 2 });
  }

  return file;
}

async function writeCollection(collection, items) {
  if (!COLLECTIONS.has(collection)) {
    throw new Error(`Unknown collection: ${collection}`);
  }

  if (!Array.isArray(items)) {
    throw new Error(`Collection data must be an array: ${collection}`);
  }

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
  if (!COLLECTIONS.has(collection)) {
    throw new Error(`Unknown collection: ${collection}`);
  }

  const file = await ensureCollectionFile(collection);

  try {
    const data = await fs.readJson(file);

    if (!Array.isArray(data)) {
      const brokenFile = `${file}.broken-${Date.now()}`;
      await fs.copy(file, brokenFile, { overwrite: true });
      await writeCollection(collection, []);
      return [];
    }

    return data;
  } catch {
    const brokenFile = `${file}.broken-${Date.now()}`;

    if (await fs.pathExists(file)) {
      await fs.copy(file, brokenFile, { overwrite: true });
    }

    await writeCollection(collection, []);
    return [];
  }
}

async function readOperationalData() {
  const names = [
    "suppliers",
    "supplierPurchases",
    "supplierPayments",

    "assets",
    "assetCategories",
    "assetMovements",

    "customers",
    "packages",
    "customerPackages",
    "customerDevices",

    "customerPayments",
    "customerTravels",
    "customerDeviceBuybacks",

    "employeeTypes",
    "employeePayrolls",
    "employeeEarnings",
    "employeePayments",

    "towerAssets",
    "towerLinks",
    "deviceTransfers",
    "towerAssetTransfers",
    "deviceHistory",

    "disconnections",
    "securityDeposits",

    "transactions",
    "financeCategories",
    "financeBudgets",
    "reports",
  ];

  const entries = await Promise.all(
    names.map(async (name) => [name, await readCollection(name)])
  );

  return Object.fromEntries(entries);
}

app.get("/api/health", (req, res) => {
  res.json({
    ready: true,
    app: "ISP Asset & Inventory Management",
    dataDirectory: activeDataDir,
  });
});

app.get("/api/collections", (req, res) => {
  res.json([...COLLECTIONS]);
});

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
  if (!COLLECTIONS.has(collection)) {
    return res.status(404).json({
      error: "Unknown collection",
      collection,
    });
  }

  next();
});

app.get("/api/:collection", async (req, res, next) => {
  try {
    const items = await readCollection(req.params.collection);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

app.put("/api/:collection", async (req, res, next) => {
  try {
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ error: "Expected an array" });
    }

    await writeCollection(req.params.collection, req.body);
    res.json(req.body);
  } catch (error) {
    next(error);
  }
});

app.post("/api/:collection", async (req, res, next) => {
  try {
    const items = await readCollection(req.params.collection);

    const item = {
      id: Date.now(),
      ...req.body,
      createdAt: req.body?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

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

    const index = items.findIndex((item) => Number(item.id) === id);

    if (index === -1) {
      return res.status(404).json({ error: "Item not found" });
    }

    items[index] = {
      ...items[index],
      ...req.body,
      id,
      updatedAt: new Date().toISOString(),
    };

    await writeCollection(req.params.collection, items);

    res.json(items[index]);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/:collection/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const items = await readCollection(req.params.collection);

    const nextItems = items.filter((item) => Number(item.id) !== id);

    await writeCollection(req.params.collection, nextItems);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  void next;
  console.error("ISP server error:", error);

  res.status(500).json({
    error: "Unable to access data file",
    message: error.message,
  });
});

function startServer(options = {}) {
  const port = options.port ?? DEFAULT_PORT;
  const host = options.host ?? DEFAULT_HOST;

  activeDataDir = options.dataDir || activeDataDir;

  return new Promise((resolve, reject) => {
    let settled = false;

    const server = app.listen(port, host, () => {
      const address = server.address();
      const resolvedPort =
        address && typeof address === "object" ? address.port : Number(port);

      if (!resolvedPort) {
        const error = new Error("Unable to determine the backend server port.");

        if (!settled) {
          settled = true;
          reject(error);
        }

        server.close();
        return;
      }

      console.log(
        `ISP server running on http://${host}:${resolvedPort}; data directory: ${activeDataDir}`
      );

      settled = true;
      resolve({
        server,
        port: resolvedPort,
        host,
        dataDir: activeDataDir,
      });
    });

    server.on("error", (error) => {
      if (!settled) {
        settled = true;
        reject(error);
        return;
      }

      console.error("ISP server runtime error:", error);
    });
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Unable to start ISP server:", error);
    process.exit(1);
  });
}

module.exports = {
  app,
  startServer,
};
