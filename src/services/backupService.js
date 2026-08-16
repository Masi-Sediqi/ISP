import {
  exportIndexedDbSnapshot,
  importIndexedDbSnapshot,
  writeIndexedCollection,
} from "../db/indexedDb";
import { flushSyncQueue } from "../sync/collectionSync";
import { getRecordIdentity } from "../utils/recycleBin";
import {
  fetchAllRemoteRows,
  pushRemoteChanges,
  restoreRemoteSnapshot,
  supabaseConfigured,
} from "./supabaseRest";

export const BACKUP_FORMAT = "afghan-power-complete-backup";
export const BACKUP_VERSION = 2;

const SESSION_KEYS = new Set([
  "isp-system-session",
  "isp-current-user",
]);

function captureLocalStorage() {
  const snapshot = {};

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key || !key.startsWith("isp-") || SESSION_KEYS.has(key)) continue;
    snapshot[key] = localStorage.getItem(key);
  }

  return snapshot;
}

function restoreLocalStorage(snapshot = {}) {
  const currentSession = {};
  SESSION_KEYS.forEach((key) => {
    currentSession[key] = localStorage.getItem(key);
  });

  const removable = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key?.startsWith("isp-") && !SESSION_KEYS.has(key)) removable.push(key);
  }
  removable.forEach((key) => localStorage.removeItem(key));

  Object.entries(snapshot || {}).forEach(([key, value]) => {
    if (!key.startsWith("isp-") || SESSION_KEYS.has(key) || value === null) return;
    localStorage.setItem(key, String(value));
  });

  SESSION_KEYS.forEach((key) => {
    const value = currentSession[key];
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  });
}

function scanEmbeddedAssets(value, seen = new Set()) {
  if (typeof value === "string") {
    if (value.startsWith("data:")) {
      return { count: 1, bytesApprox: Math.ceil(value.length * 0.75) };
    }

    if ((value.startsWith("{") || value.startsWith("[")) && value.length > 20) {
      try {
        return scanEmbeddedAssets(JSON.parse(value), seen);
      } catch {
        return { count: 0, bytesApprox: 0 };
      }
    }

    return { count: 0, bytesApprox: 0 };
  }

  if (!value || typeof value !== "object") {
    return { count: 0, bytesApprox: 0 };
  }

  if (seen.has(value)) return { count: 0, bytesApprox: 0 };
  seen.add(value);

  const values = Array.isArray(value) ? value : Object.values(value);
  return values.reduce(
    (total, item) => {
      const result = scanEmbeddedAssets(item, seen);
      return {
        count: total.count + result.count,
        bytesApprox: total.bytesApprox + result.bytesApprox,
      };
    },
    { count: 0, bytesApprox: 0 }
  );
}

function buildManifest(remoteRows, indexedDb, localStorageSnapshot) {
  const activeRows = remoteRows.filter((row) => !row.deleted_at);
  const deletedRows = remoteRows.filter((row) => Boolean(row.deleted_at));
  const centralCollections = new Set(remoteRows.map((row) => row.collection_name));
  const centralAssets = scanEmbeddedAssets(remoteRows.map((row) => row.record_data));
  const localAssets = scanEmbeddedAssets(indexedDb.collections);

  return {
    centralRows: remoteRows.length,
    centralActiveRows: activeRows.length,
    centralDeletedRows: deletedRows.length,
    centralCollections: centralCollections.size,
    localCollections: indexedDb.collections.length,
    pendingSyncOperations: indexedDb.syncQueue.length,
    localStorageKeys: Object.keys(localStorageSnapshot).length,
    embeddedAssets: {
      centralCount: centralAssets.count,
      centralBytesApprox: centralAssets.bytesApprox,
      localCount: localAssets.count,
      localBytesApprox: localAssets.bytesApprox,
    },
  };
}

export async function createCompleteBackup({ backupType = "manual" } = {}) {
  if (supabaseConfigured && !navigator.onLine) {
    throw new Error(
      "Internet is required to include and verify the central Supabase data in a complete backup."
    );
  }

  if (supabaseConfigured) {
    await flushSyncQueue();
  }

  const [indexedDb, remoteRows] = await Promise.all([
    exportIndexedDbSnapshot(),
    supabaseConfigured ? fetchAllRemoteRows() : Promise.resolve([]),
  ]);
  const localStorageSnapshot = captureLocalStorage();
  const exportedAt = new Date().toISOString();

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    app: "Afghan Power",
    exportedAt,
    backupType,
    manifest: buildManifest(remoteRows, indexedDb, localStorageSnapshot),
    central: {
      provider: supabaseConfigured ? "supabase" : "not-configured",
      table: "app_records",
      rows: remoteRows,
    },
    local: {
      indexedDb,
      localStorage: localStorageSnapshot,
      excludedSessionKeys: [...SESSION_KEYS],
    },
  };
}

function legacyCollectionsToRows(collections = {}) {
  const now = new Date().toISOString();
  const rows = [];

  Object.entries(collections).forEach(([collectionName, records]) => {
    if (!Array.isArray(records)) return;
    records.forEach((record) => {
      rows.push({
        collection_name: collectionName,
        record_id: getRecordIdentity(record),
        record_data: record,
        actor_id: null,
        owner_id: null,
        updated_at: now,
        deleted_at: null,
      });
    });
  });

  return rows;
}

async function restoreLegacyBackup(parsed) {
  const collections = parsed?.collections && typeof parsed.collections === "object"
    ? parsed.collections
    : parsed;
  const validCollections = Object.fromEntries(
    Object.entries(collections || {}).filter(([, value]) => Array.isArray(value))
  );

  if (!Object.keys(validCollections).length) {
    throw new Error("This file does not contain importable backup data.");
  }

  const rows = legacyCollectionsToRows(validCollections);
  if (supabaseConfigured) {
    if (!navigator.onLine) throw new Error("Internet is required to restore Supabase data.");
    await restoreRemoteSnapshot(rows);
  }

  for (const [name, items] of Object.entries(validCollections)) {
    await writeIndexedCollection(name, items);
  }

  return {
    legacy: true,
    restoredCentralRows: rows.length,
    restoredLocalCollections: Object.keys(validCollections).length,
    verified: true,
  };
}

export async function restoreCompleteBackup(parsed) {
  if (parsed?.format !== BACKUP_FORMAT || Number(parsed?.version) !== BACKUP_VERSION) {
    return restoreLegacyBackup(parsed);
  }

  const remoteRows = Array.isArray(parsed?.central?.rows) ? parsed.central.rows : [];
  const indexedDbSnapshot = parsed?.local?.indexedDb || { collections: [], syncQueue: [] };
  const localStorageSnapshot = parsed?.local?.localStorage || {};

  let centralResult = { restoredRows: 0, verified: !supabaseConfigured };

  if (supabaseConfigured) {
    if (!navigator.onLine) {
      throw new Error("Internet is required to restore and verify the central Supabase backup.");
    }
    centralResult = await restoreRemoteSnapshot(remoteRows);
  }

  const localResult = await importIndexedDbSnapshot(indexedDbSnapshot);
  restoreLocalStorage(localStorageSnapshot);

  return {
    legacy: false,
    restoredCentralRows: centralResult.restoredRows || 0,
    archivedExtraCentralRows: centralResult.archivedExtraRows || 0,
    restoredLocalCollections: localResult.collectionCount || 0,
    restoredPendingOperations: localResult.pendingOperationCount || 0,
    verified: centralResult.verified !== false,
  };
}

export function summarizeBackup(payload) {
  const manifest = payload?.manifest || {};
  return {
    centralRows: Number(manifest.centralRows || 0),
    activeRows: Number(manifest.centralActiveRows || 0),
    deletedRows: Number(manifest.centralDeletedRows || 0),
    localCollections: Number(manifest.localCollections || 0),
    pendingOperations: Number(manifest.pendingSyncOperations || 0),
    embeddedAssets: Number(manifest?.embeddedAssets?.centralCount || 0),
  };
}
