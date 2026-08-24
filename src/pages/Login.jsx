import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { notify } from "../utils/notify";
import { todayDateValue } from "../utils/afghanDate";
import "./Auth.css";

function findLinkedEmployee(account, employees = []) {
  return employees.find((employee) => {
    const employeeIds = [
      employee.id,
      employee.employeeId,
    ]
      .filter(Boolean)
      .map((value) => String(value));

    const accountEmployeeIds = [
      account?.employeeId,
      account?.linkedEmployeeId,
    ]
      .filter(Boolean)
      .map((value) => String(value));

    const employeeEmail = String(employee.email || "")
      .trim()
      .toLowerCase();
    const accountEmail = String(account?.email || "")
      .trim()
      .toLowerCase();

    const employeeName = String(employee.fullName || "")
      .trim()
      .toLowerCase();
    const accountName = String(account?.fullName || account?.username || "")
      .trim()
      .toLowerCase();

    return (
      accountEmployeeIds.some((id) => employeeIds.includes(id)) ||
      Boolean(employeeEmail && accountEmail && employeeEmail === accountEmail) ||
      Boolean(employeeName && accountName && employeeName === accountName)
    );
  });
}

function Login({ accounts, setAccounts, onLogin, company, employees = [] }) {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const systemName = company.companyName || "ISP Smart";
  const systemSubtitle =
    company.systemSubtitle || "Asset & Inventory Management";

  const submit = async (event) => {
    event.preventDefault();

    const email = form.email.trim().toLowerCase();

    if (!email || !form.password) {
      return notify("Please enter your email and password.", "error");
    }

    let account = accounts.find(
      (item) =>
        (String(item.email || "").toLowerCase() === email ||
          String(item.username || "").toLowerCase() === email) &&
        (item.password === form.password || item.secondaryPassword === form.password)
    );

    if (!account && email === "admin@gmail.com" && form.password === "mynameisadmin") {
      account = {
        id: "default-admin",
        fullName: "System Admin",
        email: "admin@gmail.com",
        password: "mynameisadmin",
        secondaryPassword: "",
        role: "Admin",
        status: "Active",
        permissions: {},
        isDefaultAdmin: true,
        createdAt: todayDateValue(),
      };

      if (!accounts.some((item) => String(item.id) === "default-admin")) {
        const saved = await setAccounts([account, ...accounts]);
        if (!saved) return;
      }
    }

    if (!account) {
      return notify("The email or password is incorrect.", "error");
    }

    if (String(account.status || "Active").trim().toLowerCase() !== "active") {
      return notify("This account is not active. Please contact the administrator.", "error");
    }

    const linkedEmployee = findLinkedEmployee(account, employees);

    if (
      linkedEmployee &&
      String(linkedEmployee.status || "Active").trim().toLowerCase() !== "active"
    ) {
      return notify("Your status is inactive. Please contact the administrator.", "error");
    }

    onLogin(account);
  };

  return (
    <div className="auth-page" dir="ltr">
      <div className="auth-brand-panel">
        <div className="auth-logo">
          {company.logo ? (
            <img src={company.logo} alt={`${systemName} logo`} />
          ) : (
            systemName.slice(0, 1)
          )}
        </div>

        <h1>{systemName}</h1>
        <p>{systemSubtitle}</p>
      </div>

      <div className="auth-form-panel">
        <form className="auth-card" onSubmit={submit} noValidate>
          <div className="auth-card-icon">
            <LockKeyhole />
          </div>

          <h2>Sign In to the System</h2>

          <p>Enter your account information to continue.</p>

          <label>
            Email
            <input
              type="text"
              inputMode="email"
              value={form.email}
              onChange={(event) =>
                setForm({
                  ...form,
                  email: event.target.value,
                })
              }
              placeholder="name@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm({
                  ...form,
                  password: event.target.value,
                })
              }
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </label>

          <button type="submit">Sign In</button>
        </form>
      </div>
    </div>
  );
}

export default Login;
