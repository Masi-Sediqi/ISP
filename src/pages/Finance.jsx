import { useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import TablePagination from "../components/TablePagination";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { useTablePagination } from "../hooks/useTablePagination";
import { notify } from "../utils/notify";
import "./Finance.css";

const today = () => new Date().toISOString().slice(0, 10);
const formatAmount = (value) => Number(value || 0).toLocaleString("en-US");

function Finance() {
  const [transactions, setTransactions] = useJsonCollection("transactions");
  const [customerTravels] = useJsonCollection("customerTravels");
  const [customerPayments] = useJsonCollection("customerPayments");
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({
    type: "income",
    title: "",
    amount: "",
    description: "",
  });

  const legacyTravelPayments = customerTravels
    .filter(
      (record) =>
        Number(record.paidAmount || 0) > 0 &&
        !transactions.some(
          (item) => item.source === "customer-travel" && Number(item.referenceId) === Number(record.id)
        )
    )
    .map((record) => ({
      id: `legacy-travel-${record.id}`,
      type: "income",
      title: `پرداخت سفر ${record.travelName}`,
      amount: Number(record.paidAmount),
      date: record.date,
      description: "پرداخت ثبت‌شده پیشین مشتری",
      source: "customer-travel",
    }));
  const legacyCustomerPayments = customerPayments
    .filter(
      (payment) =>
        !transactions.some(
          (item) => item.source === "customer-payment" && Number(item.referenceId) === Number(payment.id)
        )
    )
    .map((payment) => ({
      id: `legacy-payment-${payment.id}`,
      type: "income",
      title: "پرداخت بدهی مشتری",
      amount: Number(payment.amount),
      date: payment.date,
      description: payment.description,
      source: "customer-payment",
    }));
  const allTransactions = [
    ...transactions,
    ...legacyTravelPayments,
    ...legacyCustomerPayments,
  ];

  const totalIncome = allTransactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalExpense = allTransactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const net = totalIncome - totalExpense;

  const filteredTransactions = [...allTransactions]
    .filter((item) =>
      (item.title || "").includes(search) ||
      (item.description || "").includes(search) ||
      (item.date || "").includes(search)
    )
    .sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
  const financeByDate = (() => {
    const days = new Map();
    allTransactions.forEach((item) => {
      const current = days.get(item.date) || { date: item.date || "-", income: 0, expense: 0, net: 0 };
      current[item.type === "income" ? "income" : "expense"] += Number(item.amount || 0);
      current.net = current.income - current.expense;
      days.set(item.date, current);
    });
    return [...days.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  })();
  const maximumAmount = Math.max(totalIncome, totalExpense, Math.abs(net), 1);
  const { page, setPage, totalPages, pageItems, pageSize } = useTablePagination(filteredTransactions, search);

  const handleSubmit = (event) => {
    event.preventDefault();
    const amount = Number(formData.amount);
    if (amount <= 0) return;

    setTransactions([
      ...transactions,
      {
        id: Date.now(),
        ...formData,
        amount,
        category: "other",
        date: today(),
        source: "manual",
      },
    ]);
    setFormData({ type: "income", title: "", amount: "", description: "" });
    setShowModal(false);
    notify(formData.type === "income" ? "عاید ثبت شد." : "مصرف ثبت شد.");
  };

  return (
    <div className="finance-page">
      <div className="finance-header">
        <div>
          <h1>عواید و مصارف</h1>
          <p>مدیریت جریان پول، عواید، مصارف و سود یا ضرر خالص</p>
        </div>
        <button className="finance-add-btn" onClick={() => setShowModal(true)}>
          + ثبت عاید یا مصرف
        </button>
      </div>

      <div className="finance-stats">
        <div className="finance-stat-card income">
          <span>مجموع عواید</span>
          <strong>{formatAmount(totalIncome)}</strong>
          <p>افغانی دریافت‌شده</p>
        </div>
        <div className="finance-stat-card expense">
          <span>مجموع مصارف</span>
          <strong>{formatAmount(totalExpense)}</strong>
          <p>افغانی پرداخت‌شده</p>
        </div>
        <div className={`finance-stat-card ${net >= 0 ? "profit" : "loss"}`}>
          <span>{net >= 0 ? "سود خالص" : "ضرر خالص"}</span>
          <strong>{formatAmount(Math.abs(net))}</strong>
          <p>تفاوت عواید و مصارف</p>
        </div>
      </div>

      <div className="finance-visuals">
        <div className="finance-overview-card">
          <div className="finance-chart-title"><h3>نمای کلی وضعیت مالی</h3><p>مقایسه عاید، مصرف و سود خالص</p></div>
          <div className="finance-progress-list">
            <div><span><b>عاید</b><strong>{formatAmount(totalIncome)}</strong></span><i><em style={{ width: `${(totalIncome / maximumAmount) * 100}%` }} className="income" /></i></div>
            <div><span><b>مصارف</b><strong>{formatAmount(totalExpense)}</strong></span><i><em style={{ width: `${(totalExpense / maximumAmount) * 100}%` }} className="expense" /></i></div>
            <div><span><b>{net >= 0 ? "سود خالص" : "ضرر خالص"}</b><strong>{formatAmount(Math.abs(net))}</strong></span><i><em style={{ width: `${(Math.abs(net) / maximumAmount) * 100}%` }} className={net >= 0 ? "profit" : "loss"} /></i></div>
          </div>
        </div>
        <div className="finance-chart-card">
          <div className="finance-chart-title"><h3>عواید، مصارف و سود بر اساس تاریخ</h3><p>هر ستون و خط، وضعیت همان روز را نشان می‌دهد</p></div>
          <div className="finance-chart">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={financeByDate}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatAmount(value)} />
                <Bar dataKey="income" name="عاید" fill="#16a34a" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" name="مصرف" fill="#dc2626" radius={[6, 6, 0, 0]} />
                <Line type="monotone" dataKey="net" name="سود خالص" stroke="#2563eb" strokeWidth={3} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="finance-table-card">
        <div className="finance-table-header">
          <div>
            <h3>ریکارد عواید و مصارف</h3>
            <p>تمام تعاملات مالی دستی و خودکار سیستم</p>
          </div>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="جستجو در ریکاردها..."
          />
        </div>
        <div className="finance-table-wrap">
          <table>
            <thead>
              <tr>
                <th>تاریخ</th>
                <th>حالت</th>
                <th>عنوان</th>
                <th>مقدار</th>
                <th>منبع</th>
                <th>توضیحات</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.date || "-"}</td>
                  <td>
                    <span className={`finance-badge ${item.type}`}>
                      {item.type === "income" ? "عاید" : "مصرف"}
                    </span>
                  </td>
                  <td>{item.title}</td>
                  <td>{formatAmount(item.amount)} افغانی</td>
                  <td>{item.source === "manual" ? "دستی" : "سیستم"}</td>
                  <td>{item.description || "-"}</td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan="6" className="finance-empty">هنوز ریکارد مالی ثبت نشده است</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePagination page={page} totalPages={totalPages} setPage={setPage} totalItems={filteredTransactions.length} pageSize={pageSize} />
      </div>

      {showModal && (
        <div className="finance-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="finance-modal" onClick={(event) => event.stopPropagation()}>
            <div className="finance-modal-header">
              <div>
                <h3>ثبت عاید یا مصرف دستی</h3>
                <p>معلومات تعامل مالی را وارد کنید</p>
              </div>
              <button type="button" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="finance-form-grid">
                <div className="finance-form-group">
                  <label>حالت</label>
                  <select
                    value={formData.type}
                    onChange={(event) => setFormData({ ...formData, type: event.target.value })}
                  >
                    <option value="income">عاید</option>
                    <option value="expense">مصرف</option>
                  </select>
                </div>
                <div className="finance-form-group">
                  <label>عنوان</label>
                  <input
                    value={formData.title}
                    onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                    required
                  />
                </div>
                <div className="finance-form-group">
                  <label>مقدار</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.amount}
                    onChange={(event) => setFormData({ ...formData, amount: event.target.value })}
                    required
                  />
                </div>
                <div className="finance-form-group finance-form-full">
                  <label>توضیحات</label>
                  <textarea
                    value={formData.description}
                    onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                  />
                </div>
              </div>
              <div className="finance-modal-actions">
                <button type="button" className="finance-cancel-btn" onClick={() => setShowModal(false)}>
                  لغو
                </button>
                <button type="submit" className="finance-save-btn">ثبت ریکارد</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Finance;
