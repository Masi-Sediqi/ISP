import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCheck,
  Download,
  FileText,
  Image as ImageIcon,
  Check,
  Paperclip,
  Pencil,
  Search,
  Send,
  SmilePlus,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { useChat } from "../hooks/useChat";
import { notify } from "../utils/notify";
import "./Messages.css";

const MAX_ATTACHMENT_SIZE = 2 * 1024 * 1024;
const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥", "🎉"];
const SYSTEM_ADMIN_AVATAR_URL =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQq6WMcaaq479pTOpaETnxKw4r6QicRgBin2pOX5hJM_n96PwxR8ZA6Bng&s=10";

const defaultAdminAccount = {
  id: "default-admin",
  fullName: "System Admin",
  email: "admin@gmail.com",
  role: "Admin",
  status: "Active",
  isDefaultAdmin: true,
};

const normalize = (value) =>
  String(value || "").trim().toLowerCase();

function accountName(account) {
  return (
    account?.fullName ||
    account?.employeeName ||
    account?.username ||
    account?.email ||
    "Employee"
  );
}

function initials(value) {
  const parts = String(value || "E")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return (parts[0]?.[0] || "E").toUpperCase();
}

function profileImage(account) {
  if (
    String(account?.id || "") === "default-admin" ||
    normalize(accountName(account)) === "system admin"
  ) {
    return SYSTEM_ADMIN_AVATAR_URL;
  }

  return (
    account?.profileImage ||
    account?.profilePhoto ||
    account?.avatar ||
    account?.photo ||
    account?.image ||
    account?.picture ||
    ""
  );
}

function roleText(account) {
  const roles = [
    account?.primaryRole,
    account?.role,
    ...(Array.isArray(account?.roles) ? account.roles : []),
  ].filter(Boolean);

  return roles[0] || account?.accountType || "Employee";
}

function isInactive(account) {
  return ["inactive", "disabled", "blocked", "suspended"].includes(
    normalize(account?.status || account?.accountStatus || "Active")
  );
}

function isFullAdminAccount(account) {
  const roles = [
    account?.role,
    account?.primaryRole,
    ...(Array.isArray(account?.roles) ? account.roles : []),
    account?.accountType,
  ]
    .filter(Boolean)
    .map(normalize);

  return (
    account?.isDefaultAdmin === true ||
    account?.isAdmin === true ||
    account?.isFullAdmin === true ||
    account?.permissions?.all === true ||
    roles.some((role) =>
      ["admin", "full admin", "full administrator", "administrator", "super admin"].includes(role)
    )
  );
}

function formatTime(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function reactionSummary(reactions) {
  return (Array.isArray(reactions) ? reactions : [])
    .map((entry) => ({
      emoji: String(entry?.emoji || ""),
      userIds: [...new Set((Array.isArray(entry?.userIds) ? entry.userIds : []).map(String))],
    }))
    .filter((entry) => entry.emoji && entry.userIds.length);
}

function fileToAttachment(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        dataUrl: String(reader.result || ""),
      });
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Messages({ currentUser }) {
  const location = useLocation();
  const [accounts, , , accountsLoaded] = useJsonCollection("accounts");
  const [employees, , , employeesLoaded] = useJsonCollection("employees");

  const resolvedCurrentUser = useMemo(() => {
    if (!currentUser) return currentUser;

    const candidates = [
      currentUser?.id,
      currentUser?.accountId,
      currentUser?.employeeId,
      currentUser?.username,
      currentUser?.email,
    ]
      .filter(Boolean)
      .map((value) => normalize(value));

    const matchedAccount = accounts.find((account) => {
      const accountCandidates = [
        account?.id,
        account?.accountId,
        account?.employeeId,
        account?.username,
        account?.email,
      ]
        .filter(Boolean)
        .map((value) => normalize(value));

      return accountCandidates.some((value) => candidates.includes(value));
    });

    return matchedAccount
      ? {
          ...matchedAccount,
          ...currentUser,
          id: matchedAccount.id || currentUser.id,
          accountId: matchedAccount.id || currentUser.accountId || currentUser.id,
        }
      : currentUser;
  }, [accounts, currentUser]);

  const {
    messages,
    onlineUsers,
    typingUsers,
    messagesLoading,
    presenceLoading,
    sendMessage,
    seenMessages,
    editMessage,
    deleteMessage,
    toggleReaction,
    sendTyping,
  } = useChat(resolvedCurrentUser);

  const [interfaceLanguage, setInterfaceLanguage] = useState(
    () => localStorage.getItem("isp-language") || "en"
  );
  const [search, setSearch] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [sending, setSending] = useState(false);
  const [reactionPickerId, setReactionPickerId] = useState("");
  const [editingMessageId, setEditingMessageId] = useState("");
  const [editText, setEditText] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState("");
  const messagesEndRef = useRef(null);
  const typingStopRef = useRef(null);

  useEffect(() => {
    const syncLanguage = (event) => {
      setInterfaceLanguage(
        event?.detail || localStorage.getItem("isp-language") || "en"
      );
    };

    window.addEventListener("isp-language-changed", syncLanguage);
    window.addEventListener("storage", syncLanguage);

    return () => {
      window.removeEventListener("isp-language-changed", syncLanguage);
      window.removeEventListener("storage", syncLanguage);
    };
  }, []);

  const tx = (en, dr, ps) =>
    interfaceLanguage === "dr" ? dr : interfaceLanguage === "ps" ? ps : en;

  const currentAccountId = String(
    resolvedCurrentUser?.id ||
      resolvedCurrentUser?.accountId ||
      resolvedCurrentUser?.employeeId ||
      resolvedCurrentUser?.username ||
      resolvedCurrentUser?.email ||
      ""
  );

  const employeesById = useMemo(
    () =>
      new Map(
        employees.map((employee) => [
          String(employee.id || employee.employeeId || ""),
          employee,
        ])
      ),
    [employees]
  );

  const chatAccounts = useMemo(() => {
    const effectiveAccounts = accounts.some(
      (account) => String(account.id) === "default-admin"
    )
      ? accounts
      : [defaultAdminAccount, ...accounts];

    const enrichedAccounts = effectiveAccounts
      .filter((account) => account?.id && !isInactive(account))
      .map((account) => {
        const employee = employeesById.get(String(account.employeeId || ""));

        return {
          ...employee,
          ...account,
          id: account.id,
          fullName:
            account.fullName ||
            employee?.fullName ||
            account.username ||
            account.email,
          employeeName: employee?.fullName || account.employeeName,
          department:
            employee?.department ||
            account.department ||
            account.accountType ||
            "",
          departments: employee?.departments || account.departments || [],
          roles: account.roles || employee?.roles || [],
          role: account.role || employee?.role || account.primaryRole,
        };
      })
      .filter((account) => String(account.id) !== currentAccountId);

    // Every active account can participate in employee chat.
    // Permissions for the rest of the application remain unchanged.
    return enrichedAccounts;
  }, [accounts, currentAccountId, employeesById]);

  const unreadByAccount = useMemo(() => {
    const result = {};

    messages.forEach((message) => {
      if (
        String(message.toAccountId) === currentAccountId &&
        String(message.fromAccountId) !== currentAccountId &&
        !message.seen
      ) {
        result[String(message.fromAccountId)] =
          (result[String(message.fromAccountId)] || 0) + 1;
      }
    });

    return result;
  }, [currentAccountId, messages]);

  const lastMessageByAccount = useMemo(() => {
    const result = {};

    messages.forEach((message) => {
      const from = String(message.fromAccountId || "");
      const to = String(message.toAccountId || "");
      if (from !== currentAccountId && to !== currentAccountId) return;

      const otherId = from === currentAccountId ? to : from;
      const current = result[otherId];

      if (
        !current ||
        new Date(message.createdAt || 0) > new Date(current.createdAt || 0)
      ) {
        result[otherId] = message;
      }
    });

    return result;
  }, [currentAccountId, messages]);

  const visibleAccounts = useMemo(() => {
    const query = normalize(search);

    return chatAccounts
      .filter((account) => {
        if (!query) return true;

        return [
          accountName(account),
          account.email,
          roleText(account),
          account.department,
        ].some((value) => normalize(value).includes(query));
      })
      .sort((first, second) => {
        const firstUnread = unreadByAccount[String(first.id)] || 0;
        const secondUnread = unreadByAccount[String(second.id)] || 0;
        if (firstUnread !== secondUnread) return secondUnread - firstUnread;

        const firstMessage = lastMessageByAccount[String(first.id)];
        const secondMessage = lastMessageByAccount[String(second.id)];
        return (
          new Date(secondMessage?.createdAt || 0) -
          new Date(firstMessage?.createdAt || 0)
        );
      });
  }, [chatAccounts, lastMessageByAccount, search, unreadByAccount]);

  useEffect(() => {
    const requestedAccountId = new URLSearchParams(location.search).get("chat");

    if (
      requestedAccountId &&
      visibleAccounts.some(
        (account) => String(account.id) === String(requestedAccountId)
      )
    ) {
      setSelectedAccountId(String(requestedAccountId));
      return;
    }

    if (
      !selectedAccountId ||
      !visibleAccounts.some(
        (account) => String(account.id) === String(selectedAccountId)
      )
    ) {
      setSelectedAccountId(String(visibleAccounts[0]?.id || ""));
    }
  }, [location.search, selectedAccountId, visibleAccounts]);

  const selectedAccount = visibleAccounts.find(
    (account) => String(account.id) === String(selectedAccountId)
  );

  const conversationMessages = useMemo(
    () =>
      messages
        .filter((message) => {
          const from = String(message.fromAccountId || "");
          const to = String(message.toAccountId || "");

          return (
            (from === currentAccountId && to === String(selectedAccountId)) ||
            (to === currentAccountId && from === String(selectedAccountId))
          );
        })
        .sort(
          (first, second) =>
            new Date(first.createdAt || 0) - new Date(second.createdAt || 0)
        ),
    [currentAccountId, messages, selectedAccountId]
  );

  useEffect(() => {
    const unseenIds = conversationMessages
      .filter(
        (message) =>
          String(message.toAccountId) === currentAccountId &&
          !message.seen
      )
      .map((message) => message.id)
      .filter(Boolean);

    if (unseenIds.length) {
      seenMessages(unseenIds);
    }
  }, [conversationMessages, currentAccountId, seenMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationMessages, typingUsers, selectedAccountId]);

  useEffect(() => {
    setReactionPickerId("");
    setEditingMessageId("");
    setEditText("");
    setDeleteConfirmId("");
  }, [selectedAccountId]);

  function emitTyping(isTyping) {
    if (!selectedAccount) return;

    sendTyping({
      fromAccountId: currentAccountId,
      toAccountId: selectedAccount.id,
      senderName: accountName(currentUser),
      isTyping,
    });
  }

  function updateText(value) {
    setText(value);

    emitTyping(true);
    window.clearTimeout(typingStopRef.current);
    typingStopRef.current = window.setTimeout(() => {
      emitTyping(false);
    }, 1200);
  }

  async function addFiles(fileList) {
    const files = Array.from(fileList || []);
    const nextAttachments = [];

    for (const file of files) {
      if (file.size > MAX_ATTACHMENT_SIZE) {
        notify(
          tx(
            `${file.name} is larger than 2 MB.`,
            `${file.name} \u0627\u0632 \u06f2 \u0645\u06cc\u06af\u0627\u0628\u0627\u06cc\u062a \u06a9\u0644\u0627\u0646\u200c\u062a\u0631 \u0627\u0633\u062a.`,
            `${file.name} \u0644\u0647 \u06f2 \u0645\u06cc\u06ab\u0627\u0628\u0627\u06cc\u067c \u0685\u062e\u0647 \u0644\u0648\u06cc \u062f\u06cc.`
          ),
          "error"
        );
        continue;
      }

      nextAttachments.push(await fileToAttachment(file));
    }

    if (nextAttachments.length) {
      setAttachments((current) => [...current, ...nextAttachments].slice(0, 6));
    }
  }

  async function submitMessage(event) {
    event.preventDefault();

    if (!selectedAccount || sending) return;

    const cleanText = text.trim();
    if (!cleanText && !attachments.length) return;

    setSending(true);

    try {
      const response = await sendMessage({
        fromAccountId: currentAccountId,
        toAccountId: selectedAccount.id,
        fromEmployeeId: currentUser?.employeeId || "",
        toEmployeeId: selectedAccount.employeeId || "",
        senderName: accountName(currentUser),
        receiverName: accountName(selectedAccount),
        text: cleanText,
        attachments,
      });

      if (!response?.success) {
        notify(response?.error || "Unable to send message.", "error");
        return;
      }

      setText("");
      setAttachments([]);
      emitTyping(false);
    } finally {
      setSending(false);
    }
  }

  function startEdit(message) {
    setReactionPickerId("");
    setDeleteConfirmId("");
    setEditingMessageId(String(message.id));
    setEditText(String(message.text || ""));
  }

  async function saveEdit(message) {
    const response = await editMessage(message.id, editText);
    if (!response?.success) {
      notify(response?.error || "Unable to edit message.", "error");
      return;
    }

    setEditingMessageId("");
    setEditText("");
  }

  async function confirmDelete(message) {
    const response = await deleteMessage(message.id);
    if (!response?.success) {
      notify(response?.error || "Unable to delete message.", "error");
      return;
    }

    setDeleteConfirmId("");
    setReactionPickerId("");
    if (String(editingMessageId) === String(message.id)) {
      setEditingMessageId("");
      setEditText("");
    }
  }

  async function reactToMessage(message, emoji) {
    const response = await toggleReaction(message.id, emoji);
    if (!response?.success) {
      notify(response?.error || "Unable to update reaction.", "error");
      return;
    }
    setReactionPickerId("");
  }

  const selectedTyping = selectedAccount
    ? typingUsers[String(selectedAccount.id)]
    : null;

  const [loadingGraceExpired, setLoadingGraceExpired] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoadingGraceExpired(true), 7000);
    return () => window.clearTimeout(timer);
  }, [currentAccountId]);

  const collectionsLoading = !accountsLoaded || !employeesLoaded;
  const chatLoading =
    !loadingGraceExpired &&
    (collectionsLoading || messagesLoading || presenceLoading);

  if (chatLoading) {
    return (
      <div className="messages-page messages-page-loading" aria-busy="true" aria-label="Loading messages">
        <div className="messages-loader-wrap">
          <div className="loader" />
        </div>
      </div>
    );
  }

  return (
    <div className="messages-page">
      <aside className="messages-contacts">
        <header>
          <div>
            <span>
              {tx("Employee Chat", "\u0686\u062a \u06a9\u0627\u0631\u0645\u0646\u062f\u0627\u0646", "\u062f \u06a9\u0627\u0631\u06a9\u0648\u0648\u0646\u06a9\u0648 \u0686\u067c")}
            </span>
            <h1>{tx("Message", "\u067e\u06cc\u0627\u0645", "\u067e\u06cc\u063a\u0627\u0645")}</h1>
          </div>
          <strong>{visibleAccounts.length}</strong>
        </header>

        <label className="messages-search">
          <Search size={16} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={tx(
              "Search employees...",
              "\u062c\u0633\u062a\u062c\u0648\u06cc \u06a9\u0627\u0631\u0645\u0646\u062f...",
              "\u06a9\u0627\u0631\u06a9\u0648\u0648\u0646\u06a9\u064a \u0648\u0644\u067c\u0648\u0626..."
            )}
          />
        </label>

        <div className="messages-contact-list">
          {visibleAccounts.map((account) => {
            const lastMessage = lastMessageByAccount[String(account.id)];
            const unread = unreadByAccount[String(account.id)] || 0;
            const online = onlineUsers.map(String).includes(String(account.id));

            return (
              <button
                key={account.id}
                type="button"
                className={
                  String(selectedAccountId) === String(account.id)
                    ? "active"
                    : ""
                }
                onClick={() => setSelectedAccountId(String(account.id))}
              >
                <span className="messages-avatar">
                  <span className="messages-avatar-frame">
                    {profileImage(account) ? (
                      <img src={profileImage(account)} alt={accountName(account)} />
                    ) : (
                      initials(accountName(account))
                    )}
                  </span>
                  <i className={online ? "online" : ""} />
                </span>

                <span className="messages-contact-meta">
                  <strong>{accountName(account)}</strong>
                  <small>
                    {lastMessage?.text ||
                      (lastMessage?.attachments?.length
                        ? tx("Attachment", "\u0641\u0627\u06cc\u0644", "\u0641\u0627\u06cc\u0644")
                        : roleText(account))}
                  </small>
                </span>

                {unread > 0 && <b>{unread > 99 ? "99+" : unread}</b>}
              </button>
            );
          })}

          {!visibleAccounts.length && (
            <div className="messages-empty">
              <UserRound size={28} />
              <strong>
                {tx(
                  "No chat users available.",
                  "\u0647\u06cc\u0686 \u06a9\u0627\u0631\u0628\u0631\u06cc \u0628\u0631\u0627\u06cc \u0686\u062a \u0645\u0648\u062c\u0648\u062f \u0646\u06cc\u0633\u062a.",
                  "\u062f \u0686\u067c \u0644\u067e\u0627\u0631\u0647 \u0647\u06d0\u0685 \u06a9\u0627\u0631\u0648\u0648\u0646\u06a9\u06cc \u0646\u0634\u062a\u0647."
                )}
              </strong>
            </div>
          )}
        </div>
      </aside>

      <section className="messages-chat">
        {selectedAccount ? (
          <>
            <header className="messages-chat-header">
              <div className="messages-avatar large">
                <span className="messages-avatar-frame">
                  {profileImage(selectedAccount) ? (
                    <img
                      src={profileImage(selectedAccount)}
                      alt={accountName(selectedAccount)}
                    />
                  ) : (
                    initials(accountName(selectedAccount))
                  )}
                </span>
                <i
                  className={
                    onlineUsers.map(String).includes(String(selectedAccount.id))
                      ? "online"
                      : ""
                  }
                />
              </div>

              <div>
                <h2>{accountName(selectedAccount)}</h2>
                <p>
                  {onlineUsers.map(String).includes(String(selectedAccount.id))
                    ? tx("Online", "\u0622\u0646\u0644\u0627\u06cc\u0646", "\u0622\u0646\u0644\u0627\u06cc\u0646")
                    : roleText(selectedAccount)}
                </p>
              </div>
            </header>

            <div className="messages-thread">
              {conversationMessages.map((message) => {
                const mine = String(message.fromAccountId) === currentAccountId;
                const deleted = Boolean(message.deletedAt);
                const reactions = reactionSummary(message.reactions);
                const isEditing = String(editingMessageId) === String(message.id);
                const isDeleting = String(deleteConfirmId) === String(message.id);
                const pickerOpen = String(reactionPickerId) === String(message.id);

                return (
                  <article
                    key={message.id}
                    className={`${mine ? "mine" : ""} ${deleted ? "deleted" : ""}`.trim()}
                  >
                    <div className="message-shell">
                      {!deleted && (
                        <div className="message-actions" aria-label="Message actions">
                          <button
                            type="button"
                            className={pickerOpen ? "active" : ""}
                            onClick={() => {
                              setDeleteConfirmId("");
                              setReactionPickerId((current) =>
                                String(current) === String(message.id) ? "" : String(message.id)
                              );
                            }}
                            title={tx("React", "واکنش", "غبرګون")}
                          >
                            <SmilePlus size={15} />
                          </button>

                          {mine && (
                            <>
                              <button
                                type="button"
                                onClick={() => startEdit(message)}
                                title={tx("Edit", "ویرایش", "سمون")}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                className="danger"
                                onClick={() => {
                                  setReactionPickerId("");
                                  setDeleteConfirmId((current) =>
                                    String(current) === String(message.id) ? "" : String(message.id)
                                  );
                                }}
                                title={tx("Delete", "حذف", "حذف")}
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {pickerOpen && !deleted && (
                        <div className="message-reaction-picker">
                          {REACTION_EMOJIS.map((emoji) => {
                            const selected = reactions.some(
                              (entry) =>
                                entry.emoji === emoji && entry.userIds.includes(currentAccountId)
                            );
                            return (
                              <button
                                key={emoji}
                                type="button"
                                className={selected ? "selected" : ""}
                                onClick={() => reactToMessage(message, emoji)}
                              >
                                {emoji}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <div className="messages-bubble">
                        {deleted ? (
                          <p className="message-deleted-text">
                            {tx("Message deleted", "پیام حذف شده", "پیغام حذف شوی")}
                          </p>
                        ) : isEditing ? (
                          <div className="message-edit-box">
                            <textarea
                              value={editText}
                              onChange={(event) => setEditText(event.target.value)}
                              rows={2}
                              autoFocus
                              onKeyDown={(event) => {
                                if (event.key === "Escape") {
                                  setEditingMessageId("");
                                  setEditText("");
                                }
                                if (event.key === "Enter" && !event.shiftKey) {
                                  event.preventDefault();
                                  saveEdit(message);
                                }
                              }}
                            />
                            <div>
                              <button
                                type="button"
                                className="save"
                                onClick={() => saveEdit(message)}
                              >
                                <Check size={14} />
                                {tx("Save", "ذخیره", "ثبت")}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMessageId("");
                                  setEditText("");
                                }}
                              >
                                <X size={14} />
                                {tx("Cancel", "لغو", "لغوه")}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {message.text && <p>{message.text}</p>}

                            {Array.isArray(message.attachments) &&
                              message.attachments.length > 0 && (
                                <div className="message-attachments">
                                  {message.attachments.map((attachment) => {
                                    const isImage = normalize(attachment.type).startsWith("image/");

                                    return (
                                      <a
                                        key={attachment.id || attachment.name}
                                        href={attachment.dataUrl}
                                        download={attachment.name}
                                        className={isImage ? "image" : "file"}
                                      >
                                        {isImage ? (
                                          <>
                                            <img src={attachment.dataUrl} alt={attachment.name} />
                                            <span>
                                              <ImageIcon size={13} />
                                              {attachment.name}
                                            </span>
                                          </>
                                        ) : (
                                          <>
                                            <FileText size={18} />
                                            <span>{attachment.name}</span>
                                            <Download size={14} />
                                          </>
                                        )}
                                      </a>
                                    );
                                  })}
                                </div>
                              )}
                          </>
                        )}

                        <small>
                          {formatTime(message.createdAt)}
                          {message.editedAt && !deleted && (
                            <em>{tx("Edited", "ویرایش شده", "سم شوی")}</em>
                          )}
                          {mine && message.seen && <CheckCheck size={13} />}
                        </small>

                        {isDeleting && !deleted && (
                          <div className="message-delete-confirm">
                            <span>
                              {tx(
                                "Delete this message for everyone?",
                                "این پیام برای همه حذف شود؟",
                                "دا پیغام د ټولو لپاره حذف شي؟"
                              )}
                            </span>
                            <div>
                              <button type="button" onClick={() => setDeleteConfirmId("")}>
                                {tx("Cancel", "لغو", "لغوه")}
                              </button>
                              <button
                                type="button"
                                className="danger"
                                onClick={() => confirmDelete(message)}
                              >
                                <Trash2 size={13} />
                                {tx("Delete", "حذف", "حذف")}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {!deleted && reactions.length > 0 && (
                        <div className="message-reactions">
                          {reactions.map((reaction) => {
                            const mineReaction = reaction.userIds.includes(currentAccountId);
                            return (
                              <button
                                key={reaction.emoji}
                                type="button"
                                className={mineReaction ? "mine-reaction" : ""}
                                onClick={() => reactToMessage(message, reaction.emoji)}
                                title={`${reaction.userIds.length}`}
                              >
                                <span>{reaction.emoji}</span>
                                <b>{reaction.userIds.length}</b>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}

              {selectedTyping && (
                <article className="typing-row" aria-live="polite">
                  <div className="messages-bubble typing">
                    <strong>
                      {tx("Typing ....", "در حال تایپ ....", "لیکل کوي ....")}
                    </strong>
                    <span aria-hidden="true" />
                    <span aria-hidden="true" />
                    <span aria-hidden="true" />
                  </div>
                </article>
              )}

              <div ref={messagesEndRef} />
            </div>

            {attachments.length > 0 && (
              <div className="messages-pending-files">
                {attachments.map((attachment) => (
                  <span key={attachment.id}>
                    {normalize(attachment.type).startsWith("image/") ? (
                      <ImageIcon size={14} />
                    ) : (
                      <FileText size={14} />
                    )}
                    {attachment.name}
                    <button
                      type="button"
                      onClick={() =>
                        setAttachments((current) =>
                          current.filter((item) => item.id !== attachment.id)
                        )
                      }
                      aria-label="Remove attachment"
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <form className="messages-composer" onSubmit={submitMessage}>
              <label>
                <Paperclip size={18} />
                <input
                  type="file"
                  multiple
                  onChange={(event) => {
                    addFiles(event.target.files);
                    event.target.value = "";
                  }}
                />
              </label>

              <textarea
                value={text}
                onChange={(event) => updateText(event.target.value)}
                placeholder={tx(
                  "Write a message...",
                  "\u067e\u06cc\u0627\u0645 \u0628\u0646\u0648\u06cc\u0633\u06cc\u062f...",
                  "\u067e\u06cc\u063a\u0627\u0645 \u0648\u0644\u06cc\u06a9\u0626..."
                )}
                rows={1}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    submitMessage(event);
                  }
                }}
              />

              <button type="submit" disabled={sending}>
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="messages-empty main-empty">
            <UserRound size={34} />
            <strong>
              {tx(
                "Select an employee to start messaging.",
                "\u06cc\u06a9 \u06a9\u0627\u0631\u0645\u0646\u062f \u0631\u0627 \u0628\u0631\u0627\u06cc \u0634\u0631\u0648\u0639 \u067e\u06cc\u0627\u0645 \u0627\u0646\u062a\u062e\u0627\u0628 \u06a9\u0646\u06cc\u062f.",
                "\u062f \u067e\u06cc\u063a\u0627\u0645 \u062f \u067e\u06cc\u0644 \u0644\u067e\u0627\u0631\u0647 \u06cc\u0648 \u06a9\u0627\u0631\u06a9\u0648\u0648\u0646\u06a9\u06cc \u0648\u067c\u0627\u06a9\u0626."
              )}
            </strong>
          </div>
        )}
      </section>
    </div>
  );
}
