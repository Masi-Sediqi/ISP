import { useEffect, useState } from "react";
import { CalendarCheck, Users } from "lucide-react";

import { useJsonCollection } from "../hooks/useJsonCollection";
import Employees from "./Employees";
import EmployeeAttendance from "./EmployeeAttendance";
import "./Employees.css";

const sections = [
  {
    key: "employees",
    title: "Employees",
    description: "Employee profiles and contracts",
    icon: Users,
  },
  {
    key: "attendance",
    title: "Attendance",
    description: "Employee attendance records",
    icon: CalendarCheck,
  },
];

function EmployeesHub({ initialSection = "employees" }) {
  const [activeSection, setActiveSection] = useState(initialSection);
  const [employees] = useJsonCollection("employees");
  const [attendances] = useJsonCollection("employeeAttendances");

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  const counts = {
    employees: employees.length,
    attendance: attendances.length,
  };

  return (
    <div className="employees-hub-page">
      <div className="employees-hub-heading">
        <div>
          <h1>Employees & Attendance</h1>
          <p>Manage employee records and attendance from one page.</p>
        </div>
      </div>

      <div className="employee-section-cards" aria-label="Employee sections">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.key;

          return (
            <button
              key={section.key}
              type="button"
              className={`employee-section-card ${isActive ? "active" : ""}`}
              onClick={() => setActiveSection(section.key)}
              aria-pressed={isActive}
            >
              <span className="employee-section-icon">
                <Icon size={19} />
              </span>

              <span className="employee-section-copy">
                <strong>{section.title}</strong>
                <small>{section.description}</small>
              </span>

              <b>{counts[section.key] || 0}</b>
            </button>
          );
        })}
      </div>

      <div className="employee-section-panel">
        {activeSection === "employees" && <Employees />}
        {activeSection === "attendance" && <EmployeeAttendance />}
      </div>
    </div>
  );
}

export default EmployeesHub;
