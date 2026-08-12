import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ClipboardList,
  Eye,
  EyeOff,
  Gift,
  KeyRound,
  MessageCircle,
  Pencil,
  Trash2,
  TrendingUp,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import { useJsonCollection } from "../hooks/useJsonCollection";
import { useEmployeeAdjustments } from "../hooks/useEmployeeAdjustments";
import { createRecordId } from "../utils/ids";
import { notify } from "../utils/notify";
import "./EmployeeDetails.css";

const accountDefaults = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const adjustmentDefaults = {
  type: "credit",
  amount: "",
  reason: "",
};

const slug = (value) =>
  String(value || "employee")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "") || "employee";

const recordDomId = (prefix, id) =>
  `${prefix}-${String(id || "")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .slice(0, 80)}`;

const parseRecordHash = (hash) => {
  const clean = decodeURIComponent(
    String(hash || "").replace(/^#/, "")
  );
  const [type, ...rest] = clean.split(":");

  return {
    type,
    id: rest.join(":"),
  };
};

export default function EmployeeDetails({
  accounts,
  setAccounts,
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [employees, , , loaded] =
    useJsonCollection("employees");

  const [customers] =
    useJsonCollection("customers");

  const [employeeReports] =
    useJsonCollection("employeeReports");

  const [adjustments, setAdjustments] =
    useEmployeeAdjustments();

  const [accountOpen, setAccountOpen] =
    useState(false);

  const [adjustmentOpen, setAdjustmentOpen] =
    useState(false);
  
  const [detailsOpen, setDetailsOpen] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [accountForm, setAccountForm] =
    useState(accountDefaults);

  const [adjustmentForm, setAdjustmentForm] =
    useState(adjustmentDefaults);

  const [
    editingAdjustmentId,
    setEditingAdjustmentId,
  ] = useState(null);

  const [
    deleteAdjustmentTarget,
    setDeleteAdjustmentTarget,
  ] = useState(null);

  const [activeWorkTab, setActiveWorkTab] =
    useState("customers");

  const [highlightedTarget, setHighlightedTarget] =
    useState(null);

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

  const translateValue = (value) => {
    const key = String(value || "");

    const values = {
      Active: tx("Active", "فعال", "فعال"),
      Inactive: tx("Inactive", "غیرفعال", "غیرفعال"),
      "On Leave": tx("On Leave", "در رخصتی", "په رخصتۍ"),
      Unspecified: tx("Unspecified", "مشخص‌نشده", "نامعلوم"),
      Consultant: tx("Consultant", "مشاوره", "مشوره"),
      Travel: tx("Travel", "سفر", "سفر"),
      Technology: tx("Technology", "تکنالوژی", "ټکنالوژي"),
      Media: tx("Media", "رسانه", "رسنۍ"),
      credit: tx("Credit", "کریدت", "کریډیټ"),
      debit: tx("Debit", "دیبت", "ډیبیټ"),
      bonus: tx("Bonus", "امتیاز", "امتیاز"),
      penalty: tx("Penalty", "جریمه", "جریمه"),
      salary: tx("Payment", "\u067e\u0631\u062f\u0627\u062e\u062a", "\u062a\u0627\u062f\u06cc\u0647"),
      Pending: tx("Pending", "در انتظار", "په تمه"),
      Approved: tx("Approved", "تأییدشده", "تأیید شوی"),
      Rejected: tx("Rejected", "ردشده", "رد شوی"),
      Completed: tx("Completed", "تکمیل‌شده", "بشپړ شوی"),
      Cancelled: tx("Cancelled", "لغوشده", "لغوه شوی"),
      None: tx("None", "هیچ", "هیڅ"),
    };

    return values[key] || value;
  };

  const employee = useMemo(
    () =>
      employees.find(
        (item) => String(item.id) === String(id)
      ),
    [employees, id]
  );

  const employeeAccount = accounts.find(
    (item) =>
      String(item.employeeId) === String(id)
  );

  const employeeCustomers = useMemo(() => {
    const employeeId = String(employee?.id || "");
    const accountId = String(employeeAccount?.id || "");
    const employeeName = String(employee?.fullName || "")
      .trim()
      .toLowerCase();

    return customers
      .filter((customer) => {
        const sourceEmployeeId = String(
          customer.sourceEmployeeId || ""
        );

        const createdByAccountId = String(
          customer.createdByAccountId || ""
        );

        const assignedByEmployeeId = String(
          customer.assignedByEmployeeId || ""
        );

        const sourceEmployeeName = String(
          customer.sourceEmployeeName ||
          customer.source ||
          customer.createdByName ||
          ""
        )
          .trim()
          .toLowerCase();

        return (
          (employeeId && sourceEmployeeId === employeeId) ||
          (employeeId &&
            assignedByEmployeeId === employeeId) ||
          (accountId &&
            createdByAccountId === accountId) ||
          (employeeName &&
            sourceEmployeeName === employeeName)
        );
      })
      .sort(
        (first, second) =>
          new Date(
            second.createdAt ||
            second.date ||
            0
          ) -
          new Date(
            first.createdAt ||
            first.date ||
            0
          )
      );
  }, [
    customers,
    employee,
    employeeAccount,
  ]);

  const employeeAdjustments = useMemo(
    () =>
      adjustments
        .filter(
          (item) =>
            String(item.employeeId) === String(id)
        )
        .sort(
          (first, second) =>
            new Date(second.createdAt || 0) -
            new Date(first.createdAt || 0)
        ),
    [adjustments, id]
  );

  const employeeDailyReports = useMemo(() => {
    const employeeId = String(employee?.id || "");
    const accountId = String(employeeAccount?.id || "");
    const employeeName = String(employee?.fullName || "")
      .trim()
      .toLowerCase();

    return employeeReports
      .filter((report) => {
        const reportEmployeeId = String(
          report.employeeId || ""
        );

        const reportAccountId = String(
          report.accountId || ""
        );

        const reportEmployeeName = String(
          report.employeeName || ""
        )
          .trim()
          .toLowerCase();

        return (
          (employeeId &&
            reportEmployeeId === employeeId) ||
          (accountId &&
            reportAccountId === accountId) ||
          (employeeName &&
            reportEmployeeName ===
              employeeName)
        );
      })
      .sort(
        (first, second) =>
          new Date(second.createdAt || 0) -
          new Date(first.createdAt || 0)
      );
  }, [
    employeeReports,
    employee,
    employeeAccount,
  ]);


  const totalBonus = employeeAdjustments
    .filter((item) => item.type === "bonus")
    .reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );

  const totalPenalty = employeeAdjustments
    .filter((item) => item.type === "penalty")
    .reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );

  const totalCreditOnly = employeeAdjustments
    .filter((item) => item.type === "credit")
    .reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );

  const totalDebitOnly = employeeAdjustments
    .filter((item) => item.type === "debit")
    .reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );

  const totalSalary = employeeAdjustments
    .filter((item) => item.type === "salary")
    .reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );

  const totalPayments = totalSalary;

  const totalCredit =
    totalCreditOnly +
    totalBonus +
    totalSalary;

  const totalDebit =
    totalDebitOnly +
    totalPenalty;

  const ledgerBalance =
    totalCredit - totalDebit;

  const netBalance = ledgerBalance;

  const anyModalOpen =
    accountOpen ||
    adjustmentOpen ||
    detailsOpen ||
    Boolean(deleteAdjustmentTarget);

  useEffect(() => {
    const target = parseRecordHash(location.hash);

    if (!target.type || !target.id) {
      setHighlightedTarget(null);
      return;
    }

    setHighlightedTarget(target);

    if (target.type === "ledger") {
      setActiveWorkTab("ledger");
    }

    if (target.type === "reports") {
      setActiveWorkTab("reports");
    }

    window.setTimeout(() => {
      const element = document.getElementById(
        recordDomId(
          `employee-${target.type}`,
          target.id
        )
      );

      element?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 120);
  }, [location.hash]);

  useEffect(() => {
    if (!anyModalOpen) return undefined;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";
    document.body.classList.add(
      "employee-profile-modal-open"
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      document.body.classList.remove(
        "employee-profile-modal-open"
      );
    };
  }, [anyModalOpen]);

  useEffect(() => {
    const closeWithEscape = (event) => {
      if (event.key !== "Escape") return;

      if (accountOpen) {
        closeAccount();
      }

      if (detailsOpen) {
        setDetailsOpen(false);
      }

      if (adjustmentOpen) {
        closeAdjustment();
      }
    };

    document.addEventListener(
      "keydown",
      closeWithEscape
    );

    return () =>
      document.removeEventListener(
        "keydown",
        closeWithEscape
      );
    }, [accountOpen, adjustmentOpen, detailsOpen]);

  const openAccount = () => {
    const suggestedEmail =
      employeeAccount?.email ||
      employee?.email ||
      "";

    setAccountForm({
      username:
        employeeAccount?.username ||
        (suggestedEmail
          ? suggestedEmail.split("@")[0]
          : slug(employee?.fullName)),
      email: suggestedEmail,
      password: "",
      confirmPassword: "",
    });

    setShowPassword(false);
    setShowConfirmPassword(false);
    setAccountOpen(true);
  };

  const closeAccount = () => {
    setAccountOpen(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setAccountForm(accountDefaults);
  };

  const openAdjustment = (entry = null) => {
    const ledgerEntry = entry?.id ? entry : null;

    setEditingAdjustmentId(ledgerEntry?.id || null);
    setAdjustmentForm(
      ledgerEntry
        ? {
            type: ledgerEntry.type || "credit",
            amount: ledgerEntry.amount || "",
            reason: ledgerEntry.reason || "",
          }
        : adjustmentDefaults
    );
    setAdjustmentOpen(true);
  };

  const closeAdjustment = () => {
    setAdjustmentOpen(false);
    setAdjustmentForm(adjustmentDefaults);
    setEditingAdjustmentId(null);
  };

  const requestDeleteAdjustment = (entry) => {
    setDeleteAdjustmentTarget(entry);
  };

  const closeDeleteAdjustment = () => {
    setDeleteAdjustmentTarget(null);
  };

  const updateAccountField = (event) => {
    const { name, value } = event.target;

    setAccountForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const updateAdjustmentField = (event) => {
    const { name, value } = event.target;

    setAdjustmentForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const saveAccount = async (event) => {
    event.preventDefault();

    const username = accountForm.username
      .trim()
      .toLowerCase();

    const email = accountForm.email
      .trim()
      .toLowerCase();

    if (!username) {
      notify(tx("Username is required.", "نام کاربری ضروری است.", "کارن نوم اړین دی."), "error");
      return;
    }

    if (
      !employeeAccount &&
      !accountForm.password
    ) {
      notify(tx("Password is required.", "رمز عبور ضروری است.", "پټنوم اړین دی."), "error");
      return;
    }

    if (
      accountForm.password &&
      accountForm.password.length < 4
    ) {
      notify(
        tx("Password must be at least 4 characters.", "رمز عبور باید حداقل ۴ حرف باشد.", "پټنوم باید لږ تر لږه ۴ توري ولري."),
        "error"
      );
      return;
    }

    if (
      accountForm.password !==
      accountForm.confirmPassword
    ) {
      notify(
        tx("Password confirmation does not match.", "تأیید رمز عبور مطابقت ندارد.", "د پټنوم تأیید برابر نه دی."),
        "error"
      );
      return;
    }

    const duplicateAccount = accounts.some(
      (item) =>
        String(item.id) !==
          String(employeeAccount?.id) &&
        (String(item.username || "")
          .toLowerCase() === username ||
          (email &&
            String(item.email || "")
              .toLowerCase() === email))
    );

    if (duplicateAccount) {
      notify(
        tx("Username or email is already in use.", "نام کاربری یا ایمیل قبلاً استفاده شده است.", "کارن نوم یا برېښنالیک لا دمخه کارول شوی."),
        "error"
      );
      return;
    }

const departments =
  Array.isArray(employee.departments) &&
  employee.departments.length
    ? employee.departments
    : employee.department
      ? [employee.department]
      : ["Consultant"];

const department =
  departments[0] ||
  "Consultant";

const employeeRoles = Array.isArray(employee.roles)
  ? employee.roles
  : employee.role
    ? [employee.role]
    : [];

const hasEmployeeRole = (roleName) =>
  employeeRoles.some(
    (role) =>
      String(role || "")
        .trim()
        .toLowerCase() === roleName
  );

  const isAdminAccount = employeeRoles.some(
    (role) => {
      const normalizedRole = String(role || "")
        .trim()
        .toLowerCase();
  
      return (
        normalizedRole === "admin" ||
        normalizedRole === "full admin" ||
        normalizedRole === "administrator"
      );
    }
  );
  
  const isReceptionAccount =
    hasEmployeeRole("reception");

  const isCallCenterAccount =
    hasEmployeeRole("call center") ||
    hasEmployeeRole("callcenter");

  const employeePermissions = {
    ...(!isReceptionAccount || isCallCenterAccount
      ? {
          dashboard: {
            view: true,
            create: true,
            edit: true,
          },
        }
      : {}),

    ...(isReceptionAccount
      ? {
          customers: {
            view: true,
            create: true,
            edit: true,
          },
        }
      : {}),
  };

const record = {
  ...(employeeAccount || {}),

  id:
    employeeAccount?.id ||
    createRecordId(),

  employeeId: employee.id,
  fullName: employee.fullName,
  username,
  email,

  role: isAdminAccount
    ? "Admin"
    : employeeRoles[0] || "Employee",

  primaryRole: isAdminAccount
    ? "Admin"
    : employeeRoles[0] || "Employee",

  roles: employeeRoles.length
    ? employeeRoles
    : ["Employee"],

  accountType: isAdminAccount
    ? "admin"
    : "employee",

  department,
  departments,
  status: "Active",

  permissions: isAdminAccount
  ? {
      all: true,
    }
  : employeePermissions,

  isAdmin: isAdminAccount,
  isFullAdmin: isAdminAccount,

  createdAt:
    employeeAccount?.createdAt ||
    new Date().toISOString(),

  updatedAt: new Date().toISOString(),

  ...(accountForm.password
    ? {
        password: accountForm.password,
      }
    : {}),
};

    const nextAccounts = employeeAccount
      ? accounts.map((item) =>
          String(item.id) ===
          String(employeeAccount.id)
            ? record
            : item
        )
      : [...accounts, record];

    const saved =
      await setAccounts(nextAccounts);

    if (!saved) return;

    notify(
      employeeAccount
        ? tx("Employee account updated.", "حساب کارمند ویرایش شد.", "د کارکوونکي حساب سم شو.")
        : tx("Employee account created.", "حساب کارمند ایجاد شد.", "د کارکوونکي حساب جوړ شو."),
      "success"
    );

    closeAccount();
  };

  const openEmployeeChat = () => {
    if (!employeeAccount?.id) {
      notify(
        tx("First create a login account for this employee.", "ابتدا برای این کارمند حساب ورود ایجاد کنید.", "لومړی د دې کارکوونکي لپاره د ننوتلو حساب جوړ کړئ."),
        "error"
      );
      return;
    }

    navigate(
      `/team-chat?employee=${encodeURIComponent(
        employeeAccount.id
      )}`
    );
  };

  const saveAdjustment = async (event) => {
    event.preventDefault();

    const amount = Number(
      adjustmentForm.amount
    );

    if (!(amount > 0)) {
      notify(
        tx("Enter a valid amount.", "مبلغ معتبر وارد کنید.", "معتبره اندازه ولیکئ."),
        "error"
      );
      return;
    }

    const now = new Date().toISOString();

    const previousRecord = editingAdjustmentId
      ? adjustments.find(
          (item) =>
            String(item.id) ===
            String(editingAdjustmentId)
        )
      : null;

    const record = {
      ...(previousRecord || {}),
      id:
        previousRecord?.id ||
        createRecordId(),
      employeeId: employee.id,
      employeeAccountId:
        employeeAccount?.id ||
        previousRecord?.employeeAccountId ||
        "",
      employeeName: employee.fullName,
      employeeEmail:
        employee?.email ||
        employeeAccount?.email ||
        previousRecord?.employeeEmail ||
        "",
      employeeUsername:
        employeeAccount?.username ||
        previousRecord?.employeeUsername ||
        "",
      ...adjustmentForm,
      amount,
      createdAt:
        previousRecord?.createdAt || now,
      updatedAt: now,
      ...(!previousRecord
        ? {
            employeeNotificationType:
              `ledger-${adjustmentForm.type}`,
            employeeNotificationAt: now,
          }
        : {}),
    };

    const nextAdjustments = previousRecord
      ? adjustments.map((item) =>
          String(item.id) ===
          String(previousRecord.id)
            ? record
            : item
        )
      : [
          ...adjustments,
          record,
        ];

    const saved =
      await setAdjustments(nextAdjustments);

    if (!saved) return;

    window.dispatchEvent(
      new CustomEvent("isp-employee-ledger-updated", {
        detail: {
          entryId: record.id,
          employeeId: record.employeeId,
          employeeAccountId: record.employeeAccountId,
          updatedAt: record.updatedAt,
        },
      })
    );

    notify(
      previousRecord
        ? tx("Employee ledger entry updated.", "\u062b\u0628\u062a \u0645\u0627\u0644\u06cc \u06a9\u0627\u0631\u0645\u0646\u062f \u0648\u06cc\u0631\u0627\u06cc\u0634 \u0634\u062f.", "\u062f \u06a9\u0627\u0631\u06a9\u0648\u0648\u0646\u06a9\u064a \u0645\u0627\u0644\u064a \u062b\u0628\u062a \u0633\u0645 \u0634\u0648.")
        : adjustmentForm.type === "salary"
          ? tx("Payment saved successfully.", "\u067e\u0631\u062f\u0627\u062e\u062a \u0628\u0627 \u0645\u0648\u0641\u0642\u06cc\u062a \u0630\u062e\u06cc\u0631\u0647 \u0634\u062f.", "\u062a\u0627\u062f\u064a\u0647 \u067e\u0647 \u0628\u0631\u064a\u0627\u0644\u064a\u062a\u0648\u0628 \u0633\u0631\u0647 \u062e\u0648\u0646\u062f\u064a \u0634\u0648\u0647.")
          : tx("Employee ledger entry saved.", "ثبت مالی کارمند ذخیره شد.", "د کارکوونکي مالي ثبت خوندي شو."),
      "success"
    );

    closeAdjustment();
  };

  const deleteAdjustment = async () => {
    if (!deleteAdjustmentTarget) return;

    const saved = await setAdjustments(
      adjustments.filter(
        (item) =>
          String(item.id) !==
          String(deleteAdjustmentTarget.id)
      )
    );

    if (!saved) return;

    window.dispatchEvent(
      new CustomEvent("isp-employee-ledger-updated", {
        detail: {
          entryId: deleteAdjustmentTarget.id,
          employeeId: deleteAdjustmentTarget.employeeId,
          employeeAccountId:
            deleteAdjustmentTarget.employeeAccountId,
          deleted: true,
          updatedAt: new Date().toISOString(),
        },
      })
    );

    notify(
      tx("Employee ledger entry deleted.", "\u062b\u0628\u062a \u0645\u0627\u0644\u06cc \u06a9\u0627\u0631\u0645\u0646\u062f \u062d\u0630\u0641 \u0634\u062f.", "\u062f \u06a9\u0627\u0631\u06a9\u0648\u0648\u0646\u06a9\u064a \u0645\u0627\u0644\u064a \u062b\u0628\u062a \u062d\u0630\u0641 \u0634\u0648."),
      "success"
    );

    closeDeleteAdjustment();
  };

  if (!loaded) {
    return (
      <div className="page-loading">
        {tx("Loading employee...", "در حال بارگذاری کارمند...", "کارکوونکی بارېږي...")}
      </div>
    );
  }

  if (!employee) {
    return (
      <div className={`employee-profile-page ${interfaceLanguage !== "en" ? "employee-profile-page-rtl" : ""}`}>
        <button
          type="button"
          onClick={() =>
            navigate("/employees")
          }
        >
          {tx("Back to Employees", "بازگشت به کارمندان", "کارکوونکو ته بېرته")}
        </button>

        <h2>{tx("Employee not found.", "کارمند پیدا نشد.", "کارکوونکی ونه موندل شو.")}</h2>
      </div>
    );
  }

  const details = [
    [tx("Phone", "شماره تماس", "د تلیفون شمېره"), employee.phone],
    [tx("Email", "ایمیل", "برېښنالیک"), employee.email],
    [tx("NIC Number", "شماره تذکره", "د تذکرې شمېره"), employee.nicNumber],
    [
      tx("Departments", "دیپارتمنت‌ها", "څانګې"),
      employee.departments?.map(translateValue).join(", "),
    ],
    [
      tx("Roles", "وظیفه‌ها", "دندې"),
      employee.roles?.map(translateValue).join(", ") ||
        translateValue(employee.role),
    ],
    [tx("Status", "وضعیت", "حالت"), translateValue(employee.status)],
    [tx("Contract Start", "شروع قرارداد", "د قرارداد پیل"), employee.startDate],
    [tx("Contract End", "ختم قرارداد", "د قرارداد پای"), employee.endDate],
    [tx("Notes", "یادداشت", "یادښت"), employee.notes],
  ];

  return (
    <div className="employee-profile-page">
      <header className="employee-profile-header">
        <div>
          <button
            type="button"
            className="employee-profile-back"
            onClick={() =>
              navigate("/employees")
            }
          >
            <ArrowLeft size={17} />
            {tx("Employees", "کارمندان", "کارکوونکي")}
          </button>

          <h1>{tx("Employee Profile", "پروفایل کارمند", "د کارکوونکي پروفایل")}</h1>

          <p>
            {tx(
              "Complete information, login account, customers, and employee ledger.",
              "معلومات کامل، حساب ورود، مشتریان و حساب مالی کارمند.",
              "بشپړ معلومات، د ننوتلو حساب، پېرودونکي او د کارکوونکي مالي حساب."
            )}
          </p>
        </div>

        <div className="employee-profile-actions">

          <button
            type="button"
            onClick={() => setDetailsOpen(true)}
          >
            <Eye size={15} />
            {tx("View Details", "نمایش جزئیات", "تفصیل وګورئ")}
          </button>

          <button
            type="button"
            className="employee-assessment-button"
            onClick={() =>
              navigate(`/employees/${employee.id}/performance`)
            }
          >
            <TrendingUp size={15} />
            {tx("Assessment", "ارزیابی", "ارزونه")}
          </button>

          <button
            type="button"
            onClick={openAdjustment}
          >
            <Gift size={15} />
            {tx("Add Ledger Entry", "افزودن ثبت مالی", "مالي ثبت زیاتول")}
          </button>

          <button
            type="button"
            className="primary"
            onClick={openAccount}
          >
            {employeeAccount ? (
              <Pencil size={15} />
            ) : (
              <KeyRound size={15} />
            )}

            {employeeAccount
              ? tx("Edit Account", "ویرایش حساب", "حساب سمول")
              : tx("Create Account", "ایجاد حساب", "حساب جوړول")}
          </button>
        </div>
      </header>

      <section
          className={`employee-profile-hero ${
            String(employee.status || "").toLowerCase() === "active"
              ? "employee-profile-active"
              : ""
          }`}
        >
        <div className="employee-profile-photo">
          {employee.image ? (
            <img
              src={employee.image}
              alt={employee.fullName}
            />
          ) : (
            String(
              employee.fullName || "E"
            ).slice(0, 1)
          )}
        </div>

        <div>
          <span>
            {translateValue(
              employee.status || "Unspecified"
            )}
          </span>

          <h2>
            {employee.fullName ||
              tx("Unnamed Employee", "کارمند بدون نام", "بې نومه کارکوونکی")}
          </h2>

          <p>
            {employee.departments?.length
              ? employee.departments
                  .map(translateValue)
                  .join(" • ")
              : tx("No department", "بدون دیپارتمنت", "څانګه نشته")}
          </p>
        </div>

        <aside>
          <small>{tx("Net Balance", "بیلانس خالص", "خالص بیلانس")}</small>

          <strong>
            {netBalance.toLocaleString("en-US")} AFN
          </strong>

          <em>
            {tx("Credit", "کریدت", "کریډیټ")}{" "}
            {totalCredit.toLocaleString("en-US")} ·{" "}
            {tx("Debit", "دیبت", "ډیبیټ")}{" "}
            {totalDebit.toLocaleString("en-US")}
          </em>
        </aside>
      </section>

      <section className="employee-work-tabs" aria-label="Employee work sections">
        <button
          type="button"
          className={activeWorkTab === "customers" ? "active" : ""}
          onClick={() => setActiveWorkTab("customers")}
        >
          <Users size={17} />
          <span>{tx("Customers Registered by Employee", "مشتریان ثبت‌شده توسط کارمند", "د کارکوونکي لخوا ثبت شوي پېرودونکي")}</span>
          <strong>{employeeCustomers.length}</strong>
        </button>

        <button
          type="button"
          className={activeWorkTab === "ledger" ? "active" : ""}
          onClick={() => setActiveWorkTab("ledger")}
        >
          <WalletCards size={17} />
          <span>{tx("Employee Ledger", "حساب مالی کارمند", "د کارکوونکي مالي حساب")}</span>
          <strong>{employeeAdjustments.length}</strong>
        </button>

        <button
          type="button"
          className={activeWorkTab === "reports" ? "active" : ""}
          onClick={() => setActiveWorkTab("reports")}
        >
          <ClipboardList size={17} />
          <span>{tx("Daily Reports", "راپورهای روزانه", "ورځني راپورونه")}</span>
          <strong>{employeeDailyReports.length}</strong>
        </button>
      </section>

      {activeWorkTab === "customers" && (
        <section className="employee-work-card">
          <div className="employee-work-header">
            <div>
              <span>{tx("Employee Performance", "عملکرد کارمند", "د کارکوونکي فعالیت")}</span>
              <h2>{tx("Registered Customers", "مشتریان ثبت‌شده", "ثبت شوي پېرودونکي")}</h2>
              <p>
                {tx(
                  "All customers registered or referred by",
                  "تمام مشتریان ثبت یا ارجاع‌شده توسط",
                  "ټول هغه پېرودونکي چې ثبت یا راجع شوي د"
                )}{" "}
                {employee.fullName ||
                  tx("this employee", "این کارمند", "دې کارکوونکي")}.
              </p>
            </div>

            <strong>{employeeCustomers.length}</strong>
          </div>

          <div className="employee-work-table-wrap">
            <table className="employee-work-table">
              <thead>
                <tr>
                  <th>{tx("Customer", "مشتری", "پېرودونکی")}</th>
                  <th>{tx("Phone", "شماره تماس", "د تلیفون شمېره")}</th>
                  <th>{tx("Customer Type", "نوع مشتری", "د پېرودونکي ډول")}</th>
                  <th>{tx("Purpose", "هدف", "موخه")}</th>
                  <th>{tx("Date", "تاریخ", "نېټه")}</th>
                  <th>{tx("Status", "وضعیت", "حالت")}</th>
                </tr>
              </thead>

              <tbody>
                {employeeCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <strong>
                        {customer.fullName ||
                          customer.customerName ||
                          customer.personName ||
                          "-"}
                      </strong>
                    </td>

                    <td>
                      {customer.phone ||
                        customer.contactNumber ||
                        "-"}
                    </td>

                    <td>
                      <span className="employee-work-type">
                        {translateValue(
                          customer.customerType ||
                            customer.type ||
                            "-"
                        )}
                      </span>
                    </td>

                    <td>
                      {customer.technologyPurpose ||
                        customer.purpose ||
                        customer.about ||
                        "-"}
                    </td>

                    <td>
                      {customer.date
                        ? new Date(
                            `${customer.date}T00:00:00`
                          ).toLocaleDateString()
                        : customer.createdAt
                          ? new Date(
                              customer.createdAt
                            ).toLocaleDateString()
                          : "-"}
                    </td>

                    <td>
                      <span
                        className={`employee-work-status ${String(
                          customer.assignmentStatus ||
                            customer.status ||
                            "None"
                        )
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        {translateValue(
                          customer.assignmentStatus ||
                            customer.status ||
                            "None"
                        )}
                      </span>
                    </td>
                  </tr>
                ))}

                {!employeeCustomers.length && (
                  <tr>
                    <td
                      colSpan="6"
                      className="employee-work-empty"
                    >
                      {tx(
                        "No customers have been registered by this employee yet.",
                        "هنوز هیچ مشتری توسط این کارمند ثبت نشده است.",
                        "تر اوسه د دې کارکوونکي لخوا هېڅ پېرودونکی نه دی ثبت شوی."
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeWorkTab === "ledger" && (
        <section className="employee-work-card employee-ledger-card">
          <div className="employee-work-header">
            <div>
              <span>{tx("Financial Activity", "فعالیت مالی", "مالي فعالیت")}</span>
              <h2>{tx("Employee Ledger", "حساب مالی کارمند", "د کارکوونکي مالي حساب")}</h2>
              <p>
                {tx(
                  "Bonus, penalty, payment and remaining balance records for",
                  "\u0633\u0648\u0627\u0628\u0642 \u0627\u0645\u062a\u06cc\u0627\u0632\u060c \u062c\u0631\u06cc\u0645\u0647\u060c \u067e\u0631\u062f\u0627\u062e\u062a \u0648 \u0628\u0627\u0642\u06cc \u0645\u0627\u0646\u062f\u0647 \u0628\u0631\u0627\u06cc",
                  "\u062f \u0627\u0645\u062a\u06cc\u0627\u0632\u060c \u062c\u0631\u06cc\u0645\u06d0\u060c \u062a\u0627\u062f\u06cc\u06d0 \u0627\u0648 \u067e\u0627\u062a\u06d0 \u0628\u06cc\u0644\u0627\u0646\u0633 \u0631\u06cc\u06a9\u0627\u0631\u0689\u0648\u0646\u0647 \u062f"
                )}{" "}
                {employee.fullName ||
                  tx("this employee", "این کارمند", "دې کارکوونکي")}.
              </p>
            </div>

            <strong>{employeeAdjustments.length}</strong>
          </div>

          <div className="employee-ledger-summary">
            <div>
              <span>{tx("Total Bonuses", "\u0645\u062c\u0645\u0648\u0639 \u0627\u0645\u062a\u06cc\u0627\u0632\u0647\u0627", "\u062f \u0627\u0645\u062a\u06cc\u0627\u0632\u0648\u0646\u0648 \u0645\u062c\u0645\u0648\u0639\u0647")}</span>
              <strong>
                {totalBonus.toLocaleString("en-US")} AFN
              </strong>
            </div>

            <div>
              <span>{tx("Total Penalties", "\u0645\u062c\u0645\u0648\u0639 \u062c\u0631\u06cc\u0645\u0647\u200c\u0647\u0627", "\u062f \u062c\u0631\u06cc\u0645\u0648 \u0645\u062c\u0645\u0648\u0639\u0647")}</span>
              <strong className="debit">
                {totalPenalty.toLocaleString("en-US")} AFN
              </strong>
            </div>

            <div>
              <span>{tx("Total Payments", "\u0645\u062c\u0645\u0648\u0639 \u067e\u0631\u062f\u0627\u062e\u062a\u200c\u0647\u0627", "\u062f \u062a\u0627\u062f\u06cc\u0627\u062a\u0648 \u0645\u062c\u0645\u0648\u0639\u0647")}</span>
              <strong className="credit">
                {totalPayments.toLocaleString("en-US")} AFN
              </strong>
            </div>

            <div>
              <span>{tx("Remaining", "\u0628\u0627\u0642\u06cc \u0645\u0627\u0646\u062f\u0647", "\u067e\u0627\u062a\u06d0")}</span>
              <strong
                className={
                  ledgerBalance < 0
                    ? "debit"
                    : "credit"
                }
              >
                {ledgerBalance.toLocaleString("en-US")} AFN
              </strong>
            </div>
          </div>

          <div className="employee-work-table-wrap">
            <table className="employee-work-table employee-ledger-table">
              <thead>
                <tr>
                  <th>{tx("Date", "تاریخ", "نېټه")}</th>
                  <th>{tx("Type", "نوع", "ډول")}</th>
                  <th>{tx("Debit", "دیبت", "ډیبیټ")}</th>
                  <th>{tx("Credit", "کریدت", "کریډیټ")}</th>
                  <th>{tx("Reason / Note", "دلیل / یادداشت", "لامل / یادښت")}</th>
                  <th>{tx("Actions", "\u0639\u0645\u0644\u06cc\u0627\u062a", "\u06a9\u0693\u0646\u06d0")}</th>
                </tr>
              </thead>

              <tbody>
                {employeeAdjustments.map((entry) => {
                  const amount = Number(entry.amount || 0);
                  const isCredit =
                    entry.type === "credit" ||
                    entry.type === "bonus" ||
                    entry.type === "salary";

                  return (
                    <tr
                      key={entry.id}
                      id={recordDomId(
                        "employee-ledger",
                        entry.id
                      )}
                      className={
                        highlightedTarget?.type ===
                          "ledger" &&
                        String(highlightedTarget?.id) ===
                          String(entry.id)
                          ? "employee-target-highlight"
                          : ""
                      }
                    >
                      <td>
                        {entry.createdAt
                          ? new Date(
                              entry.createdAt
                            ).toLocaleDateString()
                          : "-"}
                      </td>

                      <td>
                        <span
                          className={`employee-ledger-type ${entry.type}`}
                        >
                          {translateValue(entry.type)}
                        </span>
                      </td>

                      <td className="employee-ledger-debit">
                        {!isCredit
                          ? `${amount.toLocaleString("en-US")} AFN`
                          : "-"}
                      </td>

                      <td className="employee-ledger-credit">
                        {isCredit
                          ? `${amount.toLocaleString("en-US")} AFN`
                          : "-"}
                      </td>

                      <td>{entry.reason || "-"}</td>

                      <td>
                        <div className="employee-ledger-actions">
                          <button
                            type="button"
                            onClick={() =>
                              openAdjustment(entry)
                            }
                            aria-label={tx("Edit ledger entry", "\u0648\u06cc\u0631\u0627\u06cc\u0634 \u062b\u0628\u062a \u0645\u0627\u0644\u06cc", "\u0645\u0627\u0644\u064a \u062b\u0628\u062a \u0633\u0645\u0648\u0644")}
                            title={tx("Edit", "\u0648\u06cc\u0631\u0627\u06cc\u0634", "\u0633\u0645\u0648\u0644")}
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            type="button"
                            className="delete"
                            onClick={() =>
                              requestDeleteAdjustment(entry)
                            }
                            aria-label={tx("Delete ledger entry", "\u062d\u0630\u0641 \u062b\u0628\u062a \u0645\u0627\u0644\u06cc", "\u0645\u0627\u0644\u064a \u062b\u0628\u062a \u062d\u0630\u0641\u0648\u0644")}
                            title={tx("Delete", "\u062d\u0630\u0641", "\u062d\u0630\u0641\u0648\u0644")}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!employeeAdjustments.length && (
                  <tr>
                    <td
                      colSpan="6"
                      className="employee-work-empty"
                    >
                      {tx(
                        "No ledger records have been added for this employee yet.",
                        "هنوز هیچ ثبت مالی برای این کارمند اضافه نشده است.",
                        "تر اوسه د دې کارکوونکي لپاره هېڅ مالي ثبت نه دی زیات شوی."
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeWorkTab === "reports" && (
        <section className="employee-work-card employee-report-card">
          <div className="employee-work-header">
            <div>
              <span>{tx("Daily Work Reports", "راپورهای کاری روزانه", "ورځني کاري راپورونه")}</span>
              <h2>{tx("Employee Reports", "راپورهای کارمند", "د کارکوونکي راپورونه")}</h2>
              <p>
                {tx(
                  "End-of-day reports submitted by",
                  "راپورهای آخر روز ثبت‌شده توسط",
                  "د ورځې پای راپورونه چې ثبت کړي"
                )}{" "}
                {employee.fullName ||
                  tx("this employee", "این کارمند", "دې کارکوونکي")}.
              </p>
            </div>

            <strong>{employeeDailyReports.length}</strong>
          </div>

          <div className="employee-report-list">
            {employeeDailyReports.map((report) => (
              <article
                key={report.id}
                id={recordDomId(
                  "employee-reports",
                  report.id
                )}
                className={
                  highlightedTarget?.type ===
                    "reports" &&
                  String(highlightedTarget?.id) ===
                    String(report.id)
                    ? "employee-target-highlight"
                    : ""
                }
              >
                <div className="employee-report-date">
                  <strong>
                    {report.afghanistanDate ||
                      report.date ||
                      "-"}
                  </strong>

                  <span>
                    {report.afghanistanTime ||
                      report.time ||
                      "-"}
                  </span>
                </div>

                <div className="employee-report-body">
                  <p>{report.reportText}</p>

                  {report.updatedAt &&
                    report.updatedAt !==
                      report.createdAt && (
                      <small>
                        {tx("Edited", "ویرایش‌شده", "سم شوی")}{" "}
                        {new Date(
                          report.updatedAt
                        ).toLocaleString()}
                      </small>
                    )}
                </div>
              </article>
            ))}

            {!employeeDailyReports.length && (
              <div className="employee-work-empty employee-report-empty">
                {tx(
                  "No daily reports have been submitted by this employee yet.",
                  "هنوز هیچ راپور روزانه توسط این کارمند ثبت نشده است.",
                  "تر اوسه د دې کارکوونکي لخوا ورځنی راپور نه دی ثبت شوی."
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {accountOpen && (
        <div
          className="employee-profile-modal"
          role="presentation"
          onMouseDown={closeAccount}
        >
          <form
            className="employee-account-modal-form"
            onSubmit={saveAccount}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="employee-account-title"
          >
            <header>
              <div>
                <h2 id="employee-account-title">
                  {employeeAccount
                    ? tx("Edit Account", "ویرایش حساب", "حساب سمول")
                    : tx("Create Account", "ایجاد حساب", "حساب جوړول")}
                </h2>

                <p>
                  {tx(
                    "Username and email are suggested automatically and remain editable.",
                    "نام کاربری و ایمیل به‌صورت خودکار پیشنهاد می‌شوند و قابل ویرایش هستند.",
                    "کارن نوم او برېښنالیک په اوتومات ډول وړاندیز کېږي او د سمون وړ دي."
                  )}
                </p>
              </div>

              <button
                type="button"
                className="employee-profile-modal-close"
                onClick={closeAccount}
                aria-label={tx("Close account form", "بستن فورم حساب", "د حساب فورم تړل")}
              >
                <X size={19} />
              </button>
            </header>

            <label>
              <span>{tx("Username", "نام کاربری", "کارن نوم")}</span>

              <input
                name="username"
                value={
                  accountForm.username
                }
                onChange={updateAccountField}
                autoComplete="username"
                autoFocus
              />
            </label>

            <label>
              <span>{tx("Email", "ایمیل", "برېښنالیک")}</span>

              <input
                type="email"
                name="email"
                value={accountForm.email}
                onChange={updateAccountField}
                autoComplete="email"
              />
            </label>

            <label>
              <span>
                {employeeAccount
                  ? tx("New Password (optional)", "رمز عبور جدید (اختیاری)", "نوی پټنوم (اختیاري)")
                  : tx("Password", "رمز عبور", "پټنوم")}
              </span>

              <div className="employee-password-control">
                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  value={
                    accountForm.password
                  }
                  onChange={
                    updateAccountField
                  }
                  placeholder={tx("Enter any password", "رمز عبور را وارد کنید", "پټنوم ولیکئ")}
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="employee-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
                    )
                  }
                  aria-label={
                    showPassword
                      ? tx("Hide password", "پنهان کردن رمز", "پټنوم پټول")
                      : tx("Show password", "نمایش رمز", "پټنوم ښودل")
                  }
                  title={
                    showPassword
                      ? tx("Hide password", "پنهان کردن رمز", "پټنوم پټول")
                      : tx("Show password", "نمایش رمز", "پټنوم ښودل")
                  }
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </label>

            <label>
              <span>{tx("Confirm Password", "تأیید رمز عبور", "د پټنوم تأیید")}</span>

              <div className="employee-password-control">
                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  name="confirmPassword"
                  value={
                    accountForm.confirmPassword
                  }
                  onChange={
                    updateAccountField
                  }
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="employee-password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(
                      (current) => !current
                    )
                  }
                  aria-label={
                    showConfirmPassword
                      ? tx("Hide confirm password", "پنهان کردن تأیید رمز", "د تأیید پټنوم پټول")
                      : tx("Show confirm password", "نمایش تأیید رمز", "د تأیید پټنوم ښودل")
                  }
                  title={
                    showConfirmPassword
                      ? tx("Hide password", "پنهان کردن رمز", "پټنوم پټول")
                      : tx("Show password", "نمایش رمز", "پټنوم ښودل")
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </label>

            <footer>
              <button
                type="button"
                onClick={closeAccount}
              >
                {tx("Cancel", "لغو", "لغوه")}
              </button>

              <button
                type="submit"
                className="primary"
              >
                {tx("Save Account", "ذخیره حساب", "حساب خوندي کړئ")}
              </button>
            </footer>
          </form>
        </div>
      )}


      {detailsOpen && (
        <div
          className="employee-profile-modal"
          onMouseDown={() => setDetailsOpen(false)}
        >
          <div
            className="employee-details-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <h2>{tx("Employee Details", "جزئیات کارمند", "د کارکوونکي تفصیل")}</h2>
                <p>{tx("Employee information and system account.", "معلومات کارمند و حساب سیستم.", "د کارکوونکي معلومات او سیسټم حساب.")}</p>
              </div>

              <button
                type="button"
                className="employee-profile-modal-close"
                onClick={() => setDetailsOpen(false)}
              >
                <X size={19} />
              </button>
            </header>

            <section>
              <h3>{tx("Employee Information", "معلومات کارمند", "د کارکوونکي معلومات")}</h3>

              <div className="employee-detail-list">
                {details.map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <strong>{value || "-"}</strong>
                  </div>
                ))}
              </div>
            </section>

            {employeeAccount && (
              <section>
                <h3>{tx("System Account", "حساب سیستم", "سیسټم حساب")}</h3>

                <div className="employee-detail-list">
                  <div>
                    <span>{tx("Username", "نام کاربری", "کارن نوم")}</span>
                    <strong>{employeeAccount.username || "-"}</strong>
                  </div>

                  <div>
                    <span>{tx("Email", "ایمیل", "برېښنالیک")}</span>
                    <strong>{employeeAccount.email || "-"}</strong>
                  </div>

                  <div>
                    <span>{tx("Department Dashboard", "داشبورد دیپارتمنت", "د څانګې ډشبورډ")}</span>
                    <strong>
                      {Array.isArray(
                        employeeAccount.departments
                      ) &&
                      employeeAccount.departments.length
                        ? employeeAccount.departments
                            .map(translateValue)
                            .join(", ")
                        : translateValue(
                            employeeAccount.department
                          ) || "-"}
                    </strong>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      )}

      {deleteAdjustmentTarget && (
        <div
          className="employee-profile-modal"
          role="presentation"
          onMouseDown={closeDeleteAdjustment}
        >
          <div
            className="employee-ledger-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="employee-ledger-delete-title"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <header className="employee-ledger-delete-header">
              <div className="employee-ledger-delete-icon">
                <AlertTriangle size={22} />
              </div>

              <div>
                <h2 id="employee-ledger-delete-title">
                  {tx("Delete Ledger Entry", "\u062d\u0630\u0641 \u062b\u0628\u062a \u0645\u0627\u0644\u06cc", "\u0645\u0627\u0644\u064a \u062b\u0628\u062a \u062d\u0630\u0641\u0648\u0644")}
                </h2>

                <p>
                  {tx(
                    "Are you sure you want to delete this employee ledger entry?",
                    "\u0622\u06cc\u0627 \u0645\u0637\u0645\u0626\u0646 \u0647\u0633\u062a\u06cc\u062f \u06a9\u0647 \u0627\u06cc\u0646 \u062b\u0628\u062a \u0645\u0627\u0644\u06cc \u06a9\u0627\u0631\u0645\u0646\u062f \u062d\u0630\u0641 \u0634\u0648\u062f\u061f",
                    "\u0627\u06cc\u0627 \u0628\u0627\u0648\u0631\u064a \u06cc\u0627\u0633\u062a \u0686\u06d0 \u062f\u0627 \u062f \u06a9\u0627\u0631\u06a9\u0648\u0648\u0646\u06a9\u064a \u0645\u0627\u0644\u064a \u062b\u0628\u062a \u062d\u0630\u0641 \u0634\u064a\u061f"
                  )}
                </p>
              </div>

              <button
                type="button"
                className="employee-profile-modal-close"
                onClick={closeDeleteAdjustment}
                aria-label={tx("Close", "\u0628\u0633\u062a\u0646", "\u062a\u0693\u0644")}
              >
                <X size={19} />
              </button>
            </header>

            <div className="employee-ledger-delete-summary">
              <div>
                <span>{tx("Type", "\u0646\u0648\u0639", "\u0689\u0648\u0644")}</span>
                <strong>
                  {translateValue(deleteAdjustmentTarget.type)}
                </strong>
              </div>

              <div>
                <span>{tx("Amount", "\u0645\u0628\u0644\u063a", "\u0627\u0646\u062f\u0627\u0632\u0647")}</span>
                <strong className="amount">
                  {Number(
                    deleteAdjustmentTarget.amount || 0
                  ).toLocaleString("en-US")}{" "}
                  AFN
                </strong>
              </div>

              <div className="wide">
                <span>{tx("Reason / Note", "\u062f\u0644\u06cc\u0644 / \u06cc\u0627\u062f\u062f\u0627\u0634\u062a", "\u0644\u0627\u0645\u0644 / \u06cc\u0627\u062f\u069a\u062a")}</span>
                <p>{deleteAdjustmentTarget.reason || "-"}</p>
              </div>
            </div>

            <footer className="employee-ledger-delete-actions">
              <button
                type="button"
                onClick={closeDeleteAdjustment}
              >
                {tx("Cancel", "\u0644\u063a\u0648", "\u0644\u063a\u0648\u0647")}
              </button>

              <button
                type="button"
                className="primary employee-ledger-delete-confirm"
                onClick={deleteAdjustment}
              >
                {tx("Delete", "\u062d\u0630\u0641", "\u062d\u0630\u0641\u0648\u0644")}
              </button>
            </footer>
          </div>
        </div>
      )}

      {adjustmentOpen && (
        <div
          className="employee-profile-modal"
          role="presentation"
          onMouseDown={closeAdjustment}
        >
          <form
            onSubmit={saveAdjustment}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="employee-adjustment-title"
          >
            <header>
              <div>
                <h2 id="employee-adjustment-title">
                  {editingAdjustmentId
                    ? tx("Edit Ledger Entry", "\u0648\u06cc\u0631\u0627\u06cc\u0634 \u062b\u0628\u062a \u0645\u0627\u0644\u06cc", "\u0645\u0627\u0644\u064a \u062b\u0628\u062a \u0633\u0645\u0648\u0644")
                    : tx("Employee Ledger Entry", "ثبت مالی کارمند", "د کارکوونکي مالي ثبت")}
                </h2>

                <p>
                  {tx(
                    "Add debit, credit, bonus, penalty, or payment for",
                    "\u062f\u06cc\u0628\u062a\u060c \u06a9\u0631\u06cc\u062f\u062a\u060c \u0627\u0645\u062a\u06cc\u0627\u0632\u060c \u062c\u0631\u06cc\u0645\u0647 \u06cc\u0627 \u067e\u0631\u062f\u0627\u062e\u062a \u0631\u0627 \u0628\u0631\u0627\u06cc",
                    "\u0689\u06cc\u0628\u06cc\u067c\u060c \u06a9\u0631\u06cc\u0689\u06cc\u067c\u060c \u0627\u0645\u062a\u06cc\u0627\u0632\u060c \u062c\u0631\u06cc\u0645\u0647 \u06cc\u0627 \u062a\u0627\u062f\u06cc\u0647 \u0632\u06cc\u0627\u062a\u0647 \u06a9\u0693\u0626 \u062f"
                  )}{" "}
                  {employee.fullName}.
                </p>
              </div>

              <button
                type="button"
                className="employee-profile-modal-close"
                onClick={closeAdjustment}
                aria-label={tx("Close adjustment form", "بستن فورم ثبت مالی", "د مالي ثبت فورم تړل")}
              >
                <X size={19} />
              </button>
            </header>

            <label>
              <span>{tx("Type", "نوع", "ډول")}</span>

              <select
                name="type"
                value={
                  adjustmentForm.type
                }
                onChange={
                  updateAdjustmentField
                }
              >
                <option value="credit">
                  {tx("Credit", "کریدت", "کریډیټ")}
                </option>

                <option value="debit">
                  {tx("Debit", "دیبت", "ډیبیټ")}
                </option>

                <option value="bonus">
                  {tx("Bonus", "امتیاز", "امتیاز")}
                </option>

                <option value="penalty">
                  {tx("Penalty", "جریمه", "جریمه")}
                </option>

                <option value="salary">
                  {tx("Payment", "\u067e\u0631\u062f\u0627\u062e\u062a", "\u062a\u0627\u062f\u06cc\u0647")}
                </option>
              </select>
            </label>

            <label>
              <span>{tx("Amount (AFN)", "مبلغ (AFN)", "اندازه (AFN)")}</span>

              <input
                type="number"
                min="1"
                name="amount"
                value={
                  adjustmentForm.amount
                }
                onChange={
                  updateAdjustmentField
                }
              />
            </label>

            <label>
              <span>{tx("Reason", "دلیل", "لامل")}</span>

              <textarea
                rows="3"
                name="reason"
                value={
                  adjustmentForm.reason
                }
                onChange={
                  updateAdjustmentField
                }
              />
            </label>

            <footer>
              <button
                type="button"
                onClick={closeAdjustment}
              >
                {tx("Cancel", "لغو", "لغوه")}
              </button>

              <button
                type="submit"
                className="primary"
              >
                {editingAdjustmentId
                  ? tx("Save Changes", "\u0630\u062e\u06cc\u0631\u0647 \u062a\u063a\u06cc\u06cc\u0631\u0627\u062a", "\u0628\u062f\u0644\u0648\u0646\u0648\u0646\u0647 \u062e\u0648\u0646\u062f\u064a \u06a9\u0648\u0644")
                  : tx("Save", "ذخیره", "خوندي کول")}
              </button>
            </footer>
          </form>
        </div>
      )}
    </div>
  );
}
