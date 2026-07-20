import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useJsonCollection } from "../hooks/useJsonCollection";
import "./MainStock.css";

const money = (value) => Number(value || 0).toLocaleString("en-US");

const getTrackingLabel = (asset) =>
  String(asset?.identityTracking || "").toLowerCase().includes("individual")
    ? "Individual"
    : "Single Model";

const getAssetUnit = (asset) =>
  asset?.purchaseUsageUnit ||
  asset?.purchaseUnit ||
  asset?.usageUnit ||
  "Piece";

export default function MainStock() {
  const navigate = useNavigate();

  const [assets] = useJsonCollection("assets");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [openActionId, setOpenActionId] = useState("");

  const [actionMenuPosition, setActionMenuPosition] = useState({
    top: 0,
    left: 0,
  });

  const actionMenuRef = useRef(null);

  const categories = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          assets
            .map((asset) => asset.category)
            .filter(Boolean)
        )
      ),
    ],
    [assets]
  );

  const filteredAssets = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return assets.filter((asset) => {
      const matchesCategory =
        categoryFilter === "All" ||
        asset.category === categoryFilter;

      const matchesSearch =
        !keyword ||
        String(asset.assetId || "")
          .toLowerCase()
          .includes(keyword) ||
        String(asset.deviceName || "")
          .toLowerCase()
          .includes(keyword) ||
        String(asset.category || "")
          .toLowerCase()
          .includes(keyword) ||
        String(asset.brand || "")
          .toLowerCase()
          .includes(keyword) ||
        String(asset.model || "")
          .toLowerCase()
          .includes(keyword) ||
        String(asset.macAddress || "")
          .toLowerCase()
          .includes(keyword) ||
        String(asset.serialNumber || "")
          .toLowerCase()
          .includes(keyword);

      return matchesCategory && matchesSearch;
    });
  }, [assets, categoryFilter, search]);

  const totalQuantity = filteredAssets.reduce(
    (sum, asset) => sum + Number(asset.quantity || 0),
    0
  );

  const stockValue = filteredAssets.reduce(
    (sum, asset) =>
      sum +
      Number(asset.quantity || 0) *
        Number(asset.unitPrice || 0),
    0
  );

  const lowStockCount = filteredAssets.filter(
    (asset) =>
      Number(asset.alertQuantity || 0) > 0 &&
      Number(asset.quantity || 0) <=
        Number(asset.alertQuantity || 0)
  ).length;

  const openAssetModal = (asset, modal) => {
    navigate(`/assets/${asset.id || asset.assetId}/details`, {
      state: {
        openAssetModal: modal,
        fromMainStock: true,
      },
    });
  };

  const closeActionMenu = () => {
    setOpenActionId("");
  };

  const handleActionToggle = (event, assetKey) => {
    event.stopPropagation();

    if (openActionId === assetKey) {
      closeActionMenu();
      return;
    }

    const buttonRect =
      event.currentTarget.getBoundingClientRect();

    const menuWidth = 190;
    const menuHeight = 150;
    const screenPadding = 12;

    let left = buttonRect.right - menuWidth;
    let top = buttonRect.bottom + 8;

    if (left < screenPadding) {
      left = screenPadding;
    }

    if (left + menuWidth > window.innerWidth - screenPadding) {
      left = window.innerWidth - menuWidth - screenPadding;
    }

    if (
      top + menuHeight >
      window.innerHeight - screenPadding
    ) {
      top = buttonRect.top - menuHeight - 8;
    }

    setActionMenuPosition({
      top,
      left,
    });

    setOpenActionId(assetKey);
  };

  useEffect(() => {
    if (!openActionId) return undefined;

    const handleOutsideClick = (event) => {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target) &&
        !event.target.closest(".main-stock-action-trigger")
      ) {
        closeActionMenu();
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeActionMenu();
      }
    };

    const handleViewportChange = () => {
      closeActionMenu();
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    window.addEventListener(
      "resize",
      handleViewportChange
    );

    window.addEventListener(
      "scroll",
      handleViewportChange,
      true
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );

      window.removeEventListener(
        "resize",
        handleViewportChange
      );

      window.removeEventListener(
        "scroll",
        handleViewportChange,
        true
      );
    };
  }, [openActionId]);

  const activeAsset = filteredAssets.find(
    (asset, index) =>
      String(asset.id || asset.assetId || index) ===
      openActionId
  );

  const activeAssetQuantity = Number(
    activeAsset?.quantity || 0
  );

  return (
    <div className="main-stock-page">
      <div className="main-stock-header">
        <div>
          <span>Main Stock</span>

          <h1>Main Stock Inventory</h1>

          <p>
            Current stock, value, and asset full information.
          </p>
        </div>
      </div>

      <div className="main-stock-stats">
        <div>
          <span>Assets In Stock</span>

          <strong>{filteredAssets.length}</strong>

          <p>Filtered asset records</p>
        </div>

        <div>
          <span>Total Quantity</span>

          <strong>{money(totalQuantity)}</strong>

          <p>Current quantity in stock</p>
        </div>

        <div>
          <span>Stock Value</span>

          <strong>{money(stockValue)} AFN</strong>

          <p>Quantity multiplied by unit price</p>
        </div>

        <div>
          <span>Low Stock</span>

          <strong>{lowStockCount}</strong>

          <p>Assets at or below alert quantity</p>
        </div>
      </div>

      <section className="main-stock-card">
        <div className="main-stock-toolbar">
          <div>
            <h3>Main Stock Assets</h3>

            <p>
              Filter by category or search by name, ID,
              MAC, serial, and model.
            </p>
          </div>

          <div className="main-stock-controls">
            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value)
              }
            >
              {categories.map((category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              ))}
            </select>

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search stock..."
            />
          </div>
        </div>

        <div className="main-stock-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Asset ID</th>
                <th>Image</th>
                <th>Device Name</th>
                <th>Tracking</th>
                <th>Category</th>
                <th>Model</th>
                <th>MAC Address</th>
                <th>Serial Number</th>
                <th>Current Quantity</th>
                <th>Unit Price</th>
                <th>Total Value</th>
                <th className="main-stock-actions-heading">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredAssets.map((asset, index) => {
                const trackingLabel =
                  getTrackingLabel(asset);

                const quantity = Number(
                  asset.quantity || 0
                );

                const unit = getAssetUnit(asset);

                const assetKey = String(
                  asset.id || asset.assetId || index
                );

                return (
                  <tr key={assetKey}>
                    <td className="main-stock-strong">
                      {asset.assetId || "-"}
                    </td>

                    <td>
                      {trackingLabel === "Single Model" &&
                      asset.assetImage ? (
                        <img
                          className="main-stock-thumb"
                          src={asset.assetImage}
                          alt={
                            asset.deviceName ||
                            asset.assetId ||
                            "Asset"
                          }
                        />
                      ) : (
                        "-"
                      )}
                    </td>

                    <td>{asset.deviceName || "-"}</td>

                    <td>
                      <span
                        className={`main-stock-tracking ${
                          trackingLabel === "Individual"
                            ? "individual"
                            : "single"
                        }`}
                      >
                        {trackingLabel}
                      </span>
                    </td>

                    <td>{asset.category || "-"}</td>

                    <td>{asset.model || "-"}</td>

                    <td>{asset.macAddress || "-"}</td>

                    <td>{asset.serialNumber || "-"}</td>

                    <td>
                      {money(quantity)} {unit}
                    </td>

                    <td>
                      {money(asset.unitPrice)} AFN
                    </td>

                    <td>
                      {money(
                        quantity *
                          Number(asset.unitPrice || 0)
                      )}{" "}
                      AFN
                    </td>

                    <td className="main-stock-actions-cell">
                      <button
                        type="button"
                        className={`main-stock-action-trigger ${
                          openActionId === assetKey
                            ? "active"
                            : ""
                        }`}
                        aria-label="Open asset actions"
                        aria-expanded={
                          openActionId === assetKey
                        }
                        onClick={(event) =>
                          handleActionToggle(
                            event,
                            assetKey
                          )
                        }
                      >
                        <span />
                        <span />
                        <span />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredAssets.length === 0 && (
                <tr>
                  <td
                    colSpan="12"
                    className="main-stock-empty"
                  >
                    No stock asset was found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {openActionId &&
        activeAsset &&
        createPortal(
          <div
            ref={actionMenuRef}
            className="main-stock-action-menu"
            style={{
              top: `${actionMenuPosition.top}px`,
              left: `${actionMenuPosition.left}px`,
            }}
          >
            <button
              type="button"
              onClick={() => {
                navigate(
                  `/assets/${
                    activeAsset.id ||
                    activeAsset.assetId
                  }/details`
                );

                closeActionMenu();
              }}
            >
              <span className="main-stock-menu-icon">
                i
              </span>

              <span className="main-stock-menu-content">
                <strong>Full Information</strong>
                <small>View complete asset details</small>
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                navigate(
                  `/assets/${
                    activeAsset.id ||
                    activeAsset.assetId
                  }/audit-trail`
                );

                closeActionMenu();
              }}
            >
              <span className="main-stock-menu-icon">
                ↻
              </span>

              <span className="main-stock-menu-content">
                <strong>Audit Trail</strong>
                <small>View asset movement history</small>
              </span>
            </button>

          </div>,
          document.body
        )}
    </div>
  );
}
