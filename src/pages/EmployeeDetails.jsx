import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Gift,
  KeyRound,
  Pencil,
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
  type: "bonus",
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

  const employeeAdjustments = adjustments.filter(
    (item) =>
      String(item.employeeId) === String(id)
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

  const anyModalOpen =
  accountOpen || adjustmentOpen || detailsOpen;
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
      notify("Username is required.", "error");
      return;
    }

    if (
      !employeeAccount &&
      !accountForm.password
    ) {
      notify("Password is required.", "error");
      return;
    }

    if (
      accountForm.password &&
      accountForm.password.length < 4
    ) {
      notify(
        "Password must be at least 4 characters.",
        "error"
      );
      return;
    }

    if (
      accountForm.password !==
      accountForm.confirmPassword
    ) {
      notify(
        "Password confirmation does not match.",
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
        "Username or email is already in use.",
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
        ? "Employee account updated."
        : "Employee account created.",
      "success"
    );

    closeAccount();
  };

  const saveAdjustment = async (event) => {
    event.preventDefault();

    const amount = Number(
      adjustmentForm.amount
    );

    if (!(amount > 0)) {
      notify(
        "Enter a valid amount.",
        "error"
      );
      return;
    }

    const record = {
      id: createRecordId(),
      employeeId: employee.id,
      employeeName: employee.fullName,
      ...adjustmentForm,
      amount,
      createdAt: new Date().toISOString(),
    };

    const saved = await setAdjustments([
      ...adjustments,
      record,
    ]);

    if (!saved) return;

    notify(
      "Bonus / penalty saved.",
      "success"
    );

    closeAdjustment();
  };

  if (!loaded) {
    return (
      <div className="page-loading">
        Loading employee...
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="employee-profile-page">
        <button
          type="button"
          onClick={() =>
            navigate("/employees")
          }
        >
          Back to Employees
        </button>

        <h2>Employee not found.</h2>
      </div>
    );
  }

  const details = [
    ["Phone", employee.phone],
    ["Email", employee.email],
    ["NIC Number", employee.nicNumber],
    [
      "Departments",
      employee.departments?.join(", "),
    ],
    [
      "Roles",
      employee.roles?.join(", ") ||
        employee.role,
    ],
    ["Status", employee.status],
    ["Contract Start", employee.startDate],
    ["Contract End", employee.endDate],
    ["Notes", employee.notes],
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
            Employees
          </button>

          <h1>Employee Profile</h1>

          <p>
            Complete information, login
            account, bonus and penalty.
          </p>
        </div>

        <div className="employee-profile-actions">
          <div className="employee-current-balance">
            <span>Current Balance</span>

            <strong>
              {(totalBonus - totalPenalty).toLocaleString("en-US")} AFN
            </strong>
          </div>

          <button
            type="button"
            onClick={() => setDetailsOpen(true)}
          >
            <Eye size={17} />
            View Details
          </button>

          <button
            type="button"
            onClick={openAdjustment}
          >
            <Gift size={17} />
            Bonus and Penalty
          </button>

          <button
            type="button"
            className="primary"
            onClick={openAccount}
          >
            {employeeAccount ? (
              <Pencil size={17} />
            ) : (
              <KeyRound size={17} />
            )}

            {employeeAccount
              ? "Edit Account"
              : "Create Account"}
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
            {employee.status ||
              "Unspecified"}
          </span>

          <h2>
            {employee.fullName ||
              "Unnamed Employee"}
          </h2>

          <p>
            {employee.departments?.join(
              " • "
            ) || "No department"}
          </p>
        </div>

        <aside>
          <small>Bonus balance</small>

          <strong>
            {(
              totalBonus - totalPenalty
            ).toLocaleString("en-US")}{" "}
            AFN
          </strong>

          <em>
            Bonus{" "}
            {totalBonus.toLocaleString()} ·
            Penalty{" "}
            {totalPenalty.toLocaleString()}
          </em>
        </aside>
      </section>




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
                    ? "Edit Account"
                    : "Create Account"}
                </h2>

                <p>
                  Username and email are
                  suggested automatically and
                  remain editable.
                </p>
              </div>

              <button
                type="button"
                className="employee-profile-modal-close"
                onClick={closeAccount}
                aria-label="Close account form"
              >
                <X size={19} />
              </button>
            </header>

            <label>
              <span>Username</span>

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
              <span>Email</span>

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
                  ? "New Password (optional)"
                  : "Password"}
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
                  placeholder="Enter any password"
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
                      ? "Hide password"
                      : "Show password"
                  }
                  title={
                    showPassword
                      ? "Hide password"
                      : "Show password"
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
              <span>Confirm Password</span>

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
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  title={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
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
                Cancel
              </button>

              <button
                type="submit"
                className="primary"
              >
                Save Account
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
                <h2>Employee Details</h2>
                <p>Employee information and system account.</p>
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
              <h3>Employee Information</h3>

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
                <h3>System Account</h3>

                <div className="employee-detail-list">
                  <div>
                    <span>Username</span>
                    <strong>{employeeAccount.username || "-"}</strong>
                  </div>

                  <div>
                    <span>Email</span>
                    <strong>{employeeAccount.email || "-"}</strong>
                  </div>

                  <div>
                    <span>Department Dashboard</span>
                    <strong>{employeeAccount.department || "-"}</strong>
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
                  Bonus and Penalty
                </h2>

                <p>
                  Add a financial adjustment
                  for {employee.fullName}.
                </p>
              </div>

              <button
                type="button"
                className="employee-profile-modal-close"
                onClick={closeAdjustment}
                aria-label="Close adjustment form"
              >
                <X size={19} />
              </button>
            </header>

            <label>
              <span>Type</span>

              <select
                name="type"
                value={
                  adjustmentForm.type
                }
                onChange={
                  updateAdjustmentField
                }
              >
                <option value="bonus">
                  Bonus
                </option>

                <option value="penalty">
                  Penalty
                </option>
              </select>
            </label>

            <label>
              <span>Amount (AFN)</span>

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
              <span>Reason</span>

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
                Cancel
              </button>

              <button
                type="submit"
                className="primary"
              >
                Save
              </button>
            </footer>
          </form>
        </div>
      )}
    </div>
  );
}