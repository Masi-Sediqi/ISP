import { apiUrl } from "../utils/api";

const explicitApiRoot =
  window.ispDesktop?.apiRoot ||
  import.meta.env.VITE_API_ROOT ||
  "";
const isLocalBrowser = ["localhost", "127.0.0.1", "::1"].includes(
  window.location.hostname
);

export const serverConfigured = Boolean(explicitApiRoot) || !isLocalBrowser;

async function request(path, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  const canRetry = method === "GET";
  const maxAttempts = canRetry ? 4 : 1;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(apiUrl(path), {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
        signal: options.signal || controller.signal,
        cache: method === "GET" ? "no-store" : options.cache,
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        const error = new Error(
          `Server request failed (${response.status}): ${detail || response.statusText}`
        );
        error.status = response.status;
        throw error;
      }

      if (response.status === 204) return null;
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } catch (error) {
      lastError = error?.name === "AbortError"
        ? new Error("VPS server request timed out.")
        : error;
      const retryable = !lastError?.status || lastError.status >= 500 || lastError.status === 429;
      if (!canRetry || attempt >= maxAttempts || !retryable) throw lastError;
      await new Promise((resolve) => window.setTimeout(resolve, 400 * (2 ** (attempt - 1))));
    } finally {
      window.clearTimeout(timeout);
    }
  }

  throw lastError || new Error("VPS server request failed.");
}

export async function fetchRemoteCollection(collection) {
  const result = await request(`collections/${encodeURIComponent(collection)}`);
  return Array.isArray(result) ? result : [];
}

export async function pushRemoteChanges({ collection, upserts = [], deletes = [], actorId, ownerId, identityFn }) {
  return request(`collections/${encodeURIComponent(collection)}/changes`, {
    method: "POST",
    body: JSON.stringify({
      upserts,
      deletes,
      actorId: actorId || "",
      ownerId: ownerId || actorId || "",
      identities: upserts.map((record) => String(identityFn(record))),
    }),
  });
}

export async function fetchAllRemoteRows() {
  const rows = await request("backup/rows");
  return Array.isArray(rows) ? rows : [];
}

export async function restoreRemoteSnapshot(snapshotRows = []) {
  return request("backup/restore", {
    method: "POST",
    body: JSON.stringify({ rows: Array.isArray(snapshotRows) ? snapshotRows : [] }),
  });
}
