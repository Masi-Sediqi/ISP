import { ArrowLeft, Banknote, ExternalLink, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { calculateStaffPayablesByCurrency } from "../utils/staffPayable";
import { formatCurrencyTotals } from "../utils/currencyDisplay";
import "./StaffPayable.css";

const safeList = (value) => Array.isArray(value) ? value.filter(Boolean) : [];
const dateText = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function StaffPayable() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [rawEmployees] = useJsonCollection("employees");
  const [rawPayrolls] = useJsonCollection("employeePayrolls");
  const [rawAdjustments] = useJsonCollection("employeeAdjustments");

  const result = useMemo(() => calculateStaffPayablesByCurrency({
    employees: safeList(rawEmployees),
    payrolls: safeList(rawPayrolls),
    adjustments: safeList(rawAdjustments),
  }), [rawEmployees, rawPayrolls, rawAdjustments]);

  const fieldTotals = (item, field) => ({
    AFN: Number(item?.summaries?.AFN?.[field] || 0),
    USD: Number(item?.summaries?.USD?.[field] || 0),
    EUR: Number(item?.summaries?.EUR?.[field] || 0),
  });

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return result.items;
    return result.items.filter(({ employee, employeeName }) => [
      employeeName,
      employee?.phone,
      employee?.email,
      employee?.department,
      employee?.position,
    ].some((value) => String(value || "").toLowerCase().includes(needle)));
  }, [query, result.items]);

  return (
    <div className="staff-payable-page">
      <button type="button" className="staff-payable-back" onClick={() => navigate("/")}>
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="staff-payable-heading">
        <div>
          <span className="staff-payable-kicker">EMPLOYEE FINANCE</span>
          <h1>Staff Payable</h1>
          <p>Employees who currently have a positive balance payable by the office.</p>
        </div>
        <div className="staff-payable-total-card">
          <Banknote size={22} />
          <div>
            <span>Total Staff Payable</span>
            <strong>{formatCurrencyTotals(result.totals)}</strong>
            <small>{result.items.length} employee{result.items.length === 1 ? "" : "s"}</small>
          </div>
        </div>
      </div>

      <div className="staff-payable-toolbar">
        <div className="staff-payable-search">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search employee, phone, department..."
          />
        </div>
      </div>

      <section className="staff-payable-table-card">
        <div className="staff-payable-table-title">
          <div>
            <Users size={18} />
            <strong>Employees with outstanding payable</strong>
          </div>
          <span>{filtered.length} record{filtered.length === 1 ? "" : "s"}</span>
        </div>
        <div className="staff-payable-table-wrap">
          <table className="staff-payable-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Total Payroll</th>
                <th>Total Paid</th>
                <th>Bonus</th>
                <th>Penalty</th>
                <th>Payable</th>
                <th>Last Activity</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length ? filtered.map((item) => (
                <tr key={item.employeeId}>
                  <td>
                    <div className="staff-payable-employee">
                      <span>{item.employeeName.slice(0, 1).toUpperCase()}</span>
                      <div>
                        <strong>{item.employeeName}</strong>
                        <small>{item.employee?.phone || item.employee?.email || "-"}</small>
                      </div>
                    </div>
                  </td>
                  <td>{item.employee?.department || item.employee?.position || "-"}</td>
                  <td>{formatCurrencyTotals(fieldTotals(item, "totalPayrollDue"))}</td>
                  <td>{formatCurrencyTotals(fieldTotals(item, "totalPayments"))}</td>
                  <td>{formatCurrencyTotals(fieldTotals(item, "totalBonus"))}</td>
                  <td>{formatCurrencyTotals(fieldTotals(item, "totalPenalty"))}</td>
                  <td><strong className="staff-payable-balance">{formatCurrencyTotals(item.balances)}</strong></td>
                  <td>{dateText(item.lastActivityAt)}</td>
                  <td>
                    <button
                      type="button"
                      className="staff-payable-open"
                      onClick={() => navigate(`/employees/${item.employeeId}`)}
                    >
                      <ExternalLink size={15} /> View
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="9" className="staff-payable-empty">
                    {query ? "No matching payable employee found." : "There are no outstanding staff payables."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
