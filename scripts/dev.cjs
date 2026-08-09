const { spawn } = require("child_process");
const net = require("net");
const path = require("path");

const apiHost = process.env.ISP_API_HOST || "0.0.0.0";
const browserApiHost = process.env.ISP_PUBLIC_HOST || "127.0.0.1";
const preferredApiPort = Number(process.env.ISP_API_PORT || 5050);
const dataDir = process.env.ISP_DATA_DIR || "C:\\ISP Smart";

const concurrentlyBin = path.join(
  process.cwd(),
  "node_modules",
  "concurrently",
  "dist",
  "bin",
  "index.js"
);
const vitePort = Number(process.env.VITE_PORT || 5173);

function canUsePort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(port, apiHost);
  });
}

async function findAvailablePort(startPort) {
  for (let port = startPort; port < startPort + 50; port += 1) {
    if (await canUsePort(port)) {
      return port;
    }
  }

  throw new Error(`No available backend port found from ${startPort} to ${startPort + 49}.`);
}

async function main() {
  const apiPort = await findAvailablePort(preferredApiPort);

  if (apiPort !== preferredApiPort) {
    console.log(
      `Port ${preferredApiPort} is in use; starting ISP Smart backend on ${apiPort}.`
    );
  }

  const env = {
    ...process.env,
    ISP_API_HOST: apiHost,
    ISP_API_PORT: String(apiPort),
    ISP_DATA_DIR: dataDir,
    VITE_API_ROOT:
      process.env.VITE_API_ROOT || `http://${browserApiHost}:${apiPort}/api`,
    VITE_DEV_SERVER_URL: process.env.VITE_DEV_SERVER_URL || `http://127.0.0.1:${vitePort}`,
    BROWSER: "none",
    ISP_USE_EXTERNAL_BACKEND: "1",
  };

  const child = spawn(
    process.execPath,
    [
      concurrentlyBin,
      "-k",
      "-n",
      "SERVER,WEB,ELECTRON",
      "-c",
      "green,cyan,magenta",
      "node transport-backend/server.js",
      `vite --host 0.0.0.0 --port ${vitePort} --strictPort`,
      `wait-on http://127.0.0.1:${apiPort}/api/health http://127.0.0.1:${vitePort} && electron .`,
    ],
    {
      cwd: process.cwd(),
      env,
      stdio: "inherit",
    }
  );

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
