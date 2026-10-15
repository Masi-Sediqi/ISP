import { useCallback, useEffect, useRef, useState } from "react";

import { notify } from "../utils/notify";
import { getRecordIdentity } from "../utils/recycleBin";
import {
  calculateChanges,
  currentActorSnapshot,
  fetchServerCollection,
  saveCollectionChanges,
} from "../sync/collectionSync";
import { pushRemoteChanges, serverConfigured } from "../services/serverRest";
import {
  enqueueSyncOperation,
  migrateLocalStorageCollection,
  readIndexedCollection,
  writeIndexedCollection,
} from "../db/indexedDb";

const DISABLED_COLLECTIONS = new Set();
const ACTIVITY_COLLECTION = "employeeActivities";
const ACTIVITY_IGNORED_COLLECTIONS = new Set([
  ACTIVITY_COLLECTION,
  "employeeReports",
  "recycleBin",
]);
const REMOTE_REFRESH_MS = 30000;
const sharedCollectionRequests = new Map();
const localCollectionKey = (name) => `isp-local-collection:${name}`;
const canUseRemote = () => serverConfigured && navigator.onLine;

async function fetchCollectionShared(name) {
  if (sharedCollectionRequests.has(name)) {
    return sharedCollectionRequests.get(name);
  }

  const request = fetchServerCollection(name).finally(() => {
    sharedCollectionRequests.delete(name);
  });

  sharedCollectionRequests.set(name, request);
  return request;
}

const normalize = (value) => String(value || "").trim().toLowerCase();

function isFullAdminAccount(account) {
  const roles = [
    account?.role,
    account?.primaryRole,
    ...(Array.isArray(account?.roles) ? account.roles : []),
  ]
    .filter(Boolean)
    .map(normalize);

  return (
    account?.isDefaultAdmin === true ||
    account?.isFullAdmin === true ||
    account?.permissions?.all === true ||
    roles.some((role) =>
      ["full admin", "full administrator", "administrator", "admin"].includes(role)
    )
  );
}

function actorName(account) {
  return (
    account?.fullName ||
    account?.employeeName ||
    account?.username ||
    account?.email ||
    "Employee"
  );
}


function buildRecycleEntries(collectionName, previousItems, nextItems) {
  if (collectionName === "recycleBin") return [];
  const nextIds = new Set(nextItems.map(getRecordIdentity));
  const removed = previousItems.filter((item) => !nextIds.has(getRecordIdentity(item)));
  if (!removed.length) return [];

  const actor = currentActorSnapshot();
  const deletedAt = new Date().toISOString();
  return removed.map((record, index) => ({
    id: `recycle-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 9)}`,
    sourceCollection: collectionName,
    sourceCollectionLabel: collectionName,
    recordType: collectionName,
    sourceType: "server",
    recycleStorage: "server",
    recordId: getRecordIdentity(record),
    recordLabel:
      record?.customerName || record?.fullName || record?.projectName ||
      record?.supplierName || record?.name || record?.title ||
      record?.assetId || record?.id || collectionName,
    record,
    deletedAt,
    deletedByAccountId: actor?.id || "",
    deletedByEmployeeId: actor?.employeeId || "",
    deletedByName: actorName(actor),
    deletedByEmail: actor?.email || "",
    deletedByRole: actor?.primaryRole || actor?.role || actor?.accountType || "",
  }));
}

async function archiveRemovedRecordsToServer(collectionName, previousItems, nextItems) {
  const entries = buildRecycleEntries(collectionName, previousItems, nextItems);
  if (!entries.length) return;
  const actor = currentActorSnapshot();
  await pushRemoteChanges({
    collection: "recycleBin",
    upserts: entries,
    deletes: [],
    actorId: actor.id || actor.employeeId || "",
    ownerId: actor.employeeId || actor.id || "",
    identityFn: getRecordIdentity,
  });
}

function detectCollectionChange(previousItems, nextItems) {
  const previousByKey = new Map(previousItems.map((item) => [getRecordIdentity(item), item]));
  const nextByKey = new Map(nextItems.map((item) => [getRecordIdentity(item), item]));
  const createdIds = [];
  const updatedIds = [];
  const deletedIds = [];

  nextByKey.forEach((item, key) => {
    const previous = previousByKey.get(key);
    if (!previous) createdIds.push(key);
    else if (JSON.stringify(previous) !== JSON.stringify(item)) updatedIds.push(key);
  });

  previousByKey.forEach((_, key) => {
    if (!nextByKey.has(key)) deletedIds.push(key);
  });

  const createdCount = createdIds.length;
  const updatedCount = updatedIds.length;
  const deletedCount = deletedIds.length;
  const action =
    createdCount && !updatedCount && !deletedCount
      ? "created"
      : updatedCount && !createdCount && !deletedCount
        ? "updated"
        : deletedCount && !createdCount && !updatedCount
          ? "deleted"
          : "changed";

  return {
    action,
    createdCount,
    updatedCount,
    deletedCount,
    createdIds,
    updatedIds,
    deletedIds,
    changedIds: [...createdIds, ...updatedIds, ...deletedIds],
    totalChanged: createdCount + updatedCount + deletedCount,
  };
}

async function recordEmployeeActivity(collectionName, previousItems, nextItems) {
  if (ACTIVITY_IGNORED_COLLECTIONS.has(collectionName)) return;

  const actor = currentActorSnapshot();
  if (!actor?.id || isFullAdminAccount(actor) || !serverConfigured || !navigator.onLine) return;

  const change = detectCollectionChange(previousItems, nextItems);
  if (!change.totalChanged) return;

  const now = new Date().toISOString();
  const record = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: "employee-action",
    collection: collectionName,
    action: change.action,
    createdCount: change.createdCount,
    updatedCount: change.updatedCount,
    deletedCount: change.deletedCount,
    createdIds: change.createdIds,
    updatedIds: change.updatedIds,
    deletedIds: change.deletedIds,
    changedIds: change.changedIds,
    primaryRecordId: change.changedIds?.[0] || "",
    totalChanged: change.totalChanged,
    actorId: actor.id,
    actorEmployeeId: actor.employeeId || "",
    actorName: actorName(actor),
    actorEmail: actor.email || "",
    actorRole: actor.primaryRole || actor.role || "Employee",
    adminNotificationType: "employee-action",
    adminNotificationAt: now,
    adminNotificationSound: false,
    createdAt: now,
  };

  try {
    await pushRemoteChanges({
      collection: ACTIVITY_COLLECTION,
      upserts: [record],
      deletes: [],
      actorId: actor.id || actor.employeeId || "",
      ownerId: actor.employeeId || actor.id || "",
      identityFn: getRecordIdentity,
    });
    window.dispatchEvent(
      new CustomEvent("isp-employee-activity-updated", { detail: record })
    );
  } catch (error) {
    console.warn("Unable to record employee activity in VPS server:", error);
  }
}

async function queueCollectionChanges(collectionName, previousItems, nextItems) {
  const actor = currentActorSnapshot();
  const changes = calculateChanges(previousItems, nextItems);
  await enqueueSyncOperation({
    collection: collectionName,
    upserts: changes.upserts,
    deletes: changes.deletes,
    actorId: actor.id || actor.employeeId || "",
    ownerId: actor.employeeId || actor.id || "",
  });
}

export function useJsonCollection(name) {
  const disabled = DISABLED_COLLECTIONS.has(name);
  const [items, setItemsState] = useState([]);
  const [loaded, setLoaded] = useState(disabled);
  const [loadError, setLoadError] = useState(null);
  const itemsRef = useRef([]);
  const loadingRef = useRef(false);
  const loadedRef = useRef(disabled);

  const applyItems = useCallback((nextItems) => {
    const safe = Array.isArray(nextItems) ? nextItems : [];
    itemsRef.current = safe;
    setItemsState(safe);
    return safe;
  }, []);

  const loadLocalItems = useCallback(async () => {
    try {
      const localItems = await migrateLocalStorageCollection(
        name,
        localCollectionKey(name)
      );
      applyItems(localItems);
      return localItems;
    } catch (error) {
      console.warn(`[Local collection failed] ${name}:`, error);
      try {
        const localItems = await readIndexedCollection(name);
        applyItems(localItems);
        return localItems;
      } catch {
        return itemsRef.current;
      }
    }
  }, [applyItems, name]);

  const load = useCallback(async () => {
    if (disabled) {
      applyItems([]);
      setLoaded(true);
      return [];
    }

    if (loadingRef.current) return itemsRef.current;
    loadingRef.current = true;

    const isInitialLoad = !loadedRef.current;
    const loadingToken = isInitialLoad
      ? `${name}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`
      : null;

    if (loadingToken && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("isp-data-loading", {
          detail: { phase: "start", token: loadingToken, collection: name },
        })
      );
    }

    try {
      if (!canUseRemote()) {
        const localItems = await loadLocalItems();
        setLoadError(null);
        return localItems;
      }

      const remoteItems = await fetchCollectionShared(name);
      applyItems(remoteItems);
      writeIndexedCollection(name, remoteItems).catch((error) => {
        console.warn(`[Local cache write failed] ${name}:`, error);
      });
      setLoadError(null);
      return remoteItems;
    } catch (error) {
      console.error(`[VPS server collection failed] ${name}:`, error);
      setLoadError(error);
      const localItems = await loadLocalItems();
      if (!loadedRef.current && !localItems.length) {
        notify(error?.message || `Unable to load ${name} from VPS server.`, "error");
      }
      return localItems;
    } finally {
      loadedRef.current = true;
      setLoaded(true);
      loadingRef.current = false;

      if (loadingToken && typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("isp-data-loading", {
            detail: { phase: "end", token: loadingToken, collection: name },
          })
        );
      }
    }
  }, [applyItems, disabled, loadLocalItems, name]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (disabled) return undefined;

    const handleRemoteChange = (event) => {
      if (Array.isArray(event?.detail)) applyItems(event.detail);
      else load();
    };
    const handleOnline = () => load();

    window.addEventListener(`isp-server:${name}`, handleRemoteChange);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener(`isp-server:${name}`, handleRemoteChange);
      window.removeEventListener("online", handleOnline);
    };
  }, [applyItems, disabled, load, name]);

  useEffect(() => {
    if (disabled || !serverConfigured) return undefined;
    const refreshIfVisible = () => {
      if (
        document.visibilityState !== "visible" ||
        !navigator.onLine ||
        loadingRef.current
      ) {
        return;
      }
      load();
    };

    const timer = window.setInterval(refreshIfVisible, REMOTE_REFRESH_MS);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") refreshIfVisible();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [disabled, load]);

  const setItems = useCallback(
    async (nextValue) => {
      if (disabled) return false;

      const previousItems = itemsRef.current;
      const nextItems =
        typeof nextValue === "function" ? nextValue(previousItems) : nextValue;

      if (!Array.isArray(nextItems)) {
        notify(`Invalid data format for ${name}.`, "error");
        return false;
      }

      // Save locally first so forms can close quickly; server sync continues below.
      applyItems(nextItems);

      try {
        await writeIndexedCollection(name, nextItems);
        window.dispatchEvent(
          new CustomEvent(`isp-server:${name}`, { detail: nextItems })
        );
      } catch (error) {
        applyItems(previousItems);
        console.error(`Unable to save ${name} locally:`, error);
        notify(error?.message || `Unable to save ${name} locally.`, "error");
        return false;
      }

      if (!canUseRemote()) {
        try {
          await queueCollectionChanges(name, previousItems, nextItems);
        } catch (error) {
          console.warn(`[Sync queue failed] ${name}:`, error);
        }
        return true;
      }

      Promise.resolve()
        .then(async () => {
          await archiveRemovedRecordsToServer(name, previousItems, nextItems);
          await saveCollectionChanges(name, previousItems, nextItems);
          recordEmployeeActivity(name, previousItems, nextItems);
        })
        .catch(async (error) => {
          console.warn(`[Background sync failed] ${name}:`, error);
          try {
            await queueCollectionChanges(name, previousItems, nextItems);
            notify("Saved locally. It will sync when the VPS server is available.", "info");
          } catch (queueError) {
            console.error(`Unable to queue ${name} for sync:`, queueError);
          }
        });

      return true;
    },
    [applyItems, disabled, name]
  );

  return [items, setItems, load, loaded, loadError];
}
