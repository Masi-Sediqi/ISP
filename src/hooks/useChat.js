import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchChatMessages,
  fetchChatPresence,
  saveChatMessage,
  saveChatMessages,
  saveChatPresence,
} from "../services/chatStore";
import { supabaseConfigured } from "../services/supabaseRest";

const MESSAGE_POLL_MS = 1500;
const PRESENCE_POLL_MS = 2000;
const HEARTBEAT_MS = 8000;
const ONLINE_WINDOW_MS = 22000;
const TYPING_WINDOW_MS = 3500;

function getAccountId(user) {
  return String(
    user?.id || user?.accountId || user?.employeeId || user?.username || ""
  );
}

function uniqueMessages(items) {
  const map = new Map();
  (Array.isArray(items) ? items : []).forEach((item) => {
    if (!item?.id) return;
    map.set(String(item.id), item);
  });
  return [...map.values()].sort(
    (first, second) =>
      new Date(first.createdAt || 0) - new Date(second.createdAt || 0)
  );
}

export function useChat(currentUser) {
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const messagesRef = useRef([]);
  const presenceRef = useRef(null);
  const accountId = getAccountId(currentUser);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const mergeMessages = useCallback((incoming) => {
    setMessages((current) => uniqueMessages([...current, ...(incoming || [])]));
  }, []);

  const loadMessages = useCallback(async () => {
    if (!supabaseConfigured || !accountId || !navigator.onLine) return;

    try {
      const remote = await fetchChatMessages();
      const mine = (remote || []).filter((message) => {
        const from = String(message?.fromAccountId || "");
        const to = String(message?.toAccountId || "");
        return from === accountId || to === accountId;
      });
      setMessages(uniqueMessages(mine));
    } catch (error) {
      console.warn("Chat message sync failed:", error);
    }
  }, [accountId]);

  const heartbeat = useCallback(
    async (extra = {}) => {
      if (!supabaseConfigured || !accountId || !navigator.onLine) return;

      const next = {
        id: accountId,
        accountId,
        senderName:
          currentUser?.fullName ||
          currentUser?.employeeName ||
          currentUser?.username ||
          currentUser?.email ||
          "Employee",
        lastSeen: new Date().toISOString(),
        typingToAccountId: extra.typingToAccountId ?? presenceRef.current?.typingToAccountId ?? "",
        typingAt: extra.typingAt ?? presenceRef.current?.typingAt ?? null,
      };

      presenceRef.current = next;

      try {
        await saveChatPresence(next, accountId);
      } catch (error) {
        console.warn("Chat presence heartbeat failed:", error);
      }
    },
    [accountId, currentUser]
  );

  const loadPresence = useCallback(async () => {
    if (!supabaseConfigured || !accountId || !navigator.onLine) return;

    try {
      const rows = await fetchChatPresence();
      const now = Date.now();
      const online = [];
      const typing = {};

      (rows || []).forEach((presence) => {
        const id = String(presence?.accountId || presence?.id || "");
        if (!id) return;

        const lastSeen = new Date(presence?.lastSeen || 0).getTime();
        if (Number.isFinite(lastSeen) && now - lastSeen <= ONLINE_WINDOW_MS) {
          online.push(id);
        }

        const typingAt = new Date(presence?.typingAt || 0).getTime();
        if (
          String(presence?.typingToAccountId || "") === accountId &&
          id !== accountId &&
          Number.isFinite(typingAt) &&
          now - typingAt <= TYPING_WINDOW_MS
        ) {
          typing[id] = {
            accountId: id,
            senderName: presence?.senderName || "Employee",
            typedAt: presence?.typingAt,
          };
        }
      });

      setOnlineUsers([...new Set(online)]);
      setTypingUsers(typing);
    } catch (error) {
      console.warn("Chat presence sync failed:", error);
    }
  }, [accountId]);

  useEffect(() => {
    if (!accountId) return undefined;

    let stopped = false;
    let messageTimer;
    let presenceTimer;
    let heartbeatTimer;

    const pollMessages = async () => {
      if (stopped) return;
      await loadMessages();
      if (!stopped) messageTimer = window.setTimeout(pollMessages, MESSAGE_POLL_MS);
    };

    const pollPresence = async () => {
      if (stopped) return;
      await loadPresence();
      if (!stopped) presenceTimer = window.setTimeout(pollPresence, PRESENCE_POLL_MS);
    };

    const pulse = async () => {
      if (stopped) return;
      await heartbeat();
      if (!stopped) heartbeatTimer = window.setTimeout(pulse, HEARTBEAT_MS);
    };

    pollMessages();
    pollPresence();
    pulse();

    const onOnline = () => {
      loadMessages();
      loadPresence();
      heartbeat();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        loadMessages();
        loadPresence();
        heartbeat();
      }
    };

    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stopped = true;
      window.clearTimeout(messageTimer);
      window.clearTimeout(presenceTimer);
      window.clearTimeout(heartbeatTimer);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [accountId, heartbeat, loadMessages, loadPresence]);

  const sendMessage = useCallback(
    async (data) => {
      if (!accountId) {
        return { success: false, error: "No active account was found." };
      }
      if (!supabaseConfigured) {
        return {
          success: false,
          error: "Supabase is not configured for chat.",
        };
      }
      if (!navigator.onLine) {
        return {
          success: false,
          error: "Internet connection is required to send messages.",
        };
      }

      const now = new Date().toISOString();
      const message = {
        ...data,
        id:
          globalThis.crypto?.randomUUID?.() ||
          `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        fromAccountId: String(data?.fromAccountId || accountId),
        toAccountId: String(data?.toAccountId || ""),
        text: String(data?.text || ""),
        attachments: Array.isArray(data?.attachments) ? data.attachments : [],
        createdAt: now,
        updatedAt: now,
        delivered: true,
        seen: false,
        seenAt: null,
      };

      if (!message.toAccountId) {
        return { success: false, error: "Receiver account is missing." };
      }

      try {
        await saveChatMessage(message, accountId);
        mergeMessages([message]);
        return { success: true, message };
      } catch (error) {
        console.error("Unable to send chat message:", error);
        return {
          success: false,
          error: error?.message || "Unable to send message.",
        };
      }
    },
    [accountId, mergeMessages]
  );

  const seenMessages = useCallback(
    async (ids) => {
      const idSet = new Set((Array.isArray(ids) ? ids : []).map(String));
      if (!idSet.size || !accountId || !navigator.onLine) return;

      const seenAt = new Date().toISOString();
      const updates = messagesRef.current
        .filter((message) => idSet.has(String(message?.id)))
        .map((message) => ({
          ...message,
          seen: true,
          delivered: true,
          seenAt,
          updatedAt: seenAt,
        }));

      if (!updates.length) return;

      setMessages((current) =>
        current.map((message) =>
          idSet.has(String(message?.id))
            ? { ...message, seen: true, delivered: true, seenAt, updatedAt: seenAt }
            : message
        )
      );

      try {
        await saveChatMessages(updates, accountId);
      } catch (error) {
        console.warn("Unable to mark messages as seen:", error);
      }
    },
    [accountId]
  );

  const sendTyping = useCallback(
    (data) => {
      if (!accountId) return;
      heartbeat({
        typingToAccountId: data?.isTyping ? String(data?.toAccountId || "") : "",
        typingAt: data?.isTyping ? new Date().toISOString() : null,
      });
    },
    [accountId, heartbeat]
  );

  return {
    messages,
    onlineUsers,
    typingUsers,
    sendMessage,
    seenMessages,
    sendTyping,
  };
}
