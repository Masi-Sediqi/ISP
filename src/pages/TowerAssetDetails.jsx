import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { formatDateTime } from "../utils/afghanDate";
import "./TowerAssetDetails.css";

const money = (value) => Number(value || 0).toLocaleString("en-US");

const getRecordAssets = (record) => {
  if (Array.isArray(record?.assets)) return record.assets;
  return [];
};

const getAssetUnit = (asset) =>
  asset?.purchaseUsageUnit || asset?.purchaseUnit || asset?.usageUnit || "Piece";

const getTrackingMode = (asset) =>
  String(asset?.identityTracking || "").toLowerCase().includes("individual")
    ? "Individual"
    : "Single Model";

export default function TowerAssetDetails() {
  const { towerId } = useParams();
  const navigate = useNavigate();
  const [towerAssets] = useJsonCollection("towerAssets");
  const [assets] = useJsonCollection("assets");
  const [deviceTransfers] = useJsonCollection("deviceTransfers");
  const [showTowerInfo, setShowTowerInfo] = useState(true);

  const towerRecord = towerAssets.find(
    (record) => String(record.id || record.towerName) === String(towerId)
  );

  const currentAssets = useMemo(() => {
    if (!towerRecord) return [];

    const towerKeys = [
      towerRecord.id,
      towerRecord.towerName,
      `${towerRecord.towerName || ""} - ${towerRecord.towerLocation || ""}`,
    ]
      .filter(Boolean)
      .map(String);

    const grouped = new Map();

    deviceTransfers.forEach((transfer) => {
      const destinationMatches =
        transfer.destinationType === "Tower" &&
        towerKeys.some(
          (key) =>
            String(transfer.destinationRecordId || "") === key ||
            String(transfer.destinationLocation || "").includes(key)
        );
      const sourceMatches =
        transfer.sourceType === "Tower" &&
        towerKeys.some(
          (key) =>
            String(transfer.sourceRecordId || "") === key ||
            String(transfer.sourceLocation || "").includes(key)
        );

      if (!destinationMatches && !sourceMatches) return;

      const parentAsset =
        assets.find(
          (asset) =>
            String(asset.id || "") === String(transfer.assetRecordId || "") ||
            String(asset.assetId || "") === String(transfer.assetId || "")
        ) || {};
      const key = [
        transfer.assetRecordId || transfer.assetId,
        transfer.unitRecordId || "bulk",
      ].join("::");
      const previous = grouped.get(key) || {
        ...parentAsset,
        assetId: transfer.assetId || parentAsset.assetId || "",
        deviceName: transfer.deviceName || parentAsset.deviceName || "",
        category: parentAsset.category || "",
        identityTracking: transfer.trackingType || parentAsset.identityTracking || "",
        model: transfer.model || parentAsset.model || "",
        macAddress: transfer.macAddress || parentAsset.macAddress || "",
        serialNumber: transfer.serialNumber || parentAsset.serialNumber || "",
        unitPrice: Number(parentAsset.unitPrice || 0),
        purchaseUsageUnit: transfer.unit || getAssetUnit(parentAsset),
        status: transfer.newStatus || "At Tower",
        quantity: 0,
      };

      const delta = Number(transfer.quantity || 0) * (destinationMatches ? 1 : -1);
      grouped.set(key, {
        ...previous,
        quantity: Number(previous.quantity || 0) + delta,
        status: destinationMatches ? transfer.newStatus || "At Tower" : previous.status,
      });
    });

    const assignedAssets = getRecordAssets(towerRecord);

    return [
      ...Array.from(grouped.values()).filter((asset) => Number(asset.quantity || 0) > 0),
      ...assignedAssets,
    ];
  }, [assets, deviceTransfers, towerRecord]);

  const totalAssetValue = currentAssets.reduce(
    (sum, asset) => sum + Number(asset.quantity || 0) * Number(asset.unitPrice || 0),
    0
  );
  const totalQuantity = currentAssets.reduce((sum, asset) => sum + Number(asset.quantity || 0), 0);

  if (!towerRecord) {
    return (
      <div className="tower-detail-page">
        <Link className="tower-detail-back" to="/tower-assets">
          ← Back to Tower Assets
        </Link>
        <h1>Tower asset record was not found.</h1>
      </div>
    );
  }

  return (
    <div className="tower-detail-page">
      <Link className="tower-detail-back" to="/tower-assets">
        ← Back to Tower Assets
      </Link>

      <div className="tower-detail-page-header">
        <div>
          <span>Tower Asset Full Detail</span>
          <h1>{towerRecord.towerName || "Tower"}</h1>
          <p>Current assets, installation information, and total asset value.</p>
        </div>

        <div className="tower-detail-page-actions">
          <button type="button" onClick={() => setShowTowerInfo((value) => !value)}>
            {showTowerInfo ? "Hide Tower Info" : "Show Tower Info"}
          </button>
        </div>
      </div>

      <div className="tower-detail-stat-grid">
        <div>
          <span>Current Assets</span>
          <strong>{currentAssets.length}</strong>
          <p>Asset records currently held by this tower</p>
        </div>
        <div>
          <span>Total Quantity</span>
          <strong>{money(totalQuantity)}</strong>
          <p>Combined quantity across tower assets</p>
        </div>
        <div>
          <span>Current Asset Value</span>
          <strong>{money(totalAssetValue)} AFN</strong>
          <p>Quantity multiplied by unit price</p>
        </div>
        <div>
          <span>Installation Cost</span>
          <strong>{money(towerRecord.installationCost)} AFN</strong>
          <p>Recorded installation cost</p>
        </div>
      </div>

      {showTowerInfo && (
        <section className="tower-detail-info-card">
          <div>
            <span>Tower Name</span>
            <strong>{towerRecord.towerName || "-"}</strong>
          </div>
          <div>
            <span>Tower Location</span>
            <strong>{towerRecord.towerLocation || "-"}</strong>
          </div>
          <div>
            <span>Issue Date</span>
            <strong>{formatDateTime(towerRecord.issueDate, towerRecord.createdAt)}</strong>
          </div>
          <div>
            <span>Installation Status</span>
            <strong>{towerRecord.installationStatus || "-"}</strong>
          </div>
          <div>
            <span>Responsible Person</span>
            <strong>{towerRecord.responsiblePerson || "-"}</strong>
          </div>
          <div>
            <span>Notes</span>
            <strong>{towerRecord.notes || "-"}</strong>
          </div>
        </section>
      )}

      <section className="tower-detail-assets-card">
        <div className="tower-detail-assets-header">
          <div>
            <h3>Current Assets With This Tower</h3>
            <p>Assets currently assigned or issued to this tower.</p>
          </div>
        </div>

        <div className="tower-detail-assets-table">
          <table>
            <thead>
              <tr>
                <th>Asset ID</th>
                <th>Device Name</th>
                <th>Tracking</th>
                <th>Category</th>
                <th>Model</th>
                <th>MAC Address</th>
                <th>Serial Number</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {currentAssets.map((asset, index) => (
                <tr key={asset.selectionKey || asset.id || `${asset.assetId}-${index}`}>
                  <td>{asset.assetId || "-"}</td>
                  <td>{asset.deviceName || "-"}</td>
                  <td>
                    <span
                      className={`tower-detail-tracking ${
                        getTrackingMode(asset) === "Individual" ? "individual" : "single"
                      }`}
                    >
                      {getTrackingMode(asset)}
                    </span>
                  </td>
                  <td>{asset.category || "-"}</td>
                  <td>{asset.model || "-"}</td>
                  <td>{asset.macAddress || "-"}</td>
                  <td>{asset.serialNumber || "-"}</td>
                  <td>
                    {money(asset.quantity)} {getAssetUnit(asset)}
                  </td>
                  <td>{money(asset.unitPrice)} AFN</td>
                  <td>{money(Number(asset.quantity || 0) * Number(asset.unitPrice || 0))} AFN</td>
                  <td>{asset.status || "-"}</td>
                </tr>
              ))}

              {currentAssets.length === 0 && (
                <tr>
                  <td colSpan="11" className="tower-detail-empty">
                    No current asset was found for this tower.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
