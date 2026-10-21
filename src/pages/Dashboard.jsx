import { useEffect, useRef, useState } from "react";
import { CalendarDays, Check, ChevronDown } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { formatWalletAmount } from "../utils/cashWallet";
import { formatCurrencyTotals } from "../utils/currencyDisplay";
import { convertToBaseAfn, normalizeExchangeRates } from "../utils/exchangeRates";
import {
  filterDashboardRecords,
  getDashboardDateRange,
  getRecordDate,
  serializeDashboardFilter,
} from "../utils/dashboardFilters";
import "../App.css";
import "./DashboardNumbers.css";
import { dashboardMetricRows, dashboardMetricTotals } from "../utils/dashboardMetrics";

const money = (value) => Number(value || 0).toLocaleString("en-US");
const lower = (value) => String(value || "").trim().toLowerCase();
const safeList = (value) =>
  Array.isArray(value)
    ? value.filter((item) => item && typeof item === "object")
    : [];

function Dashboard() {
  const navigate = useNavigate();
  const [initialParams] = useSearchParams();
  const [interfaceLanguage, setInterfaceLanguage] = useState(
    () => localStorage.getItem("isp-language") || "en"
  );

  useEffect(() => {
    const syncLanguage = (event) => {
      setInterfaceLanguage(
        event?.detail || localStorage.getItem("isp-language") || "en"
      );
    };

    window.addEventListener("isp-language-changed", syncLanguage);
    window.addEventListener("storage", syncLanguage);

    return () => {
      window.removeEventListener("isp-language-changed", syncLanguage);
      window.removeEventListener("storage", syncLanguage);
    };
  }, []);

  const dashboardTranslations = {
    en: {
      totalCustomers: "Total Customers",
      customerReceivable: "Customer Receivable",
      activeEmployee: "Active Employee",
      totalExpenses: "Total Expenses",
      totalIncome: "Total Income",
      netProfit: "Net Profit",
      progressingCustomers: "Progressing Customers",
      supplierPayable: "Supplier Payable",
      currentCashWallet: "Current Cash Wallet",
      currentCashWalletDescription: "Cash currently available in the office wallet",
      staffPayable: "Staff Payable",
      staffPayableDescription: "Total amount currently owed to employees",
      allCustomers: "All registered customers",
      customerReceivableDescription: "Total amount customers still owe the office",
      activeEmployeeDescription: "Currently active employees",
      businessExpenses: "Total recorded business expenses",
      businessIncome: "Total recorded business income",
      incomeMinusExpenses: "Income minus total expenses",
      progressingCustomersDescription: "Customers currently in active stages",
      supplierPayableDescription: "Total amount currently owed to suppliers",
      analytics: "Analytics",
      performanceTrends: "Performance Trends",
      dateFilter: "Date filter",
      filterDashboard: "Filter dashboard",
      selectPeriod: "Select a reporting period",
      allTime: "All time",
      today: "Today",
      yesterday: "Yesterday",
      thisWeek: "This Week",
      thisMonth: "This Month",
      thisYear: "This Year",
      customRange: "Custom range",
      fromDate: "From date",
      toDate: "To date",
      applyFilter: "Apply filter",
      previewTrend: "Preview trend",
      lastSixMonths: "Last 6 months",
      preview: "Preview",
    },
    dr: {
      totalCustomers: "مجموع مشتریان",
      customerReceivable: "طلبات مشتریان",
      activeEmployee: "کارمند فعال",
      totalExpenses: "مجموع مصارف",
      totalIncome: "مجموع عواید",
      netProfit: "سود خالص",
      progressingCustomers: "مشتریان در جریان",
      supplierPayable: "قابل پرداخت تأمین‌کنندگان",
      currentCashWallet: "کیف پول نقدی فعلی",
      currentCashWalletDescription: "موجودی فعلی نقد در کیف پول دفتر",
      staffPayable: "قابل پرداخت کارمندان",
      staffPayableDescription: "مجموع طلب فعلی کارمندان از دفتر",
      allCustomers: "تمام مشتریان ثبت‌شده",
      customerReceivableDescription: "مجموع مبلغی که مشتریان هنوز به دفتر بدهکار اند",
      activeEmployeeDescription: "کارمندان فعال فعلی",
      businessExpenses: "مجموع مصارف ثبت‌شده شرکت",
      businessIncome: "مجموع عواید ثبت‌شده شرکت",
      incomeMinusExpenses: "عواید منهای مجموع مصارف",
      progressingCustomersDescription: "مشتریانی که در مراحل جریان دارند",
      supplierPayableDescription: "مجموع مبلغی که دفتر به تأمین‌کنندگان بدهکار است",
      analytics: "تحلیل‌ها",
      performanceTrends: "روند عملکرد",
      dateFilter: "فیلتر تاریخ",
      filterDashboard: "فیلتر داشبورد",
      selectPeriod: "یک دوره گزارش‌دهی را انتخاب کنید",
      allTime: "همه زمان‌ها",
      today: "امروز",
      yesterday: "دیروز",
      thisWeek: "این هفته",
      thisMonth: "این ماه",
      thisYear: "امسال",
      customRange: "بازه دلخواه",
      fromDate: "از تاریخ",
      toDate: "تا تاریخ",
      applyFilter: "اعمال فیلتر",
      previewTrend: "پیش‌نمایش روند",
      lastSixMonths: "۶ ماه اخیر",
      preview: "پیش‌نمایش",
    },
    ps: {
      totalCustomers: "ټول پېرودونکي",
      customerReceivable: "د پېرودونکو ترلاسه کېدونکې پیسې",
      activeEmployee: "فعال کارکوونکی",
      totalExpenses: "ټول لګښتونه",
      totalIncome: "ټول عاید",
      netProfit: "خالصه ګټه",
      progressingCustomers: "په جریان کې پېرودونکي",
      supplierPayable: "عرضه کوونکو ته د ورکړې وړ",
      currentCashWallet: "اوسنی نغدي والټ",
      currentCashWalletDescription: "د دفتر په والټ کې اوسنی نغدي موجودي",
      staffPayable: "د کارکوونکو ورکړې",
      staffPayableDescription: "کارکوونکو ته د دفتر ټول پاتې پور",
      allCustomers: "ټول ثبت شوي پېرودونکي",
      customerReceivableDescription: "هغه ټول مبلغ چې پېرودونکي یې لا دفتر ته پوروړي دي",
      activeEmployeeDescription: "اوسني فعال کارکوونکي",
      businessExpenses: "د سوداګرۍ ټول ثبت شوي لګښتونه",
      businessIncome: "د سوداګرۍ ټول ثبت شوي عاید",
      incomeMinusExpenses: "عاید منفي ټول لګښتونه",
      progressingCustomersDescription: "هغه پېرودونکي چې پړاوونه يې روان دي",
      supplierPayableDescription: "هغه ټول مبلغ چې دفتر یې عرضه کوونکو ته پوروړی دی",
      analytics: "شننې",
      performanceTrends: "د فعالیت بهیر",
      dateFilter: "د نېټې فلټر",
      filterDashboard: "ډشبورډ فلټر کړئ",
      selectPeriod: "د راپور موده وټاکئ",
      allTime: "ټول وخت",
      today: "نن",
      yesterday: "پرون",
      thisWeek: "دا اونۍ",
      thisMonth: "دا میاشت",
      thisYear: "سږ کال",
      customRange: "ځانګړې موده",
      fromDate: "له نېټې",
      toDate: "تر نېټې",
      applyFilter: "فلټر پلي کړئ",
      previewTrend: "د بهیر مخکتنه",
      lastSixMonths: "وروستۍ ۶ میاشتې",
      preview: "مخکتنه",
    },
  };

  const t =
    dashboardTranslations[interfaceLanguage] || dashboardTranslations.en;
  const [dateFilter, setDateFilter] = useState(() => initialParams.get('filter') || 'all');
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [customDates, setCustomDates] = useState(() => ({ from: initialParams.get('from') || '', to: initialParams.get('to') || '' }));
  const dateFilterRef = useRef(null);
  const [rawCustomers] = useJsonCollection("customers", { refreshInterval: 30000 });
  const [rawTransactions] = useJsonCollection("transactions", { refreshInterval: 30000 });
  const [rawCashWalletTransactions] = useJsonCollection("cashWalletTransactions", { refreshInterval: 30000 });
  const [rawEmployees] = useJsonCollection("employees", { refreshInterval: 30000 });
  const [rawEmployeePayrolls] = useJsonCollection("employeePayrolls", { refreshInterval: 30000 });
  const [rawEmployeeAdjustments] = useJsonCollection("employeeAdjustments", { refreshInterval: 30000 });
  const [rawProjectSales] = useJsonCollection("projectSales", { refreshInterval: 30000 });
  const [rawSupplierPayments] = useJsonCollection("supplierPayments", { refreshInterval: 30000 });
  const [rawSupplierPurchases] = useJsonCollection("supplierPurchases", { refreshInterval: 30000 });
  const [rawSuppliers] = useJsonCollection("suppliers", { refreshInterval: 30000 });
  const [rawSettings] = useJsonCollection("settings", { refreshInterval: 30000 });

  const customers = safeList(rawCustomers);
  const transactions = safeList(rawTransactions);
  const cashWalletTransactions = safeList(rawCashWalletTransactions);
  const employees = safeList(rawEmployees);
  const employeePayrolls = safeList(rawEmployeePayrolls);
  const employeeAdjustments = safeList(rawEmployeeAdjustments);
  const projectSales = safeList(rawProjectSales);
  const supplierPayments = safeList(rawSupplierPayments);
  const supplierPurchases = safeList(rawSupplierPurchases);

  useEffect(() => {
    const closeFilter = (event) => {
      if (dateFilterRef.current && !dateFilterRef.current.contains(event.target)) {
        setDateFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", closeFilter);
    return () => document.removeEventListener("mousedown", closeFilter);
  }, []);

  const dateFilterOptions = [
    ["all", t.allTime],
    ["today", t.today],
    ["yesterday", t.yesterday],
    ["week", t.thisWeek],
    ["month", t.thisMonth],
    ["year", t.thisYear],
    ["custom", t.customRange],
  ];
  const selectedDateLabel =
    dateFilterOptions.find(([key]) => key === dateFilter)?.[1] || t.allTime;

  const activeRange = getDashboardDateRange(dateFilter, customDates);
  const filteredCustomers = filterDashboardRecords(customers, activeRange);
  const filteredTransactions = filterDashboardRecords(transactions, activeRange);
  const filteredCashWalletTransactions = filterDashboardRecords(cashWalletTransactions, activeRange);
  const filteredEmployees = filterDashboardRecords(employees, activeRange);
  const filteredEmployeePayrolls = filterDashboardRecords(employeePayrolls, activeRange);
  const filteredEmployeeAdjustments = filterDashboardRecords(employeeAdjustments, activeRange);
  const filteredProjectSales = filterDashboardRecords(projectSales, activeRange);
  const filteredSupplierPayments = filterDashboardRecords(supplierPayments, activeRange);
  const filteredSupplierPurchases = filterDashboardRecords(supplierPurchases, activeRange);

  const metricData = {
    customers: filteredCustomers, employees: filteredEmployees, allEmployees: employees,
    transactions: filteredTransactions, projectSales: filteredProjectSales,
    suppliers: safeList(rawSuppliers), supplierPurchases: filteredSupplierPurchases,
    supplierPayments: filteredSupplierPayments, payrolls: filteredEmployeePayrolls,
    adjustments: filteredEmployeeAdjustments, wallet: filteredCashWalletTransactions,
  };
  const metricRows = Object.fromEntries(['customers', 'active-employees', 'progressing-customers', 'customer-receivable', 'income', 'expenses', 'net-profit', 'supplier-payable', 'staff-payable', 'cash-wallet'].map(metric => [metric, dashboardMetricRows(metric, metricData)]));
  const incomeRecords = filteredTransactions.filter((item) => lower(item.type) === "income");
  const expenseRecords = filteredTransactions.filter((item) => lower(item.type) === "expense");
  const incomeTotals = dashboardMetricTotals('income', metricRows.income);
  const expenseTotals = dashboardMetricTotals('expenses', metricRows.expenses);
  const profitTotals = dashboardMetricTotals('net-profit', metricRows['net-profit']);
  const exchangeRates = normalizeExchangeRates(safeList(rawSettings)[0]?.exchangeRates || {});
  const income = incomeRecords.reduce(
    (sum, item) => sum + convertToBaseAfn(item.amount, item.currency || item.unit || "AFN", exchangeRates),
    0
  );
  const expense = expenseRecords.reduce(
    (sum, item) => sum + convertToBaseAfn(item.amount, item.currency || item.unit || "AFN", exchangeRates),
    0
  );
  const profit = income - expense;
  const currentCashWallet = dashboardMetricTotals('cash-wallet', metricRows['cash-wallet']);
  const staffPayableByCurrency = { totals: dashboardMetricTotals('staff-payable', metricRows['staff-payable']) };
  const activeEmployees = metricRows['active-employees'].length;
  const customerReceivableTotals = dashboardMetricTotals('customer-receivable', metricRows['customer-receivable']);
  const progressingCustomers = metricRows['progressing-customers'].length;
  const supplierPayableTotals = dashboardMetricTotals('supplier-payable', metricRows['supplier-payable']);

  const monthKeys = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index));
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });

  const chartValues = metric => monthKeys.map(month => {
    const monthlyData = Object.fromEntries(Object.entries(metricData).map(([key, records]) => [key,
      ['suppliers', 'allEmployees'].includes(key) ? records : records.filter(record => {
        const date = getRecordDate(record);
        return date && `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` === month;
      }),
    ]));
    const rows = dashboardMetricRows(metric, monthlyData);
    if (['customers', 'active-employees', 'progressing-customers'].includes(metric)) return rows.length;
    const totals = dashboardMetricTotals(metric, rows);
    return Object.entries(totals).reduce((sum, [unit, amount]) => sum + convertToBaseAfn(amount, unit, exchangeRates), 0);
  });

  const dashboardTrendCharts = [
    { metric: 'income', title: t.totalIncome, color: '#22c55e', currency: true, type: 'bar' },
    { metric: 'expenses', title: t.totalExpenses, color: '#ef4444', currency: true, type: 'area' },
    { metric: 'net-profit', title: t.netProfit, color: profit >= 0 ? '#f59e0b' : '#ef4444', currency: true, type: 'line' },
    { metric: 'customer-receivable', title: t.customerReceivable, color: '#6366f1', currency: true, type: 'area' },
    { metric: 'active-employees', title: t.activeEmployee, color: '#0ea5e9', type: 'bar' },
    { metric: 'progressing-customers', title: t.progressingCustomers, color: '#8b5cf6', type: 'line' },
    { metric: 'supplier-payable', title: t.supplierPayable, color: '#ec4899', currency: true, type: 'bar' },
    { metric: 'customers', title: t.totalCustomers, color: '#14b8a6', type: 'area' },
  ].map(chart => ({ ...chart, isPreview: false, data: chartValues(chart.metric).map((value, index) => ({ month: monthKeys[index], value })) }));

  return (
    <div className="dashboard-page">
      <section className="stats dashboard-stats-expanded">
        {[
          [t.totalCustomers, filteredCustomers.length, t.allCustomers, "customers", "customers"],
          [t.customerReceivable, formatCurrencyTotals(customerReceivableTotals), t.customerReceivableDescription, "customer-receivable", "loan"],
          [t.activeEmployee, activeEmployees, t.activeEmployeeDescription, "active-employees", "employee"],
          [t.totalExpenses, formatCurrencyTotals(expenseTotals), t.businessExpenses, "expenses", "expense"],
          [t.totalIncome, formatCurrencyTotals(incomeTotals), t.businessIncome, "income", "revenue"],
          [t.netProfit, formatCurrencyTotals(profitTotals), t.incomeMinusExpenses, "net-profit", profit >= 0 ? "profit" : "loss"],
          [t.progressingCustomers, progressingCustomers, t.progressingCustomersDescription, "progressing-customers", "progress"],
          [t.supplierPayable, formatCurrencyTotals(supplierPayableTotals), t.supplierPayableDescription, "supplier-payable", "payable"],
          [t.currentCashWallet, (
            <span className="dashboard-wallet-balance-value">
              <span>{formatWalletAmount(currentCashWallet.AFN, "AFN")}</span>
              <span>{formatWalletAmount(currentCashWallet.USD, "USD")}</span>
              <span>{formatWalletAmount(currentCashWallet.EUR, "EUR")}</span>
            </span>
          ), t.currentCashWalletDescription, "cash-wallet", "wallet"],
          [t.staffPayable, formatCurrencyTotals(staffPayableByCurrency.totals), t.staffPayableDescription, "staff-payable", "payable"],
        ].map(([label, value, description, metric, tone]) => (
          <button
            type="button"
            className={`stat dashboard-stat-button dashboard-stat-${tone}`}
            key={label}
            onClick={() => {
              const filterQuery = serializeDashboardFilter(dateFilter, customDates);
              navigate(`/dashboard/details/${metric}${filterQuery}`);
            }}
          >
            <span>{label}</span>
            <h2 className="dashboard-stat-value"><bdi dir="ltr">{value}</bdi></h2>
            <p>{description}</p>
          </button>
        ))}
      </section>

      <section className="dashboard-trends-section">
        <div className="dashboard-trends-heading">
          <div>
            <span>{t.analytics}</span>
            <h2>{t.performanceTrends}</h2>
          </div>
          <div className="dashboard-date-filter" ref={dateFilterRef}>
            <button
              type="button"
              className={`dashboard-date-trigger ${dateFilter !== "all" ? "active" : ""}`}
              onClick={() => setDateFilterOpen((current) => !current)}
              aria-expanded={dateFilterOpen}
            >
              <CalendarDays size={16} />
              <span><small>{t.dateFilter}</small><strong>{selectedDateLabel}</strong></span>
              <ChevronDown size={15} />
            </button>
            {dateFilterOpen && (
              <div className="dashboard-date-menu">
                <div className="dashboard-date-menu-title">
                  <span>{t.filterDashboard}</span>
                  <small>{t.selectPeriod}</small>
                </div>
                <div className="dashboard-date-options">
                  {dateFilterOptions.map(([key, label]) => (
                    <button
                      type="button"
                      key={key}
                      className={dateFilter === key ? "selected" : ""}
                      onClick={() => {
                        setDateFilter(key);
                        if (key !== "custom") setDateFilterOpen(false);
                      }}
                    >
                      <span>{label}</span>
                      {dateFilter === key && <Check size={15} />}
                    </button>
                  ))}
                </div>
                {dateFilter === "custom" && (
                  <div className="dashboard-custom-dates">
                    <label><span>{t.fromDate}</span><input type="date" value={customDates.from} onChange={(event) => setCustomDates((current) => ({ ...current, from: event.target.value }))} /></label>
                    <label><span>{t.toDate}</span><input type="date" value={customDates.to} min={customDates.from} onChange={(event) => setCustomDates((current) => ({ ...current, to: event.target.value }))} /></label>
                    <button type="button" disabled={!customDates.from || !customDates.to} onClick={() => setDateFilterOpen(false)}>{t.applyFilter}</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-trends-grid">
          {dashboardTrendCharts.map((chart) => (
            <article className="card dashboard-trend-card" key={chart.title} role="link" tabIndex={0} aria-label={`View ${chart.title} records`} onClick={() => navigate(`/dashboard/details/${chart.metric}${serializeDashboardFilter(dateFilter, customDates)}`)} onKeyDown={event => { if (event.target === event.currentTarget && ['Enter', ' '].includes(event.key)) { event.preventDefault(); navigate(`/dashboard/details/${chart.metric}${serializeDashboardFilter(dateFilter, customDates)}`); } }}>
              <div className="card-title">
                <div>
                  <span className="dashboard-trend-accent" style={{ background: chart.color }}></span>
                  <h3>{chart.title}</h3>
                </div>
                <span>{chart.isPreview ? t.previewTrend : t.lastSixMonths}</span>
              </div>
              <div className="dashboard-trend-chart">
                <ResponsiveContainer width="100%" height="100%">
                  {(() => {
                    const ChartComponent =
                      chart.type === "area" ? AreaChart : chart.type === "bar" ? BarChart : LineChart;
                    return (
                      <ChartComponent data={chart.data} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id={`fill-${chart.color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={chart.color} stopOpacity={0.38} />
                            <stop offset="100%" stopColor={chart.color} stopOpacity={0.03} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 5" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                        <YAxis
                          allowDecimals={false}
                          axisLine={false}
                          tickLine={false}
                          width={48}
                          tick={{ fontSize: 11, fill: "#94a3b8" }}
                          tickFormatter={(value) => chart.currency ? money(value) : value}
                        />
                        <Tooltip
                          formatter={(value) => [
                            chart.currency ? `${money(value)} AFN` : value,
                            chart.isPreview ? `${chart.title} (${t.preview})` : chart.title,
                          ]}
                          cursor={{ fill: `${chart.color}0c` }}
                          contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 12px 30px rgba(15,23,42,.1)" }}
                        />
                        {chart.type === "area" && (
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke={chart.color}
                            strokeWidth={3}
                            fill={`url(#fill-${chart.color.replace("#", "")})`}
                            activeDot={{ r: 6, fill: chart.color, stroke: "#fff", strokeWidth: 3 }}
                          />
                        )}
                        {chart.type === "bar" && (
                          <Bar dataKey="value" fill={chart.color} radius={[8, 8, 3, 3]} maxBarSize={42} />
                        )}
                        {chart.type === "line" && (
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke={chart.color}
                            strokeWidth={3}
                            dot={{ r: 4, fill: "#fff", stroke: chart.color, strokeWidth: 2 }}
                            activeDot={{ r: 6, fill: chart.color, stroke: "#fff", strokeWidth: 3 }}
                          />
                        )}
                      </ChartComponent>
                    );
                  })()}
                </ResponsiveContainer>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
