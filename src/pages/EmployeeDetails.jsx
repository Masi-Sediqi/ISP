import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Gift,
  KeyRound,
  MessageCircle,
  Pencil,
  TrendingUp,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { useJsonCollection } from "../hooks/useJsonCollection";
import { useLocalCollection } from "../hooks/useLocalCollection";
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

export default function EmployeeDetails({
  accounts,
  setAccounts,
}) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employees, , , loaded] =
    useJsonCollection("employees");

  const [customers] =
    useJsonCollection("customers");

  const [adjustments, setAdjustments] =
    useLocalCollection("employeeAdjustments");

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

  const [activeWorkTab, setActiveWorkTab] =
    useState("customers");

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
      salary: tx("Salary", "معاش", "معاش"),
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
    detailsOpen;

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

  const openAdjustment = () => {
    setAdjustmentForm(adjustmentDefaults);
    setAdjustmentOpen(true);
  };

  const closeAdjustment = () => {
    setAdjustmentOpen(false);
    setAdjustmentForm(adjustmentDefaults);
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

const department =
  employee.departments?.[0] ||
  "Consultant";

const employeeRoles = Array.isArray(employee.roles)
  ? employee.roles
  : employee.role
    ? [employee.role]
    : [];

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
  
    const isReceptionAccount = employeeRoles.some(
      (role) =>
        String(role || "")
          .trim()
          .toLowerCase() === "reception"
    );

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
    : "Employee",

  accountType: isAdminAccount
    ? "admin"
    : "employee",

  department,
  status: "Active",

  permissions: isAdminAccount
  ? {
      all: true,
    }
  : isReceptionAccount
    ? {
        customers: {
          view: true,
          create: true,
          edit: true,
        },
      }
    : {
        dashboard: {
          view: true,
        },
      },

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

    const record = {
      id: createRecordId(),
      employeeId: employee.id,
      employeeName: employee.fullName,
      ...adjustmentForm,
      amount,
      createdAt: now,
      updatedAt: now,
    };

    const saved = await setAdjustments([
      ...adjustments,
      record,
    ]);

    if (!saved) return;

    notify(
      adjustmentForm.type === "salary"
        ? tx("Salary saved successfully.", "معاش با موفقیت ذخیره شد.", "معاش په بریالیتوب سره خوندي شو.")
        : tx("Employee ledger entry saved.", "ثبت مالی کارمند ذخیره شد.", "د کارکوونکي مالي ثبت خوندي شو."),
      "success"
    );

    closeAdjustment();
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
                  "Debit, credit, bonus and penalty records for",
                  "سوابق دیبت، کریدت، امتیاز و جریمه برای",
                  "د ډیبیټ، کریډیټ، امتیاز او جریمې ریکارډونه د"
                )}{" "}
                {employee.fullName ||
                  tx("this employee", "این کارمند", "دې کارکوونکي")}.
              </p>
            </div>

            <strong>{employeeAdjustments.length}</strong>
          </div>

          <div className="employee-ledger-summary">
            <div>
              <span>{tx("Credit", "کریدت", "کریډیټ")}</span>
              <strong className="credit">
                {totalCreditOnly.toLocaleString("en-US")} AFN
              </strong>
            </div>

            <div>
              <span>{tx("Debit", "دیبت", "ډیبیټ")}</span>
              <strong className="debit">
                {totalDebitOnly.toLocaleString("en-US")} AFN
              </strong>
            </div>

            <div>
              <span>{tx("Bonus", "امتیاز", "امتیاز")}</span>
              <strong>
                {totalBonus.toLocaleString("en-US")} AFN
              </strong>
            </div>

            <div>
              <span>{tx("Penalty", "جریمه", "جریمه")}</span>
              <strong>
                {totalPenalty.toLocaleString("en-US")} AFN
              </strong>
            </div>

            <div>
              <span>{tx("Salary", "معاش", "معاش")}</span>
              <strong>
                {totalSalary.toLocaleString("en-US")} AFN
              </strong>
            </div>

            <div>
              <span>{tx("Current Balance", "بیلانس فعلی", "اوسنی بیلانس")}</span>
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
                    <tr key={entry.id}>
                      <td>
                        {entry.createdAt
                          ? new Date(
                              entry.createdAt
                            ).toLocaleDateString()
                          : "-"}
                      </td>

                      <td>
                        <span
                          className={`employee-ledger-type ${translateValue(entry.type)}`}
                        >
                          {entry.type}
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
                    </tr>
                  );
                })}

                {!employeeAdjustments.length && (
                  <tr>
                    <td
                      colSpan="5"
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
                    <strong>{translateValue(employeeAccount.department) || "-"}</strong>
                  </div>
                </div>
              </section>
            )}
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
                  {tx("Employee Ledger Entry", "ثبت مالی کارمند", "د کارکوونکي مالي ثبت")}
                </h2>

                <p>
                  {tx(
                    "Add debit, credit, bonus, penalty, or salary for",
                    "دیبت، کریدت، امتیاز، جریمه یا معاش را برای",
                    "ډیبیټ، کریډیټ، امتیاز، جریمه یا معاش زیات کړئ د"
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
                  {tx("Salary", "معاش", "معاش")}
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
                {tx("Save", "ذخیره", "خوندي کول")}
              </button>
            </footer>
          </form>
        </div>
      )}
    </div>
  );
}