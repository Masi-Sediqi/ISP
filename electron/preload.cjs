const { contextBridge, ipcRenderer } = require("electron");

const portArg = process.argv.find((arg) => arg.startsWith("--isp-api-port="));
const apiPort = portArg ? portArg.split("=")[1] : "5000";

const desktopApi = Object.freeze({
  apiRoot: `http://127.0.0.1:${apiPort}/api`,
  isDesktop: true,
  getAppVersion: () => ipcRenderer.invoke("app:getVersion"),
  getUserDataPath: () => ipcRenderer.invoke("app:getUserDataPath"),
});

contextBridge.exposeInMainWorld("ispDesktop", desktopApi);
contextBridge.exposeInMainWorld("transportDesktop", desktopApi);
