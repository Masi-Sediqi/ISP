import { useCallback, useEffect, useRef, useState } from "react";

import { notify } from "../utils/notify";
import { getRecordIdentity } from "../utils/recycleBin";
import {
  currentActorSnapshot,
  fetchServerCollection,
  saveCollectionChanges,
} from "../sync/collectionSync";
import { pushRemoteChanges, serverConfigured } from "../services/serverRest";

const DISABLED_COLLECTIONS = new Set();
const ACTIVITY_COLLECTION = "employeeActivities";
const ACTIVITY_IGNORED_COLLECTIONS = new Set([
  ACTIVITY_COLLECTION,
  "employeeReports",
  "recycleBin",
]);
const sharedCollectionRequests = new Map();
// Short lived in-memory snapshots avoid duplicate round-trips when navigating
// between screens. Mutations invalidate the snapshot immediately.
const collectionSnapshots = new Map();
const SNAPSHOT_TTL_MS = 45000;
// Keep recently viewed collections in memory across route transitions.
// Writes and server events update or invalidate this cache immediately.
const canUseRemote = () => serverConfigured && navigator.onLine;

async function fetchCollectionShared(name) {
  if (sharedCollectionRequests.has(name)) {
    return sharedCollectionRequests.get(name);
  }

  const snapshot = collectionSnapshots.get(name);
  if (snapshot && Date.now() - snapshot.timestamp < SNAPSHOT_TTL_MS) {
    return snapshot.items;
  }

  const request = fetchServerCollection(name)
    .then((items) => {
      collectionSnapshots.set(name, { items, timestamp: Date.now() });
      return items;
    })
    .finally(() => {
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

export function useJsonCollection(name, options = {}) {
  const disabled = DISABLED_COLLECTIONS.has(name) || options.enabled === false;
  const background = options.background === true;
  const silentLoadErrors = options.silentLoadErrors === true;
  // Synchronously hydrate on remount, so visiting a previous section is instant.
  const initialSnapshot = !disabled ? collectionSnapshots.get(name) : null;
  const [items, setItemsState] = useState(() => initialSnapshot?.items || []);
  const [loaded, setLoaded] = useState(() => Boolean(initialSnapshot));
  const [loadError, setLoadError] = useState(null);
  const itemsRef = useRef(initialSnapshot?.items || []);
  const loadingRef = useRef(false);
  const loadedRef = useRef(Boolean(initialSnapshot));

  const applyItems = useCallback((nextItems) => {
    const safe = Array.isArray(nextItems) ? nextItems : [];
    itemsRef.current = safe;
    setItemsState(safe);
    return safe;
  }, []);

  const load = useCallback(async () => {
    if (disabled) {
      applyItems([]);
      loadedRef.current = false;
      setLoaded(false);
      setLoadError(null);
      return [];
    }

    if (loadingRef.current) return itemsRef.current;
    loadingRef.current = true;

    const isInitialLoad = !loadedRef.current;
    const loadingToken = isInitialLoad && !background
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
      if (!canUseRemote()) throw new Error("VPS server is unavailable. Check your connection.");

      const remoteItems = await fetchCollectionShared(name);
      applyItems(remoteItems);
      setLoadError(null);
      return remoteItems;
    } catch (error) {
      console.error(`[VPS server collection failed] ${name}:`, error);
      setLoadError(error);
      if (!loadedRef.current && !silentLoadErrors) {
        notify(error?.message || `Unable to load ${name} from VPS server.`, "error");
      }
      return itemsRef.current;
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
  }, [applyItems, background, disabled, name, silentLoadErrors]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (disabled) return undefined;

    const handleRemoteChange = (event) => {
      if (Array.isArray(event?.detail)) {
        collectionSnapshots.set(name, { items: event.detail, timestamp: Date.now() });
        applyItems(event.detail);
      } else {
        collectionSnapshots.delete(name);
        load();
      }
    };
    window.addEventListener(`isp-server:${name}`, handleRemoteChange);
    return () => {
      window.removeEventListener(`isp-server:${name}`, handleRemoteChange);
    };
  }, [applyItems, disabled, load, name]);

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

      if (!canUseRemote()) {
        notify("VPS server is unavailable. Check your connection.", "error");
        return false;
      }

      try {
        await archiveRemovedRecordsToServer(name, previousItems, nextItems);
        await saveCollectionChanges(name, previousItems, nextItems);
        collectionSnapshots.set(name, { items: nextItems, timestamp: Date.now() });
        applyItems(nextItems);
        window.dispatchEvent(
          new CustomEvent(`isp-server:${name}`, { detail: nextItems })
        );
        recordEmployeeActivity(name, previousItems, nextItems);
        setLoadError(null);
        return true;
      } catch (error) {
        console.error(`[VPS server save failed] ${name}:`, error);
        setLoadError(error);
        notify(error?.message || `Unable to save ${name} to VPS server.`, "error");
        return false;
      }
    },
    [applyItems, disabled, name]
  );

  return [items, setItems, load, loaded, loadError];
}
