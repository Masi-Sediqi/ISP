const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
const SUPABASE_ANON_KEY = String(import.meta.env.VITE_SUPABASE_ANON_KEY || "");
const TABLE = "app_records";
const REQUEST_TIMEOUT_MS = 15000;
const RETRY_DELAYS_MS = [600, 1400];

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

function headers(extra = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function shouldRetryStatus(status) {
  return status === 408 || status === 429 || status >= 500;
}

async function requestOnce(path, options = {}) {
  if (!supabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      ...options,
      headers: headers(options.headers),
      signal: options.signal || controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Supabase request timed out.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    const error = new Error(
      `Supabase request failed (${response.status}): ${detail || response.statusText}`
    );
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function request(path, options = {}) {
  let lastError;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await requestOnce(path, options);
    } catch (error) {
      lastError = error;
      const canRetry =
        error?.name === "AbortError" ||
        error?.message === "Supabase request timed out." ||
        shouldRetryStatus(Number(error?.status || 0));

      if (!canRetry || attempt >= RETRY_DELAYS_MS.length) {
        throw error;
      }

      await wait(RETRY_DELAYS_MS[attempt]);
    }
  }

  throw lastError;
}

export async function fetchRemoteCollection(collection) {
  const query = new URLSearchParams({
    select: "record_id,record_data,actor_id,owner_id,updated_at,deleted_at",
    collection_name: `eq.${collection}`,
    deleted_at: "is.null",
    order: "updated_at.asc",
  });

  const rows = await request(`${TABLE}?${query.toString()}`, { method: "GET" });
  return Array.isArray(rows)
    ? rows
        .map((row) => row?.record_data)
        .filter((record) => record && typeof record === "object")
    : [];
}

export async function pushRemoteChanges({ collection, upserts, deletes, actorId, ownerId, identityFn }) {
  const now = new Date().toISOString();

  if (upserts.length) {
    const rows = upserts.map((record) => ({
      collection_name: collection,
      record_id: identityFn(record),
      record_data: record,
      actor_id: actorId || null,
      owner_id: ownerId || actorId || null,
      updated_at: now,
      deleted_at: null,
    }));

    await request(`${TABLE}?on_conflict=collection_name,record_id`, {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(rows),
    });
  }

  if (deletes.length) {
    const rows = deletes.map((recordId) => ({
      collection_name: collection,
      record_id: String(recordId),
      record_data: {},
      actor_id: actorId || null,
      owner_id: ownerId || actorId || null,
      updated_at: now,
      deleted_at: now,
    }));

    await request(`${TABLE}?on_conflict=collection_name,record_id`, {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(rows),
    });
  }
}


const BACKUP_PAGE_SIZE = 1000;
const RESTORE_CHUNK_SIZE = 200;

function chunkRows(rows, size = RESTORE_CHUNK_SIZE) {
  const chunks = [];
  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }
  return chunks;
}

export async function fetchAllRemoteRows() {
  const rows = [];
  let offset = 0;

  while (true) {
    const query = new URLSearchParams({
      select: "collection_name,record_id,record_data,actor_id,owner_id,updated_at,deleted_at",
      order: "collection_name.asc,record_id.asc",
      limit: String(BACKUP_PAGE_SIZE),
      offset: String(offset),
    });

    const page = await request(`${TABLE}?${query.toString()}`, { method: "GET" });
    const safePage = Array.isArray(page) ? page : [];
    rows.push(...safePage);

    if (safePage.length < BACKUP_PAGE_SIZE) break;
    offset += BACKUP_PAGE_SIZE;
  }

  return rows;
}

async function upsertRawRows(rows) {
  const validRows = (Array.isArray(rows) ? rows : []).filter(
    (row) => row?.collection_name && row?.record_id
  );

  for (const chunk of chunkRows(validRows)) {
    await request(`${TABLE}?on_conflict=collection_name,record_id`, {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(chunk),
    });
  }
}

function remoteRowKey(row) {
  return `${String(row?.collection_name || "")}\u0000${String(row?.record_id || "")}`;
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export async function restoreRemoteSnapshot(snapshotRows = []) {
  if (!supabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }

  const backupRows = (Array.isArray(snapshotRows) ? snapshotRows : []).filter(
    (row) => row?.collection_name && row?.record_id
  );
  const currentRows = await fetchAllRemoteRows();
  const backupKeys = new Set(backupRows.map(remoteRowKey));
  const now = new Date().toISOString();

  const tombstonesForExtraRows = currentRows
    .filter((row) => !backupKeys.has(remoteRowKey(row)) && !row.deleted_at)
    .map((row) => ({
      collection_name: String(row.collection_name),
      record_id: String(row.record_id),
      record_data: {},
      actor_id: row.actor_id || null,
      owner_id: row.owner_id || row.actor_id || null,
      updated_at: now,
      deleted_at: now,
    }));

  await upsertRawRows([...backupRows, ...tombstonesForExtraRows]);

  const afterRows = await fetchAllRemoteRows();
  const afterByKey = new Map(afterRows.map((row) => [remoteRowKey(row), row]));
  const mismatches = [];

  backupRows.forEach((expected) => {
    const actual = afterByKey.get(remoteRowKey(expected));
    if (!actual) {
      mismatches.push(remoteRowKey(expected));
      return;
    }

    if (
      Boolean(expected.deleted_at) !== Boolean(actual.deleted_at) ||
      stableJson(expected.record_data || {}) !== stableJson(actual.record_data || {})
    ) {
      mismatches.push(remoteRowKey(expected));
    }
  });

  const backupActiveKeys = new Set(
    backupRows.filter((row) => !row.deleted_at).map(remoteRowKey)
  );
  const unexpectedActiveRows = afterRows.filter(
    (row) => !row.deleted_at && !backupActiveKeys.has(remoteRowKey(row))
  );

  if (mismatches.length || unexpectedActiveRows.length) {
    throw new Error(
      `Supabase restore verification failed (${mismatches.length} mismatched, ${unexpectedActiveRows.length} unexpected active rows).`
    );
  }

  return {
    restoredRows: backupRows.length,
    archivedExtraRows: tombstonesForExtraRows.length,
    verified: true,
  };
}
