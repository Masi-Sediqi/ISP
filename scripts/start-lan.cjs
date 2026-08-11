const { spawnSync, spawn } = require("child_process");
const os = require("os");

const API_PORT = Number(process.env.ISP_API_PORT || 5050);
const API_HOST = process.env.ISP_API_HOST || "0.0.0.0";

function runStep(command, args, env = {}) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: { ...process.env, ...env },
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function localIpv4Addresses() {
  const interfaces = os.networkInterfaces();

  return Object.values(interfaces)
    .flatMap((records) => records || [])
    .filter((record) => record.family === "IPv4" && !record.internal)
    .map((record) => record.address);
}

function main() {
  const env = {
    NODE_ENV: "production",
    ISP_API_HOST: API_HOST,
    ISP_API_PORT: String(API_PORT),
    ISP_SERVE_FRONTEND: "1",
    ISP_ALLOW_HTTP: "1",
    ISP_DISABLE_LOCAL_ENV: "0",
    ISP_REQUIRE_POSTGRES: "1",
    VITE_API_ROOT: "/api",
  };

  console.log("\n[1/3] Building the React production bundle...");
  runStep("npm", ["run", "build"], env);

  console.log("\n[2/3] Checking PostgreSQL and preparing the data store...");
  runStep("node", ["transport-backend/scripts/prepare-postgres.js"], env);

  console.log("\n[3/3] Starting ISP Smart LAN server...");
  const addresses = localIpv4Addresses();

  console.log(`Local server: http://127.0.0.1:${API_PORT}`);
  addresses.forEach((address) => {
    console.log(`LAN access:  http://${address}:${API_PORT}`);
  });
  console.log("Keep this window open while employees are using the system.\n");

  const child = spawn("node", ["transport-backend/server.js"], {
    cwd: process.cwd(),
    env: { ...process.env, ...env },
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  const stop = () => {
    if (!child.killed) child.kill();
  };

  process.on("SIGINT", () => {
    stop();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    stop();
    process.exit(0);
  });

  child.on("exit", (code) => {
    process.exit(code || 0);
  });
}

main();
