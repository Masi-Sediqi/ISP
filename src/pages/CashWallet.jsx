import { useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  Search,
  Trash2,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
import { buildCashWalletDeletion } from "../utils/cashWalletDelete";
import {
  calculateCashWalletBalances,
  formatWalletAmount,
  normalizeWalletCurrency,
} from "../utils/cashWallet";
import "./CashWallet.css";

function sourceLabel(record) {
  const source = String(record?.source || "manual-wallet").toLowerCase();
  if (source === "project-sale") return "Project Sale";
  if (source === "employee-payroll" || source === "employee-paid") return "Employee Payment";
  if (source === "manual-wallet") return "Manual Entry";
  return record?.sourceLabel || record?.source || "Wallet Entry";
}

function recordDate(record) {
  return record?.date || String(record?.createdAt || "").slice(0, 10) || "-";
}

export default function CashWallet() {
  const navigate = useNavigate();
  const [records, setRecords] = useJsonCollection("cashWalletTransactions");
  const [employeeAdjustments, setEmployeeAdjustments] = useJsonCollection("employeeAdjustments");
  const [transactions, setTransactions] = useJsonCollection("transactions");
  const [projectSales, setProjectSales] = useJsonCollection("projectSales");
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const balances = useMemo(() => calculateCashWalletBalances(records), [records]);

  const rows = useMemo(() => {
    const search = query.trim().toLowerCase();
    return [...(Array.isArray(records) ? records : [])]
      .sort((a, b) => String(b.createdAt || b.date || "").localeCompare(String(a.createdAt || a.date || "")))
      .filter((record) => {
        if (!search) return true;
        return [
          record.type,
          record.currency,
          record.description,
          record.projectName,
          record.customerName,
          record.employeeName,
          sourceLabel(record),
          recordDate(record),
        ].some((value) => String(value || "").toLowerCase().includes(search));
      });
  }, [records, query]);


  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;

    setDeleting(true);
    const previousRecords = [...records];
    const previousAdjustments = [...employeeAdjustments];
    const previousTransactions = [...transactions];
    const previousProjectSales = [...projectSales];

    const next = buildCashWalletDeletion({
      target: deleteTarget,
      walletTransactions: records,
      employeeAdjustments,
      transactions,
      projectSales,
    });

    const source = String(deleteTarget.source || "").toLowerCase();

    try {
      if (source === "employee-paid" || source === "employee-payroll") {
        const ledgerSaved = await setEmployeeAdjustments(next.employeeAdjustments);
        if (!ledgerSaved) return;

        const financeSaved = await setTransactions(next.transactions);
        if (!financeSaved) {
          await setEmployeeAdjustments(previousAdjustments);
          return;
        }
      }

      if (source === "project-sale") {
        const saleSaved = await setProjectSales(next.projectSales);
        if (!saleSaved) return;

        const financeSaved = await setTransactions(next.transactions);
        if (!financeSaved) {
          await setProjectSales(previousProjectSales);
          return;
        }

        const commissionSaved = await setEmployeeAdjustments(next.employeeAdjustments);
        if (!commissionSaved) {
          await setTransactions(previousTransactions);
          await setProjectSales(previousProjectSales);
          return;
        }
      }

      const walletSaved = await setRecords(next.walletTransactions);
      if (!walletSaved) {
        if (source === "employee-paid" || source === "employee-payroll") {
          await setTransactions(previousTransactions);
          await setEmployeeAdjustments(previousAdjustments);
        }
        if (source === "project-sale") {
          await setEmployeeAdjustments(previousAdjustments);
          await setTransactions(previousTransactions);
          await setProjectSales(previousProjectSales);
        }
        return;
      }

      notify("Cash Wallet record deleted successfully.", "success");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="cash-wallet-page">
      <button type="button" className="cash-wallet-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back
      </button>

      <section className="cash-wallet-page-heading">
        <div>
          <span>Cash Wallet</span>
          <h1>Cash Wallet Ledger</h1>
          <p>Track every amount added to or subtracted from the office cash wallet.</p>
        </div>
        <div className="cash-wallet-page-icon"><Wallet size={24} /></div>
      </section>

      <section className="cash-wallet-balance-grid">
        {[
          ["Afghani", formatWalletAmount(balances.AFN, "AFN"), "AFN"],
          ["US Dollar", formatWalletAmount(balances.USD, "USD"), "USD"],
          ["Euro", formatWalletAmount(balances.EUR, "EUR"), "EUR"],
        ].map(([label, value, code]) => (
          <article key={code}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{code} current balance</small>
          </article>
        ))}
      </section>

      <section className="cash-wallet-ledger-card">
        <header>
          <div>
            <span>Wallet Activity</span>
            <h2>All Cash Wallet Records</h2>
          </div>
          <label className="cash-wallet-search">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search wallet records..."
            />
          </label>
        </header>

        <div className="cash-wallet-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Currency</th>
                <th>Amount</th>
                <th>Source</th>
                <th>Reference</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((record) => {
                const currency = normalizeWalletCurrency(record.currency);
                const isDeposit = String(record.type || "").toLowerCase() === "deposit";
                return (
                  <tr key={record.id}>
                    <td>{recordDate(record)}</td>
                    <td>
                      <span className={`cash-wallet-type-pill ${isDeposit ? "deposit" : "credit"}`}>
                        {isDeposit ? <ArrowDownToLine size={14} /> : <ArrowUpFromLine size={14} />}
                        {isDeposit ? "Deposit" : "Credit"}
                      </span>
                    </td>
                    <td>{currency}</td>
                    <td className={isDeposit ? "cash-in" : "cash-out"}>
                      {isDeposit ? "+" : "-"}{formatWalletAmount(record.amount, currency)}
                    </td>
                    <td>{sourceLabel(record)}</td>
                    <td>{record.projectName || record.employeeName || record.customerName || "-"}</td>
                    <td>{record.description || "-"}</td>
                    <td>
                      <button
                        type="button"
                        className="cash-wallet-delete-btn"
                        title="Delete record"
                        aria-label="Delete record"
                        onClick={() => setDeleteTarget(record)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!rows.length && (
                <tr>
                  <td colSpan="8" className="cash-wallet-empty">No Cash Wallet records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {deleteTarget && (
        <div className="cash-wallet-confirm-overlay" role="presentation">
          <div className="cash-wallet-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="wallet-delete-title">
            <div className="cash-wallet-confirm-icon">
              <Trash2 size={20} />
            </div>
            <h3 id="wallet-delete-title">Delete Cash Wallet Record?</h3>
            <p>
              This will remove the selected wallet movement. Linked employee payments or project-sale cash records will also be updated so balances stay consistent.
            </p>
            <div className="cash-wallet-confirm-summary">
              <span>{sourceLabel(deleteTarget)}</span>
              <strong>
                {formatWalletAmount(deleteTarget.amount, normalizeWalletCurrency(deleteTarget.currency))}
              </strong>
            </div>
            <div className="cash-wallet-confirm-actions">
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
              <button type="button" className="danger" onClick={confirmDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
