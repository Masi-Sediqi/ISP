import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Banknote,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  Gift,
  MessageSquare,
  Pencil,
  Sparkles,
  Trash2,
  UserRound,
  UserRoundPlus,
  Users,
  X,
  XCircle,
} from "lucide-react";

import { useJsonCollection } from "../hooks/useJsonCollection";
import { useEmployeeAdjustments } from "../hooks/useEmployeeAdjustments";
import { createRecordId } from "../utils/ids";
import { notify } from "../utils/notify";
import "./MyAccount.css";

const normalize = (value) =>
  String(value || "").trim().toLowerCase();

const recordDomId = (prefix, id) =>
  `${prefix}-${String(id || "")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .slice(0, 80)}`;

const parseRecordHash = (hash) => {
  const clean = decodeURIComponent(
    String(hash || "").replace(/^#/, "")
  );
  const [type, ...rest] = clean.split(":");
  const id = rest.join(":");

  return {
    type,
    id,
  };
};

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

function getAfghanistanDateTime() {
  const now = new Date();

  const formatter = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Kabul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }
  );

  const parts = Object.fromEntries(
    formatter
      .formatToParts(now)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  const date =
    `${parts.year}-${parts.month}-${parts.day}`;

  const time =
    `${parts.hour}:${parts.minute}:${parts.second}`;

  return {
    date,
    time,
    dateTime: `${date}T${time}+04:30`,
    iso: now.toISOString(),
  };
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
  const location = useLocation();

  const [interfaceLanguage, setInterfaceLanguage] =
    useState(
      () => localStorage.getItem("isp-language") || "en"
    );

  useEffect(() => {
    const syncInterfaceLanguage = (event) => {
      const nextLanguage =
        event?.detail ||
        localStorage.getItem("isp-language") ||
        "en";

      setInterfaceLanguage(nextLanguage);
    };

    window.addEventListener(
      "isp-language-changed",
      syncInterfaceLanguage
    );

    window.addEventListener(
      "storage",
      syncInterfaceLanguage
    );

    return () => {
      window.removeEventListener(
        "isp-language-changed",
        syncInterfaceLanguage
      );

      window.removeEventListener(
        "storage",
        syncInterfaceLanguage
      );
    };
  }, []);

  const tx = (en, dr, ps) =>
    interfaceLanguage === "dr"
      ? dr
      : interfaceLanguage === "ps"
        ? ps
        : en;

  const ledgerTypeLabel = (type) => {
    const labels = {
      bonus: tx("Bonus", "\u0627\u0645\u062a\u06cc\u0627\u0632", "\u0627\u0645\u062a\u06cc\u0627\u0632"),
      penalty: tx("Penalty", "\u062c\u0631\u06cc\u0645\u0647", "\u062c\u0631\u06cc\u0645\u0647"),
      salary: tx("Payment", "\u067e\u0631\u062f\u0627\u062e\u062a", "\u062a\u0627\u062f\u06cc\u0647"),
      credit: tx("Credit", "\u06a9\u0631\u06cc\u062f\u062a", "\u06a9\u0631\u06cc\u0689\u06cc\u067c"),
      debit: tx("Debit", "\u062f\u06cc\u0628\u062a", "\u0689\u06cc\u0628\u06cc\u067c"),
    };

    return labels[type] || formatValue(type);
  };

  const statusLabel = (status) => {
    const key = normalize(status);
    const labels = {
      pending: tx("Pending", "\u062f\u0631 \u0627\u0646\u062a\u0638\u0627\u0631", "\u067e\u0647 \u062a\u0645\u0647"),
      accepted: tx("Accepted", "\u0642\u0628\u0648\u0644 \u0634\u062f\u0647", "\u0645\u0646\u0644 \u0634\u0648\u06cc"),
      rejected: tx("Rejected", "\u0631\u062f \u0634\u062f\u0647", "\u0631\u062f \u0634\u0648\u06cc"),
      referred: tx("Referred", "\u0631\u0627\u062c\u0639 \u0634\u062f\u0647", "\u0631\u0627\u062c\u0639 \u0634\u0648\u06cc"),
    };

    return labels[key] || formatValue(status);
  };

  const customerTypeLabel = (type) => {
    const labels = {
      consultant: tx("Consultant", "\u0645\u0634\u0627\u0648\u0631", "\u0645\u0634\u0627\u0648\u0631"),
      travel: tx("Travel", "\u0633\u0641\u0631", "\u0633\u0641\u0631"),
      technology: tx("Technology", "\u062a\u06a9\u0646\u0627\u0644\u0648\u0698\u06cc", "\u067c\u06a9\u0646\u0627\u0644\u0648\u0698\u064a"),
      media: tx("Media Production", "\u062a\u0648\u0644\u06cc\u062f \u0631\u0633\u0627\u0646\u0647", "\u062f \u0631\u0633\u0646\u06cc\u0648 \u062a\u0648\u0644\u06cc\u062f"),
    };

    return labels[normalize(type)] || formatValue(type);
  };

  const yesNoLabel = (value) => {
    const key = normalize(value);
    if (value === true || key === "yes") {
      return tx("Yes", "\u0628\u0644\u06cc", "\u0647\u0648");
    }

    if (value === false || key === "no") {
      return tx("No", "\u0646\u062e\u06cc\u0631", "\u0646\u0647");
    }

    return formatValue(value);
  };

  const callTypeLabel = (value) => {
    const labels = {
      incoming: tx("Incoming", "\u0648\u0627\u0631\u062f\u0647", "\u0631\u0627\u062a\u0644\u0648\u0646\u06a9\u06cc"),
      outgoing: tx("Outgoing", "\u062e\u0627\u0631\u062c\u0647", "\u062a\u0644\u0648\u0646\u06a9\u06cc"),
    };

    return labels[normalize(value)] || formatValue(value);
  };

  const detailLabel = (label) => {
    const labels = {
      "Customer Name": tx("Customer Name", "\u0646\u0627\u0645 \u0645\u0634\u062a\u0631\u06cc", "\u062f \u067e\u06d0\u0631\u0648\u062f\u0648\u0646\u06a9\u064a \u0646\u0648\u0645"),
      "Phone Number": tx("Phone Number", "\u0646\u0645\u0628\u0631 \u062a\u0645\u0627\u0633", "\u062f \u062a\u0644\u06cc\u0641\u0648\u0646 \u0634\u0645\u06d0\u0631\u0647"),
      Email: tx("Email", "\u0627\u06cc\u0645\u06cc\u0644", "\u0628\u0631\u06cc\u069a\u0646\u0627\u0644\u06cc\u06a9"),
      "Customer Type": tx("Customer Type", "\u0646\u0648\u0639 \u0645\u0634\u062a\u0631\u06cc", "\u062f \u067e\u06d0\u0631\u0648\u062f\u0648\u0646\u06a9\u064a \u0689\u0648\u0644"),
      Source: tx("Source", "\u0645\u0646\u0628\u0639", "\u0633\u0631\u0686\u06cc\u0646\u0647"),
      "Assigned To": tx("Assigned To", "\u0631\u0627\u062c\u0639 \u0628\u0647", "\u0648\u0631\u062a\u0647 \u0633\u067e\u0627\u0631\u0644 \u0634\u0648\u06cc"),
      "Assigned By": tx("Assigned By", "\u0631\u0627\u062c\u0639 \u0634\u062f\u0647 \u062a\u0648\u0633\u0637", "\u0644\u062e\u0648\u0627 \u0633\u067e\u0627\u0631\u0644 \u0634\u0648\u06cc"),
      "Assigned Date": tx("Assigned Date", "\u062a\u0627\u0631\u06cc\u062e \u0631\u0627\u062c\u0639", "\u062f \u0633\u067e\u0627\u0631\u0644\u0648 \u0646\u06d0\u067c\u0647"),
      "Registration Date": tx("Registration Date", "\u062a\u0627\u0631\u06cc\u062e \u062b\u0628\u062a", "\u062f \u062b\u0628\u062a \u0646\u06d0\u067c\u0647"),
      Status: tx("Status", "\u062d\u0627\u0644\u062a", "\u062d\u0627\u0644\u062a"),
      Purpose: tx("Purpose", "\u0647\u062f\u0641", "\u0645\u0648\u062e\u0647"),
      "City / Province": tx("City / Province", "\u0634\u0647\u0631 / \u0648\u0644\u0627\u06cc\u062a", "\u069a\u0627\u0631 / \u0648\u0644\u0627\u06cc\u062a"),
      Language: tx("Language", "\u0632\u0628\u0627\u0646", "\u0698\u0628\u0647"),
      "Call Type": tx("Call Type", "\u0646\u0648\u0639 \u062a\u0645\u0627\u0633", "\u062f \u0632\u0646\u06ab \u0689\u0648\u0644"),
      Note: tx("Note", "\u06cc\u0627\u062f\u062f\u0627\u0634\u062a", "\u06cc\u0627\u062f\u069a\u062a"),
      "Last Message": tx("Last Message", "\u0622\u062e\u0631\u06cc\u0646 \u067e\u06cc\u0627\u0645", "\u0648\u0631\u0648\u0633\u062a\u06cc \u067e\u06cc\u063a\u0627\u0645"),
      Country: tx("Country", "\u06a9\u0634\u0648\u0631", "\u0647\u06d0\u0648\u0627\u062f"),
      "Destination Country": tx("Destination Country", "\u06a9\u0634\u0648\u0631 \u0645\u0642\u0635\u062f", "\u062f \u0645\u0646\u0632\u0644 \u0647\u06d0\u0648\u0627\u062f"),
      "Educational Level": tx("Educational Level", "\u0633\u0637\u062d \u062a\u062d\u0635\u06cc\u0644\u06cc", "\u062f \u0632\u062f\u0647 \u06a9\u0693\u0648 \u06a9\u0686\u0647"),
      "School / University": tx("School / University", "\u0645\u06a9\u062a\u0628 / \u067e\u0648\u0647\u0646\u062a\u0648\u0646", "\u069a\u0648\u0648\u0646\u069a\u06cc / \u067e\u0648\u0647\u0646\u062a\u0648\u0646"),
      "Scholarship Type": tx("Scholarship Type", "\u0646\u0648\u0639 \u0628\u0648\u0631\u0633\u06cc\u0647", "\u062f \u0628\u0648\u0631\u0633 \u0689\u0648\u0644"),
      "Passport Number": tx("Passport Number", "\u0646\u0645\u0628\u0631 \u067e\u0627\u0633\u067e\u0648\u0631\u062a", "\u062f \u067e\u0627\u0633\u067e\u0648\u0631\u067c \u0634\u0645\u06d0\u0631\u0647"),
      "Marital Status": tx("Marital Status", "\u062d\u0627\u0644\u062a \u0645\u062f\u0646\u06cc", "\u0645\u062f\u0646\u064a \u062d\u0627\u0644\u062a"),
      "Graduated Major": tx("Graduated Major", "\u0631\u0634\u062a\u0647 \u0641\u0631\u0627\u063a\u062a", "\u062f \u0641\u0631\u0627\u063a\u062a \u0685\u0627\u0646\u06ab\u0647"),
      "Graduation Percentage": tx("Graduation Percentage", "\u0641\u06cc\u0635\u062f\u06cc \u0641\u0631\u0627\u063a\u062a", "\u062f \u0641\u0631\u0627\u063a\u062a \u0633\u0644\u0646\u0647"),
      "Graduation Year": tx("Graduation Year", "\u0633\u0627\u0644 \u0641\u0631\u0627\u063a\u062a", "\u062f \u0641\u0631\u0627\u063a\u062a \u06a9\u0627\u0644"),
      "Desired Major": tx("Desired Major", "\u0631\u0634\u062a\u0647 \u0645\u0648\u0631\u062f \u0646\u0638\u0631", "\u063a\u0648\u069a\u062a\u0644 \u0634\u0648\u06d0 \u0685\u0627\u0646\u06ab\u0647"),
      Intake: tx("Intake", "\u062f\u0648\u0631\u0647 \u0634\u0645\u0648\u0644\u06cc\u062a", "\u062f \u0634\u0645\u0648\u0644\u06cc\u062a \u062f\u0648\u0631\u0647"),
      "Bank Statement Owner": tx("Bank Statement Owner", "\u0645\u0627\u0644\u06a9 \u0627\u0633\u062a\u06cc\u062a\u0645\u0646\u062a \u0628\u0627\u0646\u06a9", "\u062f \u0628\u0627\u0646\u06a9 \u0627\u0633\u067c\u06cc\u067c\u0645\u0646\u067c \u0645\u0627\u0644\u06a9"),
      "Bank Statement Amount": tx("Bank Statement Amount", "\u0645\u0628\u0644\u063a \u0627\u0633\u062a\u06cc\u062a\u0645\u0646\u062a \u0628\u0627\u0646\u06a9", "\u062f \u0628\u0627\u0646\u06a9 \u0627\u0633\u067c\u06cc\u067c\u0645\u0646\u067c \u0645\u0628\u0644\u063a"),
      "Currency Unit": tx("Currency Unit", "\u0648\u0627\u062d\u062f \u067e\u0648\u0644", "\u062f \u067e\u06cc\u0633\u0648 \u0648\u0627\u062d\u062f"),
      "Total Amount": tx("Total Amount", "\u0645\u062c\u0645\u0648\u0639 \u0645\u0628\u0644\u063a", "\u067c\u0648\u0644 \u0645\u0628\u0644\u063a"),
      "Paid Amount": tx("Paid Amount", "\u0645\u0628\u0644\u063a \u067e\u0631\u062f\u0627\u062e\u062a\u200c\u0634\u062f\u0647", "\u062a\u0627\u062f\u06cc\u0647 \u0634\u0648\u06cc \u0645\u0628\u0644\u063a"),
      "Remaining Amount": tx("Remaining Amount", "\u0645\u0628\u0644\u063a \u0628\u0627\u0642\u06cc \u0645\u0627\u0646\u062f\u0647", "\u067e\u0627\u062a\u06d0 \u0645\u0628\u0644\u063a"),
      "Guarantee Type": tx("Guarantee Type", "\u0646\u0648\u0639 \u0636\u0645\u0627\u0646\u062a", "\u062f \u0636\u0645\u0627\u0646\u062a \u0689\u0648\u0644"),
      "Visa Type": tx("Visa Type", "\u0646\u0648\u0639 \u0648\u06cc\u0632\u0647", "\u062f \u0648\u06cc\u0632\u06d0 \u0689\u0648\u0644"),
      "Business Type": tx("Business Type", "\u0646\u0648\u0639 \u062a\u062c\u0627\u0631\u062a", "\u062f \u0633\u0648\u062f\u0627\u06ab\u0631\u06cd \u0689\u0648\u0644"),
      "Technology Purpose": tx("Technology Purpose", "\u0647\u062f\u0641 \u062a\u06a9\u0646\u0627\u0644\u0648\u0698\u06cc", "\u062f \u067c\u06a9\u0646\u0627\u0644\u0648\u0698\u06cd \u0645\u0648\u062e\u0647"),
      Project: tx("Project", "\u067e\u0631\u0648\u0698\u0647", "\u067e\u0631\u0648\u0698\u0647"),
      "Project Amount": tx("Project Amount", "\u0645\u0628\u0644\u063a \u067e\u0631\u0648\u0698\u0647", "\u062f \u067e\u0631\u0648\u0698\u06d0 \u0645\u0628\u0644\u063a"),
      "Brand Name": tx("Brand Name", "\u0646\u0627\u0645 \u0628\u0631\u0646\u062f", "\u062f \u0628\u0631\u0646\u0689 \u0646\u0648\u0645"),
      "Media Purpose": tx("Media Purpose", "\u0647\u062f\u0641 \u0631\u0633\u0627\u0646\u0647", "\u062f \u0631\u0633\u0646\u06cc\u0648 \u0645\u0648\u062e\u0647"),
      "Custom Purpose": tx("Custom Purpose", "\u0647\u062f\u0641 \u062f\u0644\u062e\u0648\u0627\u0647", "\u062e\u067e\u0644\u0647 \u0645\u0648\u062e\u0647"),
    };

    return labels[label] || label;
  };

  const isLedgerCredit = (entry) =>
    ["bonus", "salary", "credit"].includes(
      String(entry?.type || "")
    );

  const isFollowUpComplete = (customer) =>
    customer?.followUpCompleted === true ||
    normalize(customer?.followUpWorkflowStatus) === "completed" ||
    Boolean(customer?.followUp?.completedAt);
  const [
    customers,
    setCustomers,
    loadCustomers,
    customersLoaded,
  ] = useJsonCollection("customers");

  const [
    employeeReports,
    setEmployeeReports,
    loadEmployeeReports,
    reportsLoaded,
  ] = useJsonCollection("employeeReports");

  const [
    employeeAdjustments,
    ,
    loadEmployeeAdjustments,
    adjustmentsLoaded,
  ] = useEmployeeAdjustments();

  const [employees] =
    useJsonCollection("employees");

  const [selectedCustomer, setSelectedCustomer] =
    useState(null);

  const [activeAccountTab, setActiveAccountTab] =
    useState("customers");

  const [highlightedTarget, setHighlightedTarget] =
    useState(null);

  const [messageOpen, setMessageOpen] =
    useState(false);

  const [messageText, setMessageText] =
    useState("");

  const [savingAction, setSavingAction] =
    useState(false);

  const [reportText, setReportText] =
    useState("");

  const [editingReportId, setEditingReportId] =
    useState(null);

  const [savingReport, setSavingReport] =
    useState(false);

  const [reportModalOpen, setReportModalOpen] =
    useState(false);

  const [reassignOpen, setReassignOpen] =
    useState(false);

  const [reassignEmployeeId, setReassignEmployeeId] =
    useState("");

  const [reassignNote, setReassignNote] =
    useState("");

  const customerRefreshRunningRef =
    useRef(false);

  const reportRefreshRunningRef =
    useRef(false);

  const ledgerRefreshRunningRef =
    useRef(false);

  const fullName =
    employee?.fullName ||
    currentUser?.fullName ||
    currentUser?.username ||
    "Employee";

  const currentUserRoles = [
    currentUser?.role,
    currentUser?.primaryRole,
    ...(Array.isArray(currentUser?.roles)
      ? currentUser.roles
      : []),
  ]
    .filter(Boolean)
    .map(normalize);

  const isCurrentUserAdmin =
    currentUser?.isDefaultAdmin === true ||
    currentUser?.isAdmin === true ||
    currentUser?.isFullAdmin === true ||
    currentUser?.permissions?.all === true ||
    currentUser?.accountType === "admin" ||
    currentUserRoles.some((role) =>
      [
        "admin",
        "full admin",
        "administrator",
      ].includes(role)
    );

  const email =
    employee?.email ||
    currentUser?.email ||
    "No email configured";

  const image =
    employee?.image ||
    currentUser?.image ||
    "";

  const reportEmployeeId =
    employee?.id ||
    currentUser?.employeeId ||
    currentUser?.id ||
    "";

  const reportAccountId =
    currentUser?.id || "";

  const ledgerEmployeeId =
    employee?.id ||
    currentUser?.employeeId ||
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

  useEffect(() => {
    if (!reportsLoaded) {
      return undefined;
    }

    const refreshReports = async () => {
      if (reportRefreshRunningRef.current) {
        return;
      }

      reportRefreshRunningRef.current = true;

      try {
        await loadEmployeeReports();
      } finally {
        reportRefreshRunningRef.current = false;
      }
    };

    const refreshImmediately = () => {
      refreshReports();
    };

    window.addEventListener(
      "isp-employee-report-updated",
      refreshImmediately
    );

    window.addEventListener(
      "storage",
      refreshImmediately
    );

    return () => {
      window.removeEventListener(
        "isp-employee-report-updated",
        refreshImmediately
      );

      window.removeEventListener(
        "storage",
        refreshImmediately
      );
    };
  }, [
    reportsLoaded,
    loadEmployeeReports,
  ]);

  useEffect(() => {
    if (!adjustmentsLoaded) {
      return undefined;
    }

    const refreshLedger = async () => {
      if (ledgerRefreshRunningRef.current) {
        return;
      }

      ledgerRefreshRunningRef.current = true;

      try {
        await loadEmployeeAdjustments();
      } finally {
        ledgerRefreshRunningRef.current = false;
      }
    };

    const intervalId = window.setInterval(
      refreshLedger,
      1500
    );

    const refreshImmediately = () => {
      refreshLedger();
    };

    window.addEventListener(
      "isp-employee-ledger-updated",
      refreshImmediately
    );

    window.addEventListener(
      "storage",
      refreshImmediately
    );

    return () => {
      window.clearInterval(intervalId);

      window.removeEventListener(
        "isp-employee-ledger-updated",
        refreshImmediately
      );

      window.removeEventListener(
        "storage",
        refreshImmediately
      );
    };
  }, [
    adjustmentsLoaded,
    loadEmployeeAdjustments,
  ]);

  const accountIds = useMemo(
    () =>
      [
        currentUser?.id,
        currentUser?.employeeId,
        currentUser?.accountId,
        employee?.id,
        employee?.employeeId,
        employee?.accountId,
      ]
        .filter(Boolean)
        .map(String),
    [
      currentUser?.id,
      currentUser?.employeeId,
      currentUser?.accountId,
      employee?.id,
      employee?.employeeId,
      employee?.accountId,
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
        employee?.username,
      ]
        .filter(Boolean)
        .map(normalize),
    [
      currentUser?.fullName,
      currentUser?.username,
      currentUser?.email,
      employee?.fullName,
      employee?.email,
      employee?.username,
    ]
  );

  const accountEmails = useMemo(
    () =>
      [
        currentUser?.email,
        employee?.email,
      ]
        .filter(Boolean)
        .map(normalize),
    [
      currentUser?.email,
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

  const myReports = useMemo(
    () =>
      employeeReports
        .filter((report) => {
          const reportIds = [
            report.employeeId,
            report.accountId,
          ]
            .filter(Boolean)
            .map(String);

          return (
            reportIds.includes(
              String(reportEmployeeId)
            ) ||
            reportIds.includes(
              String(reportAccountId)
            )
          );
        })
        .sort(
          (first, second) =>
            new Date(second.createdAt || 0) -
            new Date(first.createdAt || 0)
        ),
    [
      employeeReports,
      reportEmployeeId,
      reportAccountId,
    ]
  );

  const editingReport = useMemo(
    () =>
      myReports.find(
        (report) =>
          String(report.id) ===
          String(editingReportId)
      ) || null,
    [myReports, editingReportId]
  );

  const lastReport = myReports[0] || null;

  const myLedgerEntries = useMemo(
    () =>
      employeeAdjustments
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
            (ledgerEmployeeId &&
              entryIds.includes(
                String(ledgerEmployeeId)
              )) ||
            entryIds.some((entryId) =>
              accountIds.includes(entryId)
            ) ||
            entryNames.some((entryName) =>
              accountNames.includes(entryName)
            ) ||
            entryEmails.some((entryEmail) =>
              accountEmails.includes(entryEmail)
            )
          );
        })
        .sort(
          (first, second) =>
            new Date(second.createdAt || 0) -
            new Date(first.createdAt || 0)
        ),
    [
      employeeAdjustments,
      ledgerEmployeeId,
      accountIds,
      accountNames,
      accountEmails,
    ]
  );

  const ledgerBonus = myLedgerEntries
    .filter((entry) => entry.type === "bonus")
    .reduce(
      (sum, entry) =>
        sum + Number(entry.amount || 0),
      0
    );

  const ledgerPenalty = myLedgerEntries
    .filter((entry) => entry.type === "penalty")
    .reduce(
      (sum, entry) =>
        sum + Number(entry.amount || 0),
      0
    );

  const ledgerPayment = myLedgerEntries
    .filter((entry) => entry.type === "salary")
    .reduce(
      (sum, entry) =>
        sum + Number(entry.amount || 0),
      0
    );

  const ledgerCredit = myLedgerEntries
    .filter((entry) => entry.type === "credit")
    .reduce(
      (sum, entry) =>
        sum + Number(entry.amount || 0),
      0
    );

  const ledgerDebit = myLedgerEntries
    .filter((entry) => entry.type === "debit")
    .reduce(
      (sum, entry) =>
        sum + Number(entry.amount || 0),
      0
    );

  const ledgerRemaining =
    ledgerPayment +
    ledgerBonus +
    ledgerCredit -
    ledgerPenalty -
    ledgerDebit;

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

  useEffect(() => {
    const target = parseRecordHash(location.hash);

    if (!target.type || !target.id) {
      setHighlightedTarget(null);
      return;
    }

    setHighlightedTarget(target);

    if (target.type === "customer") {
      setActiveAccountTab("customers");

      const customer = myCustomers.find(
        (item) =>
          String(item.id || item.customerId) ===
          String(target.id)
      );

      if (customer) {
        setSelectedCustomer(customer);
      }
    }

    if (target.type === "ledger") {
      setActiveAccountTab("ledger");
    }

    if (target.type === "reports") {
      setActiveAccountTab("reports");
    }

    window.setTimeout(() => {
      const element = document.getElementById(
        recordDomId(
          `my-account-${target.type}`,
          target.id
        )
      );

      element?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 120);
  }, [
    location.hash,
    myCustomers,
  ]);

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

            lastTransferredByIsAdmin:
              isCurrentUserAdmin,

            lastTransferredByRole:
              currentUser?.primaryRole ||
              currentUser?.role ||
              "",

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

                transferredByIsAdmin:
                  isCurrentUserAdmin,

                transferredByRole:
                  currentUser?.primaryRole ||
                  currentUser?.role ||
                  "",
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

  function openReportModal(report = null) {
    if (report) {
      setEditingReportId(report.id);
      setReportText(report.reportText || "");
    } else {
      setEditingReportId(null);
      setReportText("");
    }

    setReportModalOpen(true);
  }

  function editReport(report) {
    openReportModal(report);
  }

  async function deleteReport(report) {
    if (savingReport || !report?.id) return;

    const confirmed = window.confirm(
      tx(
        "Delete this report? It will move to Recycle Bin.",
        "\u0622\u06cc\u0627 \u0645\u06cc\u200c\u062e\u0648\u0627\u0647\u06cc\u062f \u0627\u06cc\u0646 \u0631\u0627\u067e\u0648\u0631 \u062d\u0630\u0641 \u0634\u0648\u062f\u061f \u0627\u06cc\u0646 \u0631\u0627\u067e\u0648\u0631 \u0628\u0647 \u0632\u0628\u0627\u0644\u0647\u200c\u062f\u0627\u0646 \u0645\u0646\u062a\u0642\u0644 \u0645\u06cc\u200c\u0634\u0648\u062f.",
        "\u0627\u06cc\u0627 \u063a\u0648\u0627\u0693\u0626 \u062f\u0627 \u0631\u0627\u067e\u0648\u0631 \u062d\u0630\u0641 \u06a9\u0693\u0626\u061f \u0631\u0627\u067e\u0648\u0631 \u0628\u0647 \u062f \u0632\u0628\u0627\u0644\u0647 \u062f\u0627\u0646 \u0628\u0631\u062e\u06d0 \u062a\u0647 \u0648\u0644\u06d0\u0696\u062f\u0648\u0644 \u0634\u064a."
      )
    );

    if (!confirmed) return;

    setSavingReport(true);

    try {
      const latestReports = await loadEmployeeReports();
      const exists = latestReports.some(
        (item) => String(item.id) === String(report.id)
      );

      if (!exists) {
        notify(
          tx(
            "Selected report was not found.",
            "\u0631\u0627\u067e\u0648\u0631 \u0627\u0646\u062a\u062e\u0627\u0628\u200c\u0634\u062f\u0647 \u067e\u06cc\u062f\u0627 \u0646\u0634\u062f.",
            "\u067c\u0627\u06a9\u0644 \u0634\u0648\u06cc \u0631\u0627\u067e\u0648\u0631 \u0648\u0646\u0647 \u0645\u0648\u0646\u062f\u0644 \u0634\u0648."
          ),
          "error"
        );
        return;
      }

      const saved = await setEmployeeReports(
        latestReports.filter(
          (item) => String(item.id) !== String(report.id)
        )
      );

      if (!saved) return;

      window.dispatchEvent(
        new CustomEvent("isp-employee-report-updated", {
          detail: {
            reportId: report.id,
            employeeId: report.employeeId,
            deleted: true,
            updatedAt: new Date().toISOString(),
          },
        })
      );

      notify(
        tx(
          "Report moved to Recycle Bin.",
          "\u0631\u0627\u067e\u0648\u0631 \u0628\u0647 \u0632\u0628\u0627\u0644\u0647\u200c\u062f\u0627\u0646 \u0645\u0646\u062a\u0642\u0644 \u0634\u062f.",
          "\u0631\u0627\u067e\u0648\u0631 \u062f \u0632\u0628\u0627\u0644\u0647 \u062f\u0627\u0646 \u0628\u0631\u062e\u06d0 \u062a\u0647 \u0648\u0644\u06d0\u0696\u062f\u0648\u0644 \u0634\u0648."
        ),
        "success"
      );
    } finally {
      setSavingReport(false);
    }
  }

  function closeReportModal() {
    if (savingReport) return;

    setReportModalOpen(false);
    setEditingReportId(null);
    setReportText("");
  }

  function cancelReportEdit() {
    closeReportModal();
  }

  async function saveDailyReport(event) {
    event.preventDefault();

    const cleanReport = reportText.trim();

    if (!cleanReport) {
      notify(
        tx(
          "Please write your daily report.",
          "\u0644\u0637\u0641\u0627\u064b \u0631\u0627\u067e\u0648\u0631 \u0631\u0648\u0632\u0627\u0646\u0647 \u062e\u0648\u062f \u0631\u0627 \u0628\u0646\u0648\u06cc\u0633\u06cc\u062f.",
          "\u0645\u0647\u0631\u0628\u0627\u0646\u064a \u0648\u06a9\u0693\u0626 \u062e\u067e\u0644 \u0648\u0631\u0681\u0646\u06cc \u0631\u0627\u067e\u0648\u0631 \u0648\u0644\u06cc\u06a9\u0626."
        ),
        "error"
      );
      return;
    }

    if (savingReport) return;

    setSavingReport(true);

    try {
      const latestReports =
        await loadEmployeeReports();

      const now = getAfghanistanDateTime();

      const existingReport = editingReportId
        ? latestReports.find(
            (report) =>
              String(report.id) ===
              String(editingReportId)
          )
        : null;

      if (editingReportId && !existingReport) {
        notify(
          tx(
            "Selected report was not found.",
            "\u0631\u0627\u067e\u0648\u0631 \u0627\u0646\u062a\u062e\u0627\u0628\u200c\u0634\u062f\u0647 \u067e\u06cc\u062f\u0627 \u0646\u0634\u062f.",
            "\u067c\u0627\u06a9\u0644 \u0634\u0648\u06cc \u0631\u0627\u067e\u0648\u0631 \u0648\u0646\u0647 \u0645\u0648\u0646\u062f\u0644 \u0634\u0648."
          ),
          "error"
        );
        return;
      }

      const record = existingReport
        ? {
            ...existingReport,
            reportText: cleanReport,
            updatedAt: now.iso,
            updatedAfghanistanDate:
              now.date,
            updatedAfghanistanTime:
              now.time,
            updatedAfghanistanDateTime:
              now.dateTime,
          }
        : {
            id: createRecordId(),
            employeeId: reportEmployeeId,
            accountId: reportAccountId,
            employeeName: fullName,
            employeeEmail: email,
            reportText: cleanReport,
            date: now.date,
            time: now.time,
            afghanistanDate: now.date,
            afghanistanTime: now.time,
            afghanistanDateTime:
              now.dateTime,
            createdAt: now.iso,
            updatedAt: now.iso,
            adminNotificationType:
              "employee-report-submitted",
            adminNotificationAt: now.iso,
            adminNotificationSound: false,
          };

      const nextReports = existingReport
        ? latestReports.map((report) =>
            String(report.id) ===
            String(existingReport.id)
              ? record
              : report
          )
        : [...latestReports, record];

      const saved =
        await setEmployeeReports(
          nextReports
        );

      if (!saved) return;

      window.dispatchEvent(
        new CustomEvent(
          "isp-employee-report-updated",
          {
            detail: {
              reportId: record.id,
              employeeId: record.employeeId,
              updatedAt: record.updatedAt,
            },
          }
        )
      );

      notify(
        existingReport
          ? tx(
              "Daily report updated successfully.",
              "\u0631\u0627\u067e\u0648\u0631 \u0631\u0648\u0632\u0627\u0646\u0647 \u0628\u0627 \u0645\u0648\u0641\u0642\u06cc\u062a \u0648\u06cc\u0631\u0627\u06cc\u0634 \u0634\u062f.",
              "\u0648\u0631\u0681\u0646\u06cc \u0631\u0627\u067e\u0648\u0631 \u067e\u0647 \u0628\u0631\u06cc\u0627\u0644\u06cc\u062a\u0648\u0628 \u0633\u0645 \u0634\u0648."
            )
          : tx(
              "Daily report submitted successfully.",
              "\u0631\u0627\u067e\u0648\u0631 \u0631\u0648\u0632\u0627\u0646\u0647 \u0628\u0627 \u0645\u0648\u0641\u0642\u06cc\u062a \u062b\u0628\u062a \u0634\u062f.",
              "\u0648\u0631\u0681\u0646\u06cc \u0631\u0627\u067e\u0648\u0631 \u067e\u0647 \u0628\u0631\u06cc\u0627\u0644\u06cc\u062a\u0648\u0628 \u062b\u0628\u062a \u0634\u0648."
            ),
        "success"
      );

      setReportModalOpen(false);
      setEditingReportId(null);
      setReportText("");
    } finally {
      setSavingReport(false);
    }
  }

  return (
    <div className="my-account-page">
      <header className="my-account-heading">
        <div>
          <span>
            {tx(
              "Employee Workspace",
              "\u0641\u0636\u0627\u06cc \u06a9\u0627\u0631\u06cc \u06a9\u0627\u0631\u0645\u0646\u062f",
              "\u062f \u06a9\u0627\u0631\u06a9\u0648\u0648\u0646\u06a9\u064a \u06a9\u0627\u0631\u064a \u0633\u0627\u062d\u0647"
            )}
          </span>

          <h1>
            {tx(
              "My Account",
              "\u062d\u0633\u0627\u0628 \u0645\u0646",
              "\u0632\u0645\u0627 \u062d\u0633\u0627\u0628"
            )}
          </h1>

          <p>
            {tx(
              "View customer requests assigned to your account.",
              "\u062f\u0631\u062e\u0648\u0627\u0633\u062a\u200c\u0647\u0627\u06cc \u0645\u0634\u062a\u0631\u06cc\u0627\u0646 \u0631\u0627 \u06a9\u0647 \u0628\u0647 \u062d\u0633\u0627\u0628 \u0634\u0645\u0627 \u0631\u0627\u062c\u0639 \u0634\u062f\u0647 \u0645\u0634\u0627\u0647\u062f\u0647 \u06a9\u0646\u06cc\u062f.",
              "\u0647\u063a\u0647 \u062f \u067e\u06d0\u0631\u0648\u062f\u0648\u0646\u06a9\u0648 \u063a\u0648\u069a\u062a\u0646\u06d0 \u0648\u06ab\u0648\u0631\u0626 \u0686\u06d0 \u0633\u062a\u0627\u0633\u0648 \u062d\u0633\u0627\u0628 \u062a\u0647 \u0631\u0627\u062c\u0639 \u0634\u0648\u064a."
            )}
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

      <section className="my-account-ledger-panel my-account-tab-hidden">
        <div className="my-account-ledger-title">
          <span>
            {tx(
              "Employee Finance",
              "\u0645\u0627\u0644\u06cc \u06a9\u0627\u0631\u0645\u0646\u062f",
              "\u062f \u06a9\u0627\u0631\u06a9\u0648\u0648\u0646\u06a9\u064a \u0645\u0627\u0644\u064a"
            )}
          </span>

          <h2>
            {tx(
              "Your Ledger",
              "\u062d\u0633\u0627\u0628 \u0634\u0645\u0627",
              "\u0633\u062a\u0627\u0633\u0648 \u062d\u0633\u0627\u0628"
            )}
          </h2>
        </div>

        <div className="my-account-ledger-cards">
          <article className="bonus">
            <div>
              <Gift size={17} />
            </div>

            <span>
              {tx("Bonus", "\u0627\u0645\u062a\u06cc\u0627\u0632", "\u0627\u0645\u062a\u06cc\u0627\u0632")}
            </span>

            <strong>
              {ledgerBonus.toLocaleString("en-US")} AFN
            </strong>
          </article>

          <article className="penalty">
            <div>
              <XCircle size={17} />
            </div>

            <span>
              {tx("Penalty", "\u062c\u0631\u06cc\u0645\u0647", "\u062c\u0631\u06cc\u0645\u0647")}
            </span>

            <strong>
              {ledgerPenalty.toLocaleString("en-US")} AFN
            </strong>
          </article>

          <article className="payment">
            <div>
              <Banknote size={17} />
            </div>

            <span>
              {tx("Payment", "\u067e\u0631\u062f\u0627\u062e\u062a", "\u062a\u0627\u062f\u06cc\u0647")}
            </span>

            <strong>
              {ledgerPayment.toLocaleString("en-US")} AFN
            </strong>
          </article>

          <article className="remaining">
            <div>
              <Clock3 size={17} />
            </div>

            <span>
              {tx("Remaining", "\u0628\u0627\u0642\u06cc \u0645\u0627\u0646\u062f\u0647", "\u067e\u0627\u062a\u06d0")}
            </span>

            <strong>
              {ledgerRemaining.toLocaleString("en-US")} AFN
            </strong>
          </article>
        </div>
      </section>

      <nav
        className="my-account-tabs"
        aria-label={tx(
          "My account sections",
          "\u0628\u062e\u0634\u200c\u0647\u0627\u06cc \u062d\u0633\u0627\u0628 \u0645\u0646",
          "\u0632\u0645\u0627 \u062f \u062d\u0633\u0627\u0628 \u0628\u0631\u062e\u06d0"
        )}
      >
        <button
          type="button"
          className={
            activeAccountTab === "customers"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveAccountTab("customers")
          }
        >
          <Users size={16} />
          <span>
            {tx(
              "My Customer Requests",
              "\u062f\u0631\u062e\u0648\u0627\u0633\u062a\u200c\u0647\u0627\u06cc \u0645\u0634\u062a\u0631\u06cc\u0627\u0646 \u0645\u0646",
              "\u0632\u0645\u0627 \u062f \u067e\u06d0\u0631\u0648\u062f\u0648\u0646\u06a9\u0648 \u063a\u0648\u069a\u062a\u0646\u06d0"
            )}
          </span>
          <strong>{myCustomers.length}</strong>
        </button>

        <button
          type="button"
          className={
            activeAccountTab === "reports"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveAccountTab("reports")
          }
        >
          <ClipboardList size={16} />
          <span>
            {tx(
              "My Reports",
              "\u0631\u0627\u067e\u0648\u0631\u0647\u0627\u06cc \u0645\u0646",
              "\u0632\u0645\u0627 \u0631\u0627\u067e\u0648\u0631\u0648\u0646\u0647"
            )}
          </span>
          <strong>{myReports.length}</strong>
        </button>

        <button
          type="button"
          className={
            activeAccountTab === "ledger"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveAccountTab("ledger")
          }
        >
          <Banknote size={16} />
          <span>
            {tx(
              "My Ledger",
              "\u062d\u0633\u0627\u0628 \u0645\u0646",
              "\u0632\u0645\u0627 \u062d\u0633\u0627\u0628"
            )}
          </span>
          <strong>{myLedgerEntries.length}</strong>
        </button>
      </nav>

      <section className="my-account-report-panel">
        <div className="my-account-report-form-card">
          <header>
            <div>
              <span>
                {tx(
                  "Daily Report",
                  "\u0631\u0627\u067e\u0648\u0631 \u0631\u0648\u0632\u0627\u0646\u0647",
                  "\u0648\u0631\u0681\u0646\u06cc \u0631\u0627\u067e\u0648\u0631"
                )}
              </span>

              <h2>
                {tx(
                  "Give Report",
                  "\u062f\u0627\u062f\u0646 \u0631\u0627\u067e\u0648\u0631",
                  "\u0631\u0627\u067e\u0648\u0631 \u0648\u0631\u06a9\u0648\u0644"
                )}
              </h2>

              <p>
                {editingReport
                  ? tx(
                      `Editing report from ${editingReport.afghanistanDate || editingReport.date || "-"}`,
                      `\u0648\u06cc\u0631\u0627\u06cc\u0634 \u0631\u0627\u067e\u0648\u0631 \u062a\u0627\u0631\u06cc\u062e ${editingReport.afghanistanDate || editingReport.date || "-"}`,
                      `\u062f ${editingReport.afghanistanDate || editingReport.date || "-"} \u0631\u0627\u067e\u0648\u0631 \u0633\u0645\u0648\u0644`
                    )
                  : tx(
                      "Submit your end-of-day work report.",
                      "\u0631\u0627\u067e\u0648\u0631 \u0622\u062e\u0631 \u0631\u0648\u0632 \u06a9\u0627\u0631\u06cc \u062e\u0648\u062f \u0631\u0627 \u062b\u0628\u062a \u06a9\u0646\u06cc\u062f.",
                      "\u062f \u0648\u0631\u0681\u06d0 \u067e\u0627\u06cc \u06a9\u0627\u0631\u064a \u0631\u0627\u067e\u0648\u0631 \u062b\u0628\u062a \u06a9\u0693\u0626."
                    )}
              </p>
            </div>

            <div className="my-account-report-clock">
              <Clock3 size={16} />

              <span>
                {tx(
                  "Auto date and time",
                  "\u062a\u0627\u0631\u06cc\u062e \u0648 \u0633\u0627\u0639\u062a \u0627\u062a\u0648\u0645\u0627\u062a\u06cc\u06a9",
                  "\u0627\u062a\u0648\u0645\u0627\u062a \u0646\u06d0\u067c\u0647 \u0627\u0648 \u0648\u062e\u062a"
                )}
              </span>
            </div>
          </header>

          <form onSubmit={saveDailyReport}>
            <label>
              <FileText size={16} />

              <textarea
                value={reportText}
                onChange={(event) =>
                  setReportText(
                    event.target.value
                  )
                }
                rows="5"
                placeholder={tx(
                  "Write your work report for today...",
                  "\u0631\u0627\u067e\u0648\u0631 \u06a9\u0627\u0631\u06cc \u0627\u0645\u0631\u0648\u0632 \u062e\u0648\u062f \u0631\u0627 \u0628\u0646\u0648\u06cc\u0633\u06cc\u062f...",
                  "\u062f \u0646\u0646 \u0648\u0631\u0681\u06d0 \u062e\u067e\u0644 \u06a9\u0627\u0631\u064a \u0631\u0627\u067e\u0648\u0631 \u0648\u0644\u06cc\u06a9\u0626..."
                )}
              />
            </label>

            <footer>
              {editingReport && (
                <button
                  type="button"
                  onClick={cancelReportEdit}
                  disabled={savingReport}
                >
                  {tx(
                    "Cancel Edit",
                    "\u0644\u063a\u0648 \u0648\u06cc\u0631\u0627\u06cc\u0634",
                    "\u0633\u0645\u0648\u0644 \u0644\u063a\u0648 \u06a9\u0693\u0626"
                  )}
                </button>
              )}

              <button
                type="submit"
                className="primary"
                disabled={savingReport}
              >
                <ClipboardList size={15} />

                {savingReport
                  ? tx("Saving...", "\u062f\u0631 \u062d\u0627\u0644 \u0630\u062e\u06cc\u0631\u0647...", "\u062e\u0648\u0646\u062f\u064a \u06a9\u06d0\u0696\u064a...")
                  : editingReport
                    ? tx(
                        "Update Report",
                        "\u0630\u062e\u06cc\u0631\u0647 \u062a\u063a\u06cc\u06cc\u0631\u0627\u062a \u0631\u0627\u067e\u0648\u0631",
                        "\u062f \u0631\u0627\u067e\u0648\u0631 \u0628\u062f\u0644\u0648\u0646\u0648\u0646\u0647 \u062e\u0648\u0646\u062f\u064a \u06a9\u0693\u0626"
                      )
                    : tx(
                        "Submit Report",
                        "\u062b\u0628\u062a \u0631\u0627\u067e\u0648\u0631",
                        "\u0631\u0627\u067e\u0648\u0631 \u062b\u0628\u062a \u06a9\u0693\u0626"
                      )}
              </button>
            </footer>
          </form>
        </div>

        <div className="my-account-report-history">
          <header>
            <div>
              <span>
                {tx(
                  "Report Records",
                  "\u0631\u06cc\u06a9\u0627\u0631\u062f\u0647\u0627\u06cc \u0631\u0627\u067e\u0648\u0631",
                  "\u062f \u0631\u0627\u067e\u0648\u0631 \u0631\u06cc\u06a9\u0627\u0631\u0689\u0648\u0646\u0647"
                )}
              </span>
              <strong>{myReports.length}</strong>
            </div>

            {lastReport && (
              <small>
                {tx("Last", "\u0622\u062e\u0631\u06cc\u0646", "\u0648\u0631\u0648\u0633\u062a\u06cc")}:{" "}
                {lastReport.afghanistanDate ||
                  lastReport.date ||
                  "-"}
              </small>
            )}
          </header>

          <div className="my-account-report-list">
            {myReports.slice(0, 4).map((report) => (
              <article
                key={report.id}
                id={recordDomId(
                  "my-account-report-preview",
                  report.id
                )}
                className={
                  highlightedTarget?.type === "reports" &&
                  String(highlightedTarget?.id) ===
                    String(report.id)
                    ? "my-account-target-highlight"
                    : ""
                }
              >
                <div>
                  <span>
                    {report.afghanistanDate ||
                      report.date ||
                      "-"}
                  </span>

                  <small>
                    {report.afghanistanTime ||
                      report.time ||
                      "-"}
                  </small>
                </div>

                <p>{report.reportText}</p>

                <button
                  type="button"
                  onClick={() =>
                    editReport(report)
                  }
                  title={tx(
                    "Edit report",
                    "\u0648\u06cc\u0631\u0627\u06cc\u0634 \u0631\u0627\u067e\u0648\u0631",
                    "\u0631\u0627\u067e\u0648\u0631 \u0633\u0645\u0648\u0644"
                  )}
                  aria-label={tx(
                    "Edit report",
                    "\u0648\u06cc\u0631\u0627\u06cc\u0634 \u0631\u0627\u067e\u0648\u0631",
                    "\u0631\u0627\u067e\u0648\u0631 \u0633\u0645\u0648\u0644"
                  )}
                >
                  <Pencil size={14} />
                </button>

                <button
                  type="button"
                  className="delete-report"
                  onClick={() =>
                    deleteReport(report)
                  }
                  title={tx(
                    "Delete report",
                    "\u062d\u0630\u0641 \u0631\u0627\u067e\u0648\u0631",
                    "\u0631\u0627\u067e\u0648\u0631 \u062d\u0630\u0641\u0648\u0644"
                  )}
                  aria-label={tx(
                    "Delete report",
                    "\u062d\u0630\u0641 \u0631\u0627\u067e\u0648\u0631",
                    "\u0631\u0627\u067e\u0648\u0631 \u062d\u0630\u0641\u0648\u0644"
                  )}
                  disabled={savingReport}
                >
                  <Trash2 size={14} />
                </button>
              </article>
            ))}

            {!myReports.length && (
              <div className="my-account-report-empty">
                {tx(
                  "No reports submitted yet.",
                  "\u0647\u0646\u0648\u0632 \u0647\u06cc\u0686 \u0631\u0627\u067e\u0648\u0631\u06cc \u062b\u0628\u062a \u0646\u0634\u062f\u0647 \u0627\u0633\u062a.",
                  "\u062a\u0631 \u0627\u0648\u0633\u0647 \u0647\u06d0\u0685 \u0631\u0627\u067e\u0648\u0631 \u0646\u0647 \u062f\u06cc \u062b\u0628\u062a \u0634\u0648\u06cc."
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section
        className={`my-account-records my-account-report-records ${
          activeAccountTab === "reports"
            ? ""
            : "my-account-tab-hidden"
        }`}
      >
        <header>
          <div>
            <span>
              {tx(
                "Daily Reports",
                "\u0631\u0627\u067e\u0648\u0631\u0647\u0627\u06cc \u0631\u0648\u0632\u0627\u0646\u0647",
                "\u0648\u0631\u0681\u0646\u064a \u0631\u0627\u067e\u0648\u0631\u0648\u0646\u0647"
              )}
            </span>

            <h2>
              {tx(
                "My Reports",
                "\u0631\u0627\u067e\u0648\u0631\u0647\u0627\u06cc \u0645\u0646",
                "\u0632\u0645\u0627 \u0631\u0627\u067e\u0648\u0631\u0648\u0646\u0647"
              )}
            </h2>

            <p>
              {tx(
                "Submit and edit your end-of-day work reports.",
                "\u0631\u0627\u067e\u0648\u0631\u0647\u0627\u06cc \u0622\u062e\u0631 \u0631\u0648\u0632 \u06a9\u0627\u0631\u06cc \u062e\u0648\u062f \u0631\u0627 \u062b\u0628\u062a \u0648 \u0648\u06cc\u0631\u0627\u06cc\u0634 \u06a9\u0646\u06cc\u062f.",
                "\u062f \u0648\u0631\u0681\u06d0 \u067e\u0627\u06cc \u06a9\u0627\u0631\u064a \u0631\u0627\u067e\u0648\u0631\u0648\u0646\u0647 \u062b\u0628\u062a \u0627\u0648 \u0633\u0645 \u06a9\u0693\u0626."
              )}
            </p>
          </div>

          <div className="my-account-report-header-actions">
            {lastReport && (
              <small>
                {tx("Last report", "\u0622\u062e\u0631\u06cc\u0646 \u0631\u0627\u067e\u0648\u0631", "\u0648\u0631\u0648\u0633\u062a\u06cc \u0631\u0627\u067e\u0648\u0631")}:{" "}
                {lastReport.afghanistanDate ||
                  lastReport.date ||
                  "-"}
              </small>
            )}

            <button
              type="button"
              onClick={() => openReportModal()}
            >
              <ClipboardList size={15} />
              {tx(
                "Give Report",
                "\u062f\u0627\u062f\u0646 \u0631\u0627\u067e\u0648\u0631",
                "\u0631\u0627\u067e\u0648\u0631 \u0648\u0631\u06a9\u0648\u0644"
              )}
            </button>
          </div>
        </header>

        <div className="my-account-report-list full">
          {myReports.map((report) => (
            <article
              key={report.id}
              id={recordDomId(
                "my-account-reports",
                report.id
              )}
              className={
                highlightedTarget?.type === "reports" &&
                String(highlightedTarget?.id) ===
                  String(report.id)
                  ? "my-account-target-highlight"
                  : ""
              }
            >
              <div>
                <span>
                  {report.afghanistanDate ||
                    report.date ||
                    "-"}
                </span>

                <small>
                  {report.afghanistanTime ||
                    report.time ||
                    "-"}
                </small>
              </div>

              <p>{report.reportText}</p>

              <button
                type="button"
                onClick={() =>
                  editReport(report)
                }
                title={tx(
                  "Edit report",
                  "\u0648\u06cc\u0631\u0627\u06cc\u0634 \u0631\u0627\u067e\u0648\u0631",
                  "\u0631\u0627\u067e\u0648\u0631 \u0633\u0645\u0648\u0644"
                )}
                aria-label={tx(
                  "Edit report",
                  "\u0648\u06cc\u0631\u0627\u06cc\u0634 \u0631\u0627\u067e\u0648\u0631",
                  "\u0631\u0627\u067e\u0648\u0631 \u0633\u0645\u0648\u0644"
                )}
              >
                <Pencil size={14} />
              </button>

              <button
                type="button"
                className="delete-report"
                onClick={() =>
                  deleteReport(report)
                }
                title={tx(
                  "Delete report",
                  "\u062d\u0630\u0641 \u0631\u0627\u067e\u0648\u0631",
                  "\u0631\u0627\u067e\u0648\u0631 \u062d\u0630\u0641\u0648\u0644"
                )}
                aria-label={tx(
                  "Delete report",
                  "\u062d\u0630\u0641 \u0631\u0627\u067e\u0648\u0631",
                  "\u0631\u0627\u067e\u0648\u0631 \u062d\u0630\u0641\u0648\u0644"
                )}
                disabled={savingReport}
              >
                <Trash2 size={14} />
              </button>
            </article>
          ))}

          {!myReports.length && (
            <div className="my-account-report-empty">
              {tx(
                "No reports submitted yet.",
                "\u0647\u0646\u0648\u0632 \u0647\u06cc\u0686 \u0631\u0627\u067e\u0648\u0631\u06cc \u062b\u0628\u062a \u0646\u0634\u062f\u0647 \u0627\u0633\u062a.",
                "\u062a\u0631 \u0627\u0648\u0633\u0647 \u0647\u06d0\u0685 \u0631\u0627\u067e\u0648\u0631 \u0646\u0647 \u062f\u06cc \u062b\u0628\u062a \u0634\u0648\u06cc."
              )}
            </div>
          )}
        </div>
      </section>

      <section
        className={`my-account-records my-account-ledger-records ${
          activeAccountTab === "ledger"
            ? ""
            : "my-account-tab-hidden"
        }`}
      >
        <header>
          <div>
            <span>
              {tx(
                "Employee Finance",
                "\u0645\u0627\u0644\u06cc \u06a9\u0627\u0631\u0645\u0646\u062f",
                "\u062f \u06a9\u0627\u0631\u06a9\u0648\u0648\u0646\u06a9\u064a \u0645\u0627\u0644\u064a"
              )}
            </span>

            <h2>
              {tx(
                "My Ledger",
                "\u0644\u06cc\u062c\u0631 \u0645\u0646",
                "\u0632\u0645\u0627 \u0644\u06cc\u062c\u0631"
              )}
            </h2>

            <p>
              {tx(
                "Your bonus, penalty, payment and remaining balance records.",
                "\u0633\u0648\u0627\u0628\u0642 \u0627\u0645\u062a\u06cc\u0627\u0632\u060c \u062c\u0631\u06cc\u0645\u0647\u060c \u067e\u0631\u062f\u0627\u062e\u062a \u0648 \u0628\u0627\u0642\u06cc \u0645\u0627\u0646\u062f\u0647 \u0634\u0645\u0627.",
                "\u0633\u062a\u0627\u0633\u0648 \u062f \u0627\u0645\u062a\u06cc\u0627\u0632\u060c \u062c\u0631\u06cc\u0645\u06d0\u060c \u062a\u0627\u062f\u06cc\u06d0 \u0627\u0648 \u067e\u0627\u062a\u06d0 \u0628\u06cc\u0644\u0627\u0646\u0633 \u0631\u06cc\u06a9\u0627\u0631\u0689\u0648\u0646\u0647."
              )}
            </p>
          </div>

          <div className="my-account-counts">
            <div>
              <span>{tx("Records", "\u0631\u06cc\u06a9\u0627\u0631\u062f\u0647\u0627", "\u0631\u06cc\u06a9\u0627\u0631\u0689\u0648\u0646\u0647")}</span>
              <strong>
                {myLedgerEntries.length}
              </strong>
            </div>
          </div>
        </header>

        <div className="my-account-ledger-panel in-tab">
          <div className="my-account-ledger-cards">
            <article className="bonus">
              <div>
                <Gift size={17} />
              </div>

              <span>
                {tx("Bonus", "\u0627\u0645\u062a\u06cc\u0627\u0632", "\u0627\u0645\u062a\u06cc\u0627\u0632")}
              </span>

              <strong>
                {ledgerBonus.toLocaleString("en-US")} AFN
              </strong>
            </article>

            <article className="penalty">
              <div>
                <XCircle size={17} />
              </div>

              <span>
                {tx("Penalty", "\u062c\u0631\u06cc\u0645\u0647", "\u062c\u0631\u06cc\u0645\u0647")}
              </span>

              <strong>
                {ledgerPenalty.toLocaleString("en-US")} AFN
              </strong>
            </article>

            <article className="payment">
              <div>
                <Banknote size={17} />
              </div>

              <span>
                {tx("Payment", "\u067e\u0631\u062f\u0627\u062e\u062a", "\u062a\u0627\u062f\u06cc\u0647")}
              </span>

              <strong>
                {ledgerPayment.toLocaleString("en-US")} AFN
              </strong>
            </article>

            <article className="remaining">
              <div>
                <Clock3 size={17} />
              </div>

              <span>
                {tx("Remaining", "\u0628\u0627\u0642\u06cc \u0645\u0627\u0646\u062f\u0647", "\u067e\u0627\u062a\u06d0")}
              </span>

              <strong>
                {ledgerRemaining.toLocaleString("en-US")} AFN
              </strong>
            </article>
          </div>
        </div>

        <div className="my-account-table-wrap">
          <table className="my-account-ledger-table">
            <thead>
              <tr>
                <th>{tx("Date", "\u062a\u0627\u0631\u06cc\u062e", "\u0646\u06d0\u067c\u0647")}</th>
                <th>{tx("Type", "\u0646\u0648\u0639", "\u0689\u0648\u0644")}</th>
                <th>{tx("Debit", "\u062f\u06cc\u0628\u062a", "\u0689\u06cc\u0628\u06cc\u067c")}</th>
                <th>{tx("Credit", "\u06a9\u0631\u06cc\u062f\u062a", "\u06a9\u0631\u06cc\u0689\u06cc\u067c")}</th>
                <th>{tx("Reason / Note", "\u062f\u0644\u06cc\u0644 / \u06cc\u0627\u062f\u062f\u0627\u0634\u062a", "\u0644\u0627\u0645\u0644 / \u06cc\u0627\u062f\u069a\u062a")}</th>
              </tr>
            </thead>

            <tbody>
              {myLedgerEntries.map((entry) => {
                const amount = Number(entry.amount || 0);
                const creditEntry = isLedgerCredit(entry);

                return (
                  <tr
                    key={entry.id}
                    id={recordDomId(
                      "my-account-ledger",
                      entry.id
                    )}
                    className={
                      highlightedTarget?.type === "ledger" &&
                      String(highlightedTarget?.id) ===
                        String(entry.id)
                        ? "my-account-target-highlight"
                        : ""
                    }
                  >
                    <td>
                      {formatDateTime(
                        entry.createdAt ||
                          entry.employeeNotificationAt
                      )}
                    </td>

                    <td>
                      <span
                        className={`my-account-ledger-type ${entry.type || "other"}`}
                      >
                        {ledgerTypeLabel(entry.type)}
                      </span>
                    </td>

                    <td className="my-account-ledger-debit">
                      {!creditEntry
                        ? `${amount.toLocaleString("en-US")} AFN`
                        : "-"}
                    </td>

                    <td className="my-account-ledger-credit">
                      {creditEntry
                        ? `${amount.toLocaleString("en-US")} AFN`
                        : "-"}
                    </td>

                    <td>{entry.reason || "-"}</td>
                  </tr>
                );
              })}

              {!myLedgerEntries.length && (
                <tr>
                  <td
                    colSpan="5"
                    className="my-account-empty"
                  >
                    {tx(
                      "No ledger records yet.",
                      "\u0647\u0646\u0648\u0632 \u0647\u06cc\u0686 \u0631\u06cc\u06a9\u0627\u0631\u062f \u0645\u0627\u0644\u06cc \u0648\u062c\u0648\u062f \u0646\u062f\u0627\u0631\u062f.",
                      "\u062a\u0631 \u0627\u0648\u0633\u0647 \u0647\u06d0\u0685 \u0645\u0627\u0644\u064a \u0631\u06cc\u06a9\u0627\u0631\u0689 \u0646\u0634\u062a\u0647."
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section
        className={`my-account-records ${
          activeAccountTab === "customers"
            ? ""
            : "my-account-tab-hidden"
        }`}
      >
        <header>
          <div>
            <span>
              {tx(
                "Assigned Customers",
                "\u0645\u0634\u062a\u0631\u06cc\u0627\u0646 \u0631\u0627\u062c\u0639 \u0634\u062f\u0647",
                "\u0633\u067e\u0627\u0631\u0644 \u0634\u0648\u064a \u067e\u06d0\u0631\u0648\u062f\u0648\u0646\u06a9\u064a"
              )}
            </span>

            <h2>
              {tx(
                "My Customer Requests",
                "\u062f\u0631\u062e\u0648\u0627\u0633\u062a\u200c\u0647\u0627\u06cc \u0645\u0634\u062a\u0631\u06cc\u0627\u0646 \u0645\u0646",
                "\u0632\u0645\u0627 \u062f \u067e\u06d0\u0631\u0648\u062f\u0648\u0646\u06a9\u0648 \u063a\u0648\u069a\u062a\u0646\u06d0"
              )}
            </h2>

            <p>
              {tx(
                "Click any record to view its complete information.",
                "\u0628\u0631\u0627\u06cc \u062f\u06cc\u062f\u0646 \u0645\u0639\u0644\u0648\u0645\u0627\u062a \u06a9\u0627\u0645\u0644\u060c \u0631\u0648\u06cc \u0647\u0631 \u0631\u06cc\u06a9\u0627\u0631\u062f \u06a9\u0644\u06cc\u06a9 \u06a9\u0646\u06cc\u062f.",
                "\u062f \u0628\u0634\u067e\u0693\u0648 \u0645\u0639\u0644\u0648\u0645\u0627\u062a\u0648 \u0644\u06cc\u062f\u0648 \u0644\u067e\u0627\u0631\u0647 \u067e\u0647 \u0647\u0631 \u0631\u06cc\u06a9\u0627\u0631\u0689 \u06a9\u0644\u06cc\u06a9 \u0648\u06a9\u0693\u0626."
              )}
            </p>
          </div>

          <div className="my-account-counts">
            <div>
              <span>
                {tx("Total", "\u0645\u062c\u0645\u0648\u0639", "\u067c\u0648\u0644")}
              </span>
              <strong>
                {myCustomers.length}
              </strong>
            </div>

            <div>
              <span>
                {tx("Pending", "\u062f\u0631 \u0627\u0646\u062a\u0638\u0627\u0631", "\u067e\u0647 \u062a\u0645\u0647")}
              </span>
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
                <th>{tx("Customer", "\u0645\u0634\u062a\u0631\u06cc", "\u067e\u06d0\u0631\u0648\u062f\u0648\u0646\u06a9\u06cc")}</th>
                <th>{tx("Phone", "\u062a\u0645\u0627\u0633", "\u062a\u0644\u06cc\u0641\u0648\u0646")}</th>
                <th>{tx("Type", "\u0646\u0648\u0639", "\u0689\u0648\u0644")}</th>
                <th>{tx("Source", "\u0645\u0646\u0628\u0639", "\u0633\u0631\u0686\u06cc\u0646\u0647")}</th>
                <th>{tx("Purpose", "\u0647\u062f\u0641", "\u0645\u0648\u062e\u0647")}</th>
                <th>{tx("Assigned Date", "\u062a\u0627\u0631\u06cc\u062e \u0631\u0627\u062c\u0639", "\u062f \u0633\u067e\u0627\u0631\u0644\u0648 \u0646\u06d0\u067c\u0647")}</th>
                <th>{tx("Status", "\u062d\u0627\u0644\u062a", "\u062d\u0627\u0644\u062a")}</th>
                <th>{tx("Follow Up", "\u067e\u06cc\u06af\u06cc\u0631\u06cc", "\u062a\u0639\u0642\u06cc\u0628")}</th>
              </tr>
            </thead>

            <tbody>
              {myCustomers.map(
                (customer) => {
                  const requestStatus =
                    getWorkspaceStatus(customer);

                  const transferredAway =
                    !isCurrentAssignment(customer);

                  const followUpComplete =
                    isFollowUpComplete(customer);

                  return (
                    <tr
                      key={customer.id}
                      id={recordDomId(
                        "my-account-customer",
                        customer.id ||
                          customer.customerId
                      )}
                      tabIndex={0}
                      role="button"
                      className={`my-account-record-row department-${normalize(
                        customer.customerType || "other"
                      )} ${
                        highlightedTarget?.type === "customer" &&
                        String(highlightedTarget?.id) ===
                          String(
                            customer.id ||
                              customer.customerId
                          )
                          ? "my-account-target-highlight"
                          : ""
                      }`}
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
                                tx("No email", "\u0627\u06cc\u0645\u06cc\u0644 \u0646\u062f\u0627\u0631\u062f", "\u0628\u0631\u06cc\u069a\u0646\u0627\u0644\u06cc\u06a9 \u0646\u0634\u062a\u0647")}
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
                          {customerTypeLabel(
                            customer.customerType
                          )}
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
                          {transferredAway
                            ? statusLabel("Referred")
                            : statusLabel(requestStatus)}
                        </span>
                      </td>

                      <td>
                        {followUpComplete ||
                        (!transferredAway &&
                          normalize(requestStatus) ===
                            "accepted") ? (
                          <button
                            type="button"
                            className={`my-account-followup-button ${
                              followUpComplete
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
                              followUpComplete
                                ? tx(
                                    "Open completed follow-up",
                                    "\u0628\u0627\u0632 \u06a9\u0631\u062f\u0646 \u067e\u06cc\u06af\u06cc\u0631\u06cc \u062a\u06a9\u0645\u06cc\u0644\u200c\u0634\u062f\u0647",
                                    "\u0628\u0634\u067e\u0693 \u0634\u0648\u06cc \u062a\u0639\u0642\u06cc\u0628 \u067e\u0631\u0627\u0646\u06cc\u0633\u062a\u0644"
                                  )
                                : tx(
                                    "Start customer follow-up",
                                    "\u0634\u0631\u0648\u0639 \u067e\u06cc\u06af\u06cc\u0631\u06cc \u0645\u0634\u062a\u0631\u06cc",
                                    "\u062f \u067e\u06d0\u0631\u0648\u062f\u0648\u0646\u06a9\u064a \u062a\u0639\u0642\u06cc\u0628 \u067e\u06cc\u0644\u0648\u0644"
                                  )
                            }
                            aria-label={
                              followUpComplete
                                ? tx(
                                    "Open completed follow-up",
                                    "\u0628\u0627\u0632 \u06a9\u0631\u062f\u0646 \u067e\u06cc\u06af\u06cc\u0631\u06cc \u062a\u06a9\u0645\u06cc\u0644\u200c\u0634\u062f\u0647",
                                    "\u0628\u0634\u067e\u0693 \u0634\u0648\u06cc \u062a\u0639\u0642\u06cc\u0628 \u067e\u0631\u0627\u0646\u06cc\u0633\u062a\u0644"
                                  )
                                : tx(
                                    "Start customer follow-up",
                                    "\u0634\u0631\u0648\u0639 \u067e\u06cc\u06af\u06cc\u0631\u06cc \u0645\u0634\u062a\u0631\u06cc",
                                    "\u062f \u067e\u06d0\u0631\u0648\u062f\u0648\u0646\u06a9\u064a \u062a\u0639\u0642\u06cc\u0628 \u067e\u06cc\u0644\u0648\u0644"
                                  )
                            }
                          >
                            {followUpComplete ? (
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
                    {tx(
                      "No customer requests have been assigned to this account.",
                      "\u0647\u06cc\u0686 \u062f\u0631\u062e\u0648\u0627\u0633\u062a \u0645\u0634\u062a\u0631\u06cc \u0628\u0647 \u0627\u06cc\u0646 \u062d\u0633\u0627\u0628 \u0631\u0627\u062c\u0639 \u0646\u0634\u062f\u0647 \u0627\u0633\u062a.",
                      "\u062f\u06d0 \u062d\u0633\u0627\u0628 \u062a\u0647 \u0647\u06d0\u0685 \u062f \u067e\u06d0\u0631\u0648\u062f\u0648\u0646\u06a9\u064a \u063a\u0648\u069a\u062a\u0646\u0647 \u0646\u0647 \u062f\u0647 \u0633\u067e\u0627\u0631\u0644 \u0634\u0648\u06d0."
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {reportModalOpen && (
        <div
          className="my-account-modal-backdrop"
          onMouseDown={closeReportModal}
        >
          <form
            className="my-account-report-modal"
            onSubmit={saveDailyReport}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="my-account-report-title"
          >
            <header>
              <div>
                <span>
                  {tx(
                    "Daily Report",
                    "\u0631\u0627\u067e\u0648\u0631 \u0631\u0648\u0632\u0627\u0646\u0647",
                    "\u0648\u0631\u0681\u0646\u06cc \u0631\u0627\u067e\u0648\u0631"
                  )}
                </span>

                <h2 id="my-account-report-title">
                  {editingReport
                    ? tx(
                        "Edit Report",
                        "\u0648\u06cc\u0631\u0627\u06cc\u0634 \u0631\u0627\u067e\u0648\u0631",
                        "\u0631\u0627\u067e\u0648\u0631 \u0633\u0645\u0648\u0644"
                      )
                    : tx(
                        "Give Report",
                        "\u062f\u0627\u062f\u0646 \u0631\u0627\u067e\u0648\u0631",
                        "\u0631\u0627\u067e\u0648\u0631 \u0648\u0631\u06a9\u0648\u0644"
                      )}
                </h2>

                <p>
                  {tx(
                    "Date and time are saved automatically when you submit.",
                    "\u062a\u0627\u0631\u06cc\u062e \u0648 \u0633\u0627\u0639\u062a \u0647\u0646\u06af\u0627\u0645 \u062b\u0628\u062a \u0628\u0647\u200c\u0635\u0648\u0631\u062a \u0627\u062a\u0648\u0645\u0627\u062a\u06cc\u06a9 \u0630\u062e\u06cc\u0631\u0647 \u0645\u06cc\u200c\u0634\u0648\u062f.",
                    "\u0646\u06d0\u067c\u0647 \u0627\u0648 \u0648\u062e\u062a \u062f \u062b\u0628\u062a \u067e\u0631 \u0645\u0647\u0627\u0644 \u067e\u0647 \u0627\u062a\u0648\u0645\u0627\u062a \u0689\u0648\u0644 \u062e\u0648\u0646\u062f\u064a \u06a9\u06d0\u0696\u064a."
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={closeReportModal}
                disabled={savingReport}
                aria-label={tx(
                  "Close report form",
                  "\u0628\u0633\u062a\u0646 \u0641\u0648\u0631\u0645 \u0631\u0627\u067e\u0648\u0631",
                  "\u062f \u0631\u0627\u067e\u0648\u0631 \u0641\u0648\u0631\u0645 \u0628\u0646\u062f\u0648\u0644"
                )}
              >
                <X size={19} />
              </button>
            </header>

            <div className="my-account-report-modal-time">
              <Clock3 size={16} />

              <span>
                {tx(
                  "Automatic Kabul date and time",
                  "\u062a\u0627\u0631\u06cc\u062e \u0648 \u0633\u0627\u0639\u062a \u06a9\u0627\u0628\u0644 \u0627\u062a\u0648\u0645\u0627\u062a\u06cc\u06a9",
                  "\u062f \u06a9\u0627\u0628\u0644 \u0627\u062a\u0648\u0645\u0627\u062a \u0646\u06d0\u067c\u0647 \u0627\u0648 \u0648\u062e\u062a"
                )}
              </span>
            </div>

            <label>
              <span>
                {tx(
                  "Report Text",
                  "\u0645\u062a\u0646 \u0631\u0627\u067e\u0648\u0631",
                  "\u062f \u0631\u0627\u067e\u0648\u0631 \u0645\u062a\u0646"
                )}
              </span>

              <textarea
                value={reportText}
                onChange={(event) =>
                  setReportText(
                    event.target.value
                  )
                }
                rows="7"
                placeholder={tx(
                  "Write your work report for today...",
                  "\u0631\u0627\u067e\u0648\u0631 \u06a9\u0627\u0631\u06cc \u0627\u0645\u0631\u0648\u0632 \u062e\u0648\u062f \u0631\u0627 \u0628\u0646\u0648\u06cc\u0633\u06cc\u062f...",
                  "\u062f \u0646\u0646 \u0648\u0631\u0681\u06d0 \u062e\u067e\u0644 \u06a9\u0627\u0631\u064a \u0631\u0627\u067e\u0648\u0631 \u0648\u0644\u06cc\u06a9\u0626..."
                )}
                autoFocus
              />
            </label>

            <footer>
              <button
                type="button"
                onClick={cancelReportEdit}
                disabled={savingReport}
              >
                {tx("Cancel", "\u0644\u063a\u0648", "\u0644\u063a\u0648\u0647")}
              </button>

              <button
                type="submit"
                className="primary"
                disabled={savingReport}
              >
                <ClipboardList size={15} />

                {savingReport
                  ? tx(
                      "Saving...",
                      "\u062f\u0631 \u062d\u0627\u0644 \u0630\u062e\u06cc\u0631\u0647...",
                      "\u062e\u0648\u0646\u062f\u064a \u06a9\u06d0\u0696\u064a..."
                    )
                  : editingReport
                    ? tx(
                        "Update Report",
                        "\u0630\u062e\u06cc\u0631\u0647 \u062a\u063a\u06cc\u06cc\u0631\u0627\u062a \u0631\u0627\u067e\u0648\u0631",
                        "\u062f \u0631\u0627\u067e\u0648\u0631 \u0628\u062f\u0644\u0648\u0646\u0648\u0646\u0647 \u062e\u0648\u0646\u062f\u064a \u06a9\u0693\u0626"
                      )
                    : tx(
                        "Submit Report",
                        "\u062b\u0628\u062a \u0631\u0627\u067e\u0648\u0631",
                        "\u0631\u0627\u067e\u0648\u0631 \u062b\u0628\u062a \u06a9\u0693\u0626"
                      )}
              </button>
            </footer>
          </form>
        </div>
      )}

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
                  {tx(
                    "Customer Information",
                    "\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0645\u0634\u062a\u0631\u06cc",
                    "\u062f \u067e\u06d0\u0631\u0648\u062f\u0648\u0646\u06a9\u064a \u0645\u0639\u0644\u0648\u0645\u0627\u062a"
                  )}
                </span>

                <h2>
                  {getCustomerName(
                    selectedCustomer
                  )}
                </h2>

                <p>
                  {tx(
                    "Complete registration and assignment details.",
                    "\u062c\u0632\u0626\u06cc\u0627\u062a \u06a9\u0627\u0645\u0644 \u062b\u0628\u062a \u0648 \u0631\u0627\u062c\u0639 \u0634\u062f\u0646.",
                    "\u062f \u062b\u0628\u062a \u0627\u0648 \u0633\u067e\u0627\u0631\u0644\u0648 \u0628\u0634\u067e\u0693 \u062c\u0632\u0626\u06cc\u0627\u062a."
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={closeDetails}
                disabled={savingAction}
                aria-label={tx("Close", "\u0628\u0633\u062a\u0646", "\u0628\u0646\u062f\u0648\u0644")}
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
                {statusLabel(
                  getWorkspaceStatus(selectedCustomer)
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
                    <span>{detailLabel(label)}</span>

                    <strong>
                      {label === "Status"
                        ? statusLabel(value)
                        : label === "Customer Type"
                          ? customerTypeLabel(value)
                          : label === "Call Type"
                            ? callTypeLabel(value)
                            : formatValue(value)}
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
                    {tx(
                      "Message History",
                      "\u062a\u0627\u0631\u06cc\u062e\u0686\u0647 \u067e\u06cc\u0627\u0645\u200c\u0647\u0627",
                      "\u062f \u067e\u06cc\u063a\u0627\u0645\u0648\u0646\u0648 \u062a\u0627\u0631\u06cc\u062e\u0686\u0647"
                    )}
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
                              tx("Employee", "\u06a9\u0627\u0631\u0645\u0646\u062f", "\u06a9\u0627\u0631\u06a9\u0648\u0648\u0646\u06a9\u06cc")}
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
                      {statusLabel(
                        getWorkspaceStatus(selectedCustomer)
                      )}
                    </strong>

                    <span>
                      {tx(
                        "This request remains in your history and is currently managed by another employee.",
                        "\u0627\u06cc\u0646 \u062f\u0631\u062e\u0648\u0627\u0633\u062a \u062f\u0631 \u062a\u0627\u0631\u06cc\u062e\u0686\u0647 \u0634\u0645\u0627 \u0645\u06cc\u200c\u0645\u0627\u0646\u062f \u0648 \u0627\u06a9\u0646\u0648\u0646 \u062a\u0648\u0633\u0637 \u06a9\u0627\u0631\u0645\u0646\u062f \u062f\u06cc\u06af\u0631 \u0645\u062f\u06cc\u0631\u06cc\u062a \u0645\u06cc\u200c\u0634\u0648\u062f.",
                        "\u062f\u0627 \u063a\u0648\u069a\u062a\u0646\u0647 \u0633\u062a\u0627\u0633\u0648 \u067e\u0647 \u062a\u0627\u0631\u06cc\u062e\u0686\u0647 \u06a9\u06d0 \u067e\u0627\u062a\u06d0 \u06a9\u06d0\u0696\u064a \u0627\u0648 \u0627\u0648\u0633 \u062f \u0628\u0644 \u06a9\u0627\u0631\u06a9\u0648\u0648\u0646\u06a9\u064a \u0644\u062e\u0648\u0627 \u0627\u062f\u0627\u0631\u0647 \u06a9\u06d0\u0696\u064a."
                      )}
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
                  {tx(
                    "Edit Assignment",
                    "\u0648\u06cc\u0631\u0627\u06cc\u0634 \u0631\u0627\u062c\u0639 \u0633\u0627\u062e\u062a\u0646",
                    "\u0633\u067e\u0627\u0631\u0644 \u0633\u0645\u0648\u0644"
                  )}
                </button>
              </div>
            ) : reassignOpen ? (
              <form
                className="my-account-reassign-form"
                onSubmit={saveReassignment}
              >
                <div className="my-account-reassign-summary">
                  <div>
                    <span>{tx("Customer", "\u0645\u0634\u062a\u0631\u06cc", "\u067e\u06d0\u0631\u0648\u062f\u0648\u0646\u06a9\u06cc")}</span>
                    <strong>
                      {getCustomerName(
                        selectedCustomer
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      {tx(
                        "Currently Assigned To",
                        "\u0641\u0639\u0644\u0627\u064b \u0631\u0627\u062c\u0639 \u0628\u0647",
                        "\u0627\u0648\u0633 \u0648\u0631\u062a\u0647 \u0633\u067e\u0627\u0631\u0644 \u0634\u0648\u06cc"
                      )}
                    </span>
                    <strong>
                      {selectedCustomer
                        .assignedEmployeeName ||
                        "-"}
                    </strong>
                  </div>

                  <div>
                    <span>{tx("Department", "\u062f\u06cc\u067e\u0627\u0631\u062a\u0645\u0646\u062a", "\u0689\u06cc\u067e\u0627\u0631\u067c\u0645\u0646\u067c")}</span>
                    <strong>
                      {customerTypeLabel(
                        selectedCustomer.customerType
                      )}
                    </strong>
                  </div>
                </div>

                <label>
                  {tx("Assign To", "\u0631\u0627\u062c\u0639 \u0628\u0647", "\u0648\u0631\u062a\u0647 \u0633\u067e\u0627\u0631\u0644")}

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
                      {tx(
                        "Select employee",
                        "\u06a9\u0627\u0631\u0645\u0646\u062f \u0631\u0627 \u0627\u0646\u062a\u062e\u0627\u0628 \u06a9\u0646\u06cc\u062f",
                        "\u06a9\u0627\u0631\u06a9\u0648\u0648\u0646\u06a9\u06cc \u0648\u067c\u0627\u06a9\u0626"
                      )}
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
                  {tx("Note", "\u06cc\u0627\u062f\u062f\u0627\u0634\u062a", "\u06cc\u0627\u062f\u069a\u062a")}

                  <textarea
                    rows="4"
                    value={reassignNote}
                    onChange={(event) =>
                      setReassignNote(
                        event.target.value
                      )
                    }
                    placeholder={tx(
                      "Write the reason or instructions for this transfer...",
                      "\u062f\u0644\u06cc\u0644 \u06cc\u0627 \u0631\u0647\u0646\u0645\u0648\u062f \u0627\u06cc\u0646 \u0627\u0646\u062a\u0642\u0627\u0644 \u0631\u0627 \u0628\u0646\u0648\u06cc\u0633\u06cc\u062f...",
                      "\u062f \u062f\u06d0 \u0644\u06d0\u0696\u062f \u0644\u0627\u0645\u0644 \u06cc\u0627 \u0644\u0627\u0631\u069a\u0648\u0648\u0646\u0647 \u0648\u0644\u06cc\u06a9\u0626..."
                    )}
                  />
                </label>

                <div>
                  <button
                    type="button"
                    onClick={closeReassign}
                    disabled={savingAction}
                  >
                    {tx("Cancel", "\u0644\u063a\u0648", "\u0644\u063a\u0648\u0647")}
                  </button>

                  <button
                    type="submit"
                    className="primary"
                    disabled={savingAction}
                  >
                    <UserRoundPlus size={15} />

                    {savingAction
                      ? tx(
                          "Assigning...",
                          "\u062f\u0631 \u062d\u0627\u0644 \u0631\u0627\u062c\u0639 \u0633\u0627\u062e\u062a\u0646...",
                          "\u0633\u067e\u0627\u0631\u0644 \u06a9\u06d0\u0696\u064a..."
                        )
                      : tx(
                          "Assign Customer",
                          "\u0631\u0627\u062c\u0639 \u0633\u0627\u062e\u062a\u0646 \u0645\u0634\u062a\u0631\u06cc",
                          "\u067e\u06d0\u0631\u0648\u062f\u0648\u0646\u06a9\u06cc \u0633\u067e\u0627\u0631\u0644"
                        )}
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
                  {tx("Accept", "\u0642\u0628\u0648\u0644", "\u0645\u0646\u0644")}
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
                  {tx("Reject", "\u0631\u062f", "\u0631\u062f\u0648\u0644")}
                </button>

                <button
                  type="button"
                  className="reassign"
                  disabled={savingAction}
                  onClick={openReassign}
                >
                  <UserRoundPlus size={16} />
                  {tx(
                    "Assign to another",
                    "\u0631\u0627\u062c\u0639 \u0628\u0647 \u0634\u062e\u0635 \u062f\u06cc\u06af\u0631",
                    "\u0628\u0644 \u0686\u0627 \u062a\u0647 \u0633\u067e\u0627\u0631\u0644"
                  )}
                </button>

                {(isFollowUpComplete(selectedCustomer) ||
                  normalize(
                    selectedCustomer.assignmentStatus
                  ) === "accepted") && (
                  <button
                    type="button"
                    className={`followup ${
                      isFollowUpComplete(selectedCustomer)
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

                    {isFollowUpComplete(selectedCustomer)
                      ? tx(
                          "Open Follow Up",
                          "\u0628\u0627\u0632 \u06a9\u0631\u062f\u0646 \u067e\u06cc\u06af\u06cc\u0631\u06cc",
                          "\u062a\u0639\u0642\u06cc\u0628 \u067e\u0631\u0627\u0646\u06cc\u0633\u062a\u0644"
                        )
                      : tx(
                          "Start Follow Up",
                          "\u0634\u0631\u0648\u0639 \u067e\u06cc\u06af\u06cc\u0631\u06cc",
                          "\u062a\u0639\u0642\u06cc\u0628 \u067e\u06cc\u0644\u0648\u0644"
                        )}
                  </button>
                )}


              </footer>
            ) : (
              <form
                className="my-account-message-form"
                onSubmit={saveMessage}
              >
                <label>
                  {tx("Message", "\u067e\u06cc\u0627\u0645", "\u067e\u06cc\u063a\u0627\u0645")}

                  <textarea
                    rows="4"
                    value={messageText}
                    onChange={(event) =>
                      setMessageText(
                        event.target.value
                      )
                    }
                    placeholder={tx(
                      "Write your message...",
                      "\u067e\u06cc\u0627\u0645 \u062e\u0648\u062f \u0631\u0627 \u0628\u0646\u0648\u06cc\u0633\u06cc\u062f...",
                      "\u062e\u067e\u0644 \u067e\u06cc\u063a\u0627\u0645 \u0648\u0644\u06cc\u06a9\u0626..."
                    )}
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
                    {tx("Cancel", "\u0644\u063a\u0648", "\u0644\u063a\u0648\u0647")}
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
                      ? tx(
                          "Saving...",
                          "\u062f\u0631 \u062d\u0627\u0644 \u0630\u062e\u06cc\u0631\u0647...",
                          "\u062e\u0648\u0646\u062f\u064a \u06a9\u06d0\u0696\u064a..."
                        )
                      : tx(
                          "Save Message",
                          "\u0630\u062e\u06cc\u0631\u0647 \u067e\u06cc\u0627\u0645",
                          "\u067e\u06cc\u063a\u0627\u0645 \u062e\u0648\u0646\u062f\u064a \u06a9\u0693\u0626"
                        )}
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
