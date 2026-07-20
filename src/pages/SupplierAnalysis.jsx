import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { formatDateTime } from "../utils/afghanDate";
import "./SupplierAnalysis.css";

const money = (value) => Number(value || 0).toLocaleString("en-US");

const monthKey = (value) => {
  if (!value) return "Unknown";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 7) || "Unknown";
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}`;
};

export default function SupplierAnalysis() {
  const { id } = useParams();
  const supplierIndex = Number(id);

  const [suppliers] = useJsonCollection("suppliers");
  const [assets] = useJsonCollection("assets");
  const [supplierPurchases] = useJsonCollection("supplierPurchases");
  const [assetMovements] = useJsonCollection("assetMovements");
  const [supplierPayments] = useJsonCollection("supplierPayments");

  const supplier = suppliers[supplierIndex];
  const supplierName = supplier?.supplierName || "";
  const supplierKey = String(supplier?.id || supplierName || "");

  const purchases = useMemo(() => {
    const movementPurchases = assetMovements
      .filter(
        (movement) =>
          movement.movementType === "Purchase" &&
          (String(movement.supplierRecordId || "") === supplierKey ||
            movement.supplierName === supplierName)
      )
      .map((movement) => {
        const relatedAsset = assets.find(
          (asset) =>
            String(asset.id || asset.assetId) ===
              String(movement.assetRecordId || movement.assetId) ||
            String(asset.assetId || "") === String(movement.assetId || "")
        );

        return {
          id: movement.id,
          date:
            movement.date ||
            movement.purchaseDate ||
            movement.createdAt ||
            "",
          referenceNumber:
            movement.referenceNumber || movement.purchaseCode || "-",
          invoiceNumber:
            movement.invoiceNumber || movement.billNumber || "-",
          assetId: relatedAsset?.assetId || movement.assetId || "-",
          deviceName:
            relatedAsset?.deviceName || movement.deviceName || "-",
          quantity: Number(movement.quantity || 0),
          unitPrice: Number(movement.unitPrice || 0),
          totalAmount: Number(movement.totalAmount || 0),
          paidAmount: Number(movement.paidAmount || 0),
          remainingAmount: Number(movement.remainingAmount || 0),
          status: movement.paymentStatus || "-",
          source: "Asset Purchase",
        };
      });

    const directPurchases = supplierPurchases
      .filter(
        (purchase) =>
          Number(purchase.supplierIndex) === supplierIndex ||
          purchase.supplierName === supplierName
      )
      .map((purchase) => ({
        id: purchase.id,
        date: purchase.purchaseDate || purchase.createdAt || "",
        referenceNumber:
          purchase.referenceNumber || purchase.purchaseCode || "-",
        invoiceNumber: purchase.invoiceNumber || "-",
        assetId: purchase.assetId || "-",
        deviceName: purchase.deviceName || "-",
        quantity: Number(purchase.quantity || 0),
        unitPrice: Number(purchase.unitPrice || 0),
        totalAmount: Number(purchase.totalPurchaseValue || 0),
        paidAmount: Number(purchase.paidAmount || 0),
        remainingAmount: Number(purchase.remainAmount || 0),
        status:
          Number(purchase.remainAmount || 0) <= 0
            ? "Paid"
            : Number(purchase.paidAmount || 0) > 0
              ? "Partial"
              : "Unpaid",
        source: "Supplier Purchase",
      }));

    return [...movementPurchases, ...directPurchases].sort(
      (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
    );
  }, [
    assetMovements,
    assets,
    supplierIndex,
    supplierKey,
    supplierName,
    supplierPurchases,
  ]);

  const payments = useMemo(
    () =>
      supplierPayments
        .filter(
          (payment) =>
            !payment.isBalanceRecord &&
            (Number(payment.supplierIndex) === supplierIndex ||
              payment.supplierName === supplierName)
        )
        .sort(
          (a, b) =>
            new Date(b.paymentDate || 0) -
            new Date(a.paymentDate || 0)
        ),
    [supplierPayments, supplierIndex, supplierName]
  );

  const totals = useMemo(() => {
    const purchaseTotal = purchases.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );

    const purchasePaid = purchases.reduce(
      (sum, item) => sum + item.paidAmount,
      0
    );

    const paymentTotal = payments.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const remaining = purchases.reduce(
      (sum, item) => sum + item.remainingAmount,
      0
    );

    const quantity = purchases.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    return {
      purchaseTotal,
      purchasePaid,
      paymentTotal,
      remaining,
      quantity,
    };
  }, [payments, purchases]);

  const chartData = useMemo(() => {
    const rows = new Map();

    purchases.forEach((purchase) => {
      const key = monthKey(purchase.date);

      const row = rows.get(key) || {
        month: key,
        purchases: 0,
        paid: 0,
        payments: 0,
      };

      row.purchases += purchase.totalAmount;
      row.paid += purchase.paidAmount;

      rows.set(key, row);
    });

    payments.forEach((payment) => {
      const key = monthKey(payment.paymentDate);

      const row = rows.get(key) || {
        month: key,
        purchases: 0,
        paid: 0,
        payments: 0,
      };

      row.payments += Number(payment.amount || 0);

      rows.set(key, row);
    });

    return Array.from(rows.values()).sort((a, b) =>
      a.month.localeCompare(b.month)
    );
  }, [payments, purchases]);

  if (!supplier) {
    return (
      <div className="supplier-analysis-page">
        <Link
          className="supplier-analysis-back"
          to="/suppliers"
        >
          ← Back to Suppliers
        </Link>

        <h1>Supplier was not found.</h1>
      </div>
    );
  }

  return (
    <div className="supplier-analysis-page">
      <Link
        className="supplier-analysis-back"
        to="/suppliers"
      >
        ← Back to Suppliers
      </Link>

      <div className="supplier-analysis-header">
        <div>
          <span>Supplier Analysis</span>

          <h1>{supplierName || "Supplier Analysis"}</h1>

          <p>
            Purchases, quantities, balances, and payment activity
            for this supplier.
          </p>
        </div>
      </div>

      <div className="supplier-analysis-stats">
        <div>
          <span>Total Purchases</span>
          <strong>{money(totals.purchaseTotal)} AFN</strong>
          <p>All purchase values</p>
        </div>

        <div>
          <span>Total Quantity</span>
          <strong>{money(totals.quantity)}</strong>
          <p>Purchased quantity</p>
        </div>

        <div>
          <span>Paid On Purchases</span>
          <strong>{money(totals.purchasePaid)} AFN</strong>
          <p>Paid during purchase records</p>
        </div>

        <div>
          <span>Supplier Payments</span>
          <strong>{money(totals.paymentTotal)} AFN</strong>
          <p>Separate payments made</p>
        </div>

        <div>
          <span>Remaining</span>
          <strong>{money(totals.remaining)} AFN</strong>
          <p>Unpaid purchase amount</p>
        </div>
      </div>

      <div className="supplier-analysis-chart-grid">
        <section>
          <h3>Purchase vs Payment</h3>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis dataKey="month" />
              <YAxis />

              <Tooltip
                formatter={(value) => `${money(value)} AFN`}
              />

              <Legend />

              <Bar
                dataKey="purchases"
                name="Purchases"
                fill="#4f46e5"
                radius={[8, 8, 0, 0]}
              />

              <Bar
                dataKey="payments"
                name="Payments"
                fill="#10b981"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section>
          <h3>Paid Trend</h3>

          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis dataKey="month" />
              <YAxis />

              <Tooltip
                formatter={(value) => `${money(value)} AFN`}
              />

              <Legend />

              <Line
                type="monotone"
                dataKey="paid"
                name="Paid in Purchases"
                stroke="#0f766e"
                strokeWidth={3}
              />

              <Line
                type="monotone"
                dataKey="payments"
                name="Payments"
                stroke="#f59e0b"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </section>
      </div>

      <div className="supplier-analysis-history-grid">
        <section className="supplier-analysis-table-card">
          <div className="supplier-analysis-table-header">
            <div>
              <h3>Purchase History</h3>

              <p>
                All purchases from this supplier with date,
                quantity, value, and payment status.
              </p>
            </div>
          </div>

          <div className="supplier-analysis-table-wrap">
            <table className="supplier-analysis-purchase-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Invoice</th>
                  <th>Asset</th>
                  <th>Device</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Remaining</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {purchases.map((purchase) => (
                  <tr
                    key={`${purchase.source}-${purchase.id}`}
                  >
                    <td>{formatDateTime(purchase.date)}</td>
                    <td>{purchase.referenceNumber}</td>
                    <td>{purchase.invoiceNumber}</td>
                    <td>{purchase.assetId}</td>
                    <td>{purchase.deviceName}</td>
                    <td>{money(purchase.quantity)}</td>
                    <td>{money(purchase.unitPrice)} AFN</td>
                    <td>{money(purchase.totalAmount)} AFN</td>
                    <td>{money(purchase.paidAmount)} AFN</td>
                    <td>
                      {money(purchase.remainingAmount)} AFN
                    </td>

                    <td>
                      <span
                        className={`supplier-analysis-status ${String(
                          purchase.status
                        ).toLowerCase()}`}
                      >
                        {purchase.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {purchases.length === 0 && (
                  <tr>
                    <td
                      colSpan="11"
                      className="supplier-analysis-empty"
                    >
                      No purchase record was found for this
                      supplier.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="supplier-analysis-table-card">
          <div className="supplier-analysis-table-header">
            <div>
              <h3>Payment History</h3>

              <p>
                All payments made to this supplier.
              </p>
            </div>
          </div>

          <div className="supplier-analysis-table-wrap">
            <table className="supplier-analysis-payment-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Notes</th>
                </tr>
              </thead>

              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      {formatDateTime(payment.paymentDate)}
                    </td>

                    <td>
                      {money(payment.amount)} AFN
                    </td>

                    <td>{payment.method || "-"}</td>

                    <td>{payment.notes || "-"}</td>
                  </tr>
                ))}

                {payments.length === 0 && (
                  <tr>
                    <td
                      colSpan="4"
                      className="supplier-analysis-empty"
                    >
                      No payment record was found for this
                      supplier.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}