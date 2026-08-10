import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { API_ORIGIN, apiUrl } from "../utils/api";

const socket = io(API_ORIGIN, {
  transports: ["websocket", "polling"],
});

export function useChat(currentUser) {
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);

  async function loadMessages() {
    try {
      const response = await axios.get(apiUrl("messages"));
      setMessages(response.data || []);
    } catch {
      setMessages([]);
    }
  }

  useEffect(() => {
    if (!currentUser) return;

    socket.emit("chat:join", {
      accountId: currentUser.id,
    });

    loadMessages();

    socket.on("chat:message", (message) => {
      setMessages((current) => [...current, message]);
    });

    socket.on(
      "chat:online-users",
      (users) => {
        setOnlineUsers(users);
      }
    );

    socket.on(
      "chat:messages-seen",
      ({ messageIds, seenAt }) => {
        setMessages((current) =>
          current.map((message) =>
            messageIds.includes(String(message.id))
              ? {
                  ...message,
                  seen: true,
                  seenAt,
                }
              : message
          )
        );
      }
    );

    return () => {
      socket.off("chat:message");
      socket.off("chat:online-users");
      socket.off("chat:messages-seen");
    };
  }, [currentUser]);

  function sendMessage(data) {
    socket.emit("chat:send", data);
  }

  function seenMessages(ids) {
    socket.emit("chat:seen", {
      messageIds: ids,
    });
  }

  return {
    messages,
    onlineUsers,
    sendMessage,
    seenMessages,
  };
}
