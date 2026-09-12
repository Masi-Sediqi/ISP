import {
  fetchRemoteCollection,
  pushRemoteChanges,
  serverConfigured,
} from "../services/serverApi";
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
  if (!serverConfigured) {
    throw new Error("Application server is not available.");
  }
  if (!navigator.onLine) {
    throw new Error("Internet connection is required. Data is stored on the VPS server.");
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

export async function fetchServerCollection(collection) {
  if (!serverConfigured) {
    throw new Error("Application server is not available.");
  }
  if (!navigator.onLine) {
    throw new Error("Internet connection is required. Data is stored on the VPS server.");
  }
  return fetchRemoteCollection(collection);
}
