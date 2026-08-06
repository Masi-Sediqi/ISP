import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Clock3,
  MessageSquare,
  Sparkles,
  UserRound,
  UserRoundPlus,
  Users,
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

function getEmployeeName(employee) {
  return (
    employee?.fullName ||
    employee?.employeeName ||
    employee?.name ||
    employee?.email ||
    "Unnamed Employee"
  );
}

function getEmployeeId(employee) {
  return String(
    employee?.id ||
      employee?.employeeId ||
      employee?._id ||
      ""
  );
}

function getDepartmentDetailFields(record) {
  const common = [
    ["Customer Name", getCustomerName(record)],
    ["Phone Number", getCustomerPhone(record)],
    ["Email", record.email],
    ["Customer Type", record.customerType],
    ["Source", getCustomerSource(record)],
    ["Assigned To", record.assignedEmployeeName],
    ["Assigned By", record.assignedByName || record.createdByName],
    ["Assigned Date", formatDateTime(record.assignedAt)],
    [
      "Registration Date",
      formatDateTime(
        record.createdAt ||
          record.afghanistanDateTime ||
          record.date
      ),
    ],
    ["Status", record.assignmentStatus || "Pending"],
    ["Purpose", getCustomerPurpose(record)],
    ["City / Province", record.city || record.province],
    ["Language", record.language],
    ["Call Type", record.callType],
    ["Note", record.note || record.notes],
    ["Last Message", record.lastAssignmentMessage],
  ];

  const type = normalize(record.customerType);

  if (type === "consultant") {
    return [
      ...common,
      ["Country", record.country],
      ["Educational Level", record.educationalLevel],
      ["School / University", record.schoolUniversity],
      ["Scholarship Type", record.scholarshipType],
      ["Passport Number", record.passportNumber],
      ["Marital Status", record.maritalStatus],
      ["Graduated Major", record.graduatedMajor],
      ["Graduation Percentage", record.graduationPercentage],
      ["Graduation Year", record.graduationYear],
      ["Desired Major", record.desiredMajor],
      ["Intake", record.intake],
      ["Bank Statement Owner", record.bankStatementOwner],
      ["Bank Statement Amount", record.bankStatementAmount],
      ["Currency Unit", record.currencyUnit || record.unit],
      ["Total Amount", record.totalAmount],
      ["Paid Amount", record.paidAmount],
      ["Remaining Amount", record.remainingAmount],
      ["Guarantee Type", record.guaranteeType],
    ];
  }

  if (type === "travel") {
    return [
      ...common,
      ["Destination Country", record.country],
      ["Visa Type", record.visaType || record.scholarshipType],
      ["Passport Number", record.passportNumber],
      ["Marital Status", record.maritalStatus],
      ["Bank Statement Owner", record.bankStatementOwner],
      ["Bank Statement Amount", record.bankStatementAmount],
      ["Currency Unit", record.currencyUnit || record.unit],
      ["Total Amount", record.totalAmount],
      ["Paid Amount", record.paidAmount],
      ["Remaining Amount", record.remainingAmount],
    ];
  }

  if (type === "technology") {
    return [
      ...common,
      ["Business Type", record.businessType],
      ["Technology Purpose", record.technologyPurpose],
      ["Project", record.projectName],
      ["Project Amount", record.totalAmount],
      ["Currency Unit", record.currencyUnit || record.unit],
      ["Paid Amount", record.paidAmount],
      ["Remaining Amount", record.remainingAmount],
    ];
  }

  if (type === "media") {
    return [
      ...common,
      ["Brand Name", record.brandName],
      ["Media Purpose", record.mediaPurpose],
      ["Custom Purpose", record.customMediaPurpose],
      ["Business Type", record.businessType],
      ["Currency Unit", record.currencyUnit || record.unit],
      ["Total Amount", record.totalAmount],
      ["Paid Amount", record.paidAmount],
      ["Remaining Amount", record.remainingAmount],
    ];
  }

  return common;
}

export default function MyAccount({
  currentUser,
  employee,
  assignedCustomers = [],
}) {
  const navigate = useNavigate();
  const [
    customers,
    setCustomers,
    loadCustomers,
    customersLoaded,
  ] = useJsonCollection("customers");

  const [employees] =
    useJsonCollection("employees");

  const [selectedCustomer, setSelectedCustomer] =
    useState(null);

  const [messageOpen, setMessageOpen] =
    useState(false);

  const [messageText, setMessageText] =
    useState("");

  const [savingAction, setSavingAction] =
    useState(false);

  const [reassignOpen, setReassignOpen] =
    useState(false);

  const [reassignEmployeeId, setReassignEmployeeId] =
    useState("");

  const [reassignNote, setReassignNote] =
    useState("");

  const customerRefreshRunningRef =
    useRef(false);

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

  /*
   * New Reception assignments must appear automatically.
   * The custom event handles updates made in the same tab,
   * while polling handles another account, tab or browser.
   */
  useEffect(() => {
    if (!customersLoaded) {
      return undefined;
    }

    const refreshCustomers = async () => {
      if (customerRefreshRunningRef.current) {
        return;
      }

      customerRefreshRunningRef.current = true;

      try {
        await loadCustomers();
      } finally {
        customerRefreshRunningRef.current = false;
      }
    };

    const intervalId = window.setInterval(
      refreshCustomers,
      1000
    );

    const refreshImmediately = () => {
      refreshCustomers();
    };

    const refreshWhenVisible = () => {
      if (!document.hidden) {
        refreshCustomers();
      }
    };

    window.addEventListener(
      "isp-customer-assignment-updated",
      refreshImmediately
    );

    window.addEventListener(
      "focus",
      refreshImmediately
    );

    window.addEventListener(
      "storage",
      refreshImmediately
    );

    document.addEventListener(
      "visibilitychange",
      refreshWhenVisible
    );

    return () => {
      window.clearInterval(intervalId);

      window.removeEventListener(
        "isp-customer-assignment-updated",
        refreshImmediately
      );

      window.removeEventListener(
        "focus",
        refreshImmediately
      );

      window.removeEventListener(
        "storage",
        refreshImmediately
      );

      document.removeEventListener(
        "visibilitychange",
        refreshWhenVisible
      );
    };
  }, [customersLoaded, loadCustomers]);

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

  function getTransferMadeByCurrentEmployee(customer) {
    const transfers = Array.isArray(
      customer?.assignmentTransfers
    )
      ? customer.assignmentTransfers
      : [];

    return [...transfers]
      .reverse()
      .find((transfer) => {
        const fromId = String(
          transfer?.fromEmployeeId || ""
        );

        const fromName = normalize(
          transfer?.fromEmployeeName
        );

        return (
          (fromId &&
            accountIds.includes(fromId)) ||
          (fromName &&
            accountNames.includes(fromName))
        );
      });
  }

  function isCurrentAssignment(customer) {
    const assignedIds = [
      customer?.assignedEmployeeId,
      customer?.assignedAccountId,
    ]
      .filter(Boolean)
      .map(String);

    const assignedName = normalize(
      customer?.assignedEmployeeName
    );

    return (
      assignedIds.some((id) =>
        accountIds.includes(id)
      ) ||
      (assignedName &&
        accountNames.includes(assignedName))
    );
  }

  function getWorkspaceStatus(customer) {
    if (isCurrentAssignment(customer)) {
      return (
        customer?.assignmentStatus ||
        "Pending"
      );
    }

    const transfer =
      getTransferMadeByCurrentEmployee(
        customer
      );

    if (transfer?.toEmployeeName) {
      return `Referred to ${transfer.toEmployeeName}`;
    }

    return (
      customer?.assignmentStatus ||
      "Pending"
    );
  }

  const myCustomers = useMemo(() => {
    const source =
      customers.length > 0
        ? customers
        : assignedCustomers;

    return source
      .filter((customer) => {
        /*
         * The request remains visible to:
         * 1. the employee who currently owns it;
         * 2. an employee who previously referred it.
         */
        return (
          isCurrentAssignment(customer) ||
          Boolean(
            getTransferMadeByCurrentEmployee(
              customer
            )
          )
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

  /*
   * If the currently opened request changes, refresh the
   * modal content too instead of showing stale information.
   */
  useEffect(() => {
    if (!selectedCustomer) return;

    const latestRecord = customers.find(
      (customer) =>
        String(customer.id) ===
        String(selectedCustomer.id)
    );

    if (
      latestRecord &&
      latestRecord !== selectedCustomer
    ) {
      setSelectedCustomer(latestRecord);
    }
  }, [customers, selectedCustomer?.id]);

  const pendingCount = myCustomers.filter(
    (customer) => {
      if (!isCurrentAssignment(customer)) {
        return false;
      }

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
    setReassignOpen(false);
    setReassignEmployeeId("");
    setReassignNote("");
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

      const latestCustomers =
        await loadCustomers();

      const nextCustomers = latestCustomers.map(
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

      window.dispatchEvent(
        new CustomEvent(
          "isp-customer-assignment-updated",
          {
            detail: {
              customerId:
                selectedCustomer.id,
              status: nextStatus,
              respondedAt: now,
            },
          }
        )
      );

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

  function openReassign() {
    setReassignEmployeeId(
      selectedCustomer?.assignedEmployeeId || ""
    );

    setReassignNote(
      selectedCustomer?.lastReassignmentNote || ""
    );

    setMessageOpen(false);
    setReassignOpen(true);
  }

  function closeReassign() {
    if (savingAction) return;

    setReassignOpen(false);
    setReassignEmployeeId("");
    setReassignNote("");
  }

  async function saveReassignment(event) {
    event.preventDefault();

    if (!selectedCustomer || savingAction) {
      return;
    }

    if (!reassignEmployeeId) {
      notify(
        "Please select an employee.",
        "error"
      );
      return;
    }

    if (
      String(reassignEmployeeId) ===
      String(
        selectedCustomer.assignedEmployeeId || ""
      )
    ) {
      notify(
        "Please select a different employee.",
        "error"
      );
      return;
    }

    const selectedEmployee = employees.find(
      (item) =>
        getEmployeeId(item) ===
        String(reassignEmployeeId)
    );

    if (!selectedEmployee) {
      notify(
        "Selected employee was not found.",
        "error"
      );
      return;
    }

    const now = new Date().toISOString();
    const newEmployeeName =
      getEmployeeName(selectedEmployee);
    const cleanNote = reassignNote.trim();

    setSavingAction(true);

    try {
      const latestCustomers =
        await loadCustomers();

      const nextCustomers = latestCustomers.map(
        (customer) => {
          if (
            String(customer.id) !==
            String(selectedCustomer.id)
          ) {
            return customer;
          }

          const previousTransfers =
            Array.isArray(
              customer.assignmentTransfers
            )
              ? customer.assignmentTransfers
              : [];

          return {
            ...customer,

            assignedEmployeeId:
              selectedEmployee.id ||
              selectedEmployee.employeeId ||
              "",

            assignedAccountId:
              selectedEmployee.accountId ||
              selectedEmployee.userId ||
              "",

            assignedEmployeeName:
              newEmployeeName,

            assignedAt: now,

            assignmentStatus: "Pending",
            followUpStatus: "Pending",
            followUpDecisionStatus:
              "Pending",
            followUpCompleted: false,

            acceptedAt: "",
            rejectedAt: "",

            lastReassignmentNote:
              cleanNote,

            lastTransferredById:
              currentUser?.employeeId ||
              currentUser?.id ||
              "",

            lastTransferredByName:
              fullName,

            lastTransferredToId:
              selectedEmployee.id ||
              selectedEmployee.employeeId ||
              "",

            lastTransferredToName:
              newEmployeeName,

            lastTransferredAt:
              now,

            assignmentTransfers: [
              ...previousTransfers,
              {
                id:
                  typeof crypto !==
                    "undefined" &&
                  crypto.randomUUID
                    ? crypto.randomUUID()
                    : `${Date.now()}`,

                fromEmployeeId:
                  selectedCustomer
                    .assignedEmployeeId ||
                  "",

                fromEmployeeName:
                  selectedCustomer
                    .assignedEmployeeName ||
                  "",

                toEmployeeId:
                  selectedEmployee.id ||
                  selectedEmployee.employeeId ||
                  "",

                toEmployeeName:
                  newEmployeeName,

                note: cleanNote,

                transferredAt: now,

                transferredById:
                  currentUser?.employeeId ||
                  currentUser?.id ||
                  "",

                transferredByName:
                  fullName,
              },
            ],

            updatedAt: now,
          };
        }
      );

      const saved =
        await setCustomers(nextCustomers);

      if (!saved) {
        notify(
          "Unable to assign the request to another employee.",
          "error"
        );
        return;
      }

      window.dispatchEvent(
        new CustomEvent(
          "isp-customer-assignment-updated",
          {
            detail: {
              customerId:
                selectedCustomer.id,
              status: "Pending",
              assignedEmployeeName:
                newEmployeeName,
              transferredByName:
                fullName,
              transferStatus:
                `${fullName} assigned to ${newEmployeeName}`,
              assignedAt: now,
            },
          }
        )
      );

      notify(
        `Customer request assigned to ${newEmployeeName}.`,
        "success"
      );

      setSelectedCustomer(null);
      setReassignOpen(false);
      setReassignEmployeeId("");
      setReassignNote("");
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

      const latestCustomers =
        await loadCustomers();

      const nextCustomers = latestCustomers.map(
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
                <th>Follow Up</th>
              </tr>
            </thead>

            <tbody>
              {myCustomers.map(
                (customer) => {
                  const requestStatus =
                    getWorkspaceStatus(customer);

                  const transferredAway =
                    !isCurrentAssignment(customer);

                  return (
                    <tr
                      key={customer.id}
                      tabIndex={0}
                      role="button"
                      className={`my-account-record-row department-${normalize(
                        customer.customerType || "other"
                      )}`}
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
                        <span
                            className={`my-account-type ${normalize(
                              customer.customerType || "other"
                            )}`}
                          >
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
                          className={`my-account-status ${
                            transferredAway
                              ? "referred"
                              : normalize(
                                  requestStatus
                                )
                          }`}
                        >
                          {requestStatus}
                        </span>
                      </td>

                      <td>
                        {!transferredAway &&
                        normalize(requestStatus) ===
                          "accepted" ? (
                          <button
                            type="button"
                            className={`my-account-followup-button ${
                              customer.followUpCompleted
                                ? "completed"
                                : "pending"
                            }`}
                            onClick={(event) => {
                              event.stopPropagation();

                              navigate(
                                `/customer-follow-up/${customer.id}`
                              );
                            }}
                            title={
                              customer.followUpCompleted
                                ? "Open completed follow-up"
                                : "Start customer follow-up"
                            }
                            aria-label={
                              customer.followUpCompleted
                                ? "Open completed follow-up"
                                : "Start customer follow-up"
                            }
                          >
                            {customer.followUpCompleted ? (
                              <CheckCircle2 size={15} />
                            ) : (
                              <Sparkles size={15} />
                            )}
                          </button>
                        ) : (
                          <span className="my-account-followup-unavailable">
                            -
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                }
              )}

              {!myCustomers.length && (
                <tr>
                  <td
                    colSpan="8"
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
            className={`my-account-detail-modal department-${normalize(
              selectedCustomer.customerType || "other"
            )}`}
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
                className={`my-account-status ${
                  isCurrentAssignment(
                    selectedCustomer
                  )
                    ? normalize(
                        selectedCustomer
                          .assignmentStatus ||
                          "Pending"
                      )
                    : "referred"
                }`}
              >
                {getWorkspaceStatus(
                  selectedCustomer
                )}
              </span>
            </div>

            <div className="my-account-detail-grid">
              {getDepartmentDetailFields(
                selectedCustomer
              ).map(([label, value]) => {
                if (
                  value === undefined ||
                  value === null ||
                  value === ""
                ) {
                  return null;
                }

                const wide = [
                  "Purpose",
                  "Note",
                  "Last Message",
                ].includes(label);

                return (
                  <div
                    key={label}
                    className={
                      wide ? "wide" : ""
                    }
                  >
                    <span>{label}</span>

                    <strong>
                      {formatValue(value)}
                    </strong>
                  </div>
                );
              })}
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

            {!isCurrentAssignment(
              selectedCustomer
            ) && !reassignOpen ? (
              <div className="my-account-referred-section">
                <div className="my-account-referred-notice">
                  <UserRoundPlus size={17} />

                  <div>
                    <strong>
                      {getWorkspaceStatus(
                        selectedCustomer
                      )}
                    </strong>

                    <span>
                      This request remains in your history
                      and is currently managed by another
                      employee.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="my-account-edit-assignment"
                  disabled={savingAction}
                  onClick={openReassign}
                >
                  <UserRoundPlus size={15} />
                  Edit Assignment
                </button>
              </div>
            ) : reassignOpen ? (
              <form
                className="my-account-reassign-form"
                onSubmit={saveReassignment}
              >
                <div className="my-account-reassign-summary">
                  <div>
                    <span>Customer</span>
                    <strong>
                      {getCustomerName(
                        selectedCustomer
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Currently Assigned To</span>
                    <strong>
                      {selectedCustomer
                        .assignedEmployeeName ||
                        "-"}
                    </strong>
                  </div>

                  <div>
                    <span>Department</span>
                    <strong>
                      {selectedCustomer
                        .customerType ||
                        "-"}
                    </strong>
                  </div>
                </div>

                <label>
                  Assign To

                  <select
                    value={reassignEmployeeId}
                    onChange={(event) =>
                      setReassignEmployeeId(
                        event.target.value
                      )
                    }
                    autoFocus
                  >
                    <option value="">
                      Select employee
                    </option>

                    {employees
                      .filter(
                        (item) =>
                          getEmployeeId(item) &&
                          getEmployeeId(item) !==
                            String(
                              selectedCustomer
                                .assignedEmployeeId ||
                                ""
                            )
                      )
                      .map((item) => (
                        <option
                          key={getEmployeeId(item)}
                          value={getEmployeeId(item)}
                        >
                          {getEmployeeName(item)}
                        </option>
                      ))}
                  </select>
                </label>

                <label>
                  Note

                  <textarea
                    rows="4"
                    value={reassignNote}
                    onChange={(event) =>
                      setReassignNote(
                        event.target.value
                      )
                    }
                    placeholder="Write the reason or instructions for this transfer..."
                  />
                </label>

                <div>
                  <button
                    type="button"
                    onClick={closeReassign}
                    disabled={savingAction}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary"
                    disabled={savingAction}
                  >
                    <UserRoundPlus size={15} />

                    {savingAction
                      ? "Assigning..."
                      : "Assign Customer"}
                  </button>
                </div>
              </form>
            ) : !messageOpen ? (
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
                  className="reassign"
                  disabled={savingAction}
                  onClick={openReassign}
                >
                  <UserRoundPlus size={16} />
                  Assign to another
                </button>

                {normalize(
                  selectedCustomer.assignmentStatus
                ) === "accepted" && (
                  <button
                    type="button"
                    className={`followup ${
                      selectedCustomer.followUpCompleted
                        ? "completed"
                        : ""
                    }`}
                    disabled={savingAction}
                    onClick={() =>
                      navigate(
                        `/customer-follow-up/${selectedCustomer.id}`
                      )
                    }
                  >
                    <Sparkles size={16} />

                    {selectedCustomer.followUpCompleted
                      ? "Open Follow Up"
                      : "Start Follow Up"}
                  </button>
                )}


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