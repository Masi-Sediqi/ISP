import {
  fetchRemoteCollection,
  pushRemoteChanges,
  supabaseConfigured,
} from "./supabaseRest";

const MESSAGE_COLLECTION = "chatMessages";
const PRESENCE_COLLECTION = "chatPresence";

const identity = (record) => String(record?.id || record?.accountId || "");

function requireSupabase() {
  if (!supabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
    );
  }
}

export async function fetchChatMessages() {
  requireSupabase();
  return fetchRemoteCollection(MESSAGE_COLLECTION);
}

export async function saveChatMessage(message, actorId) {
  requireSupabase();
  await pushRemoteChanges({
    collection: MESSAGE_COLLECTION,
    upserts: [message],
    deletes: [],
    actorId: String(actorId || ""),
    ownerId: String(actorId || ""),
    identityFn: identity,
  });
  return message;
}

export async function saveChatMessages(messages, actorId) {
  requireSupabase();
  const valid = (Array.isArray(messages) ? messages : []).filter((item) =>
    identity(item)
  );
  if (!valid.length) return;

  await pushRemoteChanges({
    collection: MESSAGE_COLLECTION,
    upserts: valid,
    deletes: [],
    actorId: String(actorId || ""),
    ownerId: String(actorId || ""),
    identityFn: identity,
  });
}

export async function fetchChatPresence() {
  requireSupabase();
  return fetchRemoteCollection(PRESENCE_COLLECTION);
}

export async function saveChatPresence(presence, actorId) {
  requireSupabase();
  await pushRemoteChanges({
    collection: PRESENCE_COLLECTION,
    upserts: [presence],
    deletes: [],
    actorId: String(actorId || ""),
    ownerId: String(actorId || ""),
    identityFn: identity,
  });
  return presence;
}
