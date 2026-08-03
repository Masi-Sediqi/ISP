import {
    useEffect,
    useMemo,
    useState,
  } from "react";
  
  import {
    Search,
    Send,
  } from "lucide-react";
  
  import {
    useJsonCollection,
  } from "../hooks/useJsonCollection";
  
  import {
    useChat,
  } from "../hooks/useChat";
  
  import "./TeamChat.css";
  
  export default function TeamChat({
    currentUser,
  }) {
    const [accounts] =
      useJsonCollection("accounts");
  
    const [employees] =
      useJsonCollection("employees");
  
    const {
      messages,
      onlineUsers,
      sendMessage: sendChatMessage,
      seenMessages,
    } = useChat(currentUser);
  
    const [search, setSearch] =
      useState("");
  
    const [selected, setSelected] =
      useState(null);
  
    const [text, setText] =
      useState("");
  
    const currentAccountId = String(
      currentUser?.id || ""
    );
  
    const employeeList = useMemo(() => {
      const query = search
        .trim()
        .toLowerCase();
  
      return employees
        .map((employee) => {
          const account = accounts.find(
            (item) =>
              String(item.employeeId) ===
              String(employee.id)
          );
  
          return {
            ...employee,
            account,
            accountId: account?.id || "",
          };
        })
        .filter(
          (employee) =>
            employee.accountId &&
            String(employee.accountId) !==
              currentAccountId
        )
        .filter((employee) => {
          if (!query) return true;
  
          return [
            employee.fullName,
            employee.email,
            employee.phone,
            employee.role,
            employee.roles?.join(" "),
            Array.isArray(
              employee.departments
            )
              ? employee.departments.join(" ")
              : employee.departments,
          ].some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(query)
          );
        });
    }, [
      employees,
      accounts,
      search,
      currentAccountId,
    ]);
  
    const selectedAccountId = String(
      selected?.accountId || ""
    );
  
    const conversation = useMemo(() => {
      if (
        !currentAccountId ||
        !selectedAccountId
      ) {
        return [];
      }
  
      return messages
        .filter((message) => {
          const fromAccountId = String(
            message.fromAccountId || ""
          );
  
          const toAccountId = String(
            message.toAccountId || ""
          );
  
          return (
            (fromAccountId ===
              currentAccountId &&
              toAccountId ===
                selectedAccountId) ||
            (fromAccountId ===
              selectedAccountId &&
              toAccountId ===
                currentAccountId)
          );
        })
        .sort(
          (first, second) =>
            new Date(
              first.createdAt || 0
            ) -
            new Date(
              second.createdAt || 0
            )
        );
    }, [
      messages,
      currentAccountId,
      selectedAccountId,
    ]);
  
    const selectedIsOnline =
      onlineUsers.some(
        (accountId) =>
          String(accountId) ===
          selectedAccountId
      );
  
    useEffect(() => {
      if (
        !selectedAccountId ||
        !currentAccountId
      ) {
        return;
      }
  
      const unseenMessageIds =
        conversation
          .filter(
            (message) =>
              String(
                message.toAccountId
              ) === currentAccountId &&
              !message.seen
          )
          .map((message) =>
            String(message.id)
          );
  
      if (unseenMessageIds.length) {
        seenMessages(
          unseenMessageIds
        );
      }
    }, [
      conversation,
      selectedAccountId,
      currentAccountId,
      seenMessages,
    ]);
  
    function submitMessage() {
      const messageText =
        text.trim();
  
      if (
        !messageText ||
        !selected ||
        !selectedAccountId ||
        !currentAccountId
      ) {
        return;
      }
  
      sendChatMessage({
        fromAccountId:
          currentAccountId,
  
        toAccountId:
          selectedAccountId,
  
        fromEmployeeId:
          currentUser?.employeeId ||
          "",
  
        toEmployeeId:
          selected.id || "",
  
        senderName:
          currentUser?.fullName ||
          currentUser?.username ||
          currentUser?.email ||
          "Employee",
  
        receiverName:
          selected.fullName ||
          selected.email ||
          "Employee",
  
        text: messageText,
      });
  
      setText("");
    }
  
    return (
      <div className="team-chat-page">
        <aside className="team-chat-sidebar">
          <div className="team-chat-search">
            <Search size={18} />
  
            <input
              placeholder="Search employee..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>
  
          <div className="team-chat-users">
            {employeeList.map(
              (employee) => {
                const departments =
                  Array.isArray(
                    employee.departments
                  )
                    ? employee.departments.join(
                        ", "
                      )
                    : employee.departments ||
                      employee.department ||
                      employee.role ||
                      "-";
  
                const isOnline =
                  onlineUsers.some(
                    (accountId) =>
                      String(accountId) ===
                      String(
                        employee.accountId
                      )
                  );
  
                return (
                  <button
                    type="button"
                    key={
                      employee.accountId
                    }
                    className={`team-chat-user ${
                      String(
                        selected?.accountId
                      ) ===
                      String(
                        employee.accountId
                      )
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setSelected(employee)
                    }
                  >
                    <div className="team-chat-avatar">
                      {String(
                        employee.fullName ||
                          "E"
                      )
                        .charAt(0)
                        .toUpperCase()}
  
                      <span
                        className={`team-chat-status ${
                          isOnline
                            ? "online"
                            : "offline"
                        }`}
                      />
                    </div>
  
                    <div>
                      <strong>
                        {employee.fullName ||
                          "Unnamed Employee"}
                      </strong>
  
                      <small>
                        {isOnline
                          ? `Online • ${departments}`
                          : departments}
                      </small>
                    </div>
                  </button>
                );
              }
            )}
  
            {!employeeList.length && (
              <div className="team-chat-empty">
                <p>
                  No employee accounts
                  found.
                </p>
              </div>
            )}
          </div>
        </aside>
  
        <section className="team-chat-content">
          {selected ? (
            <>
              <div className="team-chat-header">
                <div className="team-chat-avatar large">
                  {String(
                    selected.fullName ||
                      "E"
                  )
                    .charAt(0)
                    .toUpperCase()}
  
                  <span
                    className={`team-chat-status ${
                      selectedIsOnline
                        ? "online"
                        : "offline"
                    }`}
                  />
                </div>
  
                <div>
                  <h2>
                    {selected.fullName ||
                      "Unnamed Employee"}
                  </h2>
  
                  <p>
                    {selectedIsOnline
                      ? "Online"
                      : "Offline"}
                  </p>
                </div>
              </div>
  
              <div className="team-chat-messages">
                {conversation.map(
                  (message) => {
                    const isMine =
                      String(
                        message.fromAccountId
                      ) ===
                      currentAccountId;
  
                    return (
                      <div
                        key={message.id}
                        className={
                          isMine
                            ? "my-message"
                            : "their-message"
                        }
                      >
                        <span>
                          {message.text}
                        </span>
  
                        <small>
                          {message.createdAt
                            ? new Date(
                                message.createdAt
                              ).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute:
                                    "2-digit",
                                }
                              )
                            : ""}
  
                          {isMine &&
                            (message.seen
                              ? "  ✓✓"
                              : "  ✓")}
                        </small>
                      </div>
                    );
                  }
                )}
  
                {!conversation.length && (
                  <div className="team-chat-empty">
                    <h3>
                      No messages yet
                    </h3>
  
                    <p>
                      Send the first
                      message to start this
                      conversation.
                    </p>
                  </div>
                )}
              </div>
  
              <div className="team-chat-input">
                <input
                  value={text}
                  placeholder="Type message..."
                  onChange={(event) =>
                    setText(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                        "Enter" &&
                      !event.shiftKey
                    ) {
                      event.preventDefault();
                      submitMessage();
                    }
                  }}
                />
  
                <button
                  type="button"
                  onClick={
                    submitMessage
                  }
                  aria-label="Send message"
                  title="Send message"
                >
                  <Send size={18} />
                </button>
              </div>
            </>
          ) : (
            <div className="team-chat-empty">
              <h2>💬 Team Chat</h2>
  
              <p>
                Select an employee from
                the left side.
              </p>
            </div>
          )}
        </section>
      </div>
    );
  }