import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CalendarRange,
  TrendingDown,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { useJsonCollection } from "../hooks/useJsonCollection";
import "./EmployeePerformance.css";

const comparisonOptions = [
  {
    key: "today",
    title: "Today vs Yesterday",
    description: "Compare today's activity with yesterday.",
  },
  {
    key: "week",
    title: "This Week vs Last Week",
    description: "Compare this week with the previous week.",
  },
  {
    key: "month",
    title: "This Month vs Last Month",
    description: "Compare this month with the previous month.",
  },
  {
    key: "custom",
    title: "Custom Date Range",
    description: "Choose your own current and comparison periods.",
  },
];

function startOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(value) {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

function startOfWeek(value) {
  const date = startOfDay(value);
  const day = date.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + offset);
  return date;
}

function endOfWeek(value) {
  const date = startOfWeek(value);
  date.setDate(date.getDate() + 6);
  return endOfDay(date);
}

function startOfMonth(value) {
  const date = new Date(value);
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1,
    0,
    0,
    0,
    0
  );
}

function endOfMonth(value) {
  const date = new Date(value);
  return new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );
}

function validDate(value) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

function percentageChange(current, previous) {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }

  return ((current - previous) / previous) * 100;
}

function customerDate(customer) {
  return (
    customer.createdAt ||
    customer.registeredAt ||
    customer.date ||
    customer.updatedAt ||
    ""
  );
}

export default function EmployeePerformance() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employees, , , employeesLoaded] =
    useJsonCollection("employees");

  const [customers, , , customersLoaded] =
    useJsonCollection("customers");

  const [comparison, setComparison] =
    useState("today");

  const today = new Date();

  const [customCurrentStart, setCustomCurrentStart] =
    useState(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      )
        .toISOString()
        .slice(0, 10)
    );

  const [customCurrentEnd, setCustomCurrentEnd] =
    useState(
      today.toISOString().slice(0, 10)
    );

  const [customPreviousStart, setCustomPreviousStart] =
    useState(
      new Date(
        today.getFullYear(),
        today.getMonth() - 1,
        1
      )
        .toISOString()
        .slice(0, 10)
    );

  const [customPreviousEnd, setCustomPreviousEnd] =
    useState(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        0
      )
        .toISOString()
        .slice(0, 10)
    );

  const employee = useMemo(
    () =>
      employees.find(
        (item) =>
          String(item.id) === String(id)
      ),
    [employees, id]
  );

  const employeeCustomers = useMemo(() => {
    const employeeId = String(employee?.id || "");
    const employeeName = String(
      employee?.fullName || ""
    )
      .trim()
      .toLowerCase();

    return customers.filter((customer) => {
      const sourceEmployeeId = String(
        customer.sourceEmployeeId || ""
      );

      const assignedByEmployeeId = String(
        customer.assignedByEmployeeId || ""
      );

      const assignedEmployeeId = String(
        customer.assignedEmployeeId || ""
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
        (employeeId &&
          sourceEmployeeId === employeeId) ||
        (employeeId &&
          assignedByEmployeeId === employeeId) ||
        (employeeId &&
          assignedEmployeeId === employeeId) ||
        (employeeName &&
          sourceEmployeeName === employeeName)
      );
    });
  }, [customers, employee]);

  const periods = useMemo(() => {
    const now = new Date();

    if (comparison === "today") {
      const currentStart = startOfDay(now);
      const currentEnd = endOfDay(now);

      const previousDate = new Date(now);
      previousDate.setDate(
        previousDate.getDate() - 1
      );

      return {
        currentLabel: "Today",
        previousLabel: "Yesterday",
        currentStart,
        currentEnd,
        previousStart: startOfDay(previousDate),
        previousEnd: endOfDay(previousDate),
      };
    }

    if (comparison === "week") {
      const currentStart = startOfWeek(now);
      const currentEnd = endOfWeek(now);

      const previousStart = new Date(
        currentStart
      );
      previousStart.setDate(
        previousStart.getDate() - 7
      );

      const previousEnd = new Date(
        currentEnd
      );
      previousEnd.setDate(
        previousEnd.getDate() - 7
      );

      return {
        currentLabel: "This Week",
        previousLabel: "Last Week",
        currentStart,
        currentEnd,
        previousStart,
        previousEnd,
      };
    }

    if (comparison === "month") {
      const currentStart = startOfMonth(now);
      const currentEnd = endOfMonth(now);

      const previousMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      );

      return {
        currentLabel: "This Month",
        previousLabel: "Last Month",
        currentStart,
        currentEnd,
        previousStart:
          startOfMonth(previousMonth),
        previousEnd:
          endOfMonth(previousMonth),
      };
    }

    return {
      currentLabel: "Current Range",
      previousLabel: "Comparison Range",
      currentStart:
        validDate(customCurrentStart) ||
        startOfDay(now),
      currentEnd:
        customCurrentEnd
          ? endOfDay(customCurrentEnd)
          : endOfDay(now),
      previousStart:
        validDate(customPreviousStart) ||
        startOfDay(now),
      previousEnd:
        customPreviousEnd
          ? endOfDay(customPreviousEnd)
          : endOfDay(now),
    };
  }, [
    comparison,
    customCurrentStart,
    customCurrentEnd,
    customPreviousStart,
    customPreviousEnd,
  ]);

  const comparisonData = useMemo(() => {
    const within = (customer, start, end) => {
      const date = validDate(
        customerDate(customer)
      );

      return (
        date &&
        date >= start &&
        date <= end
      );
    };

    const currentCustomers =
      employeeCustomers.filter((customer) =>
        within(
          customer,
          periods.currentStart,
          periods.currentEnd
        )
      );

    const previousCustomers =
      employeeCustomers.filter((customer) =>
        within(
          customer,
          periods.previousStart,
          periods.previousEnd
        )
      );

    const currentApproved =
      currentCustomers.filter((customer) => {
        const status = String(
          customer.status ||
            customer.assignmentStatus ||
            ""
        ).toLowerCase();

        return [
          "accepted",
          "approved",
          "completed",
        ].includes(status);
      }).length;

    const previousApproved =
      previousCustomers.filter((customer) => {
        const status = String(
          customer.status ||
            customer.assignmentStatus ||
            ""
        ).toLowerCase();

        return [
          "accepted",
          "approved",
          "completed",
        ].includes(status);
      }).length;

    return {
      currentCustomers,
      previousCustomers,
      currentApproved,
      previousApproved,
      customerChange: percentageChange(
        currentCustomers.length,
        previousCustomers.length
      ),
      approvedChange: percentageChange(
        currentApproved,
        previousApproved
      ),
    };
  }, [
    employeeCustomers,
    periods,
  ]);

  if (!employeesLoaded || !customersLoaded) {
    return (
      <div className="employee-performance-loading">
        Loading employee assessment...
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="employee-performance-page">
        <button
          type="button"
          className="employee-performance-back"
          onClick={() => navigate("/employees")}
        >
          <ArrowLeft size={17} />
          Employees
        </button>

        <div className="employee-performance-empty">
          Employee not found.
        </div>
      </div>
    );
  }

  const customerChangePositive =
    comparisonData.customerChange >= 0;

  const approvedChangePositive =
    comparisonData.approvedChange >= 0;

  return (
    <div className="employee-performance-page">
      <header className="employee-performance-header">
        <div>
          <button
            type="button"
            className="employee-performance-back"
            onClick={() =>
              navigate(`/employees/${employee.id}`)
            }
          >
            <ArrowLeft size={17} />
            Employee Profile
          </button>

          <span>Employee Assessment</span>

          <h1>Performance Comparison</h1>

          <p>
            Compare the employee's registered customer
            activity across different time periods.
          </p>
        </div>

        <div className="employee-performance-person">
          <div className="employee-performance-avatar">
            {employee.image ? (
              <img
                src={employee.image}
                alt={employee.fullName}
              />
            ) : (
              <UserRound size={24} />
            )}
          </div>

          <div>
            <strong>
              {employee.fullName ||
                "Unnamed Employee"}
            </strong>

            <span>
              {employee.departments?.join(" • ") ||
                employee.role ||
                "Employee"}
            </span>
          </div>
        </div>
      </header>

      <section className="employee-performance-selector">
        <div className="employee-performance-selector-title">
          <CalendarRange size={18} />

          <div>
            <strong>Comparison Period</strong>
            <span>
              Choose how you want to compare performance.
            </span>
          </div>
        </div>

        <div className="employee-performance-options">
          {comparisonOptions.map((option) => (
            <button
              type="button"
              key={option.key}
              className={
                comparison === option.key
                  ? "active"
                  : ""
              }
              onClick={() =>
                setComparison(option.key)
              }
            >
              <span>
                {option.key === "today" && "01"}
                {option.key === "week" && "07"}
                {option.key === "month" && "30"}
                {option.key === "custom" && "↔"}
              </span>

              <div>
                <strong>{option.title}</strong>
                <small>
                  {option.description}
                </small>
              </div>
            </button>
          ))}
        </div>

        {comparison === "custom" && (
          <div className="employee-performance-custom">
            <div>
              <span>Current Period</span>

              <label>
                Start Date
                <input
                  type="date"
                  value={customCurrentStart}
                  onChange={(event) =>
                    setCustomCurrentStart(
                      event.target.value
                    )
                  }
                />
              </label>

              <label>
                End Date
                <input
                  type="date"
                  value={customCurrentEnd}
                  onChange={(event) =>
                    setCustomCurrentEnd(
                      event.target.value
                    )
                  }
                />
              </label>
            </div>

            <div>
              <span>Comparison Period</span>

              <label>
                Start Date
                <input
                  type="date"
                  value={customPreviousStart}
                  onChange={(event) =>
                    setCustomPreviousStart(
                      event.target.value
                    )
                  }
                />
              </label>

              <label>
                End Date
                <input
                  type="date"
                  value={customPreviousEnd}
                  onChange={(event) =>
                    setCustomPreviousEnd(
                      event.target.value
                    )
                  }
                />
              </label>
            </div>
          </div>
        )}
      </section>

      <section className="employee-performance-periods">
        <div>
          <CalendarDays size={17} />

          <span>
            <small>{periods.currentLabel}</small>
            <strong>
              {formatDate(periods.currentStart)} —{" "}
              {formatDate(periods.currentEnd)}
            </strong>
          </span>
        </div>

        <b>VS</b>

        <div>
          <CalendarDays size={17} />

          <span>
            <small>{periods.previousLabel}</small>
            <strong>
              {formatDate(periods.previousStart)} —{" "}
              {formatDate(periods.previousEnd)}
            </strong>
          </span>
        </div>
      </section>

      <section className="employee-performance-metrics">
        <article>
          <div className="employee-performance-metric-icon">
            <Users size={19} />
          </div>

          <div className="employee-performance-metric-copy">
            <span>Registered Customers</span>

            <strong>
              {comparisonData.currentCustomers.length}
            </strong>

            <small>
              {periods.currentLabel}
            </small>
          </div>

          <div
            className={`employee-performance-change ${
              customerChangePositive
                ? "positive"
                : "negative"
            }`}
          >
            {customerChangePositive ? (
              <TrendingUp size={15} />
            ) : (
              <TrendingDown size={15} />
            )}

            {Math.abs(
              comparisonData.customerChange
            ).toFixed(1)}
            %
          </div>

          <footer>
            <span>
              {periods.previousLabel}
            </span>

            <strong>
              {comparisonData.previousCustomers.length}
            </strong>
          </footer>
        </article>

        <article>
          <div className="employee-performance-metric-icon">
            <TrendingUp size={19} />
          </div>

          <div className="employee-performance-metric-copy">
            <span>Approved / Completed</span>

            <strong>
              {comparisonData.currentApproved}
            </strong>

            <small>
              {periods.currentLabel}
            </small>
          </div>

          <div
            className={`employee-performance-change ${
              approvedChangePositive
                ? "positive"
                : "negative"
            }`}
          >
            {approvedChangePositive ? (
              <TrendingUp size={15} />
            ) : (
              <TrendingDown size={15} />
            )}

            {Math.abs(
              comparisonData.approvedChange
            ).toFixed(1)}
            %
          </div>

          <footer>
            <span>
              {periods.previousLabel}
            </span>

            <strong>
              {comparisonData.previousApproved}
            </strong>
          </footer>
        </article>
      </section>

      <section className="employee-performance-preview">
        <div>
          <span>Assessment Workspace</span>
          <h2>More performance indicators</h2>
          <p>
            This page is ready for the next stage. Sales,
            income, follow-up, attendance, bonus/penalty and
            conversion rate can be connected here without
            changing the page structure.
          </p>
        </div>

        <div className="employee-performance-preview-grid">
          <div>
            <span>Sales</span>
            <strong>Next Stage</strong>
          </div>

          <div>
            <span>Attendance</span>
            <strong>Next Stage</strong>
          </div>

          <div>
            <span>Follow-up</span>
            <strong>Next Stage</strong>
          </div>

          <div>
            <span>Conversion</span>
            <strong>Next Stage</strong>
          </div>
        </div>
      </section>
    </div>
  );
}