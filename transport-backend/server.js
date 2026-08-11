const express = require("express");
const cors = require("cors");
const fs = require("fs-extra");
const path = require("path");
const http = require("http");
const os = require("os");
const { execFile } = require("child_process");
const { Server } = require("socket.io");
const { answerAdvancedReport } = require("./advancedReport");
const {
  ALLOWED_LICENSE_TYPES,
  calculateEndDate,
  createLicenseCode,
} = require("./services/licenseGenerator");
const {
  ensurePostgresStore,
  isPostgresEnabled,
  readPostgresCollection,
  writePostgresCollection,
} = require("./services/postgresStore");

const app = express();

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: true,
    credentials: true,
  },
});
const DEFAULT_PORT = Number(process.env.ISP_API_PORT || 5050);
const DEFAULT_HOST = process.env.ISP_API_HOST || "0.0.0.0";
const DEFAULT_DATA_DIR = "C:/ISP Smart";
const LEGACY_DATA_DIR = "C:/ISP";
const DEFAULT_ADMIN_ACCOUNT = {
  id: "default-admin",
  email: "admin@gmail.com",
  role: "Admin",
  fullName: "System Administrator",
  status: "Active",
};

let activeDataDir = process.env.ISP_DATA_DIR || DEFAULT_DATA_DIR;
let dataDirectoryPrepared = false;
const writeQueues = new Map();
const licenseRateLimits = new Map();
let recycleArchiveQueue = Promise.resolve();

const COLLECTIONS = new Set([
  "settings",
  "accounts",
  "userRoles",

  "suppliers",
  "supplierPurchases",
  "supplierPayments",

  "customers",
  "customerPayments",
  "customerPackages",
  "customerDevices",
  "customerTravels",
  "customerDeviceBuybacks",

  "employeeTypes",
  "employees",
  "employeePayrolls",
  "employeeEarnings",
  "employeePayments",
  "employeeAdjustments",

  "consultantCustomers",
  "travelCustomers",
  "technologyCustomers",

  // Packages
  "visaPackages",
  "travelPackages",
  "technologyPackages",
  "mediaPackages",

  "educationInstitutions",
  "mediaProducts",
  "messages",

  "transactions",
  "financeCategories",
  "financeBudgets",

  "assets",
  "assetCategories",
  "assetMovements",
  "packages",
  "officeAssets",
  "officeAssetItems",
  "officeAssetCategories",
  "towerAssets",
  "towerLinks",
  "deviceTransfers",
  "towerAssetTransfers",
  "deviceHistory",
  "disconnections",
  "securityDeposits",

  "cars",
  "drivers",
  "destinations",
  "travels",
  "customerTravels",
  "travelExpenses",
  "carRepairs",

  "reports",
  "projects",
  "projectSales",
  "projectLicenses",
  "recycleBin",
]);

function isValidCollectionName(collection) {
  return /^[A-Za-z][A-Za-z0-9_-]{0,79}$/.test(String(collection || ""));
}

function ensureCollectionIsRegistered(collection) {
  if (!isValidCollectionName(collection)) {
    throw new Error(`Unknown collection: ${collection}`);
  }

  COLLECTIONS.add(collection);
}

app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");

  if (process.env.NODE_ENV === "production" && process.env.ISP_ALLOW_HTTP !== "1") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    const protocol = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
    if (req.path.startsWith("/api") && protocol !== "https" && !req.secure) {
      return res.status(403).json({ success: false, error: "HTTPS is required in production." });
    }
  }

  next();
});
app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (process.env.NODE_ENV !== "production") {
        callback(null, true);
        return;
      }

      const allowedOrigins = String(process.env.GENERATOR_ALLOWED_ORIGINS || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS origin is not allowed."));
    },
  })
);
app.use(express.json({ limit: "10mb" }));

function dataFile(collection) {
  return path.join(activeDataDir, `${collection}.json`);
}

async function ensureDataDirectory() {
  await fs.ensureDir(activeDataDir);

  if (!dataDirectoryPrepared) {
    dataDirectoryPrepared = true;
    await copyJsonFilesIfMissing(LEGACY_DATA_DIR, activeDataDir);
  }
}

async function copyJsonFilesIfMissing(sourceDir, targetDir) {
  if (
    !sourceDir ||
    path.resolve(sourceDir).toLowerCase() === path.resolve(targetDir).toLowerCase() ||
    !(await fs.pathExists(sourceDir))
  ) {
    return;
  }

  const entries = await fs.readdir(sourceDir, { withFileTypes: true });

  await Promise.all(
    entries
      .filter(
        (entry) =>
          entry.isFile() && path.extname(entry.name).toLowerCase() === ".json"
      )
      .map(async (entry) => {
        const sourceFile = path.join(sourceDir, entry.name);
        const targetFile = path.join(targetDir, entry.name);

        if (!(await fs.pathExists(targetFile))) {
          await fs.copy(sourceFile, targetFile);
        }
      })
  );
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
  ensureCollectionIsRegistered(collection);

  if (!Array.isArray(items)) {
    throw new Error(`Collection data must be an array: ${collection}`);
  }

  if (isPostgresEnabled()) {
    await ensurePostgresStore();
    await writePostgresCollection(collection, items);
    return;
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
  ensureCollectionIsRegistered(collection);

  if (isPostgresEnabled()) {
    await ensurePostgresStore();
    return readPostgresCollection(collection);
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

function recordIdentity(record) {
  const keys = [
    "id",
    "_id",
    "assetId",
    "customerId",
    "employeeId",
    "projectId",
    "transactionId",
    "transferId",
  ];

  for (const key of keys) {
    if (record?.[key] !== undefined && record?.[key] !== null) {
      return `${key}:${String(record[key])}`;
    }
  }

  return `data:${JSON.stringify(record)}`;
}

function recordLabel(record, collection) {
  return (
    record?.packageName ||
    record?.customerName ||
    record?.fullName ||
    record?.projectName ||
    record?.supplierName ||
    record?.name ||
    record?.title ||
    record?.assetId ||
    record?.id ||
    collection
  );
}

async function archiveRemovedRecords(collection, previousItems, nextItems, actorId = "") {
  if (collection === "recycleBin") return;

  const remainingIdentities = new Set(nextItems.map(recordIdentity));
  const removedItems = previousItems.filter(
    (item) => !remainingIdentities.has(recordIdentity(item))
  );

  if (!removedItems.length) return;

  recycleArchiveQueue = recycleArchiveQueue.then(async () => {
    const recycleItems = await readCollection("recycleBin");
    const deletedAt = new Date().toISOString();

    const entries = removedItems.map((record, index) => ({
      id: `recycle-${Date.now()}-${index}-${Math.random()
        .toString(36)
        .slice(2, 9)}`,
      sourceCollection: collection,
      sourceType: "server",
      recordId: recordIdentity(record),
      recordLabel: String(recordLabel(record, collection)),
      record,
      deletedAt,
      deletedByAccountId: actorId,
    }));

    await writeCollection("recycleBin", [...recycleItems, ...entries]);
  });

  await recycleArchiveQueue;
}

async function recoverDeletedRecordsFromBackups() {
  const recoveryMarker = path.join(
    activeDataDir,
    ".recycle-backup-recovery-v1.json"
  );

  if (await fs.pathExists(recoveryMarker)) return;

  const recycleItems = await readCollection("recycleBin");
  const knownEntries = new Set(
    recycleItems.map(
      (item) => `${item.sourceCollection}|${item.recordId}`
    )
  );
  const recoveredEntries = [];

  for (const collection of COLLECTIONS) {
    if (collection === "recycleBin") continue;

    const backupFile = `${dataFile(collection)}.bak`;
    if (!(await fs.pathExists(backupFile))) continue;

    try {
      const backupItems = await fs.readJson(backupFile);
      if (!Array.isArray(backupItems)) continue;

      const currentItems = await readCollection(collection);
      const currentIdentities = new Set(currentItems.map(recordIdentity));
      const backupStats = await fs.stat(backupFile);

      for (const record of backupItems) {
        const identity = recordIdentity(record);
        const entryKey = `${collection}|${identity}`;

        if (
          currentIdentities.has(identity) ||
          knownEntries.has(entryKey)
        ) {
          continue;
        }

        knownEntries.add(entryKey);
        recoveredEntries.push({
          id: `recovered-${Date.now()}-${recoveredEntries.length}-${Math.random()
            .toString(36)
            .slice(2, 9)}`,
          sourceCollection: collection,
          sourceType: "server",
          recordId: identity,
          recordLabel: String(recordLabel(record, collection)),
          record,
          deletedAt: backupStats.mtime.toISOString(),
          recoveredFromBackup: true,
        });
      }
    } catch (error) {
      console.warn(`Unable to inspect ${collection} backup:`, error.message);
    }
  }

  if (recoveredEntries.length) {
    await writeCollection("recycleBin", [
      ...recycleItems,
      ...recoveredEntries,
    ]);
  }

  await fs.writeJson(
    recoveryMarker,
    {
      completedAt: new Date().toISOString(),
      recoveredRecords: recoveredEntries.length,
    },
    { spaces: 2 }
  );
}

function isInactiveAccount(account) {
  const status = String(account?.status || account?.accountStatus || "Active").toLowerCase();
  return ["inactive", "disabled", "blocked", "suspended"].includes(status);
}

function isAdminAccount(account) {
  const role = String(account?.role || account?.roleName || account?.accountType || "").toLowerCase();
  return ["admin", "administrator", "super admin", "full admin", "full administrator"].includes(role);
}

async function requireAuthentication(req, res, next) {
  try {
    const sessionId = String(req.headers["x-isp-session-id"] || "").trim();
    if (!sessionId) {
      return res.status(401).json({ success: false, error: "Authentication is required." });
    }

    if (sessionId === DEFAULT_ADMIN_ACCOUNT.id) {
      req.user = DEFAULT_ADMIN_ACCOUNT;
      return next();
    }

    const accounts = await readCollection("accounts");
    const account = accounts.find((item) => String(item.id) === sessionId);

    if (!account || isInactiveAccount(account)) {
      return res.status(401).json({ success: false, error: "Authentication is invalid." });
    }

    req.user = account;
    return next();
  } catch (error) {
    return next(error);
  }
}

function requireAdminRole(req, res, next) {
  if (!isAdminAccount(req.user)) {
    return res.status(403).json({ success: false, error: "Admin access is required." });
  }
  return next();
}

function isValidDateOnly(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validateLicenseRequest(req, res, next) {
  try {
    const body = req.body;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({ success: false, error: "License request is invalid." });
    }

    if (Buffer.byteLength(JSON.stringify(body), "utf8") > 16 * 1024) {
      return res.status(413).json({ success: false, error: "License request is too large." });
    }

    const request = {
      projectId: String(body.projectId || "").trim(),
      projectName: String(body.projectName || "").trim(),
      customerId: String(body.customerId || "").trim(),
      customerName: String(body.customerName || "").trim(),
      deviceId: String(body.deviceId || "").trim().toUpperCase(),
      licenseType: String(body.licenseType || "").trim(),
      startDate: String(body.startDate || "").trim(),
      endDate: String(body.endDate || "").trim(),
      status: "Active",
      features: body.features === undefined ? ["all"] : body.features,
    };

    if (!request.projectName) return res.status(400).json({ success: false, error: "Project name is required." });
    if (!request.customerName) return res.status(400).json({ success: false, error: "Customer name is required." });
    if (!request.deviceId) return res.status(400).json({ success: false, error: "Device ID is required." });
    if (request.deviceId.startsWith("WEB-")) {
      return res.status(400).json({
        success: false,
        error: "Browser Device IDs cannot be used for production licenses. Copy the Device ID from the installed Electron customer application.",
      });
    }
    if (!ALLOWED_LICENSE_TYPES.has(request.licenseType)) {
      return res.status(400).json({ success: false, error: "License type is invalid." });
    }
    if (!isValidDateOnly(request.startDate)) {
      return res.status(400).json({ success: false, error: "License start date is invalid." });
    }
    if (request.licenseType !== "forever" && !isValidDateOnly(request.endDate)) {
      return res.status(400).json({ success: false, error: "License end date is invalid." });
    }

    const trustedEndDate = calculateEndDate(request.startDate, request.licenseType, request.endDate);
    if (request.licenseType !== "forever" && trustedEndDate < request.startDate) {
      return res.status(400).json({ success: false, error: "License end date cannot be before the start date." });
    }

    if (!Array.isArray(request.features) || request.features.length > 50) {
      return res.status(400).json({ success: false, error: "License features are invalid." });
    }

    for (const feature of request.features) {
      const value = String(feature || "").trim();
      if (!value || value.length > 80 || !/^[A-Za-z0-9._:-]+$/.test(value)) {
        return res.status(400).json({ success: false, error: "License features are invalid." });
      }
    }

    req.licenseRequest = {
      ...request,
      endDate: request.licenseType === "forever" ? "" : trustedEndDate,
      features: request.features.map((feature) => String(feature).trim()),
    };
    return next();
  } catch (error) {
    return next(error);
  }
}

function rateLimitLicenseGeneration(req, res, next) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const maxRequests = 20;
  const key = `${req.user?.id || "anonymous"}:${req.ip}`;
  const timestamps = (licenseRateLimits.get(key) || []).filter((timestamp) => now - timestamp < windowMs);

  if (timestamps.length >= maxRequests) {
    return res.status(429).json({ success: false, error: "Too many license generation requests. Please try again later." });
  }

  timestamps.push(now);
  licenseRateLimits.set(key, timestamps);
  return next();
}

function auditFile() {
  return path.join(activeDataDir, "licenseGenerationAudit.json");
}

function getRequestIp(req) {
  return String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket.remoteAddress || req.ip || "";
}

async function appendLicenseAuditLog(entry) {
  await ensureDataDirectory();
  const file = auditFile();
  let rows = [];

  try {
    if (await fs.pathExists(file)) {
      const data = await fs.readJson(file);
      rows = Array.isArray(data) ? data : [];
    }
  } catch {
    rows = [];
  }

  rows.push(entry);
  await fs.writeJson(file, rows.slice(-5000), { spaces: 2 });
}

function auditLicenseGeneration(req, _res, next) {
  req.auditLicenseGeneration = async (result) => {
    const payload = result?.certificate?.payload;
    if (!payload) return;

    await appendLicenseAuditLog({
      licenseId: payload.licenseId,
      customerId: payload.customerId,
      customerName: payload.customerName,
      projectId: payload.projectId,
      projectName: payload.projectName,
      deviceId: payload.deviceId,
      licenseType: payload.licenseType,
      startsAt: payload.startsAt,
      expiresAt: payload.expiresAt,
      generatedBy: req.user?.id || "",
      generatedAt: new Date().toISOString(),
      requestIp: getRequestIp(req),
    });
  };
  next();
}

async function readOperationalData() {
  const names = [
    "suppliers",
    "supplierPurchases",
    "supplierPayments",
    "customers",
    "customerPayments",
    "employeeTypes",
    "employeePayrolls",
    "employeeEarnings",
    "employeePayments",
    "reports",
  ];

  const entries = await Promise.all(
    names.map(async (name) => [name, await readCollection(name)])
  );

  return Object.fromEntries(entries);
}




const onlineUsers = new Map();

io.on("connection", (socket) => {
  socket.on("chat:join", ({ accountId }) => {
    const normalizedAccountId = String(
      accountId || ""
    ).trim();

    if (!normalizedAccountId) return;

    socket.data.accountId = normalizedAccountId;
    socket.join(`account:${normalizedAccountId}`);

    onlineUsers.set(
      normalizedAccountId,
      socket.id
    );

    io.emit(
      "chat:online-users",
      Array.from(onlineUsers.keys())
    );
  });

  socket.on("chat:send", async (payload, callback) => {
    try {
      const fromAccountId = String(
        payload?.fromAccountId || ""
      ).trim();

      const toAccountId = String(
        payload?.toAccountId || ""
      ).trim();

      const text = String(
        payload?.text || ""
      ).trim();

      if (!fromAccountId || !toAccountId || !text) {
        callback?.({
          success: false,
          error: "Message information is incomplete.",
        });

        return;
      }

      const messages = await readCollection("messages");

      const message = {
        id:
          typeof crypto !== "undefined" &&
          crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 10)}`,

        fromAccountId,
        toAccountId,

        fromEmployeeId: String(
          payload?.fromEmployeeId || ""
        ),

        toEmployeeId: String(
          payload?.toEmployeeId || ""
        ),

        senderName: String(
          payload?.senderName || "Employee"
        ),

        receiverName: String(
          payload?.receiverName || "Employee"
        ),

        text,

        seen: false,
        delivered: false,

        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      messages.push(message);
      await writeCollection("messages", messages);

      io.to(`account:${fromAccountId}`).emit(
        "chat:message",
        message
      );

      io.to(`account:${toAccountId}`).emit(
        "chat:message",
        message
      );

      callback?.({
        success: true,
        message,
      });
    } catch (error) {
      console.error(
        "Unable to send chat message:",
        error
      );

      callback?.({
        success: false,
        error: "Unable to send message.",
      });
    }
  });

  socket.on("chat:seen", async ({ messageIds }) => {
    try {
      const ids = Array.isArray(messageIds)
        ? messageIds.map(String)
        : [];

      if (!ids.length) return;

      const messages = await readCollection("messages");

      const updatedAt = new Date().toISOString();

      const nextMessages = messages.map((message) =>
        ids.includes(String(message.id))
          ? {
              ...message,
              seen: true,
              delivered: true,
              seenAt: updatedAt,
              updatedAt,
            }
          : message
      );

      await writeCollection(
        "messages",
        nextMessages
      );

      io.emit("chat:messages-seen", {
        messageIds: ids,
        seenAt: updatedAt,
      });
    } catch (error) {
      console.error(
        "Unable to mark messages as seen:",
        error
      );
    }
  });

  socket.on("disconnect", () => {
    const accountId = socket.data.accountId;

    if (accountId) {
      onlineUsers.delete(accountId);

      io.emit(
        "chat:online-users",
        Array.from(onlineUsers.keys())
      );
    }
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    ready: true,
    app: "ISP Smart Asset & Inventory Management",
    storage: isPostgresEnabled() ? "postgres" : "json",
    dataDirectory: activeDataDir,
  });
});

function detectWifiName() {
  if (process.platform !== "win32") return Promise.resolve("");

  return new Promise((resolve) => {
    execFile(
      "netsh",
      ["wlan", "show", "interfaces"],
      { windowsHide: true, timeout: 3000 },
      (error, stdout) => {
        if (error) return resolve("");
        const match = String(stdout || "").match(/^\s*SSID\s*:\s*(.+?)\s*$/mi);
        resolve(match?.[1]?.trim() || "");
      }
    );
  });
}

app.get("/api/network-info", async (req, res) => {
  const interfaces = os.networkInterfaces();
  const addresses = Object.entries(interfaces)
    .flatMap(([name, records]) =>
      (records || [])
        .filter(
          (record) =>
            record.family === "IPv4" &&
            !record.internal
        )
        .map((record) => ({
          name,
          address: record.address,
        }))
    );

  const preferred =
    addresses.find((item) =>
      item.address.startsWith("192.168.")
    ) ||
    addresses.find((item) =>
      item.address.startsWith("10.")
    ) ||
    addresses.find((item) =>
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(
        item.address
      )
    ) ||
    addresses[0] ||
    null;

  const wifiName = await detectWifiName();

  res.json({
    hostname: os.hostname(),
    ipAddress: preferred?.address || "",
    adapterName: preferred?.name || "",
    wifiName,
    addresses,
    webPort: Number(process.env.VITE_PORT || 5173),
    apiPort: Number(process.env.ISP_API_PORT || DEFAULT_PORT),
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

app.post(
  "/api/license/generate",
  requireAuthentication,
  requireAdminRole,
  validateLicenseRequest,
  rateLimitLicenseGeneration,
  auditLicenseGeneration,
  async (req, res) => {
    try {
      const result = createLicenseCode(req.licenseRequest);
      await req.auditLicenseGeneration?.(result);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error?.message || "License generation failed.",
      });
    }
  }
);

app.param("collection", (req, res, next, collection) => {
  if (!isValidCollectionName(collection)) {
    return res.status(404).json({
      error: "Unknown collection",
      collection,
    });
  }

  COLLECTIONS.add(collection);
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

    const previousItems = await readCollection(req.params.collection);

    await archiveRemovedRecords(
      req.params.collection,
      previousItems,
      req.body,
      String(req.headers["x-isp-session-id"] || "")
    );

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
    const id = String(req.params.id);
    const items = await readCollection(req.params.collection);

    const nextItems = items.filter((item) => String(item.id) !== id);

    await archiveRemovedRecords(
      req.params.collection,
      items,
      nextItems,
      String(req.headers["x-isp-session-id"] || "")
    );

    await writeCollection(req.params.collection, nextItems);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

function frontendDistDir() {
  const candidates = [
    process.env.ISP_FRONTEND_DIST,
    path.join(__dirname, "../dist"),
    path.join(process.cwd(), "dist"),
  ].filter(Boolean);

  return candidates.find((candidate) =>
    fs.existsSync(path.join(candidate, "index.html"))
  );
}

function serveFrontendIfAvailable() {
  if (process.env.ISP_SERVE_FRONTEND !== "1") return;

  const distDir = frontendDistDir();
  if (!distDir) {
    console.warn("Frontend dist folder was not found; LAN web access is disabled.");
    return;
  }

  app.use(express.static(distDir));
  app.get(/^\/(?!api(?:\/|$)).*/, (req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
}

serveFrontendIfAvailable();

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
  dataDirectoryPrepared = false;

  const prepareStorage = isPostgresEnabled()
    ? ensurePostgresStore()
    : ensureDataDirectory();

  return prepareStorage.then(
    () =>
      new Promise((resolve, reject) => {
        let settled = false;

        const server = httpServer.listen(port, host, () => {
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
      })
  );
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
