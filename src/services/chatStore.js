import {
  fetchRemoteCollection,
  pushRemoteChanges,
  serverConfigured,
} from "./serverApi";

const MESSAGE_COLLECTION = "chatMessages";
const PRESENCE_COLLECTION = "chatPresence";

const identity = (record) => String(record?.id || record?.accountId || "");

function requireServer() {
  if (!serverConfigured) {
    throw new Error(
      "Application server is not available."
    );
  }
}

export async function fetchChatMessages() {
  requireServer();
  return fetchRemoteCollection(MESSAGE_COLLECTION);
}

export async function saveChatMessage(message, actorId) {
  requireServer();
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
  requireServer();
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
  requireServer();
  return fetchRemoteCollection(PRESENCE_COLLECTION);
}

export async function saveChatPresence(presence, actorId) {
  requireServer();
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
