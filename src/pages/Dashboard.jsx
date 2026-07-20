import { Link, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [assets] = useJsonCollection("assets");
  const [purchases] = useJsonCollection("supplierPurchases");
  const [customers] = useJsonCollection("customers");
  const [suppliers] = useJsonCollection("suppliers");
  const [transactions] = useJsonCollection("transactions");
  const [deviceTransfers] = useJsonCollection("deviceTransfers");
  const [securityDeposits] = useJsonCollection("securityDeposits");
  const [assetMovements] = useJsonCollection("assetMovements");
  const [disconnections] = useJsonCollection("disconnections");

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
    transfers: deviceTransfers.filter((item) =>
      String(item.transferDate || item.date || "").startsWith(month)
    ).length,
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
          ["Total Assets", totalAssets, "Registered asset definitions", "/assets"],
          ["Main Stock Assets", mainStockAssets, `${money(mainStockQuantity)} units in stock`, "/main-stock"],
          ["Assets at Towers", assetsAtTowers, "Current tower-held quantity", "/tower-assets"],
          ["Assets with Customers", assetsWithCustomers, "Current customer-held quantity", "/customers"],
          ["Damaged Assets", damagedAssets, "Assets marked damaged", "/device-transfer-management"],
          ["Lost Assets", lostAssets, "Assets marked lost", "/device-transfer-management"],
          ["Under Repair Assets", underRepairAssets, "Assets currently in repair", "/device-transfer-management"],
          ["Inactive Customers", inactiveCustomers, "Inactive or disconnected customers", "/customers"],
          ["Devices Pending Collection", devicesPendingCollection, "Disconnected devices not fully collected", "/customers"],
          ["Total Deposits Held", `${money(totalDepositsHeld)} AFN`, "Held or partially held deposits", "/reports"],
          ["Deposits Refunded", `${money(depositsRefunded)} AFN`, "Refunded deposit amount", "/reports"],
          ["Outstanding Deposits", `${money(outstandingDeposits)} AFN`, "Remaining deposit balance", "/reports"],
          ["Total Purchase Value", `${money(totalPurchaseValue)} AFN`, "Recorded asset purchase value", "/reports"],
        ].map(([label, value, description, path]) => (
          <button
            type="button"
            className="stat dashboard-stat-button"
            key={label}
            onClick={() => navigate(path)}
          >
            <span>{label}</span>
            <h2>{value}</h2>
            <p>{description}</p>
          </button>
        ))}
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
