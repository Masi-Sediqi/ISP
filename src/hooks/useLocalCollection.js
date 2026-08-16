import { useCallback, useEffect, useRef, useState } from "react";
import { notify } from "../utils/notify";
import {
  fetchSupabaseCollection,
  saveCollectionChanges,
} from "../sync/collectionSync";
import { supabaseConfigured } from "../services/supabaseRest";

const REMOTE_REFRESH_MS = 5000;

// Kept under the old hook name so existing pages do not need to change.
// It is no longer local: all business data is read/written only in Supabase.
export function useLocalCollection(name, options = {}) {
  const [items, setItemsState] = useState([]);
  const itemsRef = useRef([]);
  const loadingRef = useRef(false);

  const applyItems = useCallback((nextItems) => {
    const safe = Array.isArray(nextItems) ? nextItems : [];
    itemsRef.current = safe;
    setItemsState(safe);
    return safe;
  }, []);

  const load = useCallback(async () => {
    if (loadingRef.current) return itemsRef.current;
    loadingRef.current = true;
    try {
      const remote = await fetchSupabaseCollection(name);
      applyItems(remote);
      return remote;
    } catch (error) {
      console.warn(`Unable to load ${name} from Supabase:`, error);
      return itemsRef.current;
    } finally {
      loadingRef.current = false;
    }
  }, [applyItems, name]);

  useEffect(() => {
    load();

    const handleRemoteChange = (event) => {
      if (Array.isArray(event?.detail)) applyItems(event.detail);
      else load();
    };
    const handleOnline = () => load();

    window.addEventListener(`isp-supabase:${name}`, handleRemoteChange);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener(`isp-supabase:${name}`, handleRemoteChange);
      window.removeEventListener("online", handleOnline);
    };
  }, [applyItems, load, name]);

  useEffect(() => {
    if (!supabaseConfigured) return undefined;
    const timer = window.setInterval(() => {
      if (!navigator.onLine || loadingRef.current) return;
      load();
    }, REMOTE_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  const setItems = useCallback(
    async (nextValue) => {
      const current = itemsRef.current;
      const next = typeof nextValue === "function" ? nextValue(current) : nextValue;
      if (!Array.isArray(next)) return false;

      applyItems(next);
      try {
        await saveCollectionChanges(name, current, next);
        window.dispatchEvent(new CustomEvent(`isp-supabase:${name}`, { detail: next }));
        return true;
      } catch (error) {
        applyItems(current);
        console.error(`Unable to save ${name} to Supabase:`, error);
        notify(error?.message || `Unable to save ${name} to Supabase.`, "error");
        return false;
      }
    },
    [applyItems, name]
  );

  return [items, setItems];
}
