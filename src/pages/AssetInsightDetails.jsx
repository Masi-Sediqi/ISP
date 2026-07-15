import { Link, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { formatDateTime } from "../utils/afghanDate";
import "./AssetFullInformation.css";

const today = () => new Date().toISOString().slice(0, 10);

function money(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function AssetInsightDetails() {
  const { assetId, insightType } = useParams();
  const [assets, , , assetsLoaded] = useJsonCollection("assets");
  const [movements, , , movementsLoaded] = useJsonCollection("assetMovements");
  const [filter, setFilter] = useState("All");
  const [customRange, setCustomRange] = useState({
    from: today(),
    to: today(),
  });

  const asset = assets.find(
    (item) =>
      String(item.id) === String(assetId) ||
      String(item.assetId) === String(assetId)
  );

  const assetKey = String(asset?.id || asset?.assetId || "");
  const currentQuantity = Number(asset?.quantity || 0);
  const mainStockQuantity =
    String(asset?.location || "").toLowerCase() === "main stock"
      ? currentQuantity
      : 0;
  const isIndividualAsset =
    String(asset?.identityTracking || "").toLowerCase().includes("individual") ||
    (asset?.identityRecords || []).length > 0;

  const availableIdentityRecords = (asset?.identityRecords || []).map(
    (record, index) => ({
      ...record,
      id: record.id || `identity-existing-${assetKey}-${index}`,
    })
  );

  const assetMovements = useMemo(() => {
    return movements
      .filter(
        (item) =>
          String(item.parentAssetId || "") === String(assetKey) ||
          String(item.assetRecordId || item.assetId) === String(assetKey) ||
          String(item.assetId) === String(asset?.assetId)
      )
      .sort((a, b) =>
        String(b.date || b.createdAt || "").localeCompare(
          String(a.date || a.createdAt || "")
        )
      );
  }, [movements, assetKey, asset?.assetId]);

  const totals = {
    balance: assetMovements
      .filter((item) => item.movementType === "Balance")
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    purchase: assetMovements
      .filter((item) => item.movementType === "Purchase")
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    waste: assetMovements
      .filter((item) => item.movementType === "Waste")
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    transfer: assetMovements
      .filter((item) => item.movementType === "Transfer")
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    purchaseValue: assetMovements
      .filter((item) => item.movementType === "Purchase")
      .reduce(
        (sum, item) =>
          sum + Number(item.quantity || 0) * Number(item.unitPrice || 0),
        0
      ),
  };

  const insightConfigs = {
    current: {
      title: "Current Quantity",
      description: "Current units recorded for this asset.",
      value: currentQuantity,
      movementTypes: [],
    },
    "main-stock": {
      title: "Main Stock Quantity",
      description: "Units currently available in Main Stock.",
      value: mainStockQuantity,
      movementTypes: [],
    },
    balance: {
      title: "Total Balance Added",
      description: "Units added from initial balance records.",
      value: totals.balance,
      movementTypes: ["Balance"],
    },
    purchase: {
      title: "Total Purchased",
      description: "Purchased units with purchase dates and details.",
      value: totals.purchase,
      movementTypes: ["Purchase"],
    },
    waste: {
      title: "Total Wasted",
      description: "Damaged, wasted, or disposed units.",
      value: totals.waste,
      movementTypes: ["Waste"],
    },
    transfer: {
      title: "Total Transferred",
      description: "Units moved to customers, towers, repair, or lost status.",
      value: totals.transfer,
      movementTypes: ["Transfer"],
    },
    "purchase-value": {
      title: "Total Purchase Value",
      description: "Total value of recorded purchase movements.",
      value: `${money(totals.purchaseValue)} AFN`,
      movementTypes: ["Purchase"],
    },
  };

  const config = insightConfigs[insightType] || insightConfigs.current;

  const dateInFilter = (dateValue) => {
    if (filter === "All") return true;
    const movementDate = new Date(dateValue || "");
    if (Number.isNaN(movementDate.getTime())) return false;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (filter === "Today") return movementDate >= start;
    if (filter === "Weekly") {
      const weekStart = new Date(start);
      weekStart.setDate(weekStart.getDate() - 6);
      return movementDate >= weekStart;
    }
    if (filter === "Monthly") {
      return movementDate >= new Date(now.getFullYear(), now.getMonth(), 1);
    }
    if (filter === "Custom") {
      const from = new Date(customRange.from || "");
      const to = new Date(customRange.to || "");
      if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return true;
      to.setHours(23, 59, 59, 999);
      return movementDate >= from && movementDate <= to;
    }
    return true;
  };

  const expandMovementRows = (movement) => {
    const records = movement.identityRecords || [];
    if (isIndividualAsset && records.length > 0) {
      return records.map((record, index) => ({
        id: `${movement.id}-${record.id || index}`,
        date: movement.date || "",
        timeSource: movement.createdAt || movement.updatedAt || movement.date,
        movementType: movement.movementType || "",
        type: movement.transferType || movement.wasteReason || movement.paymentStatus || "Added",
        source: movement.sourceName || "-",
        destination: movement.destinationName || "-",
        quantity: 1,
        amount: Number(record.unitPrice || movement.unitPrice || asset?.unitPrice || 0),
        model: record.model || "-",
        macAddress: record.macAddress || "-",
        serialNumber: record.serialNumber || "-",
        status: movement.transferStatus || movement.paymentStatus || "Completed",
      }));
    }

    return [
      {
        id: movement.id,
        date: movement.date || "",
        timeSource: movement.createdAt || movement.updatedAt || movement.date,
        movementType: movement.movementType || "",
        type: movement.transferType || movement.wasteReason || movement.paymentStatus || "Added",
        source: movement.sourceName || "-",
        destination: movement.destinationName || "-",
        quantity: Number(movement.quantity || 0),
        amount: Number(
          movement.totalAmount ||
            movement.estimatedLoss ||
            movement.trustAmount ||
            Number(movement.quantity || 0) * Number(movement.unitPrice || asset?.unitPrice || 0)
        ),
        model: asset?.model || "-",
        macAddress: asset?.macAddress || "-",
        serialNumber: asset?.serialNumber || "-",
        status: movement.transferStatus || movement.paymentStatus || "Completed",
      },
    ];
  };

  const insightMovements = assetMovements
    .filter((movement) => dateInFilter(movement.date || movement.createdAt))
    .filter((movement) => {
      if (insightType === "current") return true;
      if (insightType === "main-stock") {
        return ["Balance", "Purchase"].includes(movement.movementType);
      }
      return config.movementTypes.includes(movement.movementType);
    });

  const rows =
    ["current", "main-stock"].includes(insightType) &&
    isIndividualAsset &&
    availableIdentityRecords.length > 0
      ? availableIdentityRecords.map((record, index) => ({
          id: record.id || index,
          date: record.addedAt || "-",
          timeSource: record.addedAt || "",
          movementType: insightType === "main-stock" ? "Main Stock" : "Current",
          type: record.sourceType || "Available",
          source: record.sourceType || "-",
          destination: asset?.location || "Main Stock",
          quantity: 1,
          amount: Number(record.unitPrice || asset?.unitPrice || 0),
          model: record.model || "-",
          macAddress: record.macAddress || "-",
          serialNumber: record.serialNumber || "-",
          status: asset?.status || "In Stock",
        }))
      : insightMovements.flatMap(expandMovementRows);

  const chartData = Array.from(
    rows.reduce((map, row) => {
      const key = row.date && row.date !== "-" ? row.date : "No Date";
      const value = map.get(key) || { date: key, quantity: 0, amount: 0 };
      value.quantity += Number(row.quantity || 0);
      value.amount += Number(row.amount || 0);
      map.set(key, value);
      return map;
    }, new Map()).values()
  ).sort((a, b) => String(a.date).localeCompare(String(b.date)));

  if (!assetsLoaded || !movementsLoaded) {
    return <div className="page-loading">Loading asset calculation...</div>;
  }

  if (!asset) {
    return <div className="page-loading">Asset was not found.</div>;
  }

  return (
    <div className="asset-detail-page">
      <Link className="asset-detail-back" to={`/assets/${asset.assetId || asset.id}/details`}>
        ← Back to Asset Full Information
      </Link>

      <div className="asset-detail-header">
        <div>
          <span>Asset Calculation</span>
          <h1>{config.title}</h1>
          <p>
            {asset.assetId || "No Asset ID"} - {asset.deviceName || "Unnamed Asset"}.
            {config.description}
          </p>
        </div>
      </div>

      <div className="asset-insight-card">
        <div className="asset-insight-header">
          <div>
            <h3>{config.title}</h3>
            <p>{config.description}</p>
          </div>
          <div className="asset-insight-filters">
            {["All", "Today", "Weekly", "Monthly", "Custom"].map((item) => (
              <button
                type="button"
                key={item}
                className={filter === item ? "active" : ""}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {filter === "Custom" && (
          <div className="asset-insight-custom-range">
            <label>
              From
              <input
                type="date"
                value={customRange.from}
                onChange={(event) =>
                  setCustomRange((previous) => ({ ...previous, from: event.target.value }))
                }
              />
            </label>
            <label>
              To
              <input
                type="date"
                value={customRange.to}
                onChange={(event) =>
                  setCustomRange((previous) => ({ ...previous, to: event.target.value }))
                }
              />
            </label>
          </div>
        )}

        <div className="asset-insight-summary">
          <div>
            <span>Selected Card Value</span>
            <strong>{config.value}</strong>
          </div>
          <div>
            <span>Total Quantity</span>
            <strong>{rows.reduce((sum, row) => sum + Number(row.quantity || 0), 0)}</strong>
          </div>
          <div>
            <span>Records</span>
            <strong>{rows.length}</strong>
          </div>
        </div>

        <div className="asset-insight-chart">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="quantity" fill="#111827" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="asset-insight-empty">No records found for this filter.</div>
          )}
        </div>

        <div className="asset-insight-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Movement</th>
                <th>Type</th>
                <th>Model</th>
                <th>MAC Address</th>
                <th>Serial Number</th>
                <th>Source</th>
                <th>Destination</th>
                <th>Quantity</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{formatDateTime(row.date, row.timeSource)}</td>
                  <td>{row.movementType || "-"}</td>
                  <td>{row.type || "-"}</td>
                  <td>{row.model || "-"}</td>
                  <td>{row.macAddress || "-"}</td>
                  <td>{row.serialNumber || "-"}</td>
                  <td>{row.source || "-"}</td>
                  <td>{row.destination || "-"}</td>
                  <td>{row.quantity || 0}</td>
                  <td>{money(row.amount || 0)} AFN</td>
                  <td>{row.status || "-"}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="11" className="asset-detail-empty">
                    No records found for this card.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AssetInsightDetails;
