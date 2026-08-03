const express = require("express");
const cors = require("cors");
const fs = require("fs-extra");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const { answerAdvancedReport } = require("./advancedReport");
const {
  ALLOWED_LICENSE_TYPES,
  calculateEndDate,
  createLicenseCode,
} = require("./services/licenseGenerator");

const app = express();

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: true,
    credentials: true,
  },
});
const DEFAULT_PORT = Number(process.env.ISP_API_PORT || 5000);
const DEFAULT_HOST = process.env.ISP_API_HOST || "127.0.0.1";
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
  "employeeAdjustments",
  "consultantCustomers",
  "travelCustomers",
  "technologyCustomers",

  "educationInstitutions",
  "mediaProducts",
  "messages",


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

  "transactions",
  "financeCategories",
  "financeBudgets",
  "reports",
  "projects",
  "projectSales",
  "projectLicenses",

  "travels",
  "travelExpenses",
  "cars",
  "carRepairs",
]);

app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");

  if (process.env.NODE_ENV === "production") {
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
  dataDirectoryPrepared = false;

  return ensureDataDirectory().then(
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
