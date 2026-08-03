import { useMemo, useState } from "react";
import {
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  MessageSquare,
  UserRound,
  Users,
  WalletCards,
  X,
  XCircle,
} from "lucide-react";

import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
import "./MyAccount.css";

const normalize = (value) =>
  String(value || "").trim().toLowerCase();

function getCustomerName(customer) {
  return (
    customer?.fullName ||
    customer?.customerName ||
    customer?.personName ||
    "Unnamed Customer"
  );
}

function getCustomerPhone(customer) {
  return customer?.phone || customer?.contactNumber || "-";
}

function getCustomerPurpose(customer) {
  return (
    customer?.technologyPurpose ||
    customer?.purpose ||
    customer?.about ||
    "-"
  );
}

function getCustomerSource(customer) {
  return (
    customer?.source ||
    customer?.sourceEmployeeName ||
    customer?.createdByName ||
    "-"
  );
}

function getAssignedDate(customer) {
  return (
    customer?.assignedAt ||
    customer?.updatedAt ||
    customer?.createdAt ||
    customer?.date ||
    ""
  );
}

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-US");
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "-";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

const detailFields = [
  ["Customer Name", (record) => getCustomerName(record)],
  ["Phone Number", (record) => getCustomerPhone(record)],
  ["Email", (record) => record.email],
  ["Customer Type", (record) => record.customerType],
  ["Company Name", (record) => record.companyName],
  ["Educational Level", (record) => record.educationalLevel],
  ["School / University", (record) => record.schoolUniversity],
  ["Brand Name", (record) => record.brandName],
  ["Purpose", (record) => getCustomerPurpose(record)],
  ["About", (record) => record.about],
  ["Source", (record) => getCustomerSource(record)],
  ["Assigned To", (record) => record.assignedEmployeeName],
  ["Assigned By", (record) => record.assignedByName],
  ["Assigned Date", (record) => formatDateTime(record.assignedAt)],
  ["Registration Date", (record) =>
    formatDateTime(record.createdAt || record.date)],
  ["Status", (record) => record.assignmentStatus || "Pending"],
  ["Note", (record) => record.note || record.notes],
  ["Last Message", (record) => record.lastAssignmentMessage],
];

export default function MyAccount({
  currentUser,
  employee,
  assignedCustomers = [],
}) {
  const [customers, setCustomers] =
    useJsonCollection("customers");

  const [selectedCustomer, setSelectedCustomer] =
    useState(null);

  const [messageOpen, setMessageOpen] =
    useState(false);

  const [messageText, setMessageText] =
    useState("");

  const [savingAction, setSavingAction] =
    useState(false);

  const fullName =
    employee?.fullName ||
    currentUser?.fullName ||
    currentUser?.username ||
    "Employee";

  const email =
    employee?.email ||
    currentUser?.email ||
    "No email configured";

  const image =
    employee?.image ||
    currentUser?.image ||
    "";

  const accountIds = useMemo(
    () =>
      [
        currentUser?.id,
        currentUser?.employeeId,
        currentUser?.accountId,
        employee?.id,
        employee?.employeeId,
      ]
        .filter(Boolean)
        .map(String),
    [
      currentUser?.id,
      currentUser?.employeeId,
      currentUser?.accountId,
      employee?.id,
      employee?.employeeId,
    ]
  );

  const accountNames = useMemo(
    () =>
      [
        currentUser?.fullName,
        currentUser?.username,
        currentUser?.email,
        employee?.fullName,
        employee?.email,
      ]
        .filter(Boolean)
        .map(normalize),
    [
      currentUser?.fullName,
      currentUser?.username,
      currentUser?.email,
      employee?.fullName,
      employee?.email,
    ]
  );

  const myCustomers = useMemo(() => {
    const source =
      customers.length > 0
        ? customers
        : assignedCustomers;

    return source
      .filter((customer) => {
        const assignedIds = [
          customer.assignedEmployeeId,
          customer.assignedAccountId,
        ]
          .filter(Boolean)
          .map(String);

        const assignedName = normalize(
          customer.assignedEmployeeName
        );

        return (
          assignedIds.some((id) =>
            accountIds.includes(id)
          ) ||
          (assignedName &&
            accountNames.includes(
              assignedName
            ))
        );
      })
      .sort(
        (first, second) =>
          new Date(
            getAssignedDate(second) || 0
          ) -
          new Date(
            getAssignedDate(first) || 0
          )
      );
  }, [
    customers,
    assignedCustomers,
    accountIds,
    accountNames,
  ]);

  const pendingCount = myCustomers.filter(
    (customer) => {
      const status = normalize(
        customer.assignmentStatus ||
          "pending"
      );

      return (
        status === "pending" ||
        status === "assigned"
      );
    }
  ).length;

  function closeDetails() {
    if (savingAction) return;

    setSelectedCustomer(null);
    setMessageOpen(false);
    setMessageText("");
  }

  async function updateCustomerStatus(
    nextStatus
  ) {
    if (
      !selectedCustomer ||
      savingAction
    ) {
      return;
    }

    setSavingAction(true);

    try {
      const now = new Date().toISOString();

      const nextCustomers = customers.map(
        (customer) =>
          String(customer.id) ===
          String(selectedCustomer.id)
            ? {
                ...customer,
                assignmentStatus:
                  nextStatus,
                assignmentRespondedAt:
                  now,
                assignmentRespondedById:
                  currentUser?.employeeId ||
                  currentUser?.id ||
                  "",
                assignmentRespondedByName:
                  fullName,
                updatedAt: now,
              }
            : customer
      );

      const saved =
        await setCustomers(nextCustomers);

      if (!saved) {
        notify(
          "Unable to update the customer request.",
          "error"
        );
        return;
      }

      const updatedRecord =
        nextCustomers.find(
          (customer) =>
            String(customer.id) ===
            String(selectedCustomer.id)
        );

      setSelectedCustomer(updatedRecord);

      notify(
        nextStatus === "Accepted"
          ? "Customer request accepted."
          : "Customer request rejected.",
        nextStatus === "Accepted"
          ? "success"
          : "error"
      );
    } finally {
      setSavingAction(false);
    }
  }

  function openMessage() {
    setMessageText(
      selectedCustomer
        ?.lastAssignmentMessage || ""
    );

    setMessageOpen(true);
  }

  async function saveMessage(event) {
    event.preventDefault();

    if (
      !selectedCustomer ||
      savingAction
    ) {
      return;
    }

    const cleanMessage =
      messageText.trim();

    if (!cleanMessage) {
      notify(
        "Please write a message.",
        "error"
      );
      return;
    }

    setSavingAction(true);

    try {
      const now = new Date().toISOString();

      const nextCustomers = customers.map(
        (customer) => {
          if (
            String(customer.id) !==
            String(selectedCustomer.id)
          ) {
            return customer;
          }

          const previousMessages =
            Array.isArray(
              customer.assignmentMessages
            )
              ? customer.assignmentMessages
              : [];

          return {
            ...customer,

            assignmentMessages: [
              ...previousMessages,
              {
                id:
                  typeof crypto !==
                    "undefined" &&
                  crypto.randomUUID
                    ? crypto.randomUUID()
                    : `${Date.now()}`,

                message: cleanMessage,

                senderId:
                  currentUser?.employeeId ||
                  currentUser?.id ||
                  "",

                senderName: fullName,
                createdAt: now,
              },
            ],

            lastAssignmentMessage:
              cleanMessage,

            lastAssignmentMessageAt:
              now,

            updatedAt: now,
          };
        }
      );

      const saved =
        await setCustomers(nextCustomers);

      if (!saved) {
        notify(
          "Unable to save the message.",
          "error"
        );
        return;
      }

      const updatedRecord =
        nextCustomers.find(
          (customer) =>
            String(customer.id) ===
            String(selectedCustomer.id)
        );

      setSelectedCustomer(updatedRecord);
      setMessageOpen(false);
      setMessageText("");

      notify(
        "Message saved successfully.",
        "success"
      );
    } finally {
      setSavingAction(false);
    }
  }

  return (
    <div className="my-account-page">
      <header className="my-account-heading">
        <div>
          <span>Employee Workspace</span>

          <h1>My Account</h1>

          <p>
            View customer requests assigned to
            your account.
          </p>
        </div>

        <div className="my-account-user">
          <div className="my-account-avatar">
            {image ? (
              <img
                src={image}
                alt={fullName}
              />
            ) : (
              <span>
                {String(fullName)
                  .slice(0, 1)
                  .toUpperCase()}
              </span>
            )}
          </div>

          <div>
            <strong>{fullName}</strong>
            <small>{email}</small>
          </div>
        </div>
      </header>

      <section className="my-account-coming-actions">
        <button type="button" disabled>
          <BarChart3 size={17} />
          <span>
            <strong>Performance</strong>
            <small>Coming soon</small>
          </span>
        </button>

        <button type="button" disabled>
          <WalletCards size={17} />
          <span>
            <strong>Balance</strong>
            <small>Coming soon</small>
          </span>
        </button>

        <button type="button" disabled>
          <CalendarCheck size={17} />
          <span>
            <strong>Attendance</strong>
            <small>Coming soon</small>
          </span>
        </button>
      </section>

      <section className="my-account-records">
        <header>
          <div>
            <span>Assigned Customers</span>

            <h2>My Customer Requests</h2>

            <p>
              Click any record to view its
              complete information.
            </p>
          </div>

          <div className="my-account-counts">
            <div>
              <span>Total</span>
              <strong>
                {myCustomers.length}
              </strong>
            </div>

            <div>
              <span>Pending</span>
              <strong>
                {pendingCount}
              </strong>
            </div>
          </div>
        </header>

        <div className="my-account-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Type</th>
                <th>Source</th>
                <th>Purpose</th>
                <th>Assigned Date</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {myCustomers.map(
                (customer) => {
                  const requestStatus =
                    customer.assignmentStatus ||
                    "Pending";

                  return (
                    <tr
                      key={customer.id}
                      tabIndex={0}
                      role="button"
                      className="my-account-record-row"
                      onClick={() =>
                        setSelectedCustomer(
                          customer
                        )
                      }
                      onKeyDown={(event) => {
                        if (
                          event.key ===
                            "Enter" ||
                          event.key === " "
                        ) {
                          event.preventDefault();

                          setSelectedCustomer(
                            customer
                          );
                        }
                      }}
                    >
                      <td>
                        <div className="my-account-customer">
                          <span>
                            <UserRound
                              size={16}
                            />
                          </span>

                          <div>
                            <strong>
                              {getCustomerName(
                                customer
                              )}
                            </strong>

                            <small>
                              {customer.email ||
                                "No email"}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        {getCustomerPhone(
                          customer
                        )}
                      </td>

                      <td>
                        <span className="my-account-type">
                          {customer.customerType ||
                            "-"}
                        </span>
                      </td>

                      <td>
                        {getCustomerSource(
                          customer
                        )}
                      </td>

                      <td className="my-account-purpose">
                        {getCustomerPurpose(
                          customer
                        )}
                      </td>

                      <td>
                        {formatDateTime(
                          getAssignedDate(
                            customer
                          )
                        )}
                      </td>

                      <td>
                        <span
                          className={`my-account-status ${normalize(
                            requestStatus
                          )}`}
                        >
                          {requestStatus}
                        </span>
                      </td>
                    </tr>
                  );
                }
              )}

              {!myCustomers.length && (
                <tr>
                  <td
                    colSpan="7"
                    className="my-account-empty"
                  >
                    No customer requests have
                    been assigned to this
                    account.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedCustomer && (
        <div
          className="my-account-modal-backdrop"
          onMouseDown={closeDetails}
        >
          <div
            className="my-account-detail-modal"
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <header>
              <div>
                <span>
                  Customer Information
                </span>

                <h2>
                  {getCustomerName(
                    selectedCustomer
                  )}
                </h2>

                <p>
                  Complete registration and
                  assignment details.
                </p>
              </div>

              <button
                type="button"
                onClick={closeDetails}
                disabled={savingAction}
                aria-label="Close"
              >
                <X size={19} />
              </button>
            </header>

            <div className="my-account-modal-summary">
              <div className="my-account-modal-avatar">
                <UserRound size={25} />
              </div>

              <div>
                <strong>
                  {getCustomerName(
                    selectedCustomer
                  )}
                </strong>

                <span>
                  {getCustomerPhone(
                    selectedCustomer
                  )}
                </span>
              </div>

              <span
                className={`my-account-status ${normalize(
                  selectedCustomer
                    .assignmentStatus ||
                    "Pending"
                )}`}
              >
                {selectedCustomer
                  .assignmentStatus ||
                  "Pending"}
              </span>
            </div>

            <div className="my-account-detail-grid">
              {detailFields.map(
                ([label, resolver]) => {
                  const value =
                    resolver(
                      selectedCustomer
                    );

                  if (
                    value === undefined ||
                    value === null ||
                    value === ""
                  ) {
                    return null;
                  }

                  const wide = [
                    "Purpose",
                    "About",
                    "Note",
                    "Last Message",
                  ].includes(label);

                  return (
                    <div
                      key={label}
                      className={
                        wide
                          ? "wide"
                          : ""
                      }
                    >
                      <span>{label}</span>

                      <strong>
                        {formatValue(
                          value
                        )}
                      </strong>
                    </div>
                  );
                }
              )}
            </div>

            {Array.isArray(
              selectedCustomer.assignmentMessages
            ) &&
              selectedCustomer
                .assignmentMessages.length >
                0 && (
                <section className="my-account-message-history">
                  <h3>
                    Message History
                  </h3>

                  {selectedCustomer.assignmentMessages.map(
                    (message) => (
                      <div
                        key={
                          message.id ||
                          message.createdAt
                        }
                      >
                        <div>
                          <strong>
                            {message.senderName ||
                              "Employee"}
                          </strong>

                          <small>
                            {formatDateTime(
                              message.createdAt
                            )}
                          </small>
                        </div>

                        <p>
                          {message.message}
                        </p>
                      </div>
                    )
                  )}
                </section>
              )}

            {!messageOpen ? (
              <footer className="my-account-modal-actions">
                <button
                  type="button"
                  className="accept"
                  disabled={
                    savingAction ||
                    normalize(
                      selectedCustomer
                        .assignmentStatus
                    ) === "accepted"
                  }
                  onClick={() =>
                    updateCustomerStatus(
                      "Accepted"
                    )
                  }
                >
                  <CheckCircle2
                    size={16}
                  />
                  Accept
                </button>

                <button
                  type="button"
                  className="reject"
                  disabled={
                    savingAction ||
                    normalize(
                      selectedCustomer
                        .assignmentStatus
                    ) === "rejected"
                  }
                  onClick={() =>
                    updateCustomerStatus(
                      "Rejected"
                    )
                  }
                >
                  <XCircle size={16} />
                  Reject
                </button>

                <button
                  type="button"
                  className="message"
                  disabled={savingAction}
                  onClick={openMessage}
                >
                  <MessageSquare
                    size={16}
                  />
                  Message
                </button>
              </footer>
            ) : (
              <form
                className="my-account-message-form"
                onSubmit={saveMessage}
              >
                <label>
                  Message

                  <textarea
                    rows="4"
                    value={messageText}
                    onChange={(event) =>
                      setMessageText(
                        event.target.value
                      )
                    }
                    placeholder="Write your message..."
                    autoFocus
                  />
                </label>

                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setMessageOpen(false);
                      setMessageText("");
                    }}
                    disabled={savingAction}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary"
                    disabled={savingAction}
                  >
                    <MessageSquare
                      size={15}
                    />

                    {savingAction
                      ? "Saving..."
                      : "Save Message"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}