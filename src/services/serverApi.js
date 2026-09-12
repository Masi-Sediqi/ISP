const API_BASE = String(import.meta.env.VITE_API_BASE || "/api").replace(/\/$/, "");
export const serverConfigured = true;

async function request(path, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  const canRetry = method === "GET";
  const maxAttempts = canRetry ? 4 : 1;
  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
        signal: options.signal || controller.signal,
        cache: method === "GET" ? "no-store" : options.cache,
      });
      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        const error = new Error(`Server request failed (${response.status}): ${detail || response.statusText}`);
        error.status = response.status;
        throw error;
      }
      if (response.status === 204) return null;
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } catch (error) {
      lastError = error?.name === "AbortError" ? new Error("Server request timed out.") : error;
      const retryable = !lastError?.status || lastError.status >= 500 || lastError.status === 429;
      if (!canRetry || attempt >= maxAttempts || !retryable) throw lastError;
      await new Promise((resolve) => window.setTimeout(resolve, Math.min(3000, 400 * (2 ** (attempt - 1)))));
    } finally {
      window.clearTimeout(timeout);
    }
  }
  throw lastError || new Error("Server request failed.");
}

export async function fetchRemoteCollection(collection) {
  return request(`/collections/${encodeURIComponent(collection)}`);
}

export async function pushRemoteChanges({ collection, upserts, deletes, actorId, ownerId, identityFn }) {
  const payload = {
    collection,
    upserts: (upserts || []).map((record) => ({ id: String(identityFn(record)), record })),
    deletes: (deletes || []).map(String),
    actorId: actorId || null,
    ownerId: ownerId || actorId || null,
  };
  return request('/changes', { method: 'POST', body: JSON.stringify(payload) });
}

export async function fetchAllRemoteRows() {
  return request('/backup/rows');
}

export async function restoreRemoteSnapshot(snapshotRows = []) {
  return request('/backup/restore', { method: 'POST', body: JSON.stringify({ rows: snapshotRows }) });
}
