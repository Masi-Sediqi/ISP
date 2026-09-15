import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowDownToLine, ArrowUpFromLine, Wallet, X } from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { todayDateValue } from "../utils/afghanDate";
import {
  CASH_WALLET_CURRENCIES,
  calculateCashWalletBalances,
  formatWalletAmount,
} from "../utils/cashWallet";
import { createRecordId } from "../utils/ids";
import { notify } from "../utils/notify";
import "./CashWalletModal.css";

const makeDefaults = () => ({
  type: "deposit",
  amount: "",
  currency: "AFN",
  date: todayDateValue(),
  description: "",
});

export default function CashWalletModal({ open, onClose, currentUser }) {
  const [records, setRecords] = useJsonCollection("cashWalletTransactions");
  const [form, setForm] = useState(makeDefaults);
  const balances = useMemo(() => calculateCashWalletBalances(records), [records]);
  const selectedBalance = balances[form.currency] || 0;

  if (!open) return null;

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const close = () => {
    setForm(makeDefaults());
    onClose?.();
  };

  const submit = async (event) => {
    event.preventDefault();
    const amount = Number(form.amount || 0);

    if (!(amount > 0)) {
      notify("Enter a valid wallet amount.", "error");
      return;
    }

    if (form.type === "credit" && amount > selectedBalance) {
      notify(`Cash Wallet ${form.currency} balance is not enough for this credit.`, "error");
      return;
    }

    const now = new Date().toISOString();
    const record = {
      id: createRecordId(),
      type: form.type,
      amount,
      currency: form.currency,
      date: form.date || todayDateValue(),
      description: form.description.trim(),
      source: "manual-wallet",
      createdById: currentUser?.id || "",
      createdByName:
        currentUser?.fullName || currentUser?.username || currentUser?.email || "",
      createdAt: now,
      updatedAt: now,
    };

    const saved = await setRecords((previous) => [...previous, record]);
    if (!saved) return;

    notify(
      form.type === "deposit"
        ? "Cash Wallet deposit saved."
        : "Cash Wallet credit saved.",
      "success"
    );
    close();
  };

  return createPortal(
    <div className="cash-wallet-backdrop" onMouseDown={close} role="presentation">
      <form
        className="cash-wallet-modal"
        onSubmit={submit}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cash-wallet-title"
      >
        <header>
          <div>
            <span className="cash-wallet-kicker"><Wallet size={16} /> Cash Wallet</span>
            <h2 id="cash-wallet-title">Cash Wallet Entry</h2>
            <p>Add or subtract cash from the office wallet.</p>
          </div>
          <button type="button" className="cash-wallet-close" onClick={close} aria-label="Close Cash Wallet">
            <X size={15} strokeWidth={2.4} />
          </button>
        </header>

        <div className="cash-wallet-balance-card cash-wallet-balance-multi">
          <span>Current Cash Wallet</span>
          <div className="cash-wallet-balance-values">
            <strong>{formatWalletAmount(balances.AFN, "AFN")}</strong>
            <strong>{formatWalletAmount(balances.USD, "USD")}</strong>
            <strong>{formatWalletAmount(balances.EUR, "EUR")}</strong>
          </div>
        </div>

        <div className="cash-wallet-type-switch" role="group" aria-label="Cash Wallet type">
          <button
            type="button"
            className={form.type === "deposit" ? "active deposit" : "deposit"}
            aria-pressed={form.type === "deposit"}
            onClick={() => setForm((current) => ({ ...current, type: "deposit" }))}
          >
            <span className="cash-wallet-type-icon"><ArrowDownToLine size={18} /></span>
            <span className="cash-wallet-type-copy">
              <strong>Deposit</strong>
              <small>Add cash to wallet</small>
            </span>
            <span className="cash-wallet-type-dot" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={form.type === "credit" ? "active credit" : "credit"}
            aria-pressed={form.type === "credit"}
            onClick={() => setForm((current) => ({ ...current, type: "credit" }))}
          >
            <span className="cash-wallet-type-icon"><ArrowUpFromLine size={18} /></span>
            <span className="cash-wallet-type-copy">
              <strong>Credit</strong>
              <small>Subtract cash from wallet</small>
            </span>
            <span className="cash-wallet-type-dot" aria-hidden="true" />
          </button>
        </div>

        <div className="cash-wallet-fields-row cash-wallet-fields-row-three">
          <label>
            <span>Amount</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              name="amount"
              value={form.amount}
              onChange={updateField}
              autoFocus
            />
          </label>

          <label>
            <span>Currency</span>
            <select name="currency" value={form.currency} onChange={updateField}>
              {CASH_WALLET_CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency === "AFN" ? "AFN - Afghani" : currency === "USD" ? "USD - Dollar" : "EUR - Euro"}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Date</span>
            <input type="date" name="date" value={form.date} onChange={updateField} />
          </label>
        </div>

        <label>
          <span>Description</span>
          <textarea rows="3" name="description" value={form.description} onChange={updateField} />
        </label>

        <footer>
          <button type="button" className="cash-wallet-cancel" onClick={close}>Cancel</button>
          <button type="submit" className="primary">Save Entry</button>
        </footer>
      </form>
    </div>,
    document.body
  );
}
