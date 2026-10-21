import { API_ROOT, apiUrl } from "../utils/api";

// The local Vite proxy provides /api even without VITE_API_ROOT.
export const serverConfigured = Boolean(API_ROOT);

async function request(path, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), method === "GET" ? 30000 : 30000);
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
    if (error?.name === "AbortError") throw new Error("VPS server request timed out.", { cause: error });
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function fetchRemoteCollection(collection, onProgress) {
  // Page progressively, while retaining compatibility with servers not yet upgraded.
  const size = 500;
  let offset = 0;
  const all = [];
  for (;;) {
    const result = await request(
      `collections/${encodeURIComponent(collection)}?limit=${size}&offset=${offset}`
    );
    if (Array.isArray(result)) { // Older backend: one full response.
      onProgress?.(result, false);
      return result;
    }
    if (!result || !Array.isArray(result.items)) {
      throw new Error(`Invalid server response for ${collection}.`);
    }
    all.push(...result.items);
    // Publishing every batch copies the entire growing dataset and rerenders
    // every subscriber. Publish the first batch for a responsive preview;
    // publish the complete result only once after the final batch.
    if (offset === 0 || !result.hasMore) {
      onProgress?.(all.slice(), Boolean(result.hasMore));
    }
    if (!result.hasMore) return all;
    const nextOffset = Number(result.nextOffset);
    if (!Number.isSafeInteger(nextOffset) || nextOffset <= offset) {
      throw new Error(`Invalid pagination cursor for ${collection}.`);
    }
    offset = nextOffset;
    // The first page is already available to React while the next request runs.
  }
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
