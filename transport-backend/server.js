const express = require("express");
const cors = require("cors");
const fs = require("fs-extra");
const path = require("path");

const app = express();
const DATA_DIR = "C:/TransportSystem/data";
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
app.use(express.json({ limit: "3mb" }));

function dataFile(collection) {
  return path.join(DATA_DIR, `${collection}.json`);
}

async function readCollection(collection) {
  const file = dataFile(collection);
  await fs.ensureDir(DATA_DIR);
  if (!(await fs.pathExists(file))) await fs.writeJson(file, [], { spaces: 2 });
  return fs.readJson(file);
}

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
    await fs.writeJson(dataFile(req.params.collection), req.body, { spaces: 2 });
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
    await fs.writeJson(dataFile(req.params.collection), items, { spaces: 2 });
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
    await fs.writeJson(dataFile(req.params.collection), items, { spaces: 2 });
    res.json(items[index]);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/:collection/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const items = (await readCollection(req.params.collection)).filter((item) => item.id !== id);
    await fs.writeJson(dataFile(req.params.collection), items, { spaces: 2 });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res) => {
  console.error(error);
  res.status(500).json({ error: "Unable to access data file" });
});

app.listen(5000, () => {
  console.log(`Server running on http://localhost:5000; data directory: ${DATA_DIR}`);
});
