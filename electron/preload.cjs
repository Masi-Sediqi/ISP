const { contextBridge } = require("electron");

const portArg = process.argv.find((arg) => arg.startsWith("--transport-api-port="));
const apiPort = portArg ? portArg.split("=")[1] : process.env.TRANSPORT_API_PORT || "5000";

contextBridge.exposeInMainWorld("transportDesktop", {
  apiRoot: `http://127.0.0.1:${apiPort}/api`,
  isDesktop: true,
});
