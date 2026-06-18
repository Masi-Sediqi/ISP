const { app, BrowserWindow, shell } = require("electron");
const fs = require("fs");
const path = require("path");
const { startServer } = require("../transport-backend/server");

app.setName("Transport Management System");

let apiServer;
let splashWindow;
let mainWindow;

function getIconPath() {
  return path.join(__dirname, "../build/icon.ico");
}

function getDataDir() {
  return path.join(app.getPath("userData"), "data");
}

function readCompanyName() {
  const candidates = [
    path.join(getDataDir(), "settings.json"),
    "C:/TransportSystem/data/settings.json",
  ];

  for (const file of candidates) {
    try {
      const settings = JSON.parse(fs.readFileSync(file, "utf8"));
      const companyName = settings?.[0]?.companyName;
      if (companyName) return companyName;
    } catch {
      // Settings may not exist on the first launch.
    }
  }

  return "شرکت سیاحتی";
}

function createSplashWindow(companyName) {
  splashWindow = new BrowserWindow({
    width: 820,
    height: 520,
    frame: false,
    resizable: false,
    transparent: false,
    show: false,
    center: true,
    backgroundColor: "#07111f",
    icon: getIconPath(),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  splashWindow.loadFile(path.join(__dirname, "splash.html"), {
    query: { companyName },
  });
  splashWindow.once("ready-to-show", () => splashWindow.show());
}

function createWindow(apiPort) {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1180,
    minHeight: 760,
    show: false,
    backgroundColor: "#f4f7fb",
    icon: getIconPath(),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      additionalArguments: [`--transport-api-port=${apiPort}`],
      nodeIntegration: false,
      contextIsolation: true,
      devTools: !app.isPackaged,
    },
  });

  win.removeMenu();

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  win.webContents.on("will-navigate", (event, url) => {
    const allowed = app.isPackaged
      ? url.startsWith("file://")
      : url.startsWith("http://localhost:5173");
    if (!allowed) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  if (!app.isPackaged) {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  return win;
}

async function boot() {
  createSplashWindow(readCompanyName());
  const minSplashTime = new Promise((resolve) => setTimeout(resolve, 4300));

  const api = await startServer({
    host: "127.0.0.1",
    port: 0,
    dataDir: getDataDir(),
  });
  apiServer = api.server;

  mainWindow = createWindow(api.port);
  await Promise.all([
    minSplashTime,
    new Promise((resolve) => mainWindow.webContents.once("did-finish-load", resolve)),
  ]);

  mainWindow.show();
  mainWindow.focus();

  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.webContents.executeJavaScript("document.body.classList.add('closing')").catch(() => {});
    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) splashWindow.close();
      splashWindow = null;
    }, 360);
  }
}

app.whenReady().then(boot).catch((error) => {
  console.error("Unable to start desktop app:", error);
  app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    boot().catch((error) => {
      console.error("Unable to restart desktop app:", error);
      app.quit();
    });
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (apiServer) apiServer.close();
});
