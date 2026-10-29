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
  const fetchPage = (pageOffset) => request(
    `collections/${encodeURIComponent(collection)}?limit=${size}&offset=${pageOffset}`
  );

  const firstResult = await fetchPage(offset);
  if (Array.isArray(firstResult)) { // Older backend: one full response.
    onProgress?.(firstResult, false);
    return firstResult;
  }
  if (!firstResult || !Array.isArray(firstResult.items)) {
    throw new Error(`Invalid server response for ${collection}.`);
  }

  all.push(...firstResult.items);
  onProgress?.(all.slice(), Boolean(firstResult.hasMore));
  if (!firstResult.hasMore) return all;

  const total = Number(firstResult.total);
  if (Number.isSafeInteger(total) && total >= all.length) {
    const nextOffset = Number(firstResult.nextOffset);
    if (!Number.isSafeInteger(nextOffset) || nextOffset <= offset) {
      throw new Error(`Invalid pagination cursor for ${collection}.`);
    }

    // The backend tells us the total row count, so the remaining pages can be
    // fetched concurrently instead of waiting one VPS round-trip at a time.
    const pageOffsets = [];
    for (let pageOffset = nextOffset; pageOffset < total; pageOffset += size) {
      pageOffsets.push(pageOffset);
    }
    // Bound fan-out so several collections cannot trigger an unlimited
    // number of simultaneous requests. Preserve original page ordering.
    const remainingPages = new Array(pageOffsets.length);
    let cursor = 0;
    const worker = async () => {
      while (cursor < pageOffsets.length) {
        const index = cursor++;
        const result = await fetchPage(pageOffsets[index]);
        if (!result || !Array.isArray(result.items)) {
          throw new Error(`Invalid pagination response for ${collection}.`);
        }
        remainingPages[index] = result.items;
      }
    };
    await Promise.all(Array.from({ length: Math.min(3, pageOffsets.length) }, () => worker()));
    remainingPages.forEach((items) => all.push(...items));
    onProgress?.(all.slice(), false);
    return all;
  }

  // Compatibility fallback for a paginated backend that does not return total.
  offset = Number(firstResult.nextOffset);
  if (!Number.isSafeInteger(offset) || offset <= 0) {
    throw new Error(`Invalid pagination cursor for ${collection}.`);
  }
  for (;;) {
    const result = await fetchPage(offset);
    if (!result || !Array.isArray(result.items)) {
      throw new Error(`Invalid server response for ${collection}.`);
    }
    all.push(...result.items);
    if (!result.hasMore) {
      onProgress?.(all.slice(), false);
      return all;
    }
    const nextOffset = Number(result.nextOffset);
    if (!Number.isSafeInteger(nextOffset) || nextOffset <= offset) {
      throw new Error(`Invalid pagination cursor for ${collection}.`);
    }
    offset = nextOffset;
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
