import { ArrowLeft, Banknote, ExternalLink, Search, Users, Scale, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { calculateStaffPayablesByCurrency } from "../utils/staffPayable";
import { createRecordId } from "../utils/ids";
import { notify } from "../utils/notify";
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
  const [rawEmployees, , , employeesLoaded] = useJsonCollection("employees");
  const [rawPayrolls, , , payrollsLoaded] = useJsonCollection("employeePayrolls");
  const [rawAdjustments, setAdjustments, , adjustmentsLoaded] = useJsonCollection("employeeAdjustments");
  const [writeOffTarget, setWriteOffTarget] = useState(null);
  const [writeOffReasons, setWriteOffReasons] = useState("");
  const [writeOffSaving, setWriteOffSaving] = useState(false);

  const writeOffBalances = writeOffTarget
    ? Object.entries(writeOffTarget.balances).filter(([, value]) => Number(value) > 0.005)
    : [];
  const closeWriteOff = () => { if (!writeOffSaving) { setWriteOffTarget(null); setWriteOffReasons(""); } };
  const confirmWriteOff = async (event) => {
    event.preventDefault();
    if (writeOffSaving || !writeOffTarget) return;
    if (writeOffReasons.trim().length < 8) {
      notify("Please provide a clear reason (at least 8 characters).", "error");
      return;
    }
    if (!adjustmentsLoaded || !payrollsLoaded || !employeesLoaded) {
      notify("Employee ledger is still loading. Please try again.", "error");
      return;
    }
    const employeeId = writeOffTarget.employeeId;
    const latest = calculateStaffPayablesByCurrency({
      employees: safeList(rawEmployees), payrolls: safeList(rawPayrolls), adjustments: safeList(rawAdjustments)
    }).items.find((entry) => entry.employeeId === employeeId);
    if (!latest) {
      notify("This balance has changed. Refresh and review again.", "error");
      closeWriteOff();
      return;
    }
    const amounts = Object.entries(latest.balances).filter(([, value]) => Number(value) > 0.005);
    if (!amounts.length || amounts.some(([currency, value]) =>
      Math.abs(Number(value) - Number(writeOffTarget.balances[currency])) > 0.005
    )) {
      notify("The balance changed. Please review before saving.", "error");
      closeWriteOff();
      return;
    }
    const now = new Date().toISOString();
    const changes = amounts.map(([currency, amount]) => ({
      id: createRecordId(), employeeId, employeeName: latest.employeeName,
      type: "balance_writeoff", source: "staff-payable-balance-adjustment",
      currency, amount: Math.round(Number(amount) * 100) / 100,
      reason: writeOffReasons.trim(), createdAt: now, updatedAt: now,
      nonCash: true, subtractFromCashWallet: false,
    }));
    setWriteOffSaving(true);
    try {
      const ok = await setAdjustments([...safeList(rawAdjustments), ...changes]);
      if (!ok) { notify("The balance adjustment was not saved.", "error"); return; }
      notify("Balance adjusted without a salary payment or wallet movement.", "success");
      setWriteOffTarget(null); setWriteOffReasons("");
    } catch (error) {
      notify(error?.message || "Unable to save the adjustment.", "error");
    } finally { setWriteOffSaving(false); }
  };

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
                    <button type="button" className="staff-payable-adjust" disabled={!adjustmentsLoaded || !payrollsLoaded || !employeesLoaded}
                      onClick={() => { setWriteOffTarget(item); setWriteOffReasons(""); }}
                      title="Non-cash balance adjustment. Does not record salary payment">
                      <Scale size={15} /> Adjust
                    </button>
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
      {writeOffTarget && (
        <div className="staff-writeoff-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeWriteOff(); }}>
          <form className="staff-writeoff-dialog" onSubmit={confirmWriteOff} role="dialog" aria-modal="true" aria-labelledby="staff-writeoff-title">
            <header><div><h2 id="staff-writeoff-title">Adjust balance without payment</h2>
              <p>Record a non-cash write-off for {writeOffTarget.employeeName}. No payment or cash wallet transaction is created.</p></div>
              <button type="button" onClick={closeWriteOff} disabled={writeOffSaving} aria-label="Close"><X size={18}/></button></header>
            <div className="staff-writeoff-amounts">
              {writeOffBalances.map(([currency, amount]) => (
                <div key={currency}><span>{currency}</span><strong>{Number(amount).toLocaleString("en-US", {minimumFractionDigits:2,maximumFractionDigits:2})}</strong></div>
              ))}
            </div>
            <p className="staff-writeoff-warning">This changes the payable balance only. It does not cancel the original payroll and does not count as salary paid. If the payroll was entered in error, correct the original payroll instead.</p>
            <label>Reason for adjustment (required)
              <textarea required minLength={8} rows={3} value={writeOffReasons}
                onChange={(event) => setWriteOffReasons(event.target.value)} placeholder="Explain why the outstanding balance is being waived..." />
            </label>
            <footer><button type="button" onClick={closeWriteOff} disabled={writeOffSaving}>Cancel</button>
              <button className="staff-writeoff-confirm" type="submit" disabled={writeOffSaving || !adjustmentsLoaded || !payrollsLoaded || !employeesLoaded}>
                {writeOffSaving ? "Saving..." : "Confirm non-cash adjustment"}</button></footer>
          </form>
        </div>
      )}
    </div>
  );
}
