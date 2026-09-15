import { useEffect, useRef, useState } from "react";
import { CalendarDays, Check, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import { calculateCashWalletBalances, formatWalletAmount } from "../utils/cashWallet";
import { calculateStaffPayables, calculateStaffPayablesByCurrency } from "../utils/staffPayable";
import { calculateSupplierPayable, calculateSupplierPayableByCurrency } from "../utils/supplierPayable";
import { formatCurrencyTotals, subtractCurrencyTotals, sumCurrencyAmounts } from "../utils/currencyDisplay";
import { convertToBaseAfn, normalizeExchangeRates } from "../utils/exchangeRates";
import {
  filterDashboardRecords,
  getDashboardDateRange,
  serializeDashboardFilter,
} from "../utils/dashboardFilters";
import "../App.css";

const money = (value) => Number(value || 0).toLocaleString("en-US");
const lower = (value) => String(value || "").trim().toLowerCase();
const safeList = (value) =>
  Array.isArray(value)
    ? value.filter((item) => item && typeof item === "object")
    : [];

function Dashboard() {
  const navigate = useNavigate();
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
  const [dateFilter, setDateFilter] = useState("all");
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [customDates, setCustomDates] = useState({ from: "", to: "" });
  const dateFilterRef = useRef(null);
  const [rawCustomers] = useJsonCollection("customers");
  const [rawTransactions] = useJsonCollection("transactions");
  const [rawCashWalletTransactions] = useJsonCollection("cashWalletTransactions");
  const [rawEmployees] = useJsonCollection("employees");
  const [rawEmployeePayrolls] = useJsonCollection("employeePayrolls");
  const [rawEmployeeAdjustments] = useJsonCollection("employeeAdjustments");
  const [rawProjectSales] = useJsonCollection("projectSales");
  const [rawSupplierPayments] = useJsonCollection("supplierPayments");
  const [rawSupplierPurchases] = useJsonCollection("supplierPurchases");
  const [rawSettings] = useJsonCollection("settings");

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

  const incomeRecords = filteredTransactions.filter((item) => item.type === "income");
  const expenseRecords = filteredTransactions.filter((item) => item.type === "expense");
  const incomeTotals = sumCurrencyAmounts(incomeRecords);
  const expenseTotals = sumCurrencyAmounts(expenseRecords);
  const profitTotals = subtractCurrencyTotals(incomeTotals, expenseTotals);
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
  const currentCashWallet = calculateCashWalletBalances(filteredCashWalletTransactions);
  const staffPayable = calculateStaffPayables({
    employees: filteredEmployees,
    payrolls: filteredEmployeePayrolls,
    adjustments: filteredEmployeeAdjustments,
  });
  const staffPayableByCurrency = calculateStaffPayablesByCurrency({
    employees: filteredEmployees,
    payrolls: filteredEmployeePayrolls,
    adjustments: filteredEmployeeAdjustments,
  });
  const activeEmployees = filteredEmployees.filter(
    (employee) => String(employee.status || "").toLowerCase() === "active"
  ).length;
  const customerReceivableTotals = sumCurrencyAmounts(
    filteredProjectSales,
    (sale) => sale.remaining || sale.remainingAmount || sale.balance || 0,
    (sale) => sale.currency || sale.unit || "AFN"
  );
  const customerReceivable = filteredProjectSales.reduce(
    (sum, sale) => sum + convertToBaseAfn(
      sale.remaining || sale.remainingAmount || sale.balance || 0,
      sale.currency || sale.unit || "AFN",
      exchangeRates
    ),
    0
  );
  const progressingCustomers = filteredCustomers.filter((customer) => {
    const stage = String(customer.customerStage || "").trim().toLowerCase();
    return stage && stage !== "none" && !["approved", "completed", "rejected"].includes(stage);
  }).length;
  const supplierPayable = calculateSupplierPayable({
    purchases: filteredSupplierPurchases,
    payments: filteredSupplierPayments,
  });
  const supplierPayableTotals = calculateSupplierPayableByCurrency({
    purchases: filteredSupplierPurchases,
    payments: filteredSupplierPayments,
  });

  const monthKeys = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index));
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });

  const customerMonth = (customer) =>
    String(
      customer.registrationDate ||
        customer.createdAt ||
        customer.date ||
        ""
    ).slice(0, 7);

  const customerTrend = () =>
    monthKeys.map(
      (month) =>
        filteredCustomers.filter(
          (customer) => customerMonth(customer) === month
        ).length
    );

  const transactionTrend = (type) =>
    monthKeys.map((month) =>
      filteredTransactions
        .filter(
          (item) =>
            item.type === type &&
            String(item.date || item.createdAt || "").startsWith(month)
        )
        .reduce((sum, item) => sum + convertToBaseAfn(item.amount, item.currency || item.unit || "AFN", exchangeRates), 0)
    );

  const incomeTrend = transactionTrend("income");
  const expenseTrend = transactionTrend("expense");
  const profitTrend = incomeTrend.map(
    (amount, index) => amount - expenseTrend[index]
  );
  const recordMonth = (record) => String(
    record?.date || record?.createdAt || record?.registrationDate || record?.paymentDate || record?.purchaseDate || ""
  ).slice(0, 7);
  const loanTrend = monthKeys.map((month) =>
    filteredProjectSales
      .filter((sale) => recordMonth(sale) === month)
      .reduce((sum, sale) => sum + convertToBaseAfn(sale.remaining || sale.remainingAmount || sale.balance || 0, sale.currency || sale.unit || "AFN", exchangeRates), 0)
  );
  const employeeTrend = monthKeys.map((month) =>
    filteredEmployees.filter((employee) => lower(employee.status) === "active" && recordMonth(employee) === month).length
  );
  const progressingTrend = monthKeys.map((month) =>
    filteredCustomers.filter((customer) => {
      const stage = lower(customer.customerStage);
      return recordMonth(customer) === month && stage && stage !== "none" && !["approved", "completed", "rejected"].includes(stage);
    }).length
  );
  const payableTrend = monthKeys.map((month) => {
    const totals = calculateSupplierPayableByCurrency({
      purchases: filteredSupplierPurchases.filter((item) => recordMonth(item) === month),
      payments: filteredSupplierPayments.filter((item) => recordMonth(item) === month),
    });
    return convertToBaseAfn(totals.AFN, "AFN", exchangeRates)
      + convertToBaseAfn(totals.USD, "USD", exchangeRates)
      + convertToBaseAfn(totals.EUR, "EUR", exchangeRates);
  });

  const dashboardTrendCharts = [
    { title: t.totalIncome, color: "#22c55e", values: incomeTrend, currency: true, type: "bar" },
    { title: t.totalExpenses, color: "#ef4444", values: expenseTrend, currency: true, type: "area" },
    { title: t.netProfit, color: profit >= 0 ? "#f59e0b" : "#ef4444", values: profitTrend, currency: true, type: "line" },
    { title: t.customerReceivable, color: "#6366f1", values: loanTrend, currency: true, type: "area" },
    { title: t.activeEmployee, color: "#0ea5e9", values: employeeTrend, type: "bar" },
    { title: t.progressingCustomers, color: "#8b5cf6", values: progressingTrend, type: "line" },
    { title: t.supplierPayable, color: "#ec4899", values: payableTrend, currency: true, type: "bar" },
    { title: t.totalCustomers, color: "#14b8a6", values: customerTrend(), type: "area" },
  ].map((chart) => ({
    ...chart,
    isPreview: false,
    data: monthKeys.map((month, index) => ({ month, value: chart.values[index] || 0 })),
  }));

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
              if (metric === "cash-wallet") navigate(`/cash-wallet${filterQuery}`);
              else if (metric === "staff-payable") navigate(`/staff-payable${filterQuery}`);
              else navigate(`/dashboard/details/${metric}${filterQuery}`);
            }}
          >
            <span>{label}</span>
            <h2>{value}</h2>
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
            <article className="card dashboard-trend-card" key={chart.title}>
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
