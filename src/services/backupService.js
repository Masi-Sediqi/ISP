import { getRecordIdentity } from "../utils/recycleBin";
import {
  fetchAllRemoteRows,
  restoreRemoteSnapshot,
  supabaseConfigured,
} from "./supabaseRest";

export const BACKUP_FORMAT = "afghan-power-supabase-backup";
export const BACKUP_VERSION = 3;

const SESSION_KEYS = new Set(["isp-system-session", "isp-current-user"]);
const BUSINESS_LOCAL_PREFIX = "isp-local-collection:";
const BUSINESS_LOCAL_KEYS = new Set(["isp-local-recycle-bin"]);

function captureLocalPreferences() {
  const snapshot = {};
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key || !key.startsWith("isp-") || SESSION_KEYS.has(key)) continue;
    if (key.startsWith(BUSINESS_LOCAL_PREFIX) || BUSINESS_LOCAL_KEYS.has(key)) continue;
    snapshot[key] = localStorage.getItem(key);
  }
  return snapshot;
}

function restoreLocalPreferences(snapshot = {}) {
  const currentSession = {};
  SESSION_KEYS.forEach((key) => {
    currentSession[key] = localStorage.getItem(key);
  });

  Object.entries(snapshot || {}).forEach(([key, value]) => {
    if (!key.startsWith("isp-") || SESSION_KEYS.has(key) || value === null) return;
    if (key.startsWith(BUSINESS_LOCAL_PREFIX) || BUSINESS_LOCAL_KEYS.has(key)) return;
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
    return { count: 0, bytesApprox: 0 };
  }
  if (!value || typeof value !== "object" || seen.has(value)) {
    return { count: 0, bytesApprox: 0 };
  }
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

function buildManifest(remoteRows, localPreferences) {
  const activeRows = remoteRows.filter((row) => !row.deleted_at);
  const deletedRows = remoteRows.filter((row) => Boolean(row.deleted_at));
  const collections = new Set(remoteRows.map((row) => row.collection_name));
  const assets = scanEmbeddedAssets(remoteRows.map((row) => row.record_data));

  return {
    storageMode: "supabase-only",
    centralRows: remoteRows.length,
    centralActiveRows: activeRows.length,
    centralDeletedRows: deletedRows.length,
    centralCollections: collections.size,
    localPreferenceKeys: Object.keys(localPreferences).length,
    embeddedAssets: {
      centralCount: assets.count,
      centralBytesApprox: assets.bytesApprox,
    },
  };
}

export async function createCompleteBackup({ backupType = "manual" } = {}) {
  if (!supabaseConfigured) throw new Error("Supabase is not configured.");
  if (!navigator.onLine) throw new Error("Internet is required to create a Supabase backup.");

  const remoteRows = await fetchAllRemoteRows();
  const localPreferences = captureLocalPreferences();
  const exportedAt = new Date().toISOString();

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    app: "Afghan Power",
    exportedAt,
    backupType,
    manifest: buildManifest(remoteRows, localPreferences),
    central: {
      provider: "supabase",
      table: "app_records",
      rows: remoteRows,
    },
    localPreferences,
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

function rowsFromOlderCompleteBackup(parsed) {
  if (Array.isArray(parsed?.central?.rows)) return parsed.central.rows;
  return null;
}

async function restoreLegacyBackup(parsed) {
  const oldCompleteRows = rowsFromOlderCompleteBackup(parsed);
  if (oldCompleteRows) {
    if (!supabaseConfigured || !navigator.onLine) {
      throw new Error("Internet and Supabase configuration are required to restore this backup.");
    }
    const result = await restoreRemoteSnapshot(oldCompleteRows);
    return {
      legacy: true,
      restoredCentralRows: result.restoredRows || 0,
      archivedExtraCentralRows: result.archivedExtraRows || 0,
      verified: result.verified !== false,
    };
  }

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
  if (!supabaseConfigured || !navigator.onLine) {
    throw new Error("Internet and Supabase configuration are required to restore backup data.");
  }
  const result = await restoreRemoteSnapshot(rows);
  return {
    legacy: true,
    restoredCentralRows: result.restoredRows || rows.length,
    archivedExtraCentralRows: result.archivedExtraRows || 0,
    verified: result.verified !== false,
  };
}

export async function restoreCompleteBackup(parsed) {
  if (parsed?.format !== BACKUP_FORMAT || Number(parsed?.version) !== BACKUP_VERSION) {
    return restoreLegacyBackup(parsed);
  }

  if (!supabaseConfigured || !navigator.onLine) {
    throw new Error("Internet and Supabase configuration are required to restore backup data.");
  }

  const remoteRows = Array.isArray(parsed?.central?.rows) ? parsed.central.rows : [];
  const result = await restoreRemoteSnapshot(remoteRows);
  restoreLocalPreferences(parsed?.localPreferences || {});

  return {
    legacy: false,
    restoredCentralRows: result.restoredRows || 0,
    archivedExtraCentralRows: result.archivedExtraRows || 0,
    verified: result.verified !== false,
  };
}

export function summarizeBackup(payload) {
  const manifest = payload?.manifest || {};
  return {
    centralRows: Number(manifest.centralRows || 0),
    activeRows: Number(manifest.centralActiveRows || 0),
    deletedRows: Number(manifest.centralDeletedRows || 0),
    localCollections: 0,
    pendingOperations: 0,
    embeddedAssets: Number(manifest?.embeddedAssets?.centralCount || 0),
  };
}
