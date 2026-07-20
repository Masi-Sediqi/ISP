import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Box,
  CalendarClock,
  CheckCheck,
  ChevronDown,
  CreditCard,
  LogOut,
  Moon,
  Search,
  Settings,
  Sun,
  Trash2,
  User,
  Users,
  Volume2,
  Wrench,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { todayDateValue } from "../utils/afghanDate";

const normalize = (value) => String(value || "").toLowerCase().trim();
const compact = (value) => normalize(value).replace(/[^a-z0-9]/g, "");
const money = (value) => Number(value || 0).toLocaleString("en-US");

const includesQuery = (value, query) => {
  const text = normalize(value);
  const cleanText = compact(value);
  const cleanQuery = compact(query);
  return text.includes(normalize(query)) || (cleanQuery && cleanText.includes(cleanQuery));
};

const itemId = (item) => String(item?.id || item?.assetId || item?.customerId || item?.supplierName || "");

const formatLocationName = (record) =>
  record?.location ||
  record?.currentLocation ||
  record?.destinationLocation ||
  record?.sourceLocation ||
  "-";

function HeaderActions({ currentUser, onLogout, compact = false }) {
  const [openMenu, setOpenMenu] = useState(null);
  const [darkMode, setDarkMode] = useState(
    document.body.classList.contains("dark-mode")
  );

  const [assets] = useJsonCollection("assets");
  const [towerAssets] = useJsonCollection("towerAssets");
  const [securityDeposits] = useJsonCollection("securityDeposits");
  const [customerPackages] = useJsonCollection("customerPackages");
  const today = todayDateValue();

  const damagedOrLostAssets = assets.filter((asset) =>
    ["Damaged", "Lost"].includes(asset.status)
  );

  const pendingTowerAssets = towerAssets.filter(
    (item) => item.installationStatus === "Pending"
  );

  const outstandingDeposits = securityDeposits.filter((item) =>
    ["Outstanding", "Held"].includes(item.status)
  );

  const expiredCustomerPackages = customerPackages.filter(
    (item) =>
      String(item.status || "Active") === "Active" &&
      item.endDate &&
      String(item.endDate) <= today
  );

  const lowStockAssets = assets.filter((asset) => {
    const alertQuantity = Number(asset.alertQuantity || 0);
    return alertQuantity > 0 && Number(asset.quantity || 0) <= alertQuantity;
  });

  const notificationGroups = [
    {
      key: "stock",
      title: "Stock Alerts",
      count: lowStockAssets.length,
      icon: Box,
      items: lowStockAssets.map((asset) => ({
        title: "Low Stock Alert",
        description: `${asset.assetId || asset.deviceName || "Asset"} has only ${money(asset.quantity)} ${asset.purchaseUsageUnit || asset.purchaseUnit || "unit(s)"} left`,
      })),
    },
    {
      key: "asset-status",
      title: "Asset Status Alerts",
      count: damagedOrLostAssets.length,
      icon: AlertTriangle,
      items: damagedOrLostAssets.map((asset) => ({
        title: `${asset.status || "Asset"} Asset`,
        description: `${asset.assetId || asset.deviceName || "Asset"} needs attention`,
      })),
    },
    {
      key: "tower",
      title: "Tower Alerts",
      count: pendingTowerAssets.length,
      icon: Wrench,
      items: pendingTowerAssets.map((tower) => ({
        title: "Pending Tower Installation",
        description: `${tower.towerName || "Tower"} is still pending`,
      })),
    },
    {
      key: "deposit",
      title: "Deposit Alerts",
      count: outstandingDeposits.length,
      icon: CreditCard,
      items: outstandingDeposits.map((deposit) => ({
        title: "Outstanding Deposit",
        description: `${deposit.customerName || deposit.customerId || "Customer"} has a deposit balance`,
      })),
    },
    {
      key: "package",
      title: "Package Alerts",
      count: expiredCustomerPackages.length,
      icon: CalendarClock,
      items: expiredCustomerPackages.map((item) => ({
        title: "Package Expired",
        description: `${item.customerName || item.customerId || "Customer"} package ended on ${item.endDate}`,
      })),
    },
  ].filter((group) => group.count > 0);

  const notificationItems = notificationGroups.flatMap((group) =>
    group.items.map((item) => ({ ...item, groupTitle: group.title, icon: group.icon }))
  );

  const alertCount =
    lowStockAssets.length +
    damagedOrLostAssets.length +
    pendingTowerAssets.length +
    outstandingDeposits.length +
    expiredCustomerPackages.length;

  function toggleDarkMode() {
    setDarkMode((value) => !value);
    document.body.classList.toggle("dark-mode");
  }

  if (compact) {
    return (
      <div className="header-menu mobile-brand-actions">
        <button
          className="profile-btn mobile-actions-toggle"
          onClick={() => setOpenMenu(openMenu === "mobile" ? null : "mobile")}
          aria-label="Open mobile actions"
          type="button"
        >
          <User size={17} />
          {alertCount > 0 && <span className="alert-count">{alertCount}</span>}
          <ChevronDown size={14} />
        </button>

        {openMenu === "mobile" && (
          <div className="dropdown mobile-actions-dropdown">
            <strong>
              {currentUser?.fullName || currentUser?.email || currentUser?.username}
            </strong>
            <p>{currentUser?.email || "No email configured"}</p>

            <Link to="/accounts" className="dropdown-action" onClick={() => setOpenMenu(null)}>
              <Users size={15} />
              Accounts
            </Link>
            <Link to="/settings" className="dropdown-action" onClick={() => setOpenMenu(null)}>
              <Settings size={15} />
              Settings
            </Link>
            <button className="dropdown-action" type="button" onClick={toggleDarkMode}>
              {darkMode ? <Sun size={15} /> : <Moon size={15} />}
              {darkMode ? "Light mode" : "Dark mode"}
            </button>

            <div className="dropdown-alerts">
              <span>
                <Bell size={15} />
                Alerts
                <b>{alertCount}</b>
              </span>
              <small>Low stock assets: {lowStockAssets.length}</small>
              <small>Damaged / lost assets: {damagedOrLostAssets.length}</small>
              <small>Pending tower installations: {pendingTowerAssets.length}</small>
              <small>Outstanding deposits: {outstandingDeposits.length}</small>
              <small>Expired customer packages: {expiredCustomerPackages.length}</small>
            </div>

            <button className="dropdown-logout" onClick={onLogout} type="button">
              <LogOut size={15} />
              Logout
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="top-actions">
        <Link className="header-account-link" to="/accounts">
          <Users size={17} />
          Accounts
        </Link>

        <div className="header-menu">
          <button
            className="icon-btn"
            onClick={() => setOpenMenu(openMenu === "alerts" ? null : "alerts")}
            aria-label="Alerts"
          >
            <Bell size={18} />
            {alertCount > 0 && <span className="alert-count">{alertCount}</span>}
          </button>

          {openMenu === "alerts" && (
            <div className="dropdown alert-dropdown notification-dropdown">
              <div className="notification-dropdown-header">
                <strong>Notifications</strong>
                <div>
                  <button type="button" aria-label="Sound">
                    <Volume2 size={15} />
                  </button>
                  <button type="button" aria-label="Mark all as read">
                    <CheckCheck size={15} />
                  </button>
                  <button type="button" aria-label="Clear notifications">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {notificationGroups.length > 0 ? (
                <>
                  <div className="notification-group-list">
                    {notificationGroups.map((group) => {
                      const Icon = group.icon;
                      return (
                        <div key={group.key} className="notification-group-row">
                          <Icon size={15} />
                          <span>{group.title} ({group.count})</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="notification-item-list">
                    {notificationItems.slice(0, 8).map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <div key={`${item.groupTitle}-${index}`} className="notification-item">
                          <span className="notification-icon">
                            <Icon size={16} />
                          </span>
                          <div>
                            <strong>{item.title}</strong>
                            <p>{item.description}</p>
                            <small>less than a minute ago</small>
                          </div>
                          <button type="button" aria-label="Remove notification">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="notification-empty">No notifications right now.</div>
              )}
            </div>
          )}
        </div>

        <button
          className="icon-btn"
          onClick={toggleDarkMode}
          aria-label="Toggle display mode"
        >
          <Moon size={18} />
        </button>

        <div className="header-menu profile-menu">
          <button
            className="profile-btn"
            onClick={() => setOpenMenu(openMenu === "profile" ? null : "profile")}
            aria-label="Profile"
          >
            <User size={18} />
          </button>

          {openMenu === "profile" && (
            <div className="dropdown profile-dropdown">
              <strong>
                {currentUser?.fullName || currentUser?.email || currentUser?.username}
              </strong>
              <p>{currentUser?.email || "No email configured"}</p>

          <button className="dropdown-logout" onClick={onLogout}>
                <LogOut size={15} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
  );
}

function Header({ currentUser, onLogout }) {
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const [query, setQuery] = useState("");
  const [openSearch, setOpenSearch] = useState(false);
  const [resultFilter, setResultFilter] = useState("All");

  const [assets] = useJsonCollection("assets");
  const [suppliers] = useJsonCollection("suppliers");
  const [supplierPurchases] = useJsonCollection("supplierPurchases");
  const [customers] = useJsonCollection("customers");
  const [towerAssets] = useJsonCollection("towerAssets");
  const [deviceTransfers] = useJsonCollection("deviceTransfers");
  const [assetMovements] = useJsonCollection("assetMovements");
  const [securityDeposits] = useJsonCollection("securityDeposits");

  useEffect(() => {
    const handleOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setOpenSearch(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const searchResults = useMemo(() => {
    const keyword = query.trim();
    if (keyword.length < 2) return [];

    const supplierByName = new Map(
      suppliers.map((supplier) => [normalize(supplier.supplierName || supplier.companyName), supplier])
    );

    const assetResults = assets
      .map((asset) => {
        const units = Array.isArray(asset.identityRecords) ? asset.identityRecords : [];
        const matchedUnit = units.find(
          (unit) =>
            includesQuery(unit.macAddress, keyword) ||
            includesQuery(unit.serialNumber, keyword) ||
            includesQuery(unit.model, keyword)
        );

        const matchesAsset =
          includesQuery(asset.assetId, keyword) ||
          includesQuery(asset.deviceName, keyword) ||
          includesQuery(asset.macAddress, keyword) ||
          includesQuery(asset.serialNumber, keyword) ||
          includesQuery(asset.model, keyword) ||
          Boolean(matchedUnit);

        if (!matchesAsset) return null;

        const assetKey = asset.assetId || asset.id;
        const relatedTransfers = deviceTransfers
          .filter((transfer) => String(transfer.assetId || "") === String(assetKey))
          .sort((a, b) => new Date(b.createdAt || b.createdDate || b.transferDate || 0) - new Date(a.createdAt || a.createdDate || a.transferDate || 0));
        const latestTransfer = relatedTransfers[0];
        const relatedMovements = assetMovements.filter((movement) => String(movement.assetId || movement.deviceId || "") === String(assetKey));
        const purchaseRecord =
          [...relatedMovements].reverse().find((movement) => /purchase/i.test(movement.movement || movement.type || "")) ||
          supplierPurchases.find((purchase) => String(purchase.assetId || purchase.deviceId || "") === String(assetKey));
        const supplierName = asset.supplierName || purchaseRecord?.supplierName || purchaseRecord?.supplier || "-";
        const supplier = supplierByName.get(normalize(supplierName));
        const relatedDeposits = securityDeposits.filter(
          (deposit) =>
            String(deposit.assetId || deposit.deviceId || "") === String(assetKey) ||
            String(deposit.unitRecordId || "") === String(matchedUnit?.id || "")
        );
        const currentCustomer = latestTransfer?.destinationType === "Customer"
          ? latestTransfer.destinationLocation
          : latestTransfer?.sourceType === "Customer"
            ? latestTransfer.sourceLocation
            : matchedUnit?.customerName || "-";
        const currentTower = latestTransfer?.destinationType === "Tower"
          ? latestTransfer.destinationLocation
          : latestTransfer?.sourceType === "Tower"
            ? latestTransfer.sourceLocation
            : matchedUnit?.towerName || "-";
        const repairCount = relatedMovements.filter((movement) => /repair/i.test(`${movement.movement} ${movement.type} ${movement.destination}`)).length;
        const damageCount = relatedMovements.filter((movement) => /damage|damaged|lost/i.test(`${movement.movement} ${movement.type} ${movement.status} ${movement.destination}`)).length;

        return {
          type: "Asset",
          key: `asset-${assetKey}-${matchedUnit?.id || "main"}`,
          title: `${asset.assetId || "-"} - ${asset.deviceName || asset.name || "Asset"}`,
          subtitle: [matchedUnit?.macAddress || asset.macAddress, matchedUnit?.serialNumber || asset.serialNumber]
            .filter(Boolean)
            .join(" / ") || "Asset record",
          path: `/assets/${asset.id || asset.assetId}/details`,
          details: [
            `Supplier: ${supplier?.supplierName || supplierName}`,
            `Purchase Date: ${asset.purchaseDate || purchaseRecord?.purchaseDate || purchaseRecord?.date || "-"}`,
            `Purchase Price: ${money(asset.unitPrice || purchaseRecord?.unitPrice || purchaseRecord?.totalPurchaseValue)} AFN`,
            `Current Location: ${formatLocationName(matchedUnit || latestTransfer || asset)}`,
            `Current Status: ${matchedUnit?.status || asset.status || latestTransfer?.newStatus || "-"}`,
            `Current Customer: ${currentCustomer}`,
            `Current Tower: ${currentTower}`,
            `Transfers: ${relatedTransfers.length}`,
            `Repairs: ${repairCount}`,
            `Damaged / Lost History: ${damageCount}`,
            `Deposit: ${money(relatedDeposits.reduce((sum, item) => sum + Number(item.amount || item.depositAmount || 0), 0))} AFN`,
            `Last Responsible: ${latestTransfer?.responsibleUser || "-"}`
          ],
        };
      })
      .filter(Boolean);

    const customerResults = customers
      .filter((customer) => includesQuery(customer.customerName, keyword) || includesQuery(customer.customerId, keyword) || includesQuery(customer.phone, keyword))
      .map((customer) => ({
        type: "Customer",
        key: `customer-${itemId(customer)}`,
        title: `${customer.customerId || "-"} - ${customer.customerName || "Customer"}`,
        subtitle: customer.phone || customer.address || "Customer record",
        path: `/customers/${customer.id}`,
        details: [
          `Status: ${customer.status || "-"}`,
          `Current Devices: ${deviceTransfers.filter((transfer) => String(transfer.destinationRecordId || "") === String(customer.id) && transfer.destinationType === "Customer").length}`,
          `Deposits: ${money(securityDeposits.filter((deposit) => String(deposit.customerId || deposit.customerRecordId || "") === String(customer.id)).reduce((sum, item) => sum + Number(item.amount || item.depositAmount || 0), 0))} AFN`,
        ],
      }));

    const towerResults = towerAssets
      .filter((tower) => includesQuery(tower.towerName, keyword) || includesQuery(tower.towerLocation, keyword))
      .map((tower) => ({
        type: "Tower",
        key: `tower-${itemId(tower)}`,
        title: tower.towerName || "Tower",
        subtitle: tower.towerLocation || "Tower record",
        path: `/tower-assets/${tower.id}/details`,
        details: [
          `Status: ${tower.installationStatus || "-"}`,
          `Assets: ${deviceTransfers.filter((transfer) => String(transfer.destinationRecordId || "") === String(tower.id) && transfer.destinationType === "Tower").length}`,
          `Installation Cost: ${money(tower.installationCost)} AFN`,
        ],
      }));

    const supplierResults = suppliers
      .map((supplier, index) => ({ ...supplier, searchIndex: index }))
      .filter((supplier) => includesQuery(supplier.supplierName, keyword) || includesQuery(supplier.companyName, keyword) || includesQuery(supplier.phone, keyword))
      .map((supplier) => ({
        type: "Supplier",
        key: `supplier-${itemId(supplier)}`,
        title: supplier.supplierName || supplier.companyName || "Supplier",
        subtitle: supplier.companyName || supplier.phone || "Supplier record",
        path: `/suppliers/${supplier.searchIndex}`,
        details: [
          `Status: ${supplier.status || "-"}`,
          `Purchases: ${supplierPurchases.filter((purchase) => normalize(purchase.supplierName || purchase.supplier) === normalize(supplier.supplierName)).length}`,
          `Phone: ${supplier.phone || "-"}`,
        ],
      }));

    const allResults = [...assetResults, ...customerResults, ...towerResults, ...supplierResults];
    const filteredResults =
      resultFilter === "All"
        ? allResults
        : allResults.filter((result) => result.type === resultFilter);

    return filteredResults.slice(0, 12);
  }, [assetMovements, assets, customers, deviceTransfers, query, resultFilter, securityDeposits, supplierPurchases, suppliers, towerAssets]);

  const openResult = (path) => {
    setOpenSearch(false);
    setQuery("");
    navigate(path);
  };

  return (
    <header className="topbar">
      <div className="header-search global-search" ref={searchRef}>
        <Search size={17} />
        <input
          placeholder="Search MAC, Serial, Asset ID, Customer, Tower, Supplier..."
          aria-label="Search system"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpenSearch(true);
          }}
          onFocus={() => setOpenSearch(true)}
        />

        {openSearch && query.trim().length >= 2 && (
          <div className="global-search-results">
            <div className="global-search-results-header">
              <strong>System Search</strong>
              <span>{searchResults.length} result(s)</span>
            </div>

            <div className="global-search-filters">
              {["All", "Asset", "Customer", "Tower", "Supplier"].map((filter) => (
                <button
                  type="button"
                  key={filter}
                  className={resultFilter === filter ? "active" : ""}
                  onClick={() => setResultFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>

            {searchResults.map((result) => (
              <button
                type="button"
                key={result.key}
                className="global-search-result"
                onClick={() => openResult(result.path)}
              >
                <span>{result.type}</span>
                <strong>{result.title}</strong>
                <em>{result.subtitle}</em>
                <div>
                  {result.details.slice(0, 6).map((detail) => (
                    <small key={detail}>{detail}</small>
                  ))}
                </div>
              </button>
            ))}

            {!searchResults.length && (
              <div className="global-search-empty">
                No exact result found. Try a partial MAC, serial number, asset ID, customer, tower, or supplier name.
              </div>
            )}
          </div>
        )}
      </div>

      <HeaderActions currentUser={currentUser} onLogout={onLogout} />
    </header>
  );
}

Header.Actions = HeaderActions;

export default Header;
