import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BadgeDollarSign,
  BriefcaseBusiness,
  CalendarCheck,
  CalendarDays,
  CalendarX,
  CheckCircle2,
  Clock3,
  Gift,
  Minus,
  ShieldCheck,
  TrendingUp,
  UserRound,
  WalletCards,
} from "lucide-react";

import "./MyAccount.css";

const staticPerformance = {
  todayCompleted: 18,
  yesterdayCompleted: 14,
  weeklyCompleted: 86,
  monthlyCompleted: 324,

  bonus: 4500,
  penalty: 1200,
  balance: 3300,
  points: 780,

  presentDays: 24,
  absentDays: 2,
  leaveDays: 1,
  lateDays: 3,

  workHours: 176,
  targetProgress: 78,
};

const weeklyTrend = [
  { day: "Sat", value: 55 },
  { day: "Sun", value: 67 },
  { day: "Mon", value: 48 },
  { day: "Tue", value: 76 },
  { day: "Wed", value: 64 },
  { day: "Thu", value: 88 },
  { day: "Fri", value: 72 },
];

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString("en-US")} AFN`;
}

function getEmployeeRoles(currentUser, employee) {
  if (Array.isArray(employee?.roles) && employee.roles.length) {
    return employee.roles;
  }

  if (Array.isArray(currentUser?.roles) && currentUser.roles.length) {
    return currentUser.roles;
  }

  if (employee?.role) return [employee.role];
  if (currentUser?.primaryRole) return [currentUser.primaryRole];
  if (currentUser?.role) return [currentUser.role];

  return ["Employee"];
}

function getDepartments(currentUser, employee) {
  if (
    Array.isArray(employee?.departments) &&
    employee.departments.length
  ) {
    return employee.departments;
  }

  if (
    Array.isArray(currentUser?.departments) &&
    currentUser.departments.length
  ) {
    return currentUser.departments;
  }

  if (currentUser?.department) {
    return [currentUser.department];
  }

  return [];
}

export default function MyAccount({
  currentUser,
  employee,
}) {
  const roles = getEmployeeRoles(
    currentUser,
    employee
  );

  const departments = getDepartments(
    currentUser,
    employee
  );

  const fullName =
    employee?.fullName ||
    currentUser?.fullName ||
    currentUser?.username ||
    "Employee";

  const email =
    employee?.email ||
    currentUser?.email ||
    "No email configured";

  const phone =
    employee?.phone ||
    currentUser?.phone ||
    "-";

  const status =
    employee?.status ||
    currentUser?.status ||
    "Active";

  const image =
    employee?.image ||
    currentUser?.image ||
    "";

  const difference =
    staticPerformance.todayCompleted -
    staticPerformance.yesterdayCompleted;

  const differencePercent =
    staticPerformance.yesterdayCompleted > 0
      ? Math.round(
          (difference /
            staticPerformance.yesterdayCompleted) *
            100
        )
      : 0;

  const performanceImproved = difference >= 0;

  return (
    <div className="my-account-page">
      <header className="my-account-heading">
        <div>
          <span>Employee Workspace</span>

          <h1>My Account</h1>

          <p>
            Personal information, work performance,
            attendance and financial adjustments.
          </p>
        </div>

        <div className="my-account-heading-status">
          <CheckCircle2 size={16} />

          <span>{status}</span>
        </div>
      </header>

      <section className="my-account-profile">
        <div className="my-account-profile-main">
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

          <div className="my-account-profile-copy">
            <small>Signed in employee</small>

            <h2>{fullName}</h2>

            <p>{email}</p>

            <div className="my-account-profile-tags">
              {roles.map((role) => (
                <span key={role}>
                  <ShieldCheck size={13} />
                  {role}
                </span>
              ))}

              {departments.map((department) => (
                <span key={department}>
                  <BriefcaseBusiness size={13} />
                  {department}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="my-account-profile-details">
          <div>
            <span>Employee ID</span>

            <strong>
              {employee?.employeeId ||
                currentUser?.employeeId ||
                employee?.id ||
                "-"}
            </strong>
          </div>

          <div>
            <span>Phone Number</span>
            <strong>{phone}</strong>
          </div>

          <div>
            <span>Account Status</span>
            <strong>{status}</strong>
          </div>
        </div>
      </section>

      <section className="my-account-performance">
        <div className="my-account-performance-copy">
          <div className="my-account-section-title">
            <div>
              <span>Daily Performance</span>

              <h2>Today compared with yesterday</h2>

              <p>
                Static demo information. It can later
                be connected to real employee records.
              </p>
            </div>

            <div
              className={
                performanceImproved
                  ? "my-account-trend-badge positive"
                  : "my-account-trend-badge negative"
              }
            >
              {performanceImproved ? (
                <ArrowUpRight size={18} />
              ) : (
                <ArrowDownRight size={18} />
              )}

              {Math.abs(differencePercent)}%
            </div>
          </div>

          <div className="my-account-performance-values">
            <div>
              <span>Today</span>

              <strong>
                {
                  staticPerformance.todayCompleted
                }
              </strong>

              <small>Completed activities</small>
            </div>

            <div>
              <span>Yesterday</span>

              <strong>
                {
                  staticPerformance.yesterdayCompleted
                }
              </strong>

              <small>Completed activities</small>
            </div>

            <div>
              <span>Difference</span>

              <strong>
                {difference > 0 ? "+" : ""}
                {difference}
              </strong>

              <small>
                {performanceImproved
                  ? "Improved performance"
                  : "Reduced performance"}
              </small>
            </div>
          </div>
        </div>

        <div className="my-account-trend-card">
          <div className="my-account-trend-header">
            <div>
              <span>Weekly Trend</span>
              <strong>Work Performance</strong>
            </div>

            <TrendingUp size={20} />
          </div>

          <div className="my-account-chart">
            {weeklyTrend.map((item) => (
              <div
                className="my-account-chart-column"
                key={item.day}
              >
                <div className="my-account-chart-track">
                  <span
                    style={{
                      height: `${item.value}%`,
                    }}
                  />
                </div>

                <small>{item.day}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="my-account-stat-grid">
        <article className="my-account-stat-card">
          <div className="my-account-stat-icon bonus">
            <Gift size={20} />
          </div>

          <div>
            <span>Total Bonus</span>

            <strong>
              {formatMoney(
                staticPerformance.bonus
              )}
            </strong>

            <small>Financial rewards received</small>
          </div>
        </article>

        <article className="my-account-stat-card">
          <div className="my-account-stat-icon penalty">
            <BadgeDollarSign size={20} />
          </div>

          <div>
            <span>Total Penalty</span>

            <strong>
              {formatMoney(
                staticPerformance.penalty
              )}
            </strong>

            <small>Financial penalties recorded</small>
          </div>
        </article>

        <article className="my-account-stat-card">
          <div className="my-account-stat-icon balance">
            <WalletCards size={20} />
          </div>

          <div>
            <span>Current Balance</span>

            <strong>
              {formatMoney(
                staticPerformance.balance
              )}
            </strong>

            <small>Bonus minus penalty</small>
          </div>
        </article>

        <article className="my-account-stat-card">
          <div className="my-account-stat-icon points">
            <Award size={20} />
          </div>

          <div>
            <span>Performance Points</span>

            <strong>
              {staticPerformance.points.toLocaleString(
                "en-US"
              )}
            </strong>

            <small>Accumulated employee points</small>
          </div>
        </article>
      </section>

      <section className="my-account-content-grid">
        <article className="my-account-panel">
          <div className="my-account-panel-heading">
            <div>
              <span>Attendance Summary</span>
              <h2>This Month</h2>
            </div>

            <CalendarDays size={21} />
          </div>

          <div className="my-account-attendance-grid">
            <div>
              <CalendarCheck size={19} />

              <span>Present</span>

              <strong>
                {staticPerformance.presentDays}
              </strong>

              <small>Days</small>
            </div>

            <div>
              <CalendarX size={19} />

              <span>Absent</span>

              <strong>
                {staticPerformance.absentDays}
              </strong>

              <small>Days</small>
            </div>

            <div>
              <CalendarDays size={19} />

              <span>Leave</span>

              <strong>
                {staticPerformance.leaveDays}
              </strong>

              <small>Days</small>
            </div>

            <div>
              <Clock3 size={19} />

              <span>Late</span>

              <strong>
                {staticPerformance.lateDays}
              </strong>

              <small>Times</small>
            </div>
          </div>
        </article>

        <article className="my-account-panel">
          <div className="my-account-panel-heading">
            <div>
              <span>Work Summary</span>
              <h2>Current Month</h2>
            </div>

            <Activity size={21} />
          </div>

          <div className="my-account-work-list">
            <div>
              <span>
                <Clock3 size={16} />
                Total Work Hours
              </span>

              <strong>
                {staticPerformance.workHours} hours
              </strong>
            </div>

            <div>
              <span>
                <CheckCircle2 size={16} />
                Weekly Completed
              </span>

              <strong>
                {
                  staticPerformance.weeklyCompleted
                }
              </strong>
            </div>

            <div>
              <span>
                <Activity size={16} />
                Monthly Completed
              </span>

              <strong>
                {
                  staticPerformance.monthlyCompleted
                }
              </strong>
            </div>

            <div>
              <span>
                <Minus size={16} />
                Remaining Target
              </span>

              <strong>
                {100 -
                  staticPerformance.targetProgress}
                %
              </strong>
            </div>
          </div>

          <div className="my-account-progress">
            <div>
              <span>Monthly target progress</span>

              <strong>
                {staticPerformance.targetProgress}%
              </strong>
            </div>

            <div className="my-account-progress-track">
              <span
                style={{
                  width: `${staticPerformance.targetProgress}%`,
                }}
              />
            </div>
          </div>
        </article>
      </section>

      <section className="my-account-panel my-account-information-panel">
        <div className="my-account-panel-heading">
          <div>
            <span>Account Information</span>
            <h2>Personal Details</h2>
          </div>

          <UserRound size={21} />
        </div>

        <div className="my-account-information-grid">
          <div>
            <span>Full Name</span>
            <strong>{fullName}</strong>
          </div>

          <div>
            <span>Email</span>
            <strong>{email}</strong>
          </div>

          <div>
            <span>Phone Number</span>
            <strong>{phone}</strong>
          </div>

          <div>
            <span>Department</span>

            <strong>
              {departments.length
                ? departments.join(", ")
                : "-"}
            </strong>
          </div>

          <div>
            <span>Role</span>

            <strong>
              {roles.length
                ? roles.join(", ")
                : "Employee"}
            </strong>
          </div>

          <div>
            <span>Account Status</span>
            <strong>{status}</strong>
          </div>
        </div>
      </section>
    </div>
  );
}