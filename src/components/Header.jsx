import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  Bell,
  Banknote,
  Box,
  CalendarClock,
  CheckCheck,
  ChevronDown,
  CreditCard,
  FileCheck2,
  LogOut,
  Languages,
  Moon,
  Palette,
  Search,
  Settings,
  Sun,
  Trash2,
  User,
  Users,
  Wrench,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { todayDateValue } from "../utils/afghanDate";
import { applyInterfaceLanguage } from "../utils/interfaceLanguage";
import { notify } from "../utils/notify";
import { isAdminUser } from "../utils/permissions";

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
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(null);

  const [
    dismissedNotificationKeys,
    setDismissedNotificationKeys,
  ] = useState(() => new Set());

  const responseAlertReadyRef = useRef(false);
  const responseSoundRef = useRef(null);
  const adminCustomerAlertReadyRef = useRef(false);
  const adminCustomerSoundRef = useRef(null);
  const [selectedCurrency, setSelectedCurrency] = useState(
    () => {
      const savedCurrency =
        localStorage.getItem("isp-currency");

      return ["AFN", "USD"].includes(savedCurrency)
        ? savedCurrency
        : "AFN";
    }
  );

  const [usdRate, setUsdRate] = useState(
    () => {
      const savedRate = Number(
        localStorage.getItem("isp-usd-rate")
      );

      return Number.isFinite(savedRate) &&
        savedRate > 0
        ? savedRate
        : 70;
    }
  );

  const [
    exchangeDirection,
    setExchangeDirection,
  ] = useState(
    () =>
      localStorage.getItem(
        "isp-exchange-direction"
      ) || "usd-to-afn"
  );

  const [rateInput, setRateInput] = useState(
    () => {
      const savedRate = Number(
        localStorage.getItem("isp-usd-rate")
      );

      const safeRate =
        Number.isFinite(savedRate) &&
        savedRate > 0
          ? savedRate
          : 70;

      const direction =
        localStorage.getItem(
          "isp-exchange-direction"
        ) || "usd-to-afn";

      return direction === "usd-to-afn"
        ? String(safeRate)
        : String(
            Number(
              (1 / safeRate).toFixed(6)
            )
          );
    }
  );
  const [selectedTheme, setSelectedTheme] = useState(
    () => localStorage.getItem("isp-theme") || "light"
  );
  const [selectedLanguage, setSelectedLanguage] = useState(() => localStorage.getItem("isp-language") || "en");

  const [assets] = useJsonCollection("assets");
  const [towerAssets] = useJsonCollection("towerAssets");
  const [securityDeposits] = useJsonCollection("securityDeposits");
  const [customerPackages] = useJsonCollection("customerPackages");
  const [
    customers,
    ,
    loadCustomers,
    customersLoaded,
  ] = useJsonCollection("customers");
  const today = todayDateValue();

  const currentUserIds = [
  currentUser?.id,
  currentUser?.employeeId,
  currentUser?.accountId,
]
  .filter(Boolean)
  .map((value) => String(value));

const currentUserNames = [
  currentUser?.fullName,
  currentUser?.username,
  currentUser?.email,
]
  .filter(Boolean)
  .map((value) =>
    String(value).trim().toLowerCase()
  );

const assignedCustomers = customers.filter(
  (customer) => {
    const assignedEmployeeId = String(
      customer.assignedEmployeeId || ""
    );

    const assignedAccountId = String(
      customer.assignedAccountId || ""
    );

    const assignedEmployeeName = String(
      customer.assignedEmployeeName || ""
    )
      .trim()
      .toLowerCase();

    return (
      currentUserIds.includes(
        assignedEmployeeId
      ) ||
      currentUserIds.includes(
        assignedAccountId
      ) ||
      currentUserNames.includes(
        assignedEmployeeName
      )
    );
  }
);

const pendingAssignedCustomers =
  assignedCustomers.filter((customer) =>
    ["pending", "assigned"].includes(
      normalize(
        customer.assignmentStatus ||
          customer.followUpStatus ||
          "pending"
      )
    )
  );

const assignedCustomerCount =
  pendingAssignedCustomers.length;

const currentUserRoles = [
  currentUser?.role,
  currentUser?.primaryRole,
  ...(Array.isArray(currentUser?.roles) ? currentUser.roles : []),
]
  .filter(Boolean)
  .map(normalize);

const isAdminAccount =
  currentUser?.isDefaultAdmin === true ||
  currentUser?.isAdmin === true ||
  currentUser?.isFullAdmin === true ||
  currentUser?.permissions?.all === true ||
  currentUser?.accountType === "admin" ||
  currentUserRoles.some((role) =>
    ["admin", "full admin", "administrator"].includes(role)
  );

const pendingAdminFollowUps = isAdminAccount
  ? customers.filter(
      (customer) =>
        normalize(customer.followUpWorkflowStatus) ===
        "awaiting admin"
    )
  : [];

const responseOwnerIds = [
  currentUser?.id,
  currentUser?.employeeId,
  currentUser?.accountId,
]
  .filter(Boolean)
  .map(String);

const responseOwnerNames = [
  currentUser?.fullName,
  currentUser?.username,
  currentUser?.email,
]
  .filter(Boolean)
  .map(normalize);

const receptionResponseEvents =
  customers.flatMap((customer) => {
    const creatorIds = [
      customer.createdByAccountId,
      customer.assignedByAccountId,
      customer.assignedById,
      customer.receptionAccountId,
    ]
      .filter(Boolean)
      .map(String);

    const creatorNames = [
      customer.createdByName,
      customer.assignedByName,
      customer.receptionName,
    ]
      .filter(Boolean)
      .map(normalize);

    const belongsToCurrentReception =
      creatorIds.some((id) =>
        responseOwnerIds.includes(id)
      ) ||
      creatorNames.some((name) =>
        responseOwnerNames.includes(name)
      );

    if (!belongsToCurrentReception) {
      return [];
    }

    const events = [];
    const status = normalize(
      customer.assignmentStatus
    );

    if (
      ["accepted", "rejected"].includes(
        status
      ) &&
      customer.assignmentRespondedAt
    ) {
      events.push({
        key: [
          customer.id,
          "response",
          status,
          customer.assignmentRespondedAt,
        ].join("|"),
        customer,
        action:
          status === "accepted"
            ? "accepted"
            : "rejected",
        actorName:
          customer.assignmentRespondedByName ||
          customer.assignedEmployeeName ||
          "Employee",
        happenedAt:
          customer.assignmentRespondedAt,
        toastType:
          status === "accepted"
            ? "success"
            : "error",
      });
    }

    const transfers = Array.isArray(
      customer.assignmentTransfers
    )
      ? customer.assignmentTransfers
      : [];

    transfers.forEach((transfer) => {
      if (!transfer?.transferredAt) return;

      events.push({
        key: [
          customer.id,
          "reassigned",
          transfer.id ||
            transfer.transferredAt,
        ].join("|"),
        customer,
        action: `assigned the request to ${
          transfer.toEmployeeName ||
          "another employee"
        }`,
        actorName:
          transfer.transferredByName ||
          transfer.fromEmployeeName ||
          "Employee",
        happenedAt:
          transfer.transferredAt,
        toastType: "info",
      });
    });

    return events;
  });

const adminCustomerCreateEvents = useMemo(
  () =>
    customers
      .filter(
        (customer) =>
          customer.adminNotificationType === "customer-created" &&
          customer.adminNotificationAt
      )
      .map((customer) => ({
        key: [
          customer.id || customer.customerId,
          "admin-customer-created",
          customer.adminNotificationAt,
        ].join("|"),
        customer,
        section:
          customer.adminNotificationSection ||
          customer.customerType ||
          "Customers",
        creator:
          customer.createdByName ||
          customer.receptionName ||
          "Call Center",
        shouldPlaySound:
          customer.adminNotificationSound === true ||
          customer.adminNotificationType ===
            "reception-assignment",
      })),
  [customers]
);

/*
 * Keep notification badges current without requiring a
 * browser refresh. A custom event updates immediately in
 * the same tab, while polling also covers other tabs or
 * another logged-in browser window.
 */
useEffect(() => {
  if (!customersLoaded) return undefined;

  let loading = false;

  const refreshCustomers = async () => {
    if (loading) return;

    loading = true;

    try {
      await loadCustomers();
    } finally {
      loading = false;
    }
  };

  const intervalId = window.setInterval(
    refreshCustomers,
    1500
  );

  const handleCustomerUpdate = () => {
    refreshCustomers();
  };

  window.addEventListener(
    "isp-customer-assignment-updated",
    handleCustomerUpdate
  );

  window.addEventListener(
    "storage",
    handleCustomerUpdate
  );

  return () => {
    window.clearInterval(intervalId);

    window.removeEventListener(
      "isp-customer-assignment-updated",
      handleCustomerUpdate
    );

    window.removeEventListener(
      "storage",
      handleCustomerUpdate
    );
  };
}, [customersLoaded, loadCustomers]);

/*
 * Reception receives a response alert when an assigned
 * employee accepts or rejects a request. The first load is
 * silently remembered so old responses are not replayed.
 */
useEffect(() => {
  if (
    !customersLoaded ||
    !currentUser
  ) {
    return;
  }

  const accountKey = String(
    currentUser.id ||
      currentUser.employeeId ||
      currentUser.accountId ||
      "unknown"
  );

  const storageKey =
    `isp-seen-assignment-responses:${accountKey}`;

  let seen = [];

  try {
    const parsed = JSON.parse(
      localStorage.getItem(storageKey) ||
        "[]"
    );

    seen = Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    seen = [];
  }

  const seenSet = new Set(seen);

  if (!responseAlertReadyRef.current) {
    receptionResponseEvents.forEach((event) =>
      seenSet.add(event.key)
    );

    localStorage.setItem(
      storageKey,
      JSON.stringify(
        [...seenSet].slice(-300)
      )
    );

    responseAlertReadyRef.current = true;
    return;
  }

  const newResponses =
    receptionResponseEvents.filter(
      (event) =>
        !seenSet.has(event.key)
    );

  if (!newResponses.length) {
    return;
  }

  newResponses.forEach((event) => {
    seenSet.add(event.key);

    const customerName =
      event.customer.fullName ||
      event.customer.customerName ||
      event.customer.personName ||
      "Customer";

    notify(
      `${event.actorName} ${event.action} for ${customerName}.`,
      event.toastType
    );
  });

  localStorage.setItem(
    storageKey,
    JSON.stringify(
      [...seenSet].slice(-300)
    )
  );

  try {
    if (!responseSoundRef.current) {
      responseSoundRef.current = new Audio(
        "/sounds/soft-bells-495.mp3"
      );

      responseSoundRef.current.preload =
        "auto";

      responseSoundRef.current.volume =
        0.8;
    }

    responseSoundRef.current.currentTime =
      0;

    const playPromise =
      responseSoundRef.current.play();

    if (
      playPromise &&
      typeof playPromise.catch ===
        "function"
    ) {
      playPromise.catch(() => {
        // Browser may require one user interaction first.
      });
    }
  } catch {
    // Visual notification remains available if audio fails.
  }
}, [
  customers,
  customersLoaded,
  currentUser?.id,
  currentUser?.employeeId,
  currentUser?.accountId,
]);

useEffect(() => {
  if (
    !customersLoaded ||
    !currentUser ||
    !isAdminUser(currentUser)
  ) {
    return;
  }

  const accountKey = String(
    currentUser.id ||
      currentUser.employeeId ||
      currentUser.accountId ||
      "admin"
  );

  const storageKey =
    `isp-seen-admin-customer-alerts:${accountKey}`;

  let seen = [];

  try {
    const parsed = JSON.parse(
      localStorage.getItem(storageKey) || "[]"
    );

    seen = Array.isArray(parsed) ? parsed : [];
  } catch {
    seen = [];
  }

  const seenSet = new Set(seen);

  if (!adminCustomerAlertReadyRef.current) {
    adminCustomerCreateEvents.forEach((event) =>
      seenSet.add(event.key)
    );

    localStorage.setItem(
      storageKey,
      JSON.stringify([...seenSet].slice(-500))
    );

    adminCustomerAlertReadyRef.current = true;
    return;
  }

  const newEvents = adminCustomerCreateEvents.filter(
    (event) => !seenSet.has(event.key)
  );

  if (!newEvents.length) return;

  newEvents.forEach((event) => {
    seenSet.add(event.key);

    const customerName =
      event.customer.customerName ||
      event.customer.fullName ||
      event.customer.passportFullName ||
      event.customer.personName ||
      "Customer";

    notify(
      `${event.creator} registered ${customerName} from ${event.section}.`,
      "info"
    );
  });

  localStorage.setItem(
    storageKey,
    JSON.stringify([...seenSet].slice(-500))
  );

  if (
    !newEvents.some((event) => event.shouldPlaySound)
  ) {
    return;
  }

  try {
    if (!adminCustomerSoundRef.current) {
      adminCustomerSoundRef.current = new Audio(
        "/sounds/open-up-587.mp3"
      );

      adminCustomerSoundRef.current.preload =
        "auto";

      adminCustomerSoundRef.current.volume = 0.8;
    }

    adminCustomerSoundRef.current.currentTime = 0;

    const playResult =
      adminCustomerSoundRef.current.play();

    if (
      playResult &&
      typeof playResult.catch === "function"
    ) {
      playResult.catch(() => {
        // The visual alert still appears if audio is blocked.
      });
    }
  } catch {
    // Keep the admin message working even when audio is unavailable.
  }
}, [
  adminCustomerCreateEvents,
  customersLoaded,
  currentUser,
]);

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

  const adminCustomerNotifications =
    isAdminUser(currentUser)
      ? adminCustomerCreateEvents
      : [];

  const notificationGroups = [
    {
      key: "admin-customer-created",
      title: "Call Center Registrations",
      count: adminCustomerNotifications.length,
      icon: Users,
      items: adminCustomerNotifications.map((event) => {
        const customerName =
          event.customer.customerName ||
          event.customer.fullName ||
          event.customer.passportFullName ||
          event.customer.personName ||
          "Customer";

        return {
          title: "New Customer Registered",
          description: `${event.creator} registered ${customerName} from ${event.section}`,
        };
      }),
      key: "follow-up-admin-review",
      title: "Follow-Up Reviews",
      count: pendingAdminFollowUps.length,
      icon: FileCheck2,
      items: pendingAdminFollowUps.map((customer) => ({
        title: "Follow-Up Ready for Admin",
        description: `${
          customer.fullName ||
          customer.customerName ||
          customer.personName ||
          "Customer"
        } was completed by Reception and needs financial review`,
        path: `/customer-follow-up/${customer.id}`,
        happenedAt:
          customer.followUp?.submittedForAdminAt ||
          customer.followUpUpdatedAt,
      })),
    },
    {
      key: "assigned-customers",
      title: "Customer Requests",
      count: assignedCustomerCount,
      icon: Users,
      items: pendingAssignedCustomers.map(
        (customer) => ({
          title: "New Customer Request",
          description: `${
            customer.fullName ||
            customer.customerName ||
            customer.personName ||
            "Customer"
          } was assigned to your account`,
        })
      ),
    },
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

  const notificationItems = notificationGroups.flatMap(
    (group) =>
      group.items.map((item, index) => ({
        ...item,
        key: [
          group.key,
          item.title,
          item.description,
          item.happenedAt || "",
          index,
        ].join("|"),
        groupKey: group.key,
        groupTitle: group.title,
        icon: group.icon,
      }))
  );

  const visibleNotificationItems =
    notificationItems.filter(
      (item) =>
        !dismissedNotificationKeys.has(item.key)
    );

  const visibleNotificationGroups =
    notificationGroups
      .map((group) => {
        const visibleItems =
          visibleNotificationItems.filter(
            (item) =>
              item.groupKey === group.key
          );

        return {
          ...group,
          count: visibleItems.length,
          items: visibleItems,
        };
      })
      .filter((group) => group.count > 0);

  const alertCount =
    visibleNotificationItems.length;

  function dismissNotification(notificationKey) {
    setDismissedNotificationKeys((current) => {
      const next = new Set(current);
      next.add(notificationKey);
      return next;
    });
  }

  function clearAllNotifications() {
    setDismissedNotificationKeys((current) => {
      const next = new Set(current);

      notificationItems.forEach((item) => {
        next.add(item.key);
      });

      return next;
    });
  }

  const themes = [
    { key: "light", label: "Light", color: "#f7f5f1" },
    { key: "dark", label: "Dark", color: "#0f172a" },
    { key: "ocean", label: "Ocean", color: "#0ea5e9" },
    { key: "warm", label: "Warm", color: "#f59e0b" },
  ];

  const currencies = ["AFN", "USD"];

  function selectCurrency(currency) {
    setSelectedCurrency(currency);
    localStorage.setItem(
      "isp-currency",
      currency
    );

    window.dispatchEvent(
      new CustomEvent(
        "isp-currency-changed",
        {
          detail: {
            currency,
            usdRate,
          },
        }
      )
    );
  }

  function currentDisplayRate(
    direction = exchangeDirection,
    baseRate = usdRate
  ) {
    if (direction === "usd-to-afn") {
      return String(baseRate);
    }

    return String(
      Number((1 / baseRate).toFixed(6))
    );
  }

  function updateUsdRateInput(value) {
    // Keep the raw text so the user can fully clear
    // the input and type a new value.
    setRateInput(value);

    if (
      value === "" ||
      value === "." ||
      value === "-"
    ) {
      return;
    }

    const enteredRate = Number(value);

    if (
      !Number.isFinite(enteredRate) ||
      enteredRate <= 0
    ) {
      return;
    }

    const nextUsdRate =
      exchangeDirection === "usd-to-afn"
        ? enteredRate
        : 1 / enteredRate;

    setUsdRate(nextUsdRate);

    localStorage.setItem(
      "isp-usd-rate",
      String(nextUsdRate)
    );

    window.dispatchEvent(
      new CustomEvent(
        "isp-currency-rate-changed",
        {
          detail: {
            currency: selectedCurrency,
            usdRate: nextUsdRate,
            direction: exchangeDirection,
          },
        }
      )
    );
  }

  function commitUsdRateInput() {
    const enteredRate = Number(rateInput);

    if (
      !rateInput.trim() ||
      !Number.isFinite(enteredRate) ||
      enteredRate <= 0
    ) {
      setRateInput(currentDisplayRate());
    }
  }

  function toggleExchangeDirection() {
    const nextDirection =
      exchangeDirection === "usd-to-afn"
        ? "afn-to-usd"
        : "usd-to-afn";

    setExchangeDirection(nextDirection);

    localStorage.setItem(
      "isp-exchange-direction",
      nextDirection
    );

    setRateInput(
      currentDisplayRate(
        nextDirection,
        usdRate
      )
    );
  }

  function applyTheme(theme) {
    setSelectedTheme(theme);
    localStorage.setItem("isp-theme", theme);
    document.body.classList.remove("dark-mode", "theme-ocean", "theme-warm");
    if (theme === "dark") document.body.classList.add("dark-mode");
    if (theme === "ocean") document.body.classList.add("theme-ocean");
    if (theme === "warm") document.body.classList.add("theme-warm");
  }

  function toggleDarkMode() {
    applyTheme(selectedTheme === "dark" ? "light" : "dark");
  }

  useEffect(() => {
    applyTheme(selectedTheme);
    applyInterfaceLanguage(selectedLanguage);

    const storedCurrency =
      localStorage.getItem("isp-currency");

    if (
      !["AFN", "USD"].includes(storedCurrency)
    ) {
      localStorage.setItem(
        "isp-currency",
        "AFN"
      );
    }
  }, []);

  useEffect(() => {
    const syncLanguage = (event) => {
      const language = event.detail;
      if (language && language !== selectedLanguage) setSelectedLanguage(language);
    };
    window.addEventListener("isp-language-changed", syncLanguage);
    return () => window.removeEventListener("isp-language-changed", syncLanguage);
  }, [selectedLanguage]);

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
              {selectedTheme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              {selectedTheme === "dark" ? "Light mode" : "Dark mode"}
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

          <Link
  to="/my-account"
  className="dropdown-action profile-account-link"
  onClick={() => setOpenMenu(null)}
>
  <User size={15} />

  <span>My Account</span>

  {assignedCustomerCount > 0 && (
    <b className="profile-account-count">
      ({assignedCustomerCount})
    </b>
  )}
</Link>

<button
  className="dropdown-logout"
  onClick={onLogout}
  type="button"
>
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
        <div className="header-menu">
          <button
            type="button"
            className="header-control-btn"
            onClick={() => setOpenMenu(openMenu === "currency" ? null : "currency")}
            aria-expanded={openMenu === "currency"}
          >
            <Banknote size={18} />
            <span>{selectedCurrency}</span>
            <ChevronDown size={14} />
          </button>

          {openMenu === "currency" && (
            <div className="dropdown header-picker-dropdown currency-picker-dropdown">
              <div className="header-picker-title">
                <strong>Currency Exchange</strong>
                <span>Display currency</span>
              </div>

              {currencies.map((currency) => (
                <button
                  type="button"
                  key={currency}
                  className={`header-picker-option currency-code-option ${
                    selectedCurrency === currency
                      ? "active"
                      : ""
                  }`}
                  onClick={() => {
                    selectCurrency(currency);
                  }}
                >
                  <strong>{currency}</strong>

                  {selectedCurrency === currency && (
                    <CheckCheck size={15} />
                  )}
                </button>
              ))}

              <div
                style={{
                  marginTop: 10,
                  paddingTop: 12,
                  borderTop:
                    "1px solid rgba(148, 163, 184, 0.25)",
                }}
              >
                <div
                  style={{
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div>
                    <strong
                      style={{
                        display: "block",
                        fontSize: 11,
                      }}
                    >
                      Exchange Rate
                    </strong>

                    <span
                      style={{
                        color: "#64748b",
                        fontSize: 9,
                      }}
                    >
                      Manual value
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleExchangeDirection();
                    }}
                    title="Reverse exchange direction"
                    aria-label="Reverse exchange direction"
                    style={{
                      width: 30,
                      height: 30,
                      padding: 0,
                      border:
                        "1px solid #dfe3e8",
                      borderRadius: 8,
                      display: "grid",
                      placeItems: "center",
                      background: "transparent",
                      color: "inherit",
                      cursor: "pointer",
                    }}
                  >
                    <ArrowLeftRight size={14} />
                  </button>
                </div>

                <div
                  style={{
                    minHeight: 42,
                    padding: "6px 8px",
                    border:
                      "1px solid #dfe3e8",
                    borderRadius: 8,
                    display: "grid",
                    gridTemplateColumns:
                      "auto minmax(72px, 1fr) auto",
                    alignItems: "center",
                    gap: 7,
                    background: "inherit",
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {exchangeDirection ===
                    "usd-to-afn"
                      ? "1 USD ="
                      : "1 AFN ="}
                  </span>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={rateInput}
                    onChange={(event) =>
                      updateUsdRateInput(
                        event.target.value
                      )
                    }
                    onBlur={commitUsdRateInput}
                    onFocus={(event) =>
                      event.target.select()
                    }
                    onClick={(event) =>
                      event.stopPropagation()
                    }
                    style={{
                      width: "100%",
                      minWidth: 0,
                      height: 28,
                      padding: "0 7px",
                      border:
                        "1px solid #cbd5e1",
                      borderRadius: 6,
                      outline: 0,
                      background: "transparent",
                      color: "inherit",
                      fontFamily: "inherit",
                      fontSize: 10,
                      fontWeight: 800,
                    }}
                    aria-label="Currency exchange rate"
                  />

                  <strong
                    style={{
                      fontSize: 10,
                    }}
                  >
                    {exchangeDirection ===
                    "usd-to-afn"
                      ? "AFN"
                      : "USD"}
                  </strong>
                </div>

                <div
                  style={{
                    marginTop: 8,
                    padding: "7px 8px",
                    borderRadius: 7,
                    background:
                      "rgba(99, 102, 241, 0.07)",
                    color: "#64748b",
                    fontSize: 9,
                    lineHeight: 1.45,
                  }}
                >
                  {exchangeDirection ===
                  "usd-to-afn" ? (
                    <>
                      1 USD ={" "}
                      <strong>
                        {Number(
                          usdRate.toFixed(6)
                        )}
                      </strong>{" "}
                      AFN
                    </>
                  ) : (
                    <>
                      1 AFN ={" "}
                      <strong>
                        {Number(
                          (1 / usdRate).toFixed(6)
                        )}
                      </strong>{" "}
                      USD
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="header-menu">
          <button type="button" className="header-control-btn" onClick={() => setOpenMenu(openMenu === "language" ? null : "language")} aria-expanded={openMenu === "language"}>
            <Languages size={18} /><span>{selectedLanguage === "en" ? "EN" : selectedLanguage === "dr" ? "دری" : "PS"}</span><ChevronDown size={14} />
          </button>
          {openMenu === "language" && <div className="dropdown header-picker-dropdown language-picker-dropdown"><div className="header-picker-title"><strong>Language</strong><span>Interface language</span></div>{[["en","English","English"],["dr","Dari","دری"],["ps","Pashto","پښتو"]].map(([code,label,native])=><button type="button" key={code} className={`header-picker-option language-picker-option ${selectedLanguage===code?"active":""}`} onClick={()=>{setSelectedLanguage(code);applyInterfaceLanguage(code);setOpenMenu(null)}}><b data-no-translate>{code.toUpperCase()}</b><span><strong>{label}</strong><small data-no-translate>{native}</small></span>{selectedLanguage===code&&<CheckCheck size={15}/>}</button>)}</div>}
        </div>

        <div className="header-menu">
          <button
            type="button"
            className="header-control-btn"
            onClick={() => setOpenMenu(openMenu === "themes" ? null : "themes")}
            aria-expanded={openMenu === "themes"}
          >
            <Palette size={18} />
            <span>Themes</span>
            <ChevronDown size={14} />
          </button>

          {openMenu === "themes" && (
            <div className="dropdown header-picker-dropdown theme-picker-dropdown">
              <div className="header-picker-title">
                <strong>Choose Theme</strong>
                <span>Interface appearance</span>
              </div>
              <div className="theme-picker-grid">
                {themes.map((theme) => (
                  <button
                    type="button"
                    key={theme.key}
                    className={`theme-picker-option ${selectedTheme === theme.key ? "active" : ""}`}
                    onClick={() => {
                      applyTheme(theme.key);
                      setOpenMenu(null);
                    }}
                  >
                    <i style={{ background: theme.color }}></i>
                    <span>{theme.label}</span>
                    {selectedTheme === theme.key && <CheckCheck size={14} />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="header-menu">
          <button
            className="icon-btn"
            onClick={() => setOpenMenu(openMenu === "alerts" ? null : "alerts")}
            aria-label="Alerts"
          >
            <Bell size={21} strokeWidth={1.9} />
            {alertCount > 0 && <span className="alert-count">{alertCount}</span>}
          </button>

          {openMenu === "alerts" && (
            <div className="dropdown alert-dropdown notification-dropdown">
              <div className="notification-dropdown-header">
  <div className="notification-dropdown-title">
    <strong>Notifications</strong>

   {assignedCustomerCount > 0 && (
  <span className="account-request-badge">
    {assignedCustomerCount > 99
      ? "99+"
      : assignedCustomerCount}
  </span>
)}
  </div>

  <div className="notification-header-actions">
    <button
      type="button"
      aria-label="Mark all notifications as read"
      title="Mark all as read"
      onClick={clearAllNotifications}
    >
      <CheckCheck size={14} />
    </button>

    <button
      type="button"
      className="notification-clear-btn"
      aria-label="Clear all notifications"
      title="Clear notifications"
      onClick={clearAllNotifications}
    >
      <Trash2 size={14} />
    </button>
  </div>
</div>

              {visibleNotificationGroups.length > 0 ? (
                <>
                  <div className="notification-group-list">
                    {visibleNotificationGroups.map((group) => {
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
                    {visibleNotificationItems
                      .slice(0, 8)
                      .map((item) => {
                        const Icon = item.icon;
                        return (
                          <div
                            key={item.key}
                            className="notification-item"
                            role={item.path ? "button" : undefined}
                            tabIndex={item.path ? 0 : undefined}
                            onClick={() => {
                              if (!item.path) return;
                              setOpenMenu(null);
                              navigate(item.path);
                            }}
                            onKeyDown={(event) => {
                              if (
                                item.path &&
                                (event.key === "Enter" || event.key === " ")
                              ) {
                                event.preventDefault();
                                setOpenMenu(null);
                                navigate(item.path);
                              }
                            }}
                          >
  <span className="notification-icon">
    <Icon size={15} strokeWidth={1.9} />
  </span>

  <div className="notification-item-content">
    <strong>{item.title}</strong>
    <p>{item.description}</p>
    <small>
      {item.happenedAt
        ? new Date(item.happenedAt).toLocaleString()
        : "Current alert"}
    </small>
  </div>

  <button
    type="button"
    className="notification-remove-btn"
    aria-label={`Remove ${item.title}`}
    title="Remove notification"
    onClick={(event) => {
      event.stopPropagation();
      dismissNotification(item.key);
    }}
  >
    <Trash2 size={13} />
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

        <div className="header-menu profile-menu">
          <button
  className="profile-btn account-profile-btn"
  onClick={() =>
    setOpenMenu(
      openMenu === "profile"
        ? null
        : "profile"
    )
  }
  aria-label="Profile"
  type="button"
>
  <User size={21} strokeWidth={1.9} />

  {assignedCustomerCount > 0 && (
    <span className="account-request-badge">
      {assignedCustomerCount > 99
        ? "99+"
        : assignedCustomerCount}
    </span>
  )}
</button>

          {openMenu === "profile" && (
  <div className="dropdown profile-dropdown">
    <strong>
      {currentUser?.fullName ||
        currentUser?.email ||
        currentUser?.username}
    </strong>

    <p>
      {currentUser?.email ||
        "No email configured"}
    </p>

    <Link
  to="/my-account"
  className="dropdown-action profile-account-link"
  onClick={() => setOpenMenu(null)}
>
  <User size={15} />

  <span>My Account</span>

  {assignedCustomerCount > 0 && (
    <b className="profile-account-count">
      ({assignedCustomerCount})
    </b>
  )}
</Link>

    <button
      className="dropdown-logout"
      onClick={onLogout}
      type="button"
    >
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

  const [selectedLanguage, setSelectedLanguage] = useState(
    () => localStorage.getItem("isp-language") || "en"
  );

  useEffect(() => {
    const syncLanguage = (event) => {
      const language =
        event?.detail ||
        localStorage.getItem("isp-language") ||
        "en";

      setSelectedLanguage(language);
    };

    window.addEventListener(
      "isp-language-changed",
      syncLanguage
    );

    window.addEventListener(
      "storage",
      syncLanguage
    );

    return () => {
      window.removeEventListener(
        "isp-language-changed",
        syncLanguage
      );

      window.removeEventListener(
        "storage",
        syncLanguage
      );
    };
  }, []);
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
  placeholder={
    selectedLanguage === "dr"
      ? "جستجوی نام مشتری، پروژه، پرداخت، تأمین‌کننده..."
      : selectedLanguage === "ps"
        ? "د پېرودونکي نوم، پروژه، تادیه او عرضه کوونکی ولټوئ..."
        : "Search Customer Name, Project, Payment, Supplier..."
  }
  aria-label={
    selectedLanguage === "dr"
      ? "جستجوی مشتریان، پروژه‌ها، پرداخت‌ها و تأمین‌کنندگان"
      : selectedLanguage === "ps"
        ? "پېرودونکي، پروژې، تادیات او عرضه کوونکي ولټوئ"
        : "Search customers, projects, payments and suppliers"
  }
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
             <strong>
  {selectedLanguage === "dr"
    ? "جستجوی سیستم"
    : selectedLanguage === "ps"
      ? "د سیسټم لټون"
      : "System Search"}
</strong>

<span>
  {searchResults.length}{" "}
  {selectedLanguage === "dr"
    ? "نتیجه"
    : selectedLanguage === "ps"
      ? "پایله"
      : "result(s)"}
</span>
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
  No matching record found. Try a customer name, project,
  payment, phone number, or supplier name.
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
