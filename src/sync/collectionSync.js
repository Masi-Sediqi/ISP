import {
  enqueueSyncOperation,
  listSyncOperations,
  pendingRecordIdentities,
  removeSyncOperation,
} from "../db/indexedDb";
import {
  fetchRemoteCollection,
  pushRemoteChanges,
  supabaseConfigured,
} from "../services/supabaseRest";
import { getRecordIdentity } from "../utils/recycleBin";

let flushing = null;

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

export function calculateChanges(previousItems, nextItems) {
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

export async function queueCollectionChanges(collection, previousItems, nextItems) {
  const { upserts, deletes } = calculateChanges(previousItems, nextItems);
  if (!upserts.length && !deletes.length) return null;

  const actor = currentActorSnapshot();
  return enqueueSyncOperation({
    collection,
    upserts,
    deletes,
    actorId: actor.id || actor.employeeId || "",
    ownerId: actor.employeeId || actor.id || "",
  });
}

export async function flushSyncQueue() {
  if (!supabaseConfigured || !navigator.onLine) return false;
  if (flushing) return flushing;

  flushing = (async () => {
    const operations = (await listSyncOperations()).sort((a, b) =>
      String(a.createdAt).localeCompare(String(b.createdAt))
    );

    for (const operation of operations) {
      try {
        await pushRemoteChanges({
          collection: operation.collection,
          upserts: operation.upserts,
          deletes: operation.deletes,
          actorId: operation.actorId,
          ownerId: operation.ownerId,
          identityFn: getRecordIdentity,
        });
        await removeSyncOperation(operation.id);
      } catch (error) {
        console.warn("Supabase sync paused:", error);
        return false;
      }
    }

    return true;
  })().finally(() => {
    flushing = null;
  });

  return flushing;
}

export async function fetchMergedRemoteCollection(collection, localItems) {
  if (!supabaseConfigured || !navigator.onLine) return localItems;

  const remoteItems = await fetchRemoteCollection(collection);
  const pending = await pendingRecordIdentities(collection, getRecordIdentity);
  const localById = new Map(localItems.map((item) => [getRecordIdentity(item), item]));
  const merged = new Map(remoteItems.map((item) => [getRecordIdentity(item), item]));

  pending.upserts.forEach((identity) => {
    if (localById.has(identity)) merged.set(identity, localById.get(identity));
  });
  pending.deletes.forEach((identity) => merged.delete(identity));

  return [...merged.values()];
}

export async function seedRemoteIfEmpty(collection, localItems) {
  if (!supabaseConfigured || !navigator.onLine || !localItems.length) return false;
  const remoteItems = await fetchRemoteCollection(collection);
  if (remoteItems.length) return false;

  const actor = currentActorSnapshot();
  await pushRemoteChanges({
    collection,
    upserts: localItems,
    deletes: [],
    actorId: actor.id || actor.employeeId || "",
    ownerId: actor.employeeId || actor.id || "",
    identityFn: getRecordIdentity,
  });
  return true;
}
