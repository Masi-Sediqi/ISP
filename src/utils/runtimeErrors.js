export function runtimeErrorMessage(error) {
  if (error instanceof Error) return error.message || String(error);
  if (typeof error === "string") return error;
  return String(error?.message || error?.reason || error || "");
}

export function isRecoverableRuntimeError(error) {
  const message = runtimeErrorMessage(error).toLowerCase();

  return [
    "failed to fetch",
    "network error",
    "networkerror",
    "load failed",
    "vps server",
    "unable to load",
    "timeout",
    "err_connection",
    "chunkloaderror",
    "loading chunk",
    "dynamically imported module",
  ].some((pattern) => message.includes(pattern));
}
