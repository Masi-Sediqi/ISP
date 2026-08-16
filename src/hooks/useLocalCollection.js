import { useCallback, useEffect, useRef, useState } from "react";
import { notify } from "../utils/notify";
import { archiveLocalRemovedRecords } from "../utils/recycleBin";
import {
  migrateLocalStorageCollection,
  readIndexedCollection,
  writeIndexedCollection,
} from "../db/indexedDb";
import {
  fetchMergedRemoteCollection,
  flushSyncQueue,
  queueCollectionChanges,
  seedRemoteIfEmpty,
} from "../sync/collectionSync";
import { supabaseConfigured } from "../services/supabaseRest";

const prefix = "isp-local-collection:";
const REMOTE_REFRESH_MS = 8000;

export function useLocalCollection(name, options = {}) {
  const archiveDeletes = options.archiveDeletes !== false;
  const [items, setItemsState] = useState([]);
  const itemsRef = useRef([]);
  const loadingRef = useRef(false);

  const persist = useCallback(async (nextItems) => {
    const safe = Array.isArray(nextItems) ? nextItems : [];
    itemsRef.current = safe;
    setItemsState(safe);
    await writeIndexedCollection(name, safe);
    return safe;
  }, [name]);

  const load = useCallback(async () => {
    if (loadingRef.current) return itemsRef.current;
    loadingRef.current = true;

    try {
      let stored = await migrateLocalStorageCollection(name, `${prefix}${name}`);
      itemsRef.current = stored;
      setItemsState(stored);

      if (supabaseConfigured && navigator.onLine) {
        await flushSyncQueue();
        await seedRemoteIfEmpty(name, stored);
        stored = await fetchMergedRemoteCollection(name, stored);
        await persist(stored);
      }

      return stored;
    } catch (error) {
      console.warn(`Unable to refresh local collection ${name}:`, error);
      return itemsRef.current;
    } finally {
      loadingRef.current = false;
    }
  }, [name, persist]);

  useEffect(() => {
    let active = true;
    load();

    const reload = (event) => {
      if (!active) return;
      if (Array.isArray(event?.detail)) {
        itemsRef.current = event.detail;
        setItemsState(event.detail);
        return;
      }

      readIndexedCollection(name).then((stored) => {
        if (!active) return;
        itemsRef.current = stored;
        setItemsState(stored);
      });
    };

    const handleOnline = async () => {
      await flushSyncQueue();
      load();
    };

    window.addEventListener(`isp-indexed:${name}`, reload);
    window.addEventListener("online", handleOnline);

    return () => {
      active = false;
      window.removeEventListener(`isp-indexed:${name}`, reload);
      window.removeEventListener("online", handleOnline);
    };
  }, [load, name]);

  useEffect(() => {
    if (!supabaseConfigured) return undefined;

    const timer = window.setInterval(async () => {
      if (!navigator.onLine || loadingRef.current) return;
      try {
        await flushSyncQueue();
        const merged = await fetchMergedRemoteCollection(name, itemsRef.current);
        if (JSON.stringify(merged) !== JSON.stringify(itemsRef.current)) {
          await persist(merged);
        }
      } catch (error) {
        console.warn(`Background sync failed for ${name}:`, error);
      }
    }, REMOTE_REFRESH_MS);

    return () => window.clearInterval(timer);
  }, [name, persist]);

  const setItems = useCallback(
    async (nextValue) => {
      try {
        const current = itemsRef.current;
        const next = typeof nextValue === "function" ? nextValue(current) : nextValue;
        if (!Array.isArray(next)) return false;

        if (archiveDeletes) {
          archiveLocalRemovedRecords(name, current, next, "indexeddb-local");
        }

        await persist(next);
        await queueCollectionChanges(name, current, next);
        if (supabaseConfigured && navigator.onLine) flushSyncQueue();
        return true;
      } catch (error) {
        console.error(`Unable to save local ${name}:`, error);
        notify(`Unable to save ${name}.`, "error");
        return false;
      }
    },
    [archiveDeletes, name, persist]
  );

  return [items, setItems];
}
