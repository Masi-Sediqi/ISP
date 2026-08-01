const { contextBridge, ipcRenderer } = require("electron");

const portArg = process.argv.find((arg) => arg.startsWith("--isp-api-port="));
const apiPort = portArg ? portArg.split("=")[1] : process.env.ISP_API_PORT || "5050";

const desktopApi = Object.freeze({
  apiRoot: `http://127.0.0.1:${apiPort}/api`,
  isDesktop: true,
  getAppVersion: () => ipcRenderer.invoke("app:getVersion"),
  getUserDataPath: () => ipcRenderer.invoke("app:getUserDataPath"),
  license: Object.freeze({
    getStatus: () => ipcRenderer.invoke("license:getStatus"),
    activate: (licenseCode) => ipcRenderer.invoke("license:activate", licenseCode),
  }),
});

contextBridge.exposeInMainWorld("ispDesktop", desktopApi);
contextBridge.exposeInMainWorld("transportDesktop", desktopApi);
