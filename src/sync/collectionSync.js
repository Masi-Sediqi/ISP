import {
  fetchRemoteCollection,
  pushRemoteChanges,
  supabaseConfigured,
} from "../services/supabaseRest";
import { getRecordIdentity } from "../utils/recycleBin";

export function currentActorSnapshot() {
  try {
    const parsed = JSON.parse(localStorage.getItem("isp-current-user") || "null");
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    // Fall back to session id below.
  }

  const id = localStorage.getItem("isp-system-session") || "";
  return { id };
}

export function calculateChanges(previousItems = [], nextItems = []) {
  const previous = new Map(previousItems.map((item) => [getRecordIdentity(item), item]));
  const next = new Map(nextItems.map((item) => [getRecordIdentity(item), item]));
  const upserts = [];
  const deletes = [];

  next.forEach((item, identity) => {
    const oldItem = previous.get(identity);
    if (!oldItem || JSON.stringify(oldItem) !== JSON.stringify(item)) {
      upserts.push(item);
    }
  });

  previous.forEach((_, identity) => {
    if (!next.has(identity)) deletes.push(identity);
  });

  return { upserts, deletes };
}

export async function saveCollectionChanges(collection, previousItems, nextItems) {
  if (!supabaseConfigured) {
    throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }
  if (!navigator.onLine) {
    throw new Error("Internet connection is required. Data is stored only in Supabase.");
  }

  const { upserts, deletes } = calculateChanges(previousItems, nextItems);
  if (!upserts.length && !deletes.length) return true;

  const actor = currentActorSnapshot();
  await pushRemoteChanges({
    collection,
    upserts,
    deletes,
    actorId: actor.id || actor.employeeId || "",
    ownerId: actor.employeeId || actor.id || "",
    identityFn: getRecordIdentity,
  });
  return true;
}

export async function fetchSupabaseCollection(collection) {
  if (!supabaseConfigured) {
    throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }
  if (!navigator.onLine) {
    throw new Error("Internet connection is required. Data is stored only in Supabase.");
  }
  return fetchRemoteCollection(collection);
}
