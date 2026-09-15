import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Banknote,
  CalendarDays,
  Download,
  Landmark,
  ReceiptText,
  TrendingUp,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { buildReportsOverview } from "../utils/reportsOverview";
import { formatCurrencyAmount, formatCurrencyTotals, sumCurrencyAmounts, subtractCurrencyTotals } from "../utils/currencyDisplay";
import { convertToBaseAfn, normalizeExchangeRates } from "../utils/exchangeRates";
import "./Reports.css";

const safeList = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);
const money = (value) =>
  Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
const displayValue = (metric) =>
  metric.suffix ? `${money(metric.value)} ${metric.suffix}` : money(metric.value);
const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10) || "-";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const metricIcons = {
  totalSales: ReceiptText,
  paidAmount: Banknote,
  remainingAmount: Landmark,
  totalCustomers: Users,
  netProfit: TrendingUp,
  totalExpense: ReceiptText,
  activeEmployees: UserRoundCheck,
  progressingCustomers: Users,
};

export default function Reports() {
  const [range, setRange] = useState("daily");
  const [rawCustomers] = useJsonCollection("customers");
  const [rawProjectSales] = useJsonCollection("projectSales");
  const [rawTransactions] = useJsonCollection("transactions");
  const [rawEmployees] = useJsonCollection("employees");
  const [rawSettings] = useJsonCollection("settings");

  const overview = useMemo(
    () =>
      buildReportsOverview({
        customers: safeList(rawCustomers),
        projectSales: safeList(rawProjectSales),
        transactions: safeList(rawTransactions),
        employees: safeList(rawEmployees),
      }),
    [rawCustomers, rawProjectSales, rawTransactions, rawEmployees]
  );

  const projectSales = safeList(rawProjectSales);
  const transactions = safeList(rawTransactions);
  const exchangeRates = normalizeExchangeRates(safeList(rawSettings)[0]?.exchangeRates || {});
  const totalSalesByCurrency = sumCurrencyAmounts(projectSales, (sale) => sale.total ?? sale.price ?? sale.amount ?? 0, (sale) => sale.currency || sale.unit || "AFN");
  const paidByCurrency = sumCurrencyAmounts(projectSales, (sale) => sale.paid ?? sale.paidAmount ?? sale.total ?? 0, (sale) => sale.currency || sale.unit || "AFN");
  const remainingByCurrency = sumCurrencyAmounts(projectSales, (sale) => sale.remaining ?? sale.remainingAmount ?? Math.max(0, Number(sale.total || 0) - Number(sale.paid || 0)), (sale) => sale.currency || sale.unit || "AFN");
  const incomeByCurrency = sumCurrencyAmounts(transactions.filter((item) => item.type === "income"));
  const expenseByCurrency = sumCurrencyAmounts(transactions.filter((item) => item.type === "expense"));
  const netByCurrency = subtractCurrencyTotals(incomeByCurrency, expenseByCurrency);
  const currencyMetricTotals = {
    totalSales: totalSalesByCurrency,
    paidAmount: paidByCurrency,
    remainingAmount: remainingByCurrency,
    netProfit: netByCurrency,
    totalExpense: expenseByCurrency,
  };

  const metricOrder = [
    "totalSales",
    "paidAmount",
    "remainingAmount",
    "totalCustomers",
    "netProfit",
    "totalExpense",
    "activeEmployees",
    "progressingCustomers",
  ];

  const handleExport = () => window.print();

  return (
    <div className="reports-page reports-dashboard-page">
      <section className="reports-dashboard-shell">
        <header className="reports-dashboard-header">
          <h1>Reports</h1>
          <div className="reports-dashboard-actions">
            <button type="button" className="reports-date-button">
              <CalendarDays size={15} />
              <span>Last 6 months</span>
            </button>
            <select value={range} onChange={(event) => setRange(event.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <button type="button" className="reports-export-button" onClick={handleExport}>
              <Download size={15} />
              <span>Export</span>
            </button>
          </div>
        </header>

        <div className="reports-dashboard-metrics">
          {metricOrder.map((key) => {
            const metric = overview.metrics[key];
            const Icon = metricIcons[key] || ReceiptText;
            const positive = Number(metric.value || 0) >= 0;

            return (
              <article className="reports-dashboard-metric" key={key}>
                <div>
                  <span>{metric.label}</span>
                  <strong>{currencyMetricTotals[key] ? formatCurrencyTotals(currencyMetricTotals[key]) : displayValue(metric)}</strong>
                  <small>{positive ? "+" : "-"} Current system value</small>
                </div>
                <i className={positive ? "positive" : "negative"}>
                  <Icon size={15} />
                </i>
              </article>
            );
          })}
        </div>

        <div className="reports-dashboard-body">
          <section className="reports-latest-sales-card">
            <header>
              <div>
                <span>TOP COMPANIER</span>
                <h2>Latest project sales</h2>
              </div>
              <small>{overview.latestSales.length} records</small>
            </header>

            <div className="reports-latest-sales-list">
              {overview.latestSales.length ? (
                overview.latestSales.map((sale) => (
                  <article className="reports-latest-sale" key={`${sale.department}-${sale.id}`}>
                    <div className="reports-sale-avatar">
                      {sale.title.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="reports-sale-info">
                      <strong>{sale.title}</strong>
                      <span>
                        {sale.customer} · {sale.department}
                      </span>
                      <small>{formatDate(sale.date)}</small>
                    </div>
                    <div className="reports-sale-amounts">
                      <strong>
                        {formatCurrencyAmount(sale.total, sale.currency)}
                      </strong>
                      <small>
                        Paid {formatCurrencyAmount(sale.paid, sale.currency)} · Rem {formatCurrencyAmount(sale.remaining, sale.currency)}
                      </small>
                    </div>
                  </article>
                ))
              ) : (
                <div className="reports-dashboard-empty">
                  No project, travel, or education sales recorded yet.
                </div>
              )}
            </div>
          </section>

          <section className="reports-chart-card">
            <header>
              <div>
                <span>SALES TREND</span>
                <h2>Project sales by month</h2>
              </div>
              <strong>{formatCurrencyTotals(totalSalesByCurrency)}</strong>
            </header>
            <div className="reports-chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={overview.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="reportsSalesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#facc15" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#facc15" stopOpacity={0.04} />
                    </linearGradient>
                    <linearGradient id="reportsPaidFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 5" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={58}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    tickFormatter={(value) => money(value)}
                  />
                  <Tooltip
                    formatter={(value, name) => [`${money(value)} AFN`, name === "sales" ? "Total Sales" : "Paid Amount"]}
                    contentStyle={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 8,
                      boxShadow: "0 18px 40px rgba(15, 23, 42, 0.12)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    fill="url(#reportsSalesFill)"
                    activeDot={{ r: 6, fill: "#f59e0b", stroke: "#fff", strokeWidth: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="paid"
                    stroke="#0ea5e9"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#fff", stroke: "#0ea5e9", strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: "#0ea5e9", stroke: "#fff", strokeWidth: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
