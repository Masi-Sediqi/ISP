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
import { todayDateValue } from "../utils/afghanDate";
import "../App.css";

const money = (value) => Number(value || 0).toLocaleString("en-US");
const today = todayDateValue;

function Dashboard() {
  const navigate = useNavigate();
  const [dateFilter, setDateFilter] = useState("all");
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [customDates, setCustomDates] = useState({ from: "", to: "" });
  const dateFilterRef = useRef(null);
  const [assets] = useJsonCollection("assets");
  const [purchases] = useJsonCollection("supplierPurchases");
  const [customers] = useJsonCollection("customers");
  const [suppliers] = useJsonCollection("suppliers");
  const [transactions] = useJsonCollection("transactions");
  const [deviceTransfers] = useJsonCollection("deviceTransfers");
  const [securityDeposits] = useJsonCollection("securityDeposits");
  const [assetMovements] = useJsonCollection("assetMovements");
  const [disconnections] = useJsonCollection("disconnections");

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
    ["all", "All time"],
    ["today", "Today"],
    ["week", "This Week"],
    ["month", "This Month"],
    ["year", "This Year"],
    ["custom", "Custom range"],
  ];
  const selectedDateLabel =
    dateFilterOptions.find(([key]) => key === dateFilter)?.[1] || "All time";

  const totalAssets = assets.length;
  const activeTransfers = deviceTransfers.filter(
    (transfer) => String(transfer.approvalStatus || "Approved") !== "Rejected"
  );

  const transferQuantityByDestination = (destinationType) =>
    activeTransfers
      .filter(
        (transfer) =>
          String(transfer.destinationType || "").toLowerCase() === destinationType
      )
      .reduce((sum, transfer) => sum + Number(transfer.quantity || 0), 0);

  const transferQuantityBySource = (sourceType) =>
    activeTransfers
      .filter(
        (transfer) => String(transfer.sourceType || "").toLowerCase() === sourceType
      )
      .reduce((sum, transfer) => sum + Number(transfer.quantity || 0), 0);

  const countAssetUnits = (predicate) =>
    assets.reduce((sum, asset) => {
      const units = Array.isArray(asset.identityRecords) ? asset.identityRecords : [];

      if (units.length) {
        return sum + units.filter((unit) => predicate(unit, asset)).length;
      }

      return sum + (predicate(asset, asset) ? Number(asset.quantity || 0) : 0);
    }, 0);

  const mainStockAssets = assets.filter((asset) => Number(asset.quantity || 0) > 0).length;
  const mainStockQuantity = assets.reduce((sum, asset) => sum + Number(asset.quantity || 0), 0);

  const assetsAtTowers = Math.max(
    transferQuantityByDestination("tower") - transferQuantityBySource("tower"),
    countAssetUnits((unit) => String(unit.location || "").toLowerCase().includes("tower"))
  );

  const assetsWithCustomers = Math.max(
    transferQuantityByDestination("customer") - transferQuantityBySource("customer"),
    countAssetUnits((unit) => String(unit.location || "").toLowerCase().includes("customer"))
  );

  const damagedAssets = Math.max(
    transferQuantityByDestination("damaged"),
    countAssetUnits((unit, asset) => /damaged|damage/i.test(`${unit.status || ""} ${asset.status || ""}`))
  );

  const lostAssets = Math.max(
    transferQuantityByDestination("lost"),
    countAssetUnits((unit, asset) => /lost/i.test(`${unit.status || ""} ${asset.status || ""}`))
  );

  const underRepairAssets = Math.max(
    transferQuantityByDestination("repair") - transferQuantityBySource("repair"),
    countAssetUnits((unit, asset) =>
      /repair/i.test(`${unit.status || ""} ${unit.location || ""} ${asset.status || ""}`)
    )
  );

  const inactiveCustomers = customers.filter((customer) =>
    /inactive|disabled|disconnected/i.test(`${customer.status || ""}`)
  ).length;

  const devicesPendingCollection = disconnections.reduce((sum, record) => {
    const devices = record.deviceDetails || record.devices || record.pendingDevices || [];

    if (Array.isArray(devices) && devices.length) {
      return (
        sum +
        devices.filter((device) =>
          /pending|partially|unreachable/i.test(`${device.recoveryStatus || device.status || ""}`)
        ).length
      );
    }

    return sum + (/pending/i.test(`${record.recoveryStatus || ""}`) ? 1 : 0);
  }, 0);

  const depositSources = [
    ...securityDeposits,
    ...activeTransfers.filter(
      (transfer) =>
        Number(transfer.depositAmount || transfer.depositReceivedAmount || transfer.remainingDeposit || 0) > 0
    ),
  ];

  const totalDepositsHeld = depositSources
    .filter((deposit) =>
      /held|partial|outstanding|not received/i.test(`${deposit.status || deposit.depositStatus || ""}`)
    )
    .reduce(
      (sum, deposit) =>
        sum +
        Math.max(
          Number(deposit.amount || deposit.depositAmount || deposit.depositReceivedAmount || 0) -
            Number(deposit.refundAmount || deposit.refundedAmount || 0),
          0
        ),
      0
    );

  const depositsRefunded = depositSources.reduce(
    (sum, deposit) => sum + Number(deposit.refundAmount || deposit.refundedAmount || 0),
    0
  );

  const outstandingDeposits = depositSources.reduce(
    (sum, deposit) =>
      sum +
      Number(
        deposit.remainingDeposit ||
          deposit.outstandingAmount ||
          deposit.remainingAmount ||
          0
      ),
    0
  );

  const totalPurchaseValue = Math.max(
    purchases.reduce(
      (sum, purchase) =>
        sum +
        Number(
          purchase.totalPurchaseValue ||
            purchase.totalAmount ||
            purchase.amount ||
            0
        ),
      0
    ),
    assetMovements
      .filter((movement) => /purchase/i.test(`${movement.movement || ""} ${movement.type || ""}`))
      .reduce((sum, movement) => sum + Number(movement.totalAmount || movement.amount || 0), 0),
    assets.reduce((sum, asset) => sum + Number(asset.quantity || 0) * Number(asset.unitPrice || 0), 0)
  );

  const inStock = mainStockQuantity;
  const issuedAssets = assetsAtTowers + assetsWithCustomers;

  const income = transactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const expense = transactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const customerCategory = (customer) =>
    String(
      customer.customerType ||
        customer.type ||
        customer.category ||
        customer.sector ||
        customer.businessType ||
        ""
    ).toLowerCase();

  const countCustomersByCategory = (patterns) =>
    customers.filter((customer) =>
      patterns.some((pattern) => customerCategory(customer).includes(pattern))
    ).length;

  const consultantCustomers = countCustomersByCategory(["consult", "مشاور"]);
  const travelCustomers = countCustomersByCategory(["travel", "سفر", "ترانسپورت"]);
  const technologyCustomers = countCustomersByCategory(["technology", "tech", "تکنالوژی"]);
  const mediaCustomers = countCustomersByCategory(["media", "رسانه"]);
  const profit = income - expense;

  const depositHeld = securityDeposits
    .filter((item) => String(item.status || "").toLowerCase() !== "refunded")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

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

  const customerTrend = (patterns = null) =>
    monthKeys.map(
      (month) =>
        customers.filter(
          (customer) =>
            customerMonth(customer) === month &&
            (!patterns ||
              patterns.some((pattern) =>
                customerCategory(customer).includes(pattern)
              ))
        ).length
    );

  const transactionTrend = (type) =>
    monthKeys.map((month) =>
      transactions
        .filter(
          (item) =>
            item.type === type &&
            String(item.date || item.createdAt || "").startsWith(month)
        )
        .reduce((sum, item) => sum + Number(item.amount || 0), 0)
    );

  const incomeTrend = transactionTrend("income");
  const expenseTrend = transactionTrend("expense");
  const profitTrend = incomeTrend.map(
    (amount, index) => amount - expenseTrend[index]
  );

  const dashboardTrendCharts = [
    { title: "Total Customers", color: "#4f46e5", values: customerTrend(), type: "area", fallback: [1, 2, 2, 3, 4, 5] },
    { title: "Consultant Customers", color: "#8b5cf6", values: customerTrend(["consult", "مشاور"]), type: "bar", fallback: [3, 2, 4, 3, 5, 4] },
    { title: "Travel Customers", color: "#0ea5e9", values: customerTrend(["travel", "سفر", "ترانسپورت"]), type: "line", fallback: [2, 4, 1, 3, 2, 5] },
    { title: "Technology Customers", color: "#06b6d4", values: customerTrend(["technology", "tech", "تکنالوژی"]), type: "area", fallback: [4, 2, 3, 5, 3, 4] },
    { title: "Media Customers", color: "#ec4899", values: customerTrend(["media", "رسانه"]), type: "bar", fallback: [2, 3, 1, 4, 3, 5] },
    { title: "Total Expenses", color: "#ef4444", values: expenseTrend, currency: true, type: "area", fallback: [3200, 2100, 3800, 2900, 4100, 2600] },
    { title: "Total Income", color: "#22c55e", values: incomeTrend, currency: true, type: "bar", fallback: [4200, 5100, 3900, 6200, 5400, 7100] },
    { title: "Profit", color: profit >= 0 ? "#f59e0b" : "#ef4444", values: profitTrend, currency: true, type: "line", fallback: [1000, 3000, 100, 3300, 1300, 4500] },
  ].map((chart) => ({
    ...chart,
    isPreview: chart.values.every((value) => Number(value || 0) === 0),
    data: monthKeys.map((month, index) => ({
      month,
      value: chart.values.every((value) => Number(value || 0) === 0)
        ? chart.fallback[index]
        : chart.values[index] || 0,
    })),
  }));

  const totalForDonut = Math.max(
    inStock + issuedAssets + damagedAssets + lostAssets + underRepairAssets,
    totalAssets,
    1
  );
  const stockPercent = (inStock / totalForDonut) * 100;
  const issuedPercent = (issuedAssets / totalForDonut) * 100;

  const supplierPurchaseMap = new Map();
  purchases.forEach((record) => {
    const supplier = record.supplierName || record.supplier || "Unknown";
    supplierPurchaseMap.set(
      supplier,
      (supplierPurchaseMap.get(supplier) || 0) + Number(record.totalPurchaseValue || record.amount || 0)
    );
  });

  const supplierPurchases = [...supplierPurchaseMap.entries()]
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const maxSupplierPurchase = Math.max(...supplierPurchases.map((item) => item.amount), 1);

  const recentAssets = assets
    .map((asset, originalIndex) => ({ ...asset, originalIndex }))
    .slice(-6)
    .reverse();

  const todayPurchases = purchases.filter(
  (item) => item.purchaseDate === today()
).length;
  const todayTransfers = deviceTransfers.filter(
    (item) => (item.transferDate || item.date) === today()
  ).length;

  const todayIncome = transactions
    .filter((item) => item.type === "income" && item.date === today())
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const todayExpense = transactions
    .filter((item) => item.type === "expense" && item.date === today())
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <div className="dashboard-page">
      <section className="stats dashboard-stats-expanded">
        {[
          ["Total Customers", customers.length, "All registered customers", "/customers", "customers"],
          ["Consultant Customers", consultantCustomers, "Customers in consulting services", "/customers", "consultant"],
          ["Travel Customers", travelCustomers, "Customers in travel services", "/customers", "travel"],
          ["Technology Customers", technologyCustomers, "Customers in technology services", "/customers", "technology"],
          ["Media Customers", mediaCustomers, "Customers in media services", "/customers", "media"],
          ["Total Expenses", `${money(expense)} AFN`, "Total recorded business expenses", "/finance", "expense"],
          ["Total Income", `${money(income)} AFN`, "Total recorded business income", "/finance", "revenue"],
          ["Profit", `${money(profit)} AFN`, "Income minus total expenses", "/finance", profit >= 0 ? "profit" : "loss"],
        ].map(([label, value, description, path, tone]) => (
          <button
            type="button"
            className={`stat dashboard-stat-button dashboard-stat-${tone}`}
            key={label}
            onClick={() => navigate(path)}
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
            <span>Analytics</span>
            <h2>Performance Trends</h2>
          </div>
          <div className="dashboard-date-filter" ref={dateFilterRef}>
            <button
              type="button"
              className={`dashboard-date-trigger ${dateFilter !== "all" ? "active" : ""}`}
              onClick={() => setDateFilterOpen((current) => !current)}
              aria-expanded={dateFilterOpen}
            >
              <CalendarDays size={16} />
              <span><small>Date filter</small><strong>{selectedDateLabel}</strong></span>
              <ChevronDown size={15} />
            </button>
            {dateFilterOpen && (
              <div className="dashboard-date-menu">
                <div className="dashboard-date-menu-title">
                  <span>Filter dashboard</span>
                  <small>Select a reporting period</small>
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
                    <label><span>From date</span><input type="date" value={customDates.from} onChange={(event) => setCustomDates((current) => ({ ...current, from: event.target.value }))} /></label>
                    <label><span>To date</span><input type="date" value={customDates.to} min={customDates.from} onChange={(event) => setCustomDates((current) => ({ ...current, to: event.target.value }))} /></label>
                    <button type="button" disabled={!customDates.from || !customDates.to} onClick={() => setDateFilterOpen(false)}>Apply filter</button>
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
                <span>{chart.isPreview ? "Preview trend" : "Last 6 months"}</span>
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
                            chart.isPreview ? `${chart.title} (Preview)` : chart.title,
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
