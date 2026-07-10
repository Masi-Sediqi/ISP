import { Link } from "react-router-dom";
import {
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
  const [assets] = useJsonCollection("assets");
  const [purchases] = useJsonCollection("supplierPurchases");
  const [customers] = useJsonCollection("customers");
  const [suppliers] = useJsonCollection("suppliers");
  const [transactions] = useJsonCollection("transactions");
  const [deviceTransfers] = useJsonCollection("deviceTransfers");
  const [securityDeposits] = useJsonCollection("securityDeposits");

  const totalAssets = assets.length;
  const inStock = assets.filter((item) =>
    ["in stock", "available", "فعال", "موجود"].includes(String(item.status || "").toLowerCase())
  ).length;

  const issuedAssets = assets.filter((item) =>
    ["issued", "installed", "assigned", "توزیع شده", "نصب شده"].includes(String(item.status || "").toLowerCase())
  ).length;

  const damagedAssets = assets.filter((item) =>
    ["damaged", "lost", "returned", "خراب", "گم شده"].includes(String(item.status || "").toLowerCase())
  ).length;

  const income = transactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const expense = transactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const depositHeld = securityDeposits
    .filter((item) => String(item.status || "").toLowerCase() !== "refunded")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const monthKeys = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index));
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });

  const monthlyStock = monthKeys.map((month) => ({
    month,
    purchases: purchases.filter((item) =>
  String(item.purchaseDate || "").startsWith(month)
).length,
    transfers: deviceTransfers.filter((item) => String(item.date || "").startsWith(month)).length,
  }));

  const totalForDonut = Math.max(totalAssets, 1);
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
  const todayTransfers = deviceTransfers.filter((item) => item.date === today()).length;

  const todayIncome = transactions
    .filter((item) => item.type === "income" && item.date === today())
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const todayExpense = transactions
    .filter((item) => item.type === "expense" && item.date === today())
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <div className="dashboard-page">
      <section className="stats">
        <div className="stat">
          <span>Total Assets</span>
          <h2>{totalAssets}</h2>
          <p>{inStock} in stock and {issuedAssets} issued</p>
        </div>

        <div className="stat">
          <span>Customers</span>
          <h2>{customers.length}</h2>
          <p>Registered customer records</p>
        </div>

        <div className="stat">
          <span>Suppliers</span>
          <h2>{suppliers.length}</h2>
          <p>Active supplier records</p>
        </div>

        <div className="stat">
          <span>Net Balance</span>
          <h2>{money(income - expense)}</h2>
          <p>{money(expense)} total expenses</p>
        </div>
      </section>

      <section className="charts-grid">
        <div className="card large">
          <div className="card-title">
            <h3>Stock Movement - Last 6 Months</h3>
            <span>Dynamic</span>
          </div>

          <div className="real-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyStock}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="purchases"
                  name="Purchases"
                  stroke="#5b3df5"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="transfers"
                  name="Transfers"
                  stroke="#22c55e"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <h3>Asset Status</h3>
          </div>

          <div className="donut">
            <div
              className="donut-circle"
              style={{
                background: `conic-gradient(#22c55e 0 ${stockPercent}%, #3b82f6 ${stockPercent}% ${
                  stockPercent + issuedPercent
                }%, #ef4444 ${stockPercent + issuedPercent}% 100%)`,
              }}
            >
              <h2>{totalAssets}</h2>
              <p>Assets</p>
            </div>
          </div>

          <div className="legend">
            <span><b className="green"></b>In Stock: {inStock}</span>
            <span><b className="blue"></b>Issued / Installed: {issuedAssets}</span>
            <span><b className="red-dot"></b>Damaged / Lost: {damagedAssets}</span>
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <h3>Supplier Purchases</h3>
          </div>

          <div className="bar-chart">
            {supplierPurchases.map((item) => (
              <div key={item.name}>
                <span
                  style={{
                    height: `${Math.max((item.amount / maxSupplierPurchase) * 100, 6)}%`,
                  }}
                ></span>
                <p>{item.name}</p>
                <small>{money(item.amount)}</small>
              </div>
            ))}

            {!supplierPurchases.length && (
              <p className="dashboard-empty">No supplier purchase data has been recorded yet.</p>
            )}
          </div>
        </div>
      </section>

      <section className="bottom-grid">
        <div className="card table-card">
          <div className="card-title">
            <h3>Recent Assets</h3>
            <Link to="/assets">View All</Link>
          </div>

          <div className="dashboard-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Asset ID</th>
                  <th>Device</th>
                  <th>MAC Address</th>
                  <th>Serial Number</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {recentAssets.map((asset) => (
                  <tr key={asset.id || asset.originalIndex}>
                    <td>{asset.assetId || asset.plate || "-"}</td>
                    <td>{asset.deviceName || asset.name || asset.model || "-"}</td>
                    <td>{asset.macAddress || "-"}</td>
                    <td>{asset.serialNumber || asset.vin || "-"}</td>
                    <td>
                      <span className="badge info">
                        {asset.status || "Unknown"}
                      </span>
                    </td>
                  </tr>
                ))}

                {!recentAssets.length && (
                  <tr>
                    <td colSpan="5" className="dashboard-empty">
                      No asset records have been registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <h3>Today Summary</h3>
          </div>

          <div className="summary">
            <div>
              <span>Purchases Today</span>
              <b>{todayPurchases}</b>
            </div>

            <div>
              <span>Transfers Today</span>
              <b>{todayTransfers}</b>
            </div>

            <div>
              <span>Income Today</span>
              <b>{money(todayIncome)}</b>
            </div>

            <div>
              <span>Expenses Today</span>
              <b>{money(todayExpense)}</b>
            </div>

            <div>
              <span>Security Deposits Held</span>
              <b>{money(depositHeld)}</b>
            </div>

            <div className="profit">
              <span>Net Today</span>
              <b>{money(todayIncome - todayExpense)}</b>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;