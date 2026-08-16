const DB_NAME = "afghan-power-local";
const DB_VERSION = 1;
const COLLECTION_STORE = "collections";
const QUEUE_STORE = "syncQueue";

let dbPromise;

function openDatabase() {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available in this browser."));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(COLLECTION_STORE)) {
          db.createObjectStore(COLLECTION_STORE, { keyPath: "name" });
        }
        if (!db.objectStoreNames.contains(QUEUE_STORE)) {
          const store = db.createObjectStore(QUEUE_STORE, { keyPath: "id" });
          store.createIndex("collection", "collection", { unique: false });
          store.createIndex("createdAt", "createdAt", { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Unable to open IndexedDB."));
    });
  }

  return dbPromise;
}

function requestAsPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB request failed."));
  });
}

async function withStore(storeName, mode, callback) {
  const db = await openDatabase();
  const tx = db.transaction(storeName, mode);
  const store = tx.objectStore(storeName);
  const result = await callback(store);

  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("IndexedDB transaction failed."));
    tx.onabort = () => reject(tx.error || new Error("IndexedDB transaction was aborted."));
  });

  return result;
}

export async function readIndexedCollection(name) {
  const row = await withStore(COLLECTION_STORE, "readonly", (store) =>
    requestAsPromise(store.get(String(name)))
  );
  return Array.isArray(row?.items) ? row.items : [];
}

export async function writeIndexedCollection(name, items) {
  const safeItems = Array.isArray(items) ? items : [];
  await withStore(COLLECTION_STORE, "readwrite", (store) =>
    requestAsPromise(
      store.put({
        name: String(name),
        items: safeItems,
        updatedAt: new Date().toISOString(),
      })
    )
  );
  window.dispatchEvent(new CustomEvent(`isp-indexed:${name}`, { detail: safeItems }));
  return safeItems;
}

export async function migrateLocalStorageCollection(name, storageKey) {
  const existing = await readIndexedCollection(name);
  if (existing.length) return existing;

  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (Array.isArray(parsed) && parsed.length) {
      await writeIndexedCollection(name, parsed);
      return parsed;
    }
  } catch {
    // Ignore malformed legacy localStorage data.
  }

  return existing;
}

export async function enqueueSyncOperation(operation) {
  const row = {
    id: operation.id || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    collection: String(operation.collection),
    upserts: Array.isArray(operation.upserts) ? operation.upserts : [],
    deletes: Array.isArray(operation.deletes) ? operation.deletes : [],
    actorId: String(operation.actorId || ""),
    ownerId: String(operation.ownerId || operation.actorId || ""),
    createdAt: operation.createdAt || new Date().toISOString(),
  };

  await withStore(QUEUE_STORE, "readwrite", (store) => requestAsPromise(store.put(row)));
  return row;
}

export async function listSyncOperations(collection = null) {
  return withStore(QUEUE_STORE, "readonly", async (store) => {
    if (collection && store.indexNames.contains("collection")) {
      return requestAsPromise(store.index("collection").getAll(String(collection)));
    }
    return requestAsPromise(store.getAll());
  });
}

export async function removeSyncOperation(id) {
  await withStore(QUEUE_STORE, "readwrite", (store) => requestAsPromise(store.delete(id)));
}

export async function pendingRecordIdentities(collection, identityFn) {
  const operations = await listSyncOperations(collection);
  const upserts = new Set();
  const deletes = new Set();

  operations.forEach((operation) => {
    operation.upserts.forEach((record) => upserts.add(identityFn(record)));
    operation.deletes.forEach((identity) => deletes.add(String(identity)));
  });

  return { upserts, deletes };
}
