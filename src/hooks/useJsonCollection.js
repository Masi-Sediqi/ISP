import { useCallback, useEffect, useRef, useState } from "react";

import { notify } from "../utils/notify";
import {
  archiveLocalRemovedRecords,
  getRecordIdentity,
} from "../utils/recycleBin";
import {
  migrateLocalStorageCollection,
  readIndexedCollection,
  writeIndexedCollection,
} from "../db/indexedDb";
import {
  currentActorSnapshot,
  fetchMergedRemoteCollection,
  flushSyncQueue,
  queueCollectionChanges,
  seedRemoteIfEmpty,
} from "../sync/collectionSync";
import { supabaseConfigured } from "../services/supabaseRest";

const DISABLED_COLLECTIONS = new Set();
const ACTIVITY_COLLECTION = "employeeActivities";
const ACTIVITY_IGNORED_COLLECTIONS = new Set([
  ACTIVITY_COLLECTION,
  "employeeReports",
  "recycleBin",
]);
const REMOTE_REFRESH_MS = 8000;

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
    roles.some((role) => ["full admin", "administrator", "admin"].includes(role))
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
  if (!actor?.id || isFullAdminAccount(actor)) return;

  const change = detectCollectionChange(previousItems, nextItems);
  if (!change.totalChanged) return;

  try {
    const activities = await readIndexedCollection(ACTIVITY_COLLECTION);
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

    const nextActivities = [...activities, record];
    await writeIndexedCollection(ACTIVITY_COLLECTION, nextActivities);
    await queueCollectionChanges(ACTIVITY_COLLECTION, activities, nextActivities);
    flushSyncQueue();

    window.dispatchEvent(
      new CustomEvent("isp-employee-activity-updated", { detail: record })
    );
  } catch (error) {
    console.warn("Unable to record employee activity:", error);
  }
}

export function useJsonCollection(name, options = {}) {
  const disabled = DISABLED_COLLECTIONS.has(name);
  const [items, setItemsState] = useState([]);
  const [loaded, setLoaded] = useState(disabled);
  const itemsRef = useRef([]);
  const loadingRef = useRef(false);

  const applyItems = useCallback(
    async (nextItems) => {
      const safe = Array.isArray(nextItems) ? nextItems : [];
      itemsRef.current = safe;
      setItemsState(safe);
      await writeIndexedCollection(name, safe);
      return safe;
    },
    [name]
  );

  const load = useCallback(async () => {
    if (disabled) {
      itemsRef.current = [];
      setItemsState([]);
      setLoaded(true);
      return [];
    }

    if (loadingRef.current) return itemsRef.current;
    loadingRef.current = true;

    try {
      let localItems = await migrateLocalStorageCollection(
        name,
        `isp-local-collection:${name}`
      );

      itemsRef.current = localItems;
      setItemsState(localItems);
      setLoaded(true);

      if (supabaseConfigured && navigator.onLine) {
        try {
          await flushSyncQueue();
          await seedRemoteIfEmpty(name, localItems);
          const merged = await fetchMergedRemoteCollection(name, localItems);
          localItems = await applyItems(merged);
        } catch (error) {
          console.warn(`Unable to refresh ${name} from Supabase:`, error);
        }
      }

      return localItems;
    } catch (error) {
      console.error(`Unable to load ${name} from IndexedDB:`, error);
      setLoaded(true);
      notify(`Unable to load local ${name} data.`, "error");
      return [];
    } finally {
      loadingRef.current = false;
    }
  }, [applyItems, disabled, name]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (disabled) return undefined;

    const handleIndexedChange = (event) => {
      const nextItems = Array.isArray(event?.detail) ? event.detail : null;
      if (nextItems) {
        itemsRef.current = nextItems;
        setItemsState(nextItems);
      } else {
        readIndexedCollection(name).then((stored) => {
          itemsRef.current = stored;
          setItemsState(stored);
        });
      }
    };

    const handleOnline = async () => {
      await flushSyncQueue();
      load();
    };

    window.addEventListener(`isp-indexed:${name}`, handleIndexedChange);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener(`isp-indexed:${name}`, handleIndexedChange);
      window.removeEventListener("online", handleOnline);
    };
  }, [disabled, load, name]);

  useEffect(() => {
    if (disabled || !supabaseConfigured) return undefined;

    const timer = window.setInterval(async () => {
      if (!navigator.onLine || loadingRef.current) return;
      try {
        await flushSyncQueue();
        const merged = await fetchMergedRemoteCollection(name, itemsRef.current);
        if (JSON.stringify(merged) !== JSON.stringify(itemsRef.current)) {
          await applyItems(merged);
        }
      } catch (error) {
        console.warn(`Background sync failed for ${name}:`, error);
      }
    }, REMOTE_REFRESH_MS);

    return () => window.clearInterval(timer);
  }, [applyItems, disabled, name]);

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

      try {
        if (name !== "recycleBin") {
          archiveLocalRemovedRecords(name, previousItems, nextItems, "indexeddb");
        }

        await applyItems(nextItems);
        await queueCollectionChanges(name, previousItems, nextItems);
        recordEmployeeActivity(name, previousItems, nextItems);

        if (supabaseConfigured && navigator.onLine) {
          flushSyncQueue();
        }

        return true;
      } catch (error) {
        console.error(`Unable to save ${name} to IndexedDB:`, error);
        notify(`Unable to save ${name} locally.`, "error");
        return false;
      }
    },
    [applyItems, disabled, name]
  );

  return [items, setItems, load, loaded];
}
