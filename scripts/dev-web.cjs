const { spawn } = require("child_process");
const net = require("net");

const API_HOST = process.env.ISP_API_HOST || "0.0.0.0";
const API_PORT = Number(process.env.ISP_API_PORT || 5050);
const WEB_PORT = Number(process.env.VITE_PORT || 5173);
const DATA_DIR = process.env.ISP_DATA_DIR || "C:\\ISP Smart";

function canListen(port, host) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(port, host);
  });
}

function run(command, args, env) {
  return spawn(command, args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...env,
    },
    stdio: "inherit",
    shell: process.platform === "win32",
  });
}

async function validateExistingBackend() {
  const baseUrl = `http://127.0.0.1:${API_PORT}`;

  try {
    const health = await fetch(`${baseUrl}/api/health`).then((response) =>
      response.ok ? response.json() : null
    );
    const travels = await fetch(`${baseUrl}/api/travels`);
    const assets = await fetch(`${baseUrl}/api/assets`);

    return Boolean(
      health &&
        health.storage === "json" &&
        travels.ok &&
        assets.ok
    );
  } catch {
    return false;
  }
}

async function main() {
  const children = [];
  const apiPortIsFree = await canListen(API_PORT, API_HOST);

  const env = {
    ISP_API_HOST: API_HOST,
    ISP_API_PORT: String(API_PORT),
    ISP_DATA_DIR: DATA_DIR,
    ISP_DISABLE_LOCAL_ENV: process.env.ISP_DISABLE_LOCAL_ENV || "1",
    VITE_API_ROOT: process.env.VITE_API_ROOT || "/api",
    VITE_PORT: String(WEB_PORT),
  };

  if (apiPortIsFree) {
    children.push(run("node", ["transport-backend/server.js"], env));
  } else {
    const backendIsReady = await validateExistingBackend();

    if (!backendIsReady) {
      console.error(
        `Port ${API_PORT} is already in use by an old or incompatible backend.`
      );
      console.error(
        "Stop the old server with Ctrl+C, then run npm run dev again."
      );
      process.exit(1);
    }

    console.log(
      `Port ${API_PORT} is already in use; using the existing ISP backend.`
    );
  }

  children.push(
    run("npx", ["vite", "--host", "0.0.0.0", "--port", String(WEB_PORT), "--strictPort"], env)
  );

  const stopAll = () => {
    children.forEach((child) => {
      if (!child.killed) child.kill();
    });
  };

  process.on("SIGINT", () => {
    stopAll();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    stopAll();
    process.exit(0);
  });

  children.forEach((child) => {
    child.on("exit", (code) => {
      if (code && code !== 0) {
        stopAll();
        process.exit(code);
      }
    });
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
