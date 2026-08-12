import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { API_ORIGIN, apiUrl } from "../utils/api";

const socket = io(API_ORIGIN, {
  transports: ["websocket", "polling"],
});

export function useChat(currentUser) {
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const typingTimersRef = useRef({});
  const accountId = String(currentUser?.id || "");

  const loadMessages = useCallback(async () => {
    try {
      const response = await axios.get(apiUrl("messages"));
      setMessages(response.data || []);
    } catch {
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    if (!accountId) return;

    socket.emit("chat:join", {
      accountId,
    });

    loadMessages();

    const handleMessage = (message) => {
      setMessages((current) => {
        const existingIndex = current.findIndex(
          (item) => String(item.id) === String(message.id)
        );

        if (existingIndex >= 0) {
          return current.map((item, index) =>
            index === existingIndex ? message : item
          );
        }

        return [...current, message].sort(
          (first, second) =>
            new Date(first.createdAt || 0) -
            new Date(second.createdAt || 0)
        );
      });
    };

    const handleOnlineUsers = (users) => {
      setOnlineUsers(users || []);
    };

    const handleMessagesSeen = ({ messageIds, seenAt }) => {
      const ids = Array.isArray(messageIds)
        ? messageIds.map(String)
        : [];

      setMessages((current) =>
        current.map((message) =>
          ids.includes(String(message.id))
            ? {
                ...message,
                seen: true,
                delivered: true,
                seenAt,
              }
            : message
        )
      );
    };

    const handleTyping = (event) => {
      if (
        String(event?.toAccountId || "") !== accountId ||
        String(event?.fromAccountId || "") === accountId
      ) {
        return;
      }

      const fromAccountId = String(event.fromAccountId);

      window.clearTimeout(typingTimersRef.current[fromAccountId]);

      if (event.isTyping) {
        setTypingUsers((current) => ({
          ...current,
          [fromAccountId]: {
            accountId: fromAccountId,
            senderName: event.senderName,
            typedAt: event.typedAt,
          },
        }));

        typingTimersRef.current[fromAccountId] = window.setTimeout(() => {
          setTypingUsers((current) => {
            const next = { ...current };
            delete next[fromAccountId];
            return next;
          });
        }, 3500);

        return;
      }

      setTypingUsers((current) => {
        const next = { ...current };
        delete next[fromAccountId];
        return next;
      });
    };

    socket.on("chat:message", handleMessage);
    socket.on("chat:online-users", handleOnlineUsers);
    socket.on("chat:messages-seen", handleMessagesSeen);
    socket.on("chat:typing", handleTyping);

    return () => {
      socket.off("chat:message", handleMessage);
      socket.off("chat:online-users", handleOnlineUsers);
      socket.off("chat:messages-seen", handleMessagesSeen);
      socket.off("chat:typing", handleTyping);
      Object.values(typingTimersRef.current).forEach((timerId) =>
        window.clearTimeout(timerId)
      );
      typingTimersRef.current = {};
    };
  }, [accountId, loadMessages]);

  const sendMessage = useCallback((data) => {
    return new Promise((resolve) => {
      socket.emit("chat:send", data, resolve);
    });
  }, []);

  const seenMessages = useCallback((ids) => {
    socket.emit("chat:seen", {
      messageIds: ids,
    });
  }, []);

  const sendTyping = useCallback((data) => {
    socket.emit("chat:typing", data);
  }, []);

  return {
    messages,
    onlineUsers,
    typingUsers,
    sendMessage,
    seenMessages,
    sendTyping,
  };
}
