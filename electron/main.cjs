const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const fs = require("fs");
const http = require("http");
const path = require("path");
const { startServer } = require("../transport-backend/server");

const APP_NAME = "ISP";
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";
const LOAD_BUILT_RENDERER = app.isPackaged || process.env.ELECTRON_LOAD_BUILT === "1";

app.setName(APP_NAME);

let apiServer = null;
let mainWindow = null;

function existingPath(...segments) {
  const candidate = path.join(...segments);
  return fs.existsSync(candidate) ? candidate : null;
}

function getIconPath() {
  return (
    existingPath(__dirname, "../build/icon.ico") ||
    existingPath(__dirname, "../build/icon.png") ||
    undefined
  );
}

function getDataDir() {
  return path.join(app.getPath("userData"), "data");
}

function copyJsonFilesIfMissing(sourceDir, targetDir) {
  if (!sourceDir || !fs.existsSync(sourceDir)) return;

  fs.mkdirSync(targetDir, { recursive: true });

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== ".json") continue;

    const sourceFile = path.join(sourceDir, entry.name);
    const targetFile = path.join(targetDir, entry.name);

    if (!fs.existsSync(targetFile)) {
      fs.copyFileSync(sourceFile, targetFile);
    }
  }
}

function prepareUserDataDirectory() {
  const dataDir = getDataDir();
  fs.mkdirSync(dataDir, { recursive: true });

  if (app.isPackaged) {
    copyJsonFilesIfMissing(path.join(process.resourcesPath, "initial-data"), dataDir);
    copyJsonFilesIfMissing(process.env.ISP_DATA_DIR, dataDir);
    copyJsonFilesIfMissing("C:/ISP", dataDir);
  }

  return dataDir;
}

function waitForUrl(url, timeoutMs = 30000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      const request = http.get(url, (response) => {
        response.resume();
        resolve();
      });

      request.on("error", () => {
        if (Date.now() - startedAt >= timeoutMs) {
          reject(new Error(`Timed out waiting for ${url}`));
          return;
        }

        setTimeout(check, 300);
      });

      request.setTimeout(1500, () => {
        request.destroy();
      });
    };

    check();
  });
}

function showStartupError(error) {
  const message = error?.message || String(error);
  dialog.showErrorBox(
    "Unable to start ISP",
    `The application could not start correctly.\n\n${message}`
  );
}

function createWindow(apiPort) {
  const icon = getIconPath();
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    center: true,
    show: false,
    title: APP_NAME,
    backgroundColor: "#000000",
    ...(icon ? { icon } : {}),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      additionalArguments: [`--isp-api-port=${apiPort}`],
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: !app.isPackaged,
    },
  });

  win.removeMenu();

  win.once("ready-to-show", () => {
    if (win.isDestroyed()) return;
    win.maximize();
    win.show();
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) {
      shell.openExternal(url);
    }

    return { action: "deny" };
  });

  win.webContents.on("will-navigate", (event, url) => {
    const isAllowedDevUrl = !LOAD_BUILT_RENDERER && url.startsWith(DEV_SERVER_URL);
    const isAllowedProdUrl = LOAD_BUILT_RENDERER && url.startsWith("file://");

    if (isAllowedDevUrl || isAllowedProdUrl) return;

    event.preventDefault();

    if (/^https?:\/\//i.test(url)) {
      shell.openExternal(url);
    }
  });

  win.webContents.on("before-input-event", (event, input) => {
    if (!app.isPackaged) return;

    const key = String(input.key || "").toLowerCase();
    const isDevToolsShortcut =
      key === "f12" ||
      (input.control && input.shift && ["i", "j", "c"].includes(key));

    if (isDevToolsShortcut) {
      event.preventDefault();
    }
  });

  win.webContents.on("did-fail-load", (_event, _code, description) => {
    if (description) {
      console.error("Renderer failed to load:", description);
    }
  });

  return win;
}

async function loadRenderer(win) {
  if (!LOAD_BUILT_RENDERER) {
    await waitForUrl(DEV_SERVER_URL);
    await win.loadURL(DEV_SERVER_URL);
    return;
  }

  const indexFile = path.join(__dirname, "../dist/index.html");

  if (!fs.existsSync(indexFile)) {
    throw new Error("The production frontend build was not found. Run npm run build first.");
  }

  await win.loadFile(indexFile);
}

async function boot() {
  const dataDir = prepareUserDataDirectory();
  const api = await startServer({
    host: "127.0.0.1",
    port: 0,
    dataDir,
  });

  apiServer = api.server;
  mainWindow = createWindow(api.port);
  await loadRenderer(mainWindow);
}

ipcMain.handle("app:getVersion", () => app.getVersion());
ipcMain.handle("app:getUserDataPath", () => app.getPath("userData"));

app.whenReady().then(boot).catch((error) => {
  console.error("Unable to start desktop app:", error);
  showStartupError(error);
  app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    boot().catch((error) => {
      console.error("Unable to recreate desktop window:", error);
      showStartupError(error);
    });
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (apiServer) {
    apiServer.close();
    apiServer = null;
  }
});
