import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeftRight,
  Bell,
  Banknote,
  Box,
  CalendarClock,
  CheckCheck,
  ChevronDown,
  CreditCard,
  FileCheck2,
  LogOut,
  Languages,
  MessageCircle,
  Moon,
  Palette,
  Search,
  Settings,
  Sun,
  Trash2,
  User,
  Users,
  Wrench,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { useEmployeeAdjustments } from "../hooks/useEmployeeAdjustments";
import { useChat } from "../hooks/useChat";
import { todayDateValue } from "../utils/afghanDate";
import { applyInterfaceLanguage } from "../utils/interfaceLanguage";
import { notify } from "../utils/notify";
import { isAdminUser } from "../utils/permissions";

const normalize = (value) => String(value || "").toLowerCase().trim();
const compact = (value) => normalize(value).replace(/[^a-z0-9]/g, "");
const money = (value) => Number(value || 0).toLocaleString("en-US");

const includesQuery = (value, query) => {
  const text = normalize(value);
  const cleanText = compact(value);
  const cleanQuery = compact(query);
  return text.includes(normalize(query)) || (cleanQuery && cleanText.includes(cleanQuery));
};

const itemId = (item) => String(item?.id || item?.assetId || item?.customerId || item?.supplierName || "");

const formatLocationName = (record) =>
  record?.location ||
  record?.currentLocation ||
  record?.destinationLocation ||
  record?.sourceLocation ||
  "-";

const withRecordHash = (path, type, id) =>
  id
    ? `${path}#${type}:${encodeURIComponent(String(id))}`
    : path;

function HeaderActions({ currentUser, onLogout, compact = false }) {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(null);

  const [
    dismissedNotificationKeys,
    setDismissedNotificationKeys,
  ] = useState(() => new Set());

  const responseAlertReadyRef = useRef(false);
  const responseSoundRef = useRef(null);
  const assignedRequestAlertReadyRef = useRef(false);
  const assignedRequestSoundRef = useRef(null);
  const adminCustomerAlertReadyRef = useRef(false);
  const employeeLedgerSoundRef = useRef(null);
  const chatMessageAlertReadyRef = useRef(false);
  const chatMessageSoundRef = useRef(null);
  const [selectedCurrency, setSelectedCurrency] = useState(
    () => {
      const savedCurrency =
        localStorage.getItem("isp-currency");

      return ["AFN", "USD"].includes(savedCurrency)
        ? savedCurrency
        : "AFN";
    }
  );

  const [usdRate, setUsdRate] = useState(
    () => {
      const savedRate = Number(
        localStorage.getItem("isp-usd-rate")
      );

      return Number.isFinite(savedRate) &&
        savedRate > 0
        ? savedRate
        : 70;
    }
  );

  const [
    exchangeDirection,
    setExchangeDirection,
  ] = useState(
    () =>
      localStorage.getItem(
        "isp-exchange-direction"
      ) || "usd-to-afn"
  );

  const [rateInput, setRateInput] = useState(
    () => {
      const savedRate = Number(
        localStorage.getItem("isp-usd-rate")
      );

      const safeRate =
        Number.isFinite(savedRate) &&
        savedRate > 0
          ? savedRate
          : 70;

      const direction =
        localStorage.getItem(
          "isp-exchange-direction"
        ) || "usd-to-afn";

      return direction === "usd-to-afn"
        ? String(safeRate)
        : String(
            Number(
              (1 / safeRate).toFixed(6)
            )
          );
    }
  );
  const [selectedTheme, setSelectedTheme] = useState(
    () => localStorage.getItem("isp-theme") || "light"
  );
  const [selectedLanguage, setSelectedLanguage] = useState(() => localStorage.getItem("isp-language") || "en");

  const tx = (en, dr, ps) =>
    selectedLanguage === "dr"
      ? dr
      : selectedLanguage === "ps"
        ? ps
        : en;

  const ledgerTypeLabel = (type) => {
    const labels = {
      bonus: tx("Bonus", "\u0627\u0645\u062a\u06cc\u0627\u0632", "\u0627\u0645\u062a\u06cc\u0627\u0632"),
      penalty: tx("Penalty", "\u062c\u0631\u06cc\u0645\u0647", "\u062c\u0631\u06cc\u0645\u0647"),
      salary: tx("Salary / Payment", "\u0645\u0639\u0627\u0634 / \u067e\u0631\u062f\u0627\u062e\u062a", "\u0645\u0639\u0627\u0634 / \u062a\u0627\u062f\u06cc\u0647"),
      credit: tx("Credit", "\u06a9\u0631\u06cc\u062f\u062a", "\u06a9\u0631\u06cc\u0689\u06cc\u067c"),
      debit: tx("Debit", "\u062f\u06cc\u0628\u062a", "\u0689\u06cc\u0628\u06cc\u067c"),
    };

    return labels[type] || String(type || "-");
  };

  const ledgerAlertText = (entry) => {
    const formattedAmount = money(entry.amount);

    if (entry.type === "penalty") {
      return tx(
        `Penalty of ${formattedAmount} AFN was added to your account.`,
        `${formattedAmount} \u0627\u0641\u063a\u0627\u0646\u06cc \u062c\u0631\u06cc\u0645\u0647 \u062f\u0631 \u062d\u0633\u0627\u0628 \u0634\u0645\u0627 \u062b\u0628\u062a \u0634\u062f.`,
        `${formattedAmount} \u0627\u0641\u063a\u0627\u0646\u06cd \u062c\u0631\u06cc\u0645\u0647 \u0633\u062a\u0627\u0633\u0648 \u067e\u0647 \u062d\u0633\u0627\u0628 \u06a9\u06d0 \u062b\u0628\u062a \u0634\u0648\u0647.`
      );
    }

    if (entry.type === "bonus") {
      return tx(
        `Bonus of ${formattedAmount} AFN was added to your account.`,
        `${formattedAmount} \u0627\u0641\u063a\u0627\u0646\u06cc \u0627\u0645\u062a\u06cc\u0627\u0632 \u0628\u0631\u0627\u06cc \u0634\u0645\u0627 \u062b\u0628\u062a \u0634\u062f.`,
        `${formattedAmount} \u0627\u0641\u063a\u0627\u0646\u06cd \u0627\u0645\u062a\u06cc\u0627\u0632 \u0633\u062a\u0627\u0633\u0648 \u0644\u067e\u0627\u0631\u0647 \u062b\u0628\u062a \u0634\u0648.`
      );
    }

    if (entry.type === "salary") {
      return tx(
        `Salary/payment of ${formattedAmount} AFN was added to your account.`,
        `${formattedAmount} \u0627\u0641\u063a\u0627\u0646\u06cc \u0645\u0639\u0627\u0634 / \u067e\u0631\u062f\u0627\u062e\u062a \u062f\u0631 \u062d\u0633\u0627\u0628 \u0634\u0645\u0627 \u062c\u0645\u0639 \u0634\u062f.`,
        `${formattedAmount} \u0627\u0641\u063a\u0627\u0646\u06cd \u0645\u0639\u0627\u0634 / \u062a\u0627\u062f\u06cc\u0647 \u0633\u062a\u0627\u0633\u0648 \u067e\u0647 \u062d\u0633\u0627\u0628 \u06a9\u06d0 \u062c\u0645\u0639 \u0634\u0648\u0647.`
      );
    }

    if (entry.type === "debit") {
      return tx(
        `Debit of ${formattedAmount} AFN was added to your account.`,
        `${formattedAmount} \u0627\u0641\u063a\u0627\u0646\u06cc \u062f\u06cc\u0628\u062a \u062f\u0631 \u062d\u0633\u0627\u0628 \u0634\u0645\u0627 \u062b\u0628\u062a \u0634\u062f.`,
        `${formattedAmount} \u0627\u0641\u063a\u0627\u0646\u06cd \u0689\u06cc\u0628\u06cc\u067c \u0633\u062a\u0627\u0633\u0648 \u067e\u0647 \u062d\u0633\u0627\u0628 \u06a9\u06d0 \u062b\u0628\u062a \u0634\u0648.`
      );
    }

    return tx(
      `${ledgerTypeLabel(entry.type)} of ${formattedAmount} AFN was added to your account.`,
      `${formattedAmount} \u0627\u0641\u063a\u0627\u0646\u06cc ${ledgerTypeLabel(entry.type)} \u062f\u0631 \u062d\u0633\u0627\u0628 \u0634\u0645\u0627 \u062b\u0628\u062a \u0634\u062f.`,
      `${formattedAmount} \u0627\u0641\u063a\u0627\u0646\u06cd ${ledgerTypeLabel(entry.type)} \u0633\u062a\u0627\u0633\u0648 \u067e\u0647 \u062d\u0633\u0627\u0628 \u06a9\u06d0 \u062b\u0628\u062a \u0634\u0648.`
    );
  };

  const [assets] = useJsonCollection("assets");
  const [towerAssets] = useJsonCollection("towerAssets");
  const [securityDeposits] = useJsonCollection("securityDeposits");
  const [customerPackages] = useJsonCollection("customerPackages");
  const [
    employeeAdjustments,
    ,
    loadEmployeeAdjustments,
    adjustmentsLoaded,
  ] = useEmployeeAdjustments({
    silentLoadErrors: true,
  });
  const [
    customers,
    ,
    loadCustomers,
    customersLoaded,
  ] = useJsonCollection("customers");
  const [
    employeeReports,
    ,
    loadEmployeeReports,
    reportsLoaded,
  ] = useJsonCollection("employeeReports");
  const [
    employeeActivities,
    ,
    loadEmployeeActivities,
    activitiesLoaded,
  ] = useJsonCollection("employeeActivities", {
    silentLoadErrors: true,
  });
  const { messages: chatMessages } = useChat(currentUser);
  const today = todayDateValue();

const currentUserIds = [
  currentUser?.id,
  currentUser?.employeeId,
  currentUser?.accountId,
]
  .filter(Boolean)
  .map((value) => String(value));

const currentUserNames = [
  currentUser?.fullName,
  currentUser?.username,
  currentUser?.email,
]
  .filter(Boolean)
  .map((value) =>
    String(value).trim().toLowerCase()
  );

const currentUserEmails = [
  currentUser?.email,
]
  .filter(Boolean)
  .map(normalize);

const assignedCustomers = customers.filter(
  (customer) => {
    const assignedEmployeeId = String(
      customer.assignedEmployeeId || ""
    );

    const assignedAccountId = String(
      customer.assignedAccountId || ""
    );

    const assignedEmployeeName = String(
      customer.assignedEmployeeName || ""
    )
      .trim()
      .toLowerCase();

    return (
      currentUserIds.includes(
        assignedEmployeeId
      ) ||
      currentUserIds.includes(
        assignedAccountId
      ) ||
      currentUserNames.includes(
        assignedEmployeeName
      )
    );
  }
);

const pendingAssignedCustomers =
  assignedCustomers.filter((customer) =>
    ["pending", "assigned"].includes(
      normalize(
        customer.assignmentStatus ||
          customer.followUpStatus ||
          "pending"
      )
    )
  );

const assignedCustomerCount =
  pendingAssignedCustomers.length;

const currentUserRoles = [
  currentUser?.role,
  currentUser?.primaryRole,
  ...(Array.isArray(currentUser?.roles) ? currentUser.roles : []),
]
  .filter(Boolean)
  .map(normalize);

const isAdminAccount =
  currentUser?.isDefaultAdmin === true ||
  currentUser?.isAdmin === true ||
  currentUser?.isFullAdmin === true ||
  currentUser?.permissions?.all === true ||
  currentUser?.accountType === "admin" ||
  currentUserRoles.some((role) =>
    ["admin", "full admin", "administrator"].includes(role)
  );

const isFullAdminAccount =
  currentUser?.isDefaultAdmin === true ||
  currentUser?.isFullAdmin === true ||
  currentUser?.permissions?.all === true ||
  currentUserRoles.some((role) =>
    ["full admin", "administrator", "admin"].includes(role)
  );

const getLatestAssignmentTransfer = (customer) => {
  const transfers = Array.isArray(
    customer?.assignmentTransfers
  )
    ? customer.assignmentTransfers
    : [];

  return transfers[transfers.length - 1] || null;
};

const isAssignedFromReceptionToAdmin = (customer) =>
  isAdminAccount &&
  normalize(customer?.registeredFrom) === "reception" &&
  Boolean(customer?.assignedAt);

const isAssignedFromAdmin = (customer) => {
  const latestTransfer =
    getLatestAssignmentTransfer(customer);

  return (
    latestTransfer?.transferredByIsAdmin === true ||
    customer?.lastTransferredByIsAdmin === true ||
    ["admin", "full admin", "administrator"].includes(
      normalize(latestTransfer?.transferredByRole)
    ) ||
    ["admin", "full admin", "administrator"].includes(
      normalize(customer?.lastTransferredByRole)
    )
  );
};

const assignedRequestEvents = useMemo(
  () =>
    pendingAssignedCustomers.map((customer) => {
      const latestTransfer =
        getLatestAssignmentTransfer(customer);
      const customerName =
        customer.fullName ||
        customer.customerName ||
        customer.personName ||
        "Customer";

      return {
        key: [
          customer.id || customer.customerId,
          customer.assignedEmployeeId ||
            customer.assignedAccountId ||
            "",
          customer.assignedAt ||
            customer.lastTransferredAt ||
            customer.adminNotificationAt ||
            "",
        ].join("|"),
        customer,
        customerName,
        shouldPlaySound:
          isAssignedFromReceptionToAdmin(customer) ||
          isAssignedFromAdmin(customer),
        title: tx(
          "New Customer Request",
          "\u062f\u0631\u062e\u0648\u0627\u0633\u062a \u062c\u062f\u06cc\u062f \u0645\u0634\u062a\u0631\u06cc",
          "\u062f \u067e\u06d0\u0631\u0648\u062f\u0648\u0646\u06a9\u064a \u0646\u0648\u06cc \u063a\u0648\u069a\u062a\u0646\u0647"
        ),
        description: tx(
          `${customerName} was assigned to your account.`,
          `${customerName} \u0628\u0647 \u062d\u0633\u0627\u0628 \u0634\u0645\u0627 \u0631\u0627\u062c\u0639 \u0634\u062f.`,
          `${customerName} \u0633\u062a\u0627\u0633\u0648 \u062d\u0633\u0627\u0628 \u062a\u0647 \u0631\u0627\u062c\u0639 \u0634\u0648.`
        ),
        happenedAt:
          customer.assignedAt ||
          latestTransfer?.transferredAt ||
          customer.adminNotificationAt,
      };
    }),
  [
    pendingAssignedCustomers,
    isAdminAccount,
    selectedLanguage,
  ]
);

const employeeReportNotifications = isFullAdminAccount
  ? employeeReports
      .filter(
        (report) =>
          report.adminNotificationType ===
            "employee-report-submitted" &&
          report.adminNotificationAt
      )
      .sort(
        (first, second) =>
          new Date(
            second.adminNotificationAt ||
              second.createdAt ||
              0
          ) -
          new Date(
            first.adminNotificationAt ||
              first.createdAt ||
              0
          )
      )
  : [];

const employeeActivityNotifications = isFullAdminAccount
  ? employeeActivities
      .filter(
        (activity) =>
          activity.adminNotificationType ===
            "employee-action" &&
          activity.adminNotificationAt &&
          activity.actorId &&
          !currentUserIds.includes(
            String(activity.actorId)
          )
      )
      .sort(
        (first, second) =>
          new Date(
            second.adminNotificationAt ||
              second.createdAt ||
              0
          ) -
          new Date(
            first.adminNotificationAt ||
              first.createdAt ||
              0
          )
      )
  : [];

const incomingChatMessages = chatMessages
  .filter(
    (message) =>
      currentUserIds.includes(String(message.toAccountId || "")) &&
      !currentUserIds.includes(String(message.fromAccountId || "")) &&
      !message.seen
  )
  .sort(
    (first, second) =>
      new Date(second.createdAt || 0) -
      new Date(first.createdAt || 0)
  );

const collectionLabel = (collection) => {
  const labels = {
    customers: tx("Customers", "\u0645\u0634\u062a\u0631\u06cc\u0627\u0646", "\u067e\u06d0\u0631\u0648\u062f\u0648\u0646\u06a9\u064a"),
    employeeReports: tx("Daily Reports", "\u0631\u0627\u067e\u0648\u0631\u0647\u0627\u06cc \u0631\u0648\u0632\u0627\u0646\u0647", "\u0648\u0631\u0681\u0646\u064a \u0631\u0627\u067e\u0648\u0631\u0648\u0646\u0647"),
    employees: tx("Employees", "\u06a9\u0627\u0631\u0645\u0646\u062f\u0627\u0646", "\u06a9\u0627\u0631\u06a9\u0648\u0648\u0646\u06a9\u064a"),
    projects: tx("Projects", "\u067e\u0631\u0648\u0698\u0647\u200c\u0647\u0627", "\u067e\u0631\u0648\u0698\u06d0"),
    assets: tx("Assets", "\u062f\u0627\u0631\u0627\u06cc\u06cc\u200c\u0647\u0627", "\u0634\u062a\u0645\u0646\u06cd"),
    suppliers: tx("Suppliers", "\u062a\u0647\u06cc\u0647\u200c\u06a9\u0646\u0646\u062f\u0647\u200c\u0647\u0627", "\u0639\u0631\u0636\u0647 \u06a9\u0648\u0648\u0646\u06a9\u064a"),
    transactions: tx("Finance", "\u0645\u0627\u0644\u06cc", "\u0645\u0627\u0644\u064a"),
  };

  return labels[collection] || collection;
};

const activityText = (activity) => {
  const action = {
    created: tx("created", "\u062b\u0628\u062a \u06a9\u0631\u062f", "\u062b\u0628\u062a \u06a9\u0693"),
    updated: tx("updated", "\u0648\u06cc\u0631\u0627\u06cc\u0634 \u06a9\u0631\u062f", "\u0633\u0645 \u06a9\u0693"),
    deleted: tx("deleted", "\u062d\u0630\u0641 \u06a9\u0631\u062f", "\u062d\u0630\u0641 \u06a9\u0693"),
    changed: tx("changed", "\u062a\u063a\u06cc\u06cc\u0631 \u062f\u0627\u062f", "\u0628\u062f\u0644 \u06a9\u0693"),
  }[activity.action] || tx("changed", "\u062a\u063a\u06cc\u06cc\u0631 \u062f\u0627\u062f", "\u0628\u062f\u0644 \u06a9\u0693");

  return tx(
    `${activity.actorName || "Employee"} ${action} ${activity.totalChanged || 1} record(s) in ${collectionLabel(activity.collection)}.`,
    `${activity.actorName || "\u06a9\u0627\u0631\u0645\u0646\u062f"} ${activity.totalChanged || 1} \u0631\u06cc\u06a9\u0627\u0631\u062f \u0631\u0627 \u062f\u0631 ${collectionLabel(activity.collection)} ${action}.`,
    `${activity.actorName || "\u06a9\u0627\u0631\u06a9\u0648\u0648\u0646\u06a9\u064a"} \u067e\u0647 ${collectionLabel(activity.collection)} \u06a9\u06d0 ${activity.totalChanged || 1} \u0631\u06cc\u06a9\u0627\u0631\u0689 ${action}.`
  );
};

const collectionPath = (collection, recordId = "") => {
  const encodedId = recordId
    ? encodeURIComponent(String(recordId))
    : "";

  const paths = {
    customers: "/customers/consultants",
    employees: encodedId
      ? `/employees/${encodedId}`
      : "/employees",
    employeeReports: "/reports/employees",
    projects: "/projects",
    assets: "/office-assets",
    suppliers: encodedId
      ? `/suppliers/${encodedId}`
      : "/suppliers",
    transactions: "/finance",
    employeeAdjustments: "/reports/financial",
  };

  return paths[collection] || "/";
};

const employeeLedgerNotifications = employeeAdjustments
  .filter((entry) => {
    const entryIds = [
      entry.employeeId,
      entry.employeeAccountId,
      entry.accountId,
    ]
      .filter(Boolean)
      .map(String);

    const entryNames = [
      entry.employeeName,
      entry.employeeUsername,
    ]
      .filter(Boolean)
      .map(normalize);

    const entryEmails = [
      entry.employeeEmail,
    ]
      .filter(Boolean)
      .map(normalize);

    return (
      entryIds.some((entryId) =>
        currentUserIds.includes(entryId)
      ) ||
      entryNames.some((entryName) =>
        currentUserNames.includes(entryName)
      ) ||
      entryEmails.some((entryEmail) =>
        currentUserEmails.includes(entryEmail)
      )
    );
  })
  .sort(
    (first, second) =>
      new Date(
        second.employeeNotificationAt ||
          second.createdAt ||
          second.updatedAt ||
          0
      ) -
      new Date(
        first.employeeNotificationAt ||
          first.createdAt ||
          first.updatedAt ||
          0
      )
  );

const pendingAdminFollowUps = isAdminAccount
  ? customers.filter(
      (customer) =>
        normalize(customer.followUpWorkflowStatus) ===
        "awaiting admin"
    )
  : [];

const responseOwnerIds = [
  currentUser?.id,
  currentUser?.employeeId,
  currentUser?.accountId,
]
  .filter(Boolean)
  .map(String);

const responseOwnerNames = [
  currentUser?.fullName,
  currentUser?.username,
  currentUser?.email,
]
  .filter(Boolean)
  .map(normalize);

const receptionResponseEvents =
  customers.flatMap((customer) => {
    const transfers = Array.isArray(
      customer.assignmentTransfers
    )
      ? customer.assignmentTransfers
      : [];

    const creatorIds = [
      customer.createdByAccountId,
      customer.assignedByAccountId,
      customer.assignedById,
      customer.receptionAccountId,
    ]
      .filter(Boolean)
      .map(String);

    const creatorNames = [
      customer.createdByName,
      customer.assignedByName,
      customer.receptionName,
    ]
      .filter(Boolean)
      .map(normalize);

    const belongsToCurrentReception =
      creatorIds.some((id) =>
        responseOwnerIds.includes(id)
      ) ||
      creatorNames.some((name) =>
        responseOwnerNames.includes(name)
      );

    const belongsToCurrentTransferOwner =
      transfers.some((transfer) => {
        const transferOwnerIds = [
          transfer.transferredById,
        ]
          .filter(Boolean)
          .map(String);

        const transferOwnerNames = [
          transfer.transferredByName,
        ]
          .filter(Boolean)
          .map(normalize);

        return (
          transferOwnerIds.some((id) =>
            responseOwnerIds.includes(id)
          ) ||
          transferOwnerNames.some((name) =>
            responseOwnerNames.includes(name)
          )
        );
      });

    const events = [];
    const status = normalize(
      customer.assignmentStatus
    );

    if (
      ["accepted", "rejected"].includes(
        status
      ) &&
      customer.assignmentRespondedAt &&
      (
        belongsToCurrentReception ||
        belongsToCurrentTransferOwner
      )
    ) {
      events.push({
        key: [
          customer.id,
          "response",
          status,
          customer.assignmentRespondedAt,
        ].join("|"),
        customer,
        action:
          status === "accepted"
            ? "accepted"
            : "rejected",
        actorName:
          customer.assignmentRespondedByName ||
          customer.assignedEmployeeName ||
          "Employee",
        happenedAt:
          customer.assignmentRespondedAt,
        toastType:
          status === "accepted"
            ? "success"
            : "error",
      });
    }

    if (belongsToCurrentReception) {
      transfers.forEach((transfer) => {
        if (!transfer?.transferredAt) return;

        events.push({
          key: [
            customer.id,
            "reassigned",
            transfer.id ||
              transfer.transferredAt,
          ].join("|"),
          customer,
          action: `assigned the request to ${
            transfer.toEmployeeName ||
            "another employee"
          }`,
          actorName:
            transfer.transferredByName ||
            transfer.fromEmployeeName ||
            "Employee",
          happenedAt:
            transfer.transferredAt,
          toastType: "info",
        });
      });
    }

    return events;
  });

const adminCustomerCreateEvents = useMemo(
  () =>
    customers
      .filter(
        (customer) =>
          [
            "customer-created",
            "reception-assignment",
          ].includes(customer.adminNotificationType) &&
          customer.adminNotificationAt
      )
      .map((customer) => ({
        key: [
          customer.id || customer.customerId,
          "admin-customer-created",
          customer.adminNotificationAt,
        ].join("|"),
        customer,
        section:
          customer.adminNotificationSection ||
          customer.customerType ||
          "Customers",
        creator:
          customer.createdByName ||
          customer.receptionName ||
          "Call Center",
      })),
  [customers]
);

/*
 * Keep notification badges current without requiring a
 * browser refresh. A custom event updates immediately in
 * the same tab, while polling also covers other tabs or
 * another logged-in browser window.
 */
useEffect(() => {
  if (!customersLoaded) return undefined;

  let loading = false;

  const refreshCustomers = async () => {
    if (loading) return;

    loading = true;

    try {
      await loadCustomers();
    } finally {
      loading = false;
    }
  };

  const intervalId = window.setInterval(
    refreshCustomers,
    1500
  );

  const handleCustomerUpdate = () => {
    refreshCustomers();
  };

  window.addEventListener(
    "isp-customer-assignment-updated",
    handleCustomerUpdate
  );

  window.addEventListener(
    "storage",
    handleCustomerUpdate
  );

  return () => {
    window.clearInterval(intervalId);

    window.removeEventListener(
      "isp-customer-assignment-updated",
      handleCustomerUpdate
    );

    window.removeEventListener(
      "storage",
      handleCustomerUpdate
    );
  };
}, [customersLoaded, loadCustomers]);

useEffect(() => {
  if (!reportsLoaded) return undefined;

  let loading = false;

  const refreshReports = async () => {
    if (loading) return;

    loading = true;

    try {
      await loadEmployeeReports();
    } finally {
      loading = false;
    }
  };

  const intervalId = window.setInterval(
    refreshReports,
    2000
  );

  window.addEventListener(
    "isp-employee-report-updated",
    refreshReports
  );

  window.addEventListener(
    "storage",
    refreshReports
  );

  return () => {
    window.clearInterval(intervalId);

    window.removeEventListener(
      "isp-employee-report-updated",
      refreshReports
    );

    window.removeEventListener(
      "storage",
      refreshReports
    );
  };
}, [reportsLoaded, loadEmployeeReports]);

useEffect(() => {
  if (!activitiesLoaded) return undefined;

  let loading = false;

  const refreshActivities = async () => {
    if (loading) return;

    loading = true;

    try {
      await loadEmployeeActivities();
    } finally {
      loading = false;
    }
  };

  const intervalId = window.setInterval(
    refreshActivities,
    1500
  );

  window.addEventListener(
    "isp-employee-activity-updated",
    refreshActivities
  );

  window.addEventListener(
    "storage",
    refreshActivities
  );

  return () => {
    window.clearInterval(intervalId);

    window.removeEventListener(
      "isp-employee-activity-updated",
      refreshActivities
    );

    window.removeEventListener(
      "storage",
      refreshActivities
    );
  };
}, [activitiesLoaded, loadEmployeeActivities]);

useEffect(() => {
  if (!adjustmentsLoaded) return undefined;

  let loading = false;

  const refreshAdjustments = async () => {
    if (loading) return;

    loading = true;

    try {
      await loadEmployeeAdjustments();
    } finally {
      loading = false;
    }
  };

  const intervalId = window.setInterval(
    refreshAdjustments,
    1500
  );

  window.addEventListener(
    "isp-employee-ledger-updated",
    refreshAdjustments
  );

  window.addEventListener(
    "storage",
    refreshAdjustments
  );

  return () => {
    window.clearInterval(intervalId);

    window.removeEventListener(
      "isp-employee-ledger-updated",
      refreshAdjustments
    );

    window.removeEventListener(
      "storage",
      refreshAdjustments
    );
  };
}, [
  adjustmentsLoaded,
  loadEmployeeAdjustments,
]);

useEffect(() => {
  if (
    !customersLoaded ||
    !currentUser
  ) {
    return;
  }

  const accountKey = String(
    currentUser.id ||
      currentUser.employeeId ||
      currentUser.accountId ||
      "employee"
  );

  const storageKey =
    `isp-seen-assigned-customer-requests:${accountKey}`;

  let seen = [];

  try {
    const parsed = JSON.parse(
      localStorage.getItem(storageKey) || "[]"
    );

    seen = Array.isArray(parsed) ? parsed : [];
  } catch {
    seen = [];
  }

  const seenSet = new Set(seen.map(String));

  if (!assignedRequestAlertReadyRef.current) {
    assignedRequestEvents.forEach((event) =>
      seenSet.add(event.key)
    );

    localStorage.setItem(
      storageKey,
      JSON.stringify([...seenSet].slice(-300))
    );

    assignedRequestAlertReadyRef.current = true;
    return;
  }

  const newEvents = assignedRequestEvents.filter(
    (event) => !seenSet.has(event.key)
  );

  if (!newEvents.length) return;

  newEvents.forEach((event) => {
    seenSet.add(event.key);
    notify(event.description, "info", {
      system: true,
      title: event.title,
      path: withRecordHash(
        "/my-account",
        "customer",
        event.customer?.id ||
          event.customer?.customerId
      ),
    });
  });

  localStorage.setItem(
    storageKey,
    JSON.stringify([...seenSet].slice(-300))
  );

  if (
    !newEvents.some((event) => event.shouldPlaySound)
  ) {
    return;
  }

  try {
    if (!assignedRequestSoundRef.current) {
      assignedRequestSoundRef.current = new Audio(
        "/sounds/open-up-587.mp3"
      );

      assignedRequestSoundRef.current.preload =
        "auto";

      assignedRequestSoundRef.current.volume = 0.8;
    }

    assignedRequestSoundRef.current.currentTime = 0;

    const playResult =
      assignedRequestSoundRef.current.play();

    if (
      playResult &&
      typeof playResult.catch === "function"
    ) {
      playResult.catch(() => {
        // The visual alert still appears if audio is blocked.
      });
    }
  } catch {
    // Keep the assignment notification working without sound.
  }
}, [
  assignedRequestEvents,
  customersLoaded,
  currentUser,
]);

/*
 * Reception receives a response alert when an assigned
 * employee accepts or rejects a request. The first load is
 * silently remembered so old responses are not replayed.
 */
useEffect(() => {
  if (
    !customersLoaded ||
    !currentUser
  ) {
    return;
  }

  const accountKey = String(
    currentUser.id ||
      currentUser.employeeId ||
      currentUser.accountId ||
      "unknown"
  );

  const storageKey =
    `isp-seen-assignment-responses:${accountKey}`;

  let seen = [];

  try {
    const parsed = JSON.parse(
      localStorage.getItem(storageKey) ||
        "[]"
    );

    seen = Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    seen = [];
  }

  const seenSet = new Set(seen);

  if (!responseAlertReadyRef.current) {
    receptionResponseEvents.forEach((event) =>
      seenSet.add(event.key)
    );

    localStorage.setItem(
      storageKey,
      JSON.stringify(
        [...seenSet].slice(-300)
      )
    );

    responseAlertReadyRef.current = true;
    return;
  }

  const newResponses =
    receptionResponseEvents.filter(
      (event) =>
        !seenSet.has(event.key)
    );

  if (!newResponses.length) {
    return;
  }

  newResponses.forEach((event) => {
    seenSet.add(event.key);

    const customerName =
      event.customer.fullName ||
      event.customer.customerName ||
      event.customer.personName ||
      "Customer";

    const message =
      `${event.actorName} ${event.action} for ${customerName}.`;

    notify(message, event.toastType, {
      system: true,
      title: "Customer Request Response",
      path: event.customer?.id
        ? withRecordHash(
            "/my-account",
            "customer",
            event.customer.id
          )
        : "/my-account",
    });
  });

  localStorage.setItem(
    storageKey,
    JSON.stringify(
      [...seenSet].slice(-300)
    )
  );

  try {
    if (!responseSoundRef.current) {
      responseSoundRef.current = new Audio(
        "/sounds/soft-bells-495.mp3"
      );

      responseSoundRef.current.preload =
        "auto";

      responseSoundRef.current.volume =
        0.8;
    }

    responseSoundRef.current.currentTime =
      0;

    const playPromise =
      responseSoundRef.current.play();

    if (
      playPromise &&
      typeof playPromise.catch ===
        "function"
    ) {
      playPromise.catch(() => {
        // Browser may require one user interaction first.
      });
    }
  } catch {
    // Visual notification remains available if audio fails.
  }
}, [
  customers,
  customersLoaded,
  currentUser?.id,
  currentUser?.employeeId,
  currentUser?.accountId,
]);

useEffect(() => {
  if (
    !customersLoaded ||
    !currentUser ||
    !isAdminUser(currentUser)
  ) {
    return;
  }

  const accountKey = String(
    currentUser.id ||
      currentUser.employeeId ||
      currentUser.accountId ||
      "admin"
  );

  const storageKey =
    `isp-seen-admin-customer-alerts:${accountKey}`;

  let seen = [];

  try {
    const parsed = JSON.parse(
      localStorage.getItem(storageKey) || "[]"
    );

    seen = Array.isArray(parsed) ? parsed : [];
  } catch {
    seen = [];
  }

  const seenSet = new Set(seen);

  if (!adminCustomerAlertReadyRef.current) {
    adminCustomerCreateEvents.forEach((event) =>
      seenSet.add(event.key)
    );

    localStorage.setItem(
      storageKey,
      JSON.stringify([...seenSet].slice(-500))
    );

    adminCustomerAlertReadyRef.current = true;
    return;
  }

  const newEvents = adminCustomerCreateEvents.filter(
    (event) => !seenSet.has(event.key)
  );

  if (!newEvents.length) return;

  newEvents.forEach((event) => {
    seenSet.add(event.key);

    const customerName =
      event.customer.customerName ||
      event.customer.fullName ||
      event.customer.passportFullName ||
      event.customer.personName ||
      "Customer";

    notify(
      `${event.creator} registered ${customerName} from ${event.section}.`,
      "info",
      {
        system: true,
        title: "New Customer Registered",
        path: "/customers/consultants",
      }
    );
  });

  localStorage.setItem(
    storageKey,
    JSON.stringify([...seenSet].slice(-500))
  );
}, [
  adminCustomerCreateEvents,
  customersLoaded,
  currentUser,
]);

useEffect(() => {
  if (!currentUser) return;

  const accountKey = String(
    currentUser.employeeId ||
      currentUser.id ||
      currentUser.accountId ||
      "employee"
  );

  const storageKey =
    `isp-seen-employee-ledger-alerts:${accountKey}`;

  let seen = [];

  try {
    const parsed = JSON.parse(
      localStorage.getItem(storageKey) || "[]"
    );

    seen = Array.isArray(parsed) ? parsed : [];
  } catch {
    seen = [];
  }

  const seenSet = new Set(seen.map(String));
  const ledgerKey = (entry) =>
    String(
      entry.id ||
        `${entry.employeeNotificationAt || ""}:${entry.type || ""}:${entry.amount || ""}`
    );

  const newEntries = employeeLedgerNotifications.filter(
    (entry) => !seenSet.has(ledgerKey(entry))
  );

  if (!newEntries.length) return;

  newEntries.forEach((entry) => {
    seenSet.add(ledgerKey(entry));
    notify(ledgerAlertText(entry), "success", {
      system: true,
      title: ledgerTypeLabel(entry.type),
      path: withRecordHash(
        "/my-account",
        "ledger",
        entry.id
      ),
    });
  });

  localStorage.setItem(
    storageKey,
    JSON.stringify([...seenSet].slice(-300))
  );

  try {
    if (!employeeLedgerSoundRef.current) {
      employeeLedgerSoundRef.current = new Audio(
        "/sounds/soft-bells-495.mp3"
      );

      employeeLedgerSoundRef.current.preload =
        "auto";

      employeeLedgerSoundRef.current.volume = 0.85;
    }

    employeeLedgerSoundRef.current.currentTime = 0;

    const playResult =
      employeeLedgerSoundRef.current.play();

    if (
      playResult &&
      typeof playResult.catch === "function"
    ) {
      playResult.catch(() => {
        // The visual alert still appears if audio is blocked.
      });
    }
  } catch {
    // Keep the ledger notification working without sound.
  }
}, [
  currentUser,
  employeeLedgerNotifications,
]);

useEffect(() => {
  if (
    !currentUser ||
    !isFullAdminAccount
  ) {
    return;
  }

  const accountKey = String(
    currentUser.id ||
      currentUser.employeeId ||
      currentUser.accountId ||
      "full-admin"
  );

  const storageKey =
    `isp-seen-employee-report-alerts:${accountKey}`;

  let seen = [];

  try {
    const parsed = JSON.parse(
      localStorage.getItem(storageKey) || "[]"
    );

    seen = Array.isArray(parsed) ? parsed : [];
  } catch {
    seen = [];
  }

  const seenSet = new Set(seen.map(String));
  const reportKey = (report) =>
    String(
      report.id ||
        `${report.adminNotificationAt || ""}:${report.employeeName || ""}`
    );

  const newReports =
    employeeReportNotifications.filter(
      (report) => !seenSet.has(reportKey(report))
    );

  if (!newReports.length) return;

  newReports.forEach((report) => {
    seenSet.add(reportKey(report));

    const message = tx(
      `${report.employeeName || "Employee"} submitted their daily report.`,
      `${report.employeeName || "\u06a9\u0627\u0631\u0645\u0646\u062f"} \u0631\u0627\u067e\u0648\u0631 \u0631\u0648\u0632\u0627\u0646\u0647 \u062e\u0648\u062f \u0631\u0627 \u062b\u0628\u062a \u06a9\u0631\u062f.`,
      `${report.employeeName || "\u06a9\u0627\u0631\u06a9\u0648\u0648\u0646\u06a9\u064a"} \u062e\u067e\u0644 \u0648\u0631\u0681\u0646\u06cc \u0631\u0627\u067e\u0648\u0631 \u062b\u0628\u062a \u06a9\u0693.`
    );

    notify(message, "info", {
      system: true,
      title: tx("Daily Report Submitted", "\u0631\u0627\u067e\u0648\u0631 \u0631\u0648\u0632\u0627\u0646\u0647 \u062b\u0628\u062a \u0634\u062f", "\u0648\u0631\u0681\u0646\u06cc \u0631\u0627\u067e\u0648\u0631 \u062b\u0628\u062a \u0634\u0648"),
      path: report.employeeId
        ? withRecordHash(
            `/employees/${encodeURIComponent(String(report.employeeId))}`,
            "reports",
            report.id
          )
        : "/employees",
    });
  });

  localStorage.setItem(
    storageKey,
    JSON.stringify([...seenSet].slice(-500))
  );
}, [
  currentUser,
  employeeReportNotifications,
  isFullAdminAccount,
  tx,
]);

useEffect(() => {
  if (
    !currentUser ||
    !isFullAdminAccount
  ) {
    return;
  }

  const accountKey = String(
    currentUser.id ||
      currentUser.employeeId ||
      currentUser.accountId ||
      "full-admin"
  );

  const storageKey =
    `isp-seen-employee-activity-alerts:${accountKey}`;

  let seen = [];

  try {
    const parsed = JSON.parse(
      localStorage.getItem(storageKey) || "[]"
    );

    seen = Array.isArray(parsed) ? parsed : [];
  } catch {
    seen = [];
  }

  const seenSet = new Set(seen.map(String));
  const activityKey = (activity) =>
    String(
      activity.id ||
        `${activity.adminNotificationAt || ""}:${activity.actorId || ""}:${activity.collection || ""}`
    );

  const newActivities =
    employeeActivityNotifications.filter(
      (activity) =>
        !seenSet.has(activityKey(activity))
    );

  if (!newActivities.length) return;

  newActivities.forEach((activity) => {
    seenSet.add(activityKey(activity));
    notify(activityText(activity), "info", {
      system: true,
      title: tx("Employee Action", "\u0639\u0645\u0644\u06a9\u0631\u062f \u06a9\u0627\u0631\u0645\u0646\u062f", "\u062f \u06a9\u0627\u0631\u06a9\u0648\u0648\u0646\u06a9\u064a \u0639\u0645\u0644"),
      path: collectionPath(
        activity.collection,
        activity.primaryRecordId ||
          activity.changedIds?.[0] ||
          activity.createdIds?.[0] ||
          activity.updatedIds?.[0]
      ),
    });
  });

  localStorage.setItem(
    storageKey,
    JSON.stringify([...seenSet].slice(-600))
  );
}, [
  currentUser,
  employeeActivityNotifications,
  isFullAdminAccount,
  tx,
]);

useEffect(() => {
  if (compact || !currentUser) return;

  const accountKey = String(
    currentUser.id ||
      currentUser.employeeId ||
      currentUser.accountId ||
      "employee"
  );

  const storageKey = `isp-seen-chat-message-alerts:${accountKey}`;

  let seen = [];

  try {
    const parsed = JSON.parse(
      localStorage.getItem(storageKey) || "[]"
    );

    seen = Array.isArray(parsed) ? parsed : [];
  } catch {
    seen = [];
  }

  const seenSet = new Set(seen.map(String));
  const incomingMessages = chatMessages.filter(
    (message) =>
      currentUserIds.includes(String(message.toAccountId || "")) &&
      !currentUserIds.includes(String(message.fromAccountId || ""))
  );

  if (!chatMessageAlertReadyRef.current) {
    incomingMessages.forEach((message) => {
      if (message.id) seenSet.add(String(message.id));
    });

    localStorage.setItem(
      storageKey,
      JSON.stringify([...seenSet].slice(-800))
    );

    chatMessageAlertReadyRef.current = true;
    return;
  }

  const newMessages = incomingMessages.filter(
    (message) => message.id && !seenSet.has(String(message.id))
  );

  if (!newMessages.length) return;

  newMessages.forEach((message) => {
    seenSet.add(String(message.id));

    const alertText = tx(
      `${message.senderName || "Employee"} sent you a message.`,
      `${message.senderName || "\u06a9\u0627\u0631\u0645\u0646\u062f"} \u0628\u0631\u0627\u06cc \u0634\u0645\u0627 \u067e\u06cc\u0627\u0645 \u0641\u0631\u0633\u062a\u0627\u062f.`,
      `${message.senderName || "\u06a9\u0627\u0631\u06a9\u0648\u0648\u0646\u06a9\u064a"} \u062a\u0627\u0633\u0648 \u062a\u0647 \u067e\u06cc\u063a\u0627\u0645 \u0648\u0644\u06d0\u0696\u0647.`
    );

    notify(alertText, "info", {
      system: true,
      title: tx("New Message", "\u067e\u06cc\u0627\u0645 \u062c\u062f\u06cc\u062f", "\u0646\u0648\u06cc \u067e\u06cc\u063a\u0627\u0645"),
      path: `/messages?chat=${encodeURIComponent(
        String(message.fromAccountId || "")
      )}`,
    });
  });

  localStorage.setItem(
    storageKey,
    JSON.stringify([...seenSet].slice(-800))
  );

  try {
    if (!chatMessageSoundRef.current) {
      chatMessageSoundRef.current = new Audio(
        "/sounds/soft-bells-495.mp3"
      );

      chatMessageSoundRef.current.preload = "auto";
      chatMessageSoundRef.current.volume = 0.85;
    }

    chatMessageSoundRef.current.currentTime = 0;

    const playResult = chatMessageSoundRef.current.play();

    if (
      playResult &&
      typeof playResult.catch === "function"
    ) {
      playResult.catch(() => {
        // The visual notification still appears if audio is blocked.
      });
    }
  } catch {
    // Keep message notifications working without sound.
  }
}, [
  chatMessages,
  compact,
  currentUser,
  currentUserIds,
  tx,
]);

  const damagedOrLostAssets = assets.filter((asset) =>
    ["Damaged", "Lost"].includes(asset.status)
  );

  const pendingTowerAssets = towerAssets.filter(
    (item) => item.installationStatus === "Pending"
  );

  const outstandingDeposits = securityDeposits.filter((item) =>
    ["Outstanding", "Held"].includes(item.status)
  );

  const expiredCustomerPackages = customerPackages.filter(
    (item) =>
      String(item.status || "Active") === "Active" &&
      item.endDate &&
      String(item.endDate) <= today
  );

  const lowStockAssets = assets.filter((asset) => {
    const alertQuantity = Number(asset.alertQuantity || 0);
    return alertQuantity > 0 && Number(asset.quantity || 0) <= alertQuantity;
  });

  const adminCustomerNotifications =
    isAdminUser(currentUser)
      ? adminCustomerCreateEvents
      : [];

  const notificationGroups = [
    {
      key: "admin-customer-created",
      title: "Call Center Registrations",
      count: adminCustomerNotifications.length,
      icon: Users,
      items: adminCustomerNotifications.map((event) => {
        const customerName =
          event.customer.customerName ||
          event.customer.fullName ||
          event.customer.passportFullName ||
          event.customer.personName ||
          "Customer";

        return {
          title: "New Customer Registered",
          description: `${event.creator} registered ${customerName} from ${event.section}`,
          path: "/customers/consultants",
          happenedAt:
            event.customer.adminNotificationAt ||
            event.customer.createdAt,
        };
      }),
    },
    {
      key: "follow-up-admin-review",
      title: "Follow-Up Reviews",
      count: pendingAdminFollowUps.length,
      icon: FileCheck2,
      items: pendingAdminFollowUps.map((customer) => ({
        title: "Follow-Up Ready for Admin",
        description: `${
          customer.fullName ||
          customer.customerName ||
          customer.personName ||
          "Customer"
        } was completed by Reception and needs financial review`,
        path: `/customer-follow-up/${customer.id}`,
        happenedAt:
          customer.followUp?.submittedForAdminAt ||
          customer.followUpUpdatedAt,
      })),
    },
    {
      key: "assigned-customers",
      title: "Customer Requests",
      count: assignedCustomerCount,
      icon: Users,
      items: assignedRequestEvents.map((event) => ({
        title: event.title,
        description: event.description,
        path: withRecordHash(
          "/my-account",
          "customer",
          event.customer?.id ||
            event.customer?.customerId
        ),
        happenedAt: event.happenedAt,
      })),
    },
    {
      key: "employee-report-submitted",
      title: tx("Daily Reports", "\u0631\u0627\u067e\u0648\u0631\u0647\u0627\u06cc \u0631\u0648\u0632\u0627\u0646\u0647", "\u0648\u0631\u0681\u0646\u064a \u0631\u0627\u067e\u0648\u0631\u0648\u0646\u0647"),
      count: employeeReportNotifications.length,
      icon: FileCheck2,
      items: employeeReportNotifications.map(
        (report) => ({
          title: tx("Daily Report Submitted", "\u0631\u0627\u067e\u0648\u0631 \u0631\u0648\u0632\u0627\u0646\u0647 \u062b\u0628\u062a \u0634\u062f", "\u0648\u0631\u0681\u0646\u06cc \u0631\u0627\u067e\u0648\u0631 \u062b\u0628\u062a \u0634\u0648"),
          description: tx(
            `${report.employeeName || "Employee"} submitted their daily report.`,
            `${report.employeeName || "\u06a9\u0627\u0631\u0645\u0646\u062f"} \u0631\u0627\u067e\u0648\u0631 \u0631\u0648\u0632\u0627\u0646\u0647 \u062e\u0648\u062f \u0631\u0627 \u062b\u0628\u062a \u06a9\u0631\u062f.`,
            `${report.employeeName || "\u06a9\u0627\u0631\u06a9\u0648\u0648\u0646\u06a9\u064a"} \u062e\u067e\u0644 \u0648\u0631\u0681\u0646\u06cc \u0631\u0627\u067e\u0648\u0631 \u062b\u0628\u062a \u06a9\u0693.`
          ),
          path: report.employeeId
            ? withRecordHash(
                `/employees/${encodeURIComponent(
                  String(report.employeeId)
                )}`,
                "reports",
                report.id
              )
            : "/employees",
          happenedAt:
            report.adminNotificationAt ||
            report.createdAt,
        })
      ),
    },
    {
      key: "employee-activity",
      title: tx("Employee Activity", "\u0641\u0639\u0627\u0644\u06cc\u062a \u06a9\u0627\u0631\u0645\u0646\u062f\u0627\u0646", "\u062f \u06a9\u0627\u0631\u06a9\u0648\u0648\u0646\u06a9\u0648 \u0641\u0639\u0627\u0644\u06cc\u062a"),
      count: employeeActivityNotifications.length,
      icon: Activity,
      items: employeeActivityNotifications.map(
        (activity) => ({
          title: tx("Employee Action", "\u0639\u0645\u0644\u06a9\u0631\u062f \u06a9\u0627\u0631\u0645\u0646\u062f", "\u062f \u06a9\u0627\u0631\u06a9\u0648\u0648\u0646\u06a9\u064a \u0639\u0645\u0644"),
          description: activityText(activity),
          path: collectionPath(
            activity.collection,
            activity.primaryRecordId ||
              activity.changedIds?.[0] ||
              activity.createdIds?.[0] ||
              activity.updatedIds?.[0]
          ),
          happenedAt:
            activity.adminNotificationAt ||
            activity.createdAt,
        })
      ),
    },
    {
      key: "employee-ledger",
      title: tx("Your Ledger", "\u062d\u0633\u0627\u0628 \u0634\u0645\u0627", "\u0633\u062a\u0627\u0633\u0648 \u062d\u0633\u0627\u0628"),
      count: employeeLedgerNotifications.length,
      icon: Banknote,
      items: employeeLedgerNotifications.map(
        (entry) => ({
          title: ledgerTypeLabel(entry.type),
          description: ledgerAlertText(entry),
          path: withRecordHash(
            "/my-account",
            "ledger",
            entry.id
          ),
          happenedAt:
            entry.employeeNotificationAt ||
            entry.createdAt,
        })
      ),
    },
    {
      key: "chat-messages",
      title: tx("Messages", "\u067e\u06cc\u0627\u0645\u200c\u0647\u0627", "\u067e\u06cc\u063a\u0627\u0645\u0648\u0646\u0647"),
      count: incomingChatMessages.length,
      icon: MessageCircle,
      items: incomingChatMessages.map((message) => ({
        title: tx("New Message", "\u067e\u06cc\u0627\u0645 \u062c\u062f\u06cc\u062f", "\u0646\u0648\u06cc \u067e\u06cc\u063a\u0627\u0645"),
        description:
          message.text ||
          tx("Attachment received", "\u0641\u0627\u06cc\u0644 \u062f\u0631\u06cc\u0627\u0641\u062a \u0634\u062f", "\u0641\u0627\u06cc\u0644 \u062a\u0631\u0644\u0627\u0633\u0647 \u0634\u0648"),
        path: `/messages?chat=${encodeURIComponent(
          String(message.fromAccountId || "")
        )}`,
        happenedAt: message.createdAt,
      })),
    },
    {
      key: "stock",
      title: "Stock Alerts",
      count: lowStockAssets.length,
      icon: Box,
      items: lowStockAssets.map((asset) => ({
        title: "Low Stock Alert",
        description: `${asset.assetId || asset.deviceName || "Asset"} has only ${money(asset.quantity)} ${asset.purchaseUsageUnit || asset.purchaseUnit || "unit(s)"} left`,
        path:
          asset.id || asset.assetId
            ? `/office-assets/${encodeURIComponent(
                String(asset.id || asset.assetId)
              )}`
            : "/office-assets",
      })),
    },
    {
      key: "asset-status",
      title: "Asset Status Alerts",
      count: damagedOrLostAssets.length,
      icon: AlertTriangle,
      items: damagedOrLostAssets.map((asset) => ({
        title: `${asset.status || "Asset"} Asset`,
        description: `${asset.assetId || asset.deviceName || "Asset"} needs attention`,
        path:
          asset.id || asset.assetId
            ? `/office-assets/${encodeURIComponent(
                String(asset.id || asset.assetId)
              )}`
            : "/office-assets",
      })),
    },
    {
      key: "tower",
      title: "Tower Alerts",
      count: pendingTowerAssets.length,
      icon: Wrench,
      items: pendingTowerAssets.map((tower) => ({
        title: "Pending Tower Installation",
        description: `${tower.towerName || "Tower"} is still pending`,
      })),
    },
    {
      key: "deposit",
      title: "Deposit Alerts",
      count: outstandingDeposits.length,
      icon: CreditCard,
      items: outstandingDeposits.map((deposit) => ({
        title: "Outstanding Deposit",
        description: `${deposit.customerName || deposit.customerId || "Customer"} has a deposit balance`,
      })),
    },
    {
      key: "package",
      title: "Package Alerts",
      count: expiredCustomerPackages.length,
      icon: CalendarClock,
      items: expiredCustomerPackages.map((item) => ({
        title: "Package Expired",
        description: `${item.customerName || item.customerId || "Customer"} package ended on ${item.endDate}`,
      })),
    },
  ].filter((group) => group.count > 0);

  const notificationItems = notificationGroups.flatMap(
    (group) =>
      group.items.map((item, index) => ({
        ...item,
        key: [
          group.key,
          item.title,
          item.description,
          item.happenedAt || "",
          index,
        ].join("|"),
        groupKey: group.key,
        groupTitle: group.title,
        icon: group.icon,
      }))
  );

  const visibleNotificationItems =
    notificationItems.filter(
      (item) =>
        !dismissedNotificationKeys.has(item.key)
    );

  const visibleNotificationGroups =
    notificationGroups
      .map((group) => {
        const visibleItems =
          visibleNotificationItems.filter(
            (item) =>
              item.groupKey === group.key
          );

        return {
          ...group,
          count: visibleItems.length,
          items: visibleItems,
        };
      })
      .filter((group) => group.count > 0);

  const alertCount =
    visibleNotificationItems.length;

  function dismissNotification(notificationKey) {
    setDismissedNotificationKeys((current) => {
      const next = new Set(current);
      next.add(notificationKey);
      return next;
    });
  }

  function clearAllNotifications() {
    setDismissedNotificationKeys((current) => {
      const next = new Set(current);

      notificationItems.forEach((item) => {
        next.add(item.key);
      });

      return next;
    });
  }

  function openNotification(item) {
    if (!item.path) return;

    dismissNotification(item.key);
    setOpenMenu(null);
    navigate(item.path);
  }

  const themes = [
    {
      key: "light",
      label: tx("Light", "\u0631\u0648\u0634\u0646", "\u0631\u0648\u069a\u0627\u0646\u0647"),
      color: "#f7f5f1",
    },
    {
      key: "dark",
      label: tx("Dark", "\u062a\u0627\u0631\u06cc\u06a9", "\u062a\u06cc\u0627\u0631\u0647"),
      color: "#0f172a",
    },
    {
      key: "ocean",
      label: tx("Ocean", "\u0627\u0642\u06cc\u0627\u0646\u0648\u0633", "\u0633\u0645\u0646\u062f\u0631"),
      color: "#0ea5e9",
    },
    {
      key: "warm",
      label: tx("Warm", "\u06af\u0631\u0645", "\u062a\u0648\u062f"),
      color: "#f59e0b",
    },
    {
      key: "professional",
      label: tx("Soft Aurora", "\u0622\u0631\u0648\u0631\u0627\u06cc \u0645\u0644\u0627\u06cc\u0645", "\u0646\u0631\u0645\u0647 \u0622\u0631\u0648\u0631\u0627"),
      color: "linear-gradient(125deg, #22d3ee 0%, #a78bfa 28%, #f472b6 55%, #facc15 78%, #34d399 100%)",
    },
    {
      key: "winter",
      label: tx("Winter Snow", "\u0628\u0631\u0641 \u0632\u0645\u0633\u062a\u0627\u0646\u06cc", "\u0698\u0645\u0646\u06cd \u0648\u0627\u0648\u0631\u0647"),
      color: "linear-gradient(145deg, #020617 0%, #111827 55%, #334155 100%)",
    },
  ];

  const currencies = ["AFN", "USD"];

  function selectCurrency(currency) {
    setSelectedCurrency(currency);
    localStorage.setItem(
      "isp-currency",
      currency
    );

    window.dispatchEvent(
      new CustomEvent(
        "isp-currency-changed",
        {
          detail: {
            currency,
            usdRate,
          },
        }
      )
    );
  }

  function currentDisplayRate(
    direction = exchangeDirection,
    baseRate = usdRate
  ) {
    if (direction === "usd-to-afn") {
      return String(baseRate);
    }

    return String(
      Number((1 / baseRate).toFixed(6))
    );
  }

  function updateUsdRateInput(value) {
    // Keep the raw text so the user can fully clear
    // the input and type a new value.
    setRateInput(value);

    if (
      value === "" ||
      value === "." ||
      value === "-"
    ) {
      return;
    }

    const enteredRate = Number(value);

    if (
      !Number.isFinite(enteredRate) ||
      enteredRate <= 0
    ) {
      return;
    }

    const nextUsdRate =
      exchangeDirection === "usd-to-afn"
        ? enteredRate
        : 1 / enteredRate;

    setUsdRate(nextUsdRate);

    localStorage.setItem(
      "isp-usd-rate",
      String(nextUsdRate)
    );

    window.dispatchEvent(
      new CustomEvent(
        "isp-currency-rate-changed",
        {
          detail: {
            currency: selectedCurrency,
            usdRate: nextUsdRate,
            direction: exchangeDirection,
          },
        }
      )
    );
  }

  function commitUsdRateInput() {
    const enteredRate = Number(rateInput);

    if (
      !rateInput.trim() ||
      !Number.isFinite(enteredRate) ||
      enteredRate <= 0
    ) {
      setRateInput(currentDisplayRate());
    }
  }

  function toggleExchangeDirection() {
    const nextDirection =
      exchangeDirection === "usd-to-afn"
        ? "afn-to-usd"
        : "usd-to-afn";

    setExchangeDirection(nextDirection);

    localStorage.setItem(
      "isp-exchange-direction",
      nextDirection
    );

    setRateInput(
      currentDisplayRate(
        nextDirection,
        usdRate
      )
    );
  }

  function applyTheme(theme) {
    setSelectedTheme(theme);
    localStorage.setItem("isp-theme", theme);
    document.body.classList.remove(
      "dark-mode",
      "theme-ocean",
      "theme-warm",
      "theme-professional",
      "theme-winter"
    );
    if (theme === "dark") document.body.classList.add("dark-mode");
    if (theme === "ocean") document.body.classList.add("theme-ocean");
    if (theme === "warm") document.body.classList.add("theme-warm");
    if (theme === "professional") document.body.classList.add("theme-professional");
    if (theme === "winter") document.body.classList.add("dark-mode", "theme-winter");
  }

  function toggleDarkMode() {
    applyTheme(selectedTheme === "dark" ? "light" : "dark");
  }

  useEffect(() => {
    applyTheme(selectedTheme);
    applyInterfaceLanguage(selectedLanguage);

    const storedCurrency =
      localStorage.getItem("isp-currency");

    if (
      !["AFN", "USD"].includes(storedCurrency)
    ) {
      localStorage.setItem(
        "isp-currency",
        "AFN"
      );
    }
  }, []);

  useEffect(() => {
    const syncLanguage = (event) => {
      const language = event.detail;
      if (language && language !== selectedLanguage) setSelectedLanguage(language);
    };
    window.addEventListener("isp-language-changed", syncLanguage);
    return () => window.removeEventListener("isp-language-changed", syncLanguage);
  }, [selectedLanguage]);

  if (compact) {
    return (
      <div className="header-menu mobile-brand-actions">
        <button
          className="profile-btn mobile-actions-toggle"
          onClick={() => setOpenMenu(openMenu === "mobile" ? null : "mobile")}
          aria-label="Open mobile actions"
          type="button"
        >
          <User size={17} />
          {alertCount > 0 && <span className="alert-count">{alertCount}</span>}
          <ChevronDown size={14} />
        </button>

        {openMenu === "mobile" && (
          <div className="dropdown mobile-actions-dropdown">
            <strong>
              {currentUser?.fullName || currentUser?.email || currentUser?.username}
            </strong>
            <p>{currentUser?.email || "No email configured"}</p>

            <Link to="/accounts" className="dropdown-action" onClick={() => setOpenMenu(null)}>
              <Users size={15} />
              Accounts
            </Link>
            <Link to="/settings" className="dropdown-action" onClick={() => setOpenMenu(null)}>
              <Settings size={15} />
              Settings
            </Link>
            <button className="dropdown-action" type="button" onClick={toggleDarkMode}>
              {selectedTheme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              {selectedTheme === "dark" ? "Light mode" : "Dark mode"}
            </button>

            <div className="dropdown-alerts">
              <span>
                <Bell size={15} />
                Alerts
                <b>{alertCount}</b>
              </span>
              <small>Low stock assets: {lowStockAssets.length}</small>
              <small>Damaged / lost assets: {damagedOrLostAssets.length}</small>
              <small>Pending tower installations: {pendingTowerAssets.length}</small>
              <small>Outstanding deposits: {outstandingDeposits.length}</small>
              <small>Expired customer packages: {expiredCustomerPackages.length}</small>
            </div>

          <Link
  to="/my-account"
  className="dropdown-action profile-account-link"
  onClick={() => setOpenMenu(null)}
>
  <User size={15} />

  <span>My Account</span>

  {assignedCustomerCount > 0 && (
    <b className="profile-account-count">
      ({assignedCustomerCount})
    </b>
  )}
</Link>

<button
  className="dropdown-logout"
  onClick={onLogout}
  type="button"
>
  <LogOut size={15} />
  Logout
</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="top-actions">
        <div className="header-menu">
          <button
            type="button"
            className="header-control-btn"
            onClick={() => setOpenMenu(openMenu === "currency" ? null : "currency")}
            aria-expanded={openMenu === "currency"}
          >
            <Banknote size={18} />
            <span>{selectedCurrency}</span>
            <ChevronDown size={14} />
          </button>

          {openMenu === "currency" && (
            <div className="dropdown header-picker-dropdown currency-picker-dropdown">
              <div className="header-picker-title">
                <strong>Currency Exchange</strong>
                <span>Display currency</span>
              </div>

              {currencies.map((currency) => (
                <button
                  type="button"
                  key={currency}
                  className={`header-picker-option currency-code-option ${
                    selectedCurrency === currency
                      ? "active"
                      : ""
                  }`}
                  onClick={() => {
                    selectCurrency(currency);
                  }}
                >
                  <strong>{currency}</strong>

                  {selectedCurrency === currency && (
                    <CheckCheck size={15} />
                  )}
                </button>
              ))}

              <div
                style={{
                  marginTop: 10,
                  paddingTop: 12,
                  borderTop:
                    "1px solid rgba(148, 163, 184, 0.25)",
                }}
              >
                <div
                  style={{
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div>
                    <strong
                      style={{
                        display: "block",
                        fontSize: 11,
                      }}
                    >
                      Exchange Rate
                    </strong>

                    <span
                      style={{
                        color: "#64748b",
                        fontSize: 9,
                      }}
                    >
                      Manual value
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleExchangeDirection();
                    }}
                    title="Reverse exchange direction"
                    aria-label="Reverse exchange direction"
                    style={{
                      width: 30,
                      height: 30,
                      padding: 0,
                      border:
                        "1px solid #dfe3e8",
                      borderRadius: 8,
                      display: "grid",
                      placeItems: "center",
                      background: "transparent",
                      color: "inherit",
                      cursor: "pointer",
                    }}
                  >
                    <ArrowLeftRight size={14} />
                  </button>
                </div>

                <div
                  style={{
                    minHeight: 42,
                    padding: "6px 8px",
                    border:
                      "1px solid #dfe3e8",
                    borderRadius: 8,
                    display: "grid",
                    gridTemplateColumns:
                      "auto minmax(72px, 1fr) auto",
                    alignItems: "center",
                    gap: 7,
                    background: "inherit",
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {exchangeDirection ===
                    "usd-to-afn"
                      ? "1 USD ="
                      : "1 AFN ="}
                  </span>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={rateInput}
                    onChange={(event) =>
                      updateUsdRateInput(
                        event.target.value
                      )
                    }
                    onBlur={commitUsdRateInput}
                    onFocus={(event) =>
                      event.target.select()
                    }
                    onClick={(event) =>
                      event.stopPropagation()
                    }
                    style={{
                      width: "100%",
                      minWidth: 0,
                      height: 28,
                      padding: "0 7px",
                      border:
                        "1px solid #cbd5e1",
                      borderRadius: 6,
                      outline: 0,
                      background: "transparent",
                      color: "inherit",
                      fontFamily: "inherit",
                      fontSize: 10,
                      fontWeight: 800,
                    }}
                    aria-label="Currency exchange rate"
                  />

                  <strong
                    style={{
                      fontSize: 10,
                    }}
                  >
                    {exchangeDirection ===
                    "usd-to-afn"
                      ? "AFN"
                      : "USD"}
                  </strong>
                </div>

                <div
                  style={{
                    marginTop: 8,
                    padding: "7px 8px",
                    borderRadius: 7,
                    background:
                      "rgba(99, 102, 241, 0.07)",
                    color: "#64748b",
                    fontSize: 9,
                    lineHeight: 1.45,
                  }}
                >
                  {exchangeDirection ===
                  "usd-to-afn" ? (
                    <>
                      1 USD ={" "}
                      <strong>
                        {Number(
                          usdRate.toFixed(6)
                        )}
                      </strong>{" "}
                      AFN
                    </>
                  ) : (
                    <>
                      1 AFN ={" "}
                      <strong>
                        {Number(
                          (1 / usdRate).toFixed(6)
                        )}
                      </strong>{" "}
                      USD
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="header-menu">
          <button type="button" className="header-control-btn" onClick={() => setOpenMenu(openMenu === "language" ? null : "language")} aria-expanded={openMenu === "language"}>
            <Languages size={18} /><span>{selectedLanguage === "en" ? "EN" : selectedLanguage === "dr" ? "دری" : "PS"}</span><ChevronDown size={14} />
          </button>
          {openMenu === "language" && <div className="dropdown header-picker-dropdown language-picker-dropdown"><div className="header-picker-title"><strong>Language</strong><span>Interface language</span></div>{[["en","English","English"],["dr","Dari","دری"],["ps","Pashto","پښتو"]].map(([code,label,native])=><button type="button" key={code} className={`header-picker-option language-picker-option ${selectedLanguage===code?"active":""}`} onClick={()=>{setSelectedLanguage(code);applyInterfaceLanguage(code);setOpenMenu(null)}}><b data-no-translate>{code.toUpperCase()}</b><span><strong>{label}</strong><small data-no-translate>{native}</small></span>{selectedLanguage===code&&<CheckCheck size={15}/>}</button>)}</div>}
        </div>

        <div className="header-menu">
          <button
            type="button"
            className="header-control-btn"
            onClick={() => setOpenMenu(openMenu === "themes" ? null : "themes")}
            aria-expanded={openMenu === "themes"}
          >
            <Palette size={18} />
            <span>
              {tx("Themes", "\u067e\u0648\u0633\u062a\u0647\u200c\u0647\u0627", "\u067e\u0648\u0633\u062a\u06a9\u064a")}
            </span>
            <ChevronDown size={14} />
          </button>

          {openMenu === "themes" && (
            <div className="dropdown header-picker-dropdown theme-picker-dropdown">
              <div className="header-picker-title">
                <strong>
                  {tx("Choose Theme", "\u0627\u0646\u062a\u062e\u0627\u0628 \u067e\u0648\u0633\u062a\u0647", "\u067e\u0648\u0633\u062a\u06a9\u06cc \u0648\u067c\u0627\u06a9\u0626")}
                </strong>
                <span>
                  {tx("Interface appearance", "\u0638\u0627\u0647\u0631 \u0633\u06cc\u0633\u062a\u0645", "\u062f \u0633\u06cc\u0633\u062a\u0645 \u0685\u06d0\u0631\u0647")}
                </span>
              </div>
              <div className="theme-picker-grid">
                {themes.map((theme) => (
                  <button
                    type="button"
                    key={theme.key}
                    className={`theme-picker-option ${selectedTheme === theme.key ? "active" : ""}`}
                    onClick={() => {
                      applyTheme(theme.key);
                      setOpenMenu(null);
                    }}
                  >
                    <i
                      className={`theme-preview-${theme.key}`}
                      style={{ background: theme.color }}
                    ></i>
                    <span>{theme.label}</span>
                    {selectedTheme === theme.key && <CheckCheck size={14} />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="header-menu">
          <button
            className="icon-btn"
            onClick={() => setOpenMenu(openMenu === "alerts" ? null : "alerts")}
            aria-label="Alerts"
          >
            <Bell size={21} strokeWidth={1.9} />
            {alertCount > 0 && <span className="alert-count">{alertCount}</span>}
          </button>

          {openMenu === "alerts" && (
            <div className="dropdown alert-dropdown notification-dropdown">
              <div className="notification-dropdown-header">
  <div className="notification-dropdown-title">
    <strong>Notifications</strong>

   {assignedCustomerCount > 0 && (
  <span className="account-request-badge">
    {assignedCustomerCount > 99
      ? "99+"
      : assignedCustomerCount}
  </span>
)}
  </div>

  <div className="notification-header-actions">
    <button
      type="button"
      aria-label="Mark all notifications as read"
      title="Mark all as read"
      onClick={clearAllNotifications}
    >
      <CheckCheck size={14} />
    </button>

    <button
      type="button"
      className="notification-clear-btn"
      aria-label="Clear all notifications"
      title="Clear notifications"
      onClick={clearAllNotifications}
    >
      <Trash2 size={14} />
    </button>
  </div>
</div>

              {visibleNotificationGroups.length > 0 ? (
                <>
                  <div className="notification-group-list">
                    {visibleNotificationGroups.map((group) => {
                      const Icon = group.icon;
                      return (
                        <div key={group.key} className="notification-group-row">
                          <Icon size={15} />
                          <span>{group.title} ({group.count})</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="notification-item-list">
                    {visibleNotificationItems
                      .slice(0, 8)
                      .map((item) => {
                        const Icon = item.icon;
                        return (
                          <div
                            key={item.key}
                            className="notification-item"
                            role={item.path ? "button" : undefined}
                            tabIndex={item.path ? 0 : undefined}
                            onClick={() => {
                              openNotification(item);
                            }}
                            onKeyDown={(event) => {
                              if (
                                item.path &&
                                (event.key === "Enter" || event.key === " ")
                              ) {
                                event.preventDefault();
                                openNotification(item);
                              }
                            }}
                          >
  <span className="notification-icon">
    <Icon size={15} strokeWidth={1.9} />
  </span>

  <div className="notification-item-content">
    <strong>{item.title}</strong>
    <p>{item.description}</p>
    <small>
      {item.happenedAt
        ? new Date(item.happenedAt).toLocaleString()
        : "Current alert"}
    </small>
  </div>

  <button
    type="button"
    className="notification-remove-btn"
    aria-label={`Remove ${item.title}`}
    title="Remove notification"
    onClick={(event) => {
      event.stopPropagation();
      dismissNotification(item.key);
    }}
  >
    <Trash2 size={13} />
  </button>
</div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="notification-empty">No notifications right now.</div>
              )}
            </div>
          )}
        </div>

        <div className="header-menu profile-menu">
          <button
  className="profile-btn account-profile-btn"
  onClick={() =>
    setOpenMenu(
      openMenu === "profile"
        ? null
        : "profile"
    )
  }
  aria-label="Profile"
  type="button"
>
  <User size={21} strokeWidth={1.9} />

  {assignedCustomerCount > 0 && (
    <span className="account-request-badge">
      {assignedCustomerCount > 99
        ? "99+"
        : assignedCustomerCount}
    </span>
  )}
</button>

          {openMenu === "profile" && (
  <div className="dropdown profile-dropdown">
    <strong>
      {currentUser?.fullName ||
        currentUser?.email ||
        currentUser?.username}
    </strong>

    <p>
      {currentUser?.email ||
        "No email configured"}
    </p>

    <Link
  to="/my-account"
  className="dropdown-action profile-account-link"
  onClick={() => setOpenMenu(null)}
>
  <User size={15} />

  <span>My Account</span>

  {assignedCustomerCount > 0 && (
    <b className="profile-account-count">
      ({assignedCustomerCount})
    </b>
  )}
</Link>

    <button
      className="dropdown-logout"
      onClick={onLogout}
      type="button"
    >
      <LogOut size={15} />
      Logout
    </button>
  </div>
)}
        </div>
      </div>
  );
}
function Header({ currentUser, onLogout }) {
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const [query, setQuery] = useState("");
  const [openSearch, setOpenSearch] = useState(false);
  const [resultFilter, setResultFilter] = useState("All");

  const [selectedLanguage, setSelectedLanguage] = useState(
    () => localStorage.getItem("isp-language") || "en"
  );

  useEffect(() => {
    const syncLanguage = (event) => {
      const language =
        event?.detail ||
        localStorage.getItem("isp-language") ||
        "en";

      setSelectedLanguage(language);
    };

    window.addEventListener(
      "isp-language-changed",
      syncLanguage
    );

    window.addEventListener(
      "storage",
      syncLanguage
    );

    return () => {
      window.removeEventListener(
        "isp-language-changed",
        syncLanguage
      );

      window.removeEventListener(
        "storage",
        syncLanguage
      );
    };
  }, []);
  const [assets] = useJsonCollection("assets");
  const [suppliers] = useJsonCollection("suppliers");
  const [supplierPurchases] = useJsonCollection("supplierPurchases");
  const [customers] = useJsonCollection("customers");
  const [towerAssets] = useJsonCollection("towerAssets");
  const [deviceTransfers] = useJsonCollection("deviceTransfers");
  const [assetMovements] = useJsonCollection("assetMovements");
  const [securityDeposits] = useJsonCollection("securityDeposits");

  useEffect(() => {
    const handleOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setOpenSearch(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const searchResults = useMemo(() => {
    const keyword = query.trim();
    if (keyword.length < 2) return [];

    const supplierByName = new Map(
      suppliers.map((supplier) => [normalize(supplier.supplierName || supplier.companyName), supplier])
    );

    const assetResults = assets
      .map((asset) => {
        const units = Array.isArray(asset.identityRecords) ? asset.identityRecords : [];
        const matchedUnit = units.find(
          (unit) =>
            includesQuery(unit.macAddress, keyword) ||
            includesQuery(unit.serialNumber, keyword) ||
            includesQuery(unit.model, keyword)
        );

        const matchesAsset =
          includesQuery(asset.assetId, keyword) ||
          includesQuery(asset.deviceName, keyword) ||
          includesQuery(asset.macAddress, keyword) ||
          includesQuery(asset.serialNumber, keyword) ||
          includesQuery(asset.model, keyword) ||
          Boolean(matchedUnit);

        if (!matchesAsset) return null;

        const assetKey = asset.assetId || asset.id;
        const relatedTransfers = deviceTransfers
          .filter((transfer) => String(transfer.assetId || "") === String(assetKey))
          .sort((a, b) => new Date(b.createdAt || b.createdDate || b.transferDate || 0) - new Date(a.createdAt || a.createdDate || a.transferDate || 0));
        const latestTransfer = relatedTransfers[0];
        const relatedMovements = assetMovements.filter((movement) => String(movement.assetId || movement.deviceId || "") === String(assetKey));
        const purchaseRecord =
          [...relatedMovements].reverse().find((movement) => /purchase/i.test(movement.movement || movement.type || "")) ||
          supplierPurchases.find((purchase) => String(purchase.assetId || purchase.deviceId || "") === String(assetKey));
        const supplierName = asset.supplierName || purchaseRecord?.supplierName || purchaseRecord?.supplier || "-";
        const supplier = supplierByName.get(normalize(supplierName));
        const relatedDeposits = securityDeposits.filter(
          (deposit) =>
            String(deposit.assetId || deposit.deviceId || "") === String(assetKey) ||
            String(deposit.unitRecordId || "") === String(matchedUnit?.id || "")
        );
        const currentCustomer = latestTransfer?.destinationType === "Customer"
          ? latestTransfer.destinationLocation
          : latestTransfer?.sourceType === "Customer"
            ? latestTransfer.sourceLocation
            : matchedUnit?.customerName || "-";
        const currentTower = latestTransfer?.destinationType === "Tower"
          ? latestTransfer.destinationLocation
          : latestTransfer?.sourceType === "Tower"
            ? latestTransfer.sourceLocation
            : matchedUnit?.towerName || "-";
        const repairCount = relatedMovements.filter((movement) => /repair/i.test(`${movement.movement} ${movement.type} ${movement.destination}`)).length;
        const damageCount = relatedMovements.filter((movement) => /damage|damaged|lost/i.test(`${movement.movement} ${movement.type} ${movement.status} ${movement.destination}`)).length;

        return {
          type: "Asset",
          key: `asset-${assetKey}-${matchedUnit?.id || "main"}`,
          title: `${asset.assetId || "-"} - ${asset.deviceName || asset.name || "Asset"}`,
          subtitle: [matchedUnit?.macAddress || asset.macAddress, matchedUnit?.serialNumber || asset.serialNumber]
            .filter(Boolean)
            .join(" / ") || "Asset record",
          path: `/assets/${asset.id || asset.assetId}/details`,
          details: [
            `Supplier: ${supplier?.supplierName || supplierName}`,
            `Purchase Date: ${asset.purchaseDate || purchaseRecord?.purchaseDate || purchaseRecord?.date || "-"}`,
            `Purchase Price: ${money(asset.unitPrice || purchaseRecord?.unitPrice || purchaseRecord?.totalPurchaseValue)} AFN`,
            `Current Location: ${formatLocationName(matchedUnit || latestTransfer || asset)}`,
            `Current Status: ${matchedUnit?.status || asset.status || latestTransfer?.newStatus || "-"}`,
            `Current Customer: ${currentCustomer}`,
            `Current Tower: ${currentTower}`,
            `Transfers: ${relatedTransfers.length}`,
            `Repairs: ${repairCount}`,
            `Damaged / Lost History: ${damageCount}`,
            `Deposit: ${money(relatedDeposits.reduce((sum, item) => sum + Number(item.amount || item.depositAmount || 0), 0))} AFN`,
            `Last Responsible: ${latestTransfer?.responsibleUser || "-"}`
          ],
        };
      })
      .filter(Boolean);

    const customerResults = customers
      .filter((customer) => includesQuery(customer.customerName, keyword) || includesQuery(customer.customerId, keyword) || includesQuery(customer.phone, keyword))
      .map((customer) => ({
        type: "Customer",
        key: `customer-${itemId(customer)}`,
        title: `${customer.customerId || "-"} - ${customer.customerName || "Customer"}`,
        subtitle: customer.phone || customer.address || "Customer record",
        path: "/customers/consultants",
        details: [
          `Status: ${customer.status || "-"}`,
          `Current Devices: ${deviceTransfers.filter((transfer) => String(transfer.destinationRecordId || "") === String(customer.id) && transfer.destinationType === "Customer").length}`,
          `Deposits: ${money(securityDeposits.filter((deposit) => String(deposit.customerId || deposit.customerRecordId || "") === String(customer.id)).reduce((sum, item) => sum + Number(item.amount || item.depositAmount || 0), 0))} AFN`,
        ],
      }));

    const towerResults = towerAssets
      .filter((tower) => includesQuery(tower.towerName, keyword) || includesQuery(tower.towerLocation, keyword))
      .map((tower) => ({
        type: "Tower",
        key: `tower-${itemId(tower)}`,
        title: tower.towerName || "Tower",
        subtitle: tower.towerLocation || "Tower record",
        path: `/tower-assets/${tower.id}/details`,
        details: [
          `Status: ${tower.installationStatus || "-"}`,
          `Assets: ${deviceTransfers.filter((transfer) => String(transfer.destinationRecordId || "") === String(tower.id) && transfer.destinationType === "Tower").length}`,
          `Installation Cost: ${money(tower.installationCost)} AFN`,
        ],
      }));

    const supplierResults = suppliers
      .map((supplier, index) => ({ ...supplier, searchIndex: index }))
      .filter((supplier) => includesQuery(supplier.supplierName, keyword) || includesQuery(supplier.companyName, keyword) || includesQuery(supplier.phone, keyword))
      .map((supplier) => ({
        type: "Supplier",
        key: `supplier-${itemId(supplier)}`,
        title: supplier.supplierName || supplier.companyName || "Supplier",
        subtitle: supplier.companyName || supplier.phone || "Supplier record",
        path: `/suppliers/${supplier.searchIndex}`,
        details: [
          `Status: ${supplier.status || "-"}`,
          `Purchases: ${supplierPurchases.filter((purchase) => normalize(purchase.supplierName || purchase.supplier) === normalize(supplier.supplierName)).length}`,
          `Phone: ${supplier.phone || "-"}`,
        ],
      }));

    const allResults = [...assetResults, ...customerResults, ...towerResults, ...supplierResults];
    const filteredResults =
      resultFilter === "All"
        ? allResults
        : allResults.filter((result) => result.type === resultFilter);

    return filteredResults.slice(0, 12);
  }, [assetMovements, assets, customers, deviceTransfers, query, resultFilter, securityDeposits, supplierPurchases, suppliers, towerAssets]);

  const openResult = (path) => {
    setOpenSearch(false);
    setQuery("");
    navigate(path);
  };

  return (
    <header className="topbar">
      <div className="header-search global-search" ref={searchRef}>
        <Search size={17} />
       <input
  placeholder={
    selectedLanguage === "dr"
      ? "جستجوی نام مشتری، پروژه، پرداخت، تأمین‌کننده..."
      : selectedLanguage === "ps"
        ? "د پېرودونکي نوم، پروژه، تادیه او عرضه کوونکی ولټوئ..."
        : "Search Customer Name, Project, Payment, Supplier..."
  }
  aria-label={
    selectedLanguage === "dr"
      ? "جستجوی مشتریان، پروژه‌ها، پرداخت‌ها و تأمین‌کنندگان"
      : selectedLanguage === "ps"
        ? "پېرودونکي، پروژې، تادیات او عرضه کوونکي ولټوئ"
        : "Search customers, projects, payments and suppliers"
  }
  value={query}
  onChange={(event) => {
    setQuery(event.target.value);
    setOpenSearch(true);
  }}
  onFocus={() => setOpenSearch(true)}
/>

        {openSearch && query.trim().length >= 2 && (
          <div className="global-search-results">
            <div className="global-search-results-header">
             <strong>
  {selectedLanguage === "dr"
    ? "جستجوی سیستم"
    : selectedLanguage === "ps"
      ? "د سیسټم لټون"
      : "System Search"}
</strong>

<span>
  {searchResults.length}{" "}
  {selectedLanguage === "dr"
    ? "نتیجه"
    : selectedLanguage === "ps"
      ? "پایله"
      : "result(s)"}
</span>
            </div>

         

            {searchResults.map((result) => (
              <button
                type="button"
                key={result.key}
                className="global-search-result"
                onClick={() => openResult(result.path)}
              >
                <span>{result.type}</span>
                <strong>{result.title}</strong>
                <em>{result.subtitle}</em>
                <div>
                  {result.details.slice(0, 6).map((detail) => (
                    <small key={detail}>{detail}</small>
                  ))}
                </div>
              </button>
            ))}

            {!searchResults.length && (
              <div className="global-search-empty">
  No matching record found. Try a customer name, project,
  payment, phone number, or supplier name.
</div>
            )}
          </div>
        )}
      </div>

      <HeaderActions currentUser={currentUser} onLogout={onLogout} />
    </header>
  );
}

Header.Actions = HeaderActions;

export default Header;
