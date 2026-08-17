import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import axios from "axios";
import { MessageCircle } from "lucide-react";
import {
  Routes,
  Route,
  NavLink,
  Navigate,
  useLocation,
} from "react-router-dom";

import {
  Armchair,
  BookOpen,
  Bot,
  Building2,
  CircleHelp,
  Code2,
  FileBarChart,
  FolderKanban,
  HelpCircle,
  Info,
  LayoutDashboard,
  Package,
  Settings as SettingsIcon,
  ShieldCheck,
  Trash2,
  Users,
  CircleUserRound,
  UserRoundCog,
  WalletCards,
} from "lucide-react";
import Header from "./components/Header";
import GlobalTableEnhancer from "./components/GlobalTableEnhancer";
import ToastHost from "./components/ToastHost";
import brandLogo from "./assets/logo.PNG";
import { useJsonCollection } from "./hooks/useJsonCollection";
import { canViewModule } from "./utils/permissions";
import { notify, requestSystemNotificationPermission } from "./utils/notify";
import ReportFinancial from "./pages/ReportFinancial";


function lazyWithRetry(importer) {
  return lazy(async () => {
    try {
      return await importer();
    } catch (firstError) {
      // Retry once for short network/CDN interruptions.
      await new Promise((resolve) => window.setTimeout(resolve, 700));
      try {
        return await importer();
      } catch (secondError) {
        const message = String(secondError?.message || firstError?.message || "");
        const looksLikeChunkError = /dynamically imported module|failed to fetch|loading chunk|importing a module script/i.test(message);
        const reloadKey = "isp-chunk-recovery-at";
        const lastReload = Number(sessionStorage.getItem(reloadKey) || 0);

        if (looksLikeChunkError && Date.now() - lastReload > 15000) {
          sessionStorage.setItem(reloadKey, String(Date.now()));
          window.location.reload();
          return new Promise(() => {});
        }
        throw secondError;
      }
    }
  });
}

const Dashboard = lazyWithRetry(() => import("./pages/Dashboard"));
const MyAccount = lazyWithRetry(() =>
  import("./pages/MyAccount")
);
const Suppliers = lazyWithRetry(() => import("./pages/Suppliers"));
const SupplierDetails = lazyWithRetry(() => import("./pages/SupplierDetails"));
const ConsultantCustomers = lazyWithRetry(() => import("./pages/ConsultantCustomers"));
const Accounts = lazyWithRetry(() => import("./pages/Accounts"));
const Finance = lazyWithRetry(() => import("./pages/Finance"));
const Reports = lazyWithRetry(() => import("./pages/Reports"));
const Settings = lazyWithRetry(() => import("./pages/Settings"));
const UserManagement = lazyWithRetry(() => import("./pages/UserManagement"));
const Agent = lazyWithRetry(() => import("./pages/Agent"));
const EmployeesHub = lazyWithRetry(() => import("./pages/EmployeesHub"));
const EmployeeDetails = lazyWithRetry(() => import("./pages/EmployeeDetails"));
const EmployeePerformance = lazyWithRetry(() =>
  import("./pages/EmployeePerformance")
);
const EmployeeDashboard = lazyWithRetry(() => import("./pages/EmployeeDashboard"));
import ProjectReport from "./pages/ProjectReport";
import EmployeeReport from "./pages/EmployeeReport";
import SupplierReport from "./pages/SupplierReport";
import ReceptionReport from "./pages/ReceptionReport";
const OfficeAssets = lazyWithRetry(() => import("./pages/OfficeAssets"));
const OfficeAssetDetails = lazyWithRetry(() => import("./pages/OfficeAssetDetails"));

const ProjectsHub = lazyWithRetry(() => import("./pages/ProjectsHub"));
const Login = lazyWithRetry(() => import("./pages/Login"));
const HelpCenter = lazyWithRetry(() => import("./pages/HelpCenter"));
const Developer = lazyWithRetry(() => import("./pages/Developer"));

import CustomerReport from "./pages/CustomerReport";
const TermsPrivacy = lazyWithRetry(
  () => import("./pages/TermsPrivacy")
);
const FAQ = lazyWithRetry(() =>
  import("./pages/FAQ")
);
const Reception = lazyWithRetry(() => import("./pages/Reception"));
const CustomerFollowUp = lazyWithRetry(() => import("./pages/CustomerFollowUp"));
const Packages = lazyWithRetry(() => import("./pages/Packages"));
const RecycleBin = lazyWithRetry(() => import("./pages/RecycleBin"));
const Messages = lazyWithRetry(() => import("./pages/Messages"));


const UserGuide = lazyWithRetry(() => import("./pages/UserGuide"));

const defaultAdminAccount = {
  id: "default-admin",
  fullName: "System Admin",
  email: "admin@gmail.com",
  password: "mynameisadmin",
  secondaryPassword: "",
  role: "Admin",
  status: "Active",
  permissions: {},
  isDefaultAdmin: true,
  createdAt: "2026-07-18",
};

function ModulePlaceholder({ title, description, items = [] }) {
  return (
    <div className="module-placeholder">
      <div className="module-placeholder-card">
        <span className="module-kicker">Module</span>
        <h1>{title}</h1>
        <p>{description}</p>

        {!!items.length && (
          <div className="module-feature-grid">
            {items.map((item) => (
              <div className="module-feature" key={item}>
                <span></span>
                <p>{item}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PermissionDenied() {
  return (
    <div className="module-placeholder">
      <div className="module-placeholder-card">
        <span className="module-kicker">Access Control</span>
        <h1>Permission Denied</h1>
        <p>You do not have permission to access this module.</p>
      </div>
    </div>
  );
}

function ProtectedModule({ currentUser, moduleKey, children }) {
  if (!canViewModule(currentUser, moduleKey)) {
    return <PermissionDenied />;
  }

  return children;
}

function App() {
  const location = useLocation();
  const [settings, , loadSettings] = useJsonCollection("settings");
  const [accounts, setAccounts, , accountsLoaded] = useJsonCollection("accounts");
  const [employees, , , employeesLoaded] = useJsonCollection("employees");
    const [
      customers,
      ,
      loadCustomers,
      customersLoaded,
    ] = useJsonCollection("customers");
  
  const [sidebarInfoOpen, setSidebarInfoOpen] = useState(false);
  const sidebarInfoRef = useRef(null);

  const [interfaceLanguage, setInterfaceLanguage] = useState(
    () => localStorage.getItem("isp-language") || "en"
  );

  useEffect(() => {
    const syncInterfaceLanguage = (event) => {
      const nextLanguage =
        event?.detail || localStorage.getItem("isp-language") || "en";

      setInterfaceLanguage(nextLanguage);
    };

    window.addEventListener("isp-language-changed", syncInterfaceLanguage);
    window.addEventListener("storage", syncInterfaceLanguage);

    return () => {
      window.removeEventListener(
        "isp-language-changed",
        syncInterfaceLanguage
      );
      window.removeEventListener("storage", syncInterfaceLanguage);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle(
      "lang-rtl",
      interfaceLanguage === "dr" || interfaceLanguage === "ps"
    );
  }, [interfaceLanguage]);

  useEffect(() => {
    const enableNotifications = () => {
      requestSystemNotificationPermission();
    };

    window.addEventListener("pointerdown", enableNotifications, {
      once: true,
    });
    window.addEventListener("keydown", enableNotifications, {
      once: true,
    });

    const removeOpenPathListener =
      window.ispDesktop?.onOpenNotificationPath?.((path) => {
        if (path) {
          window.location.hash = `#${path}`;
        }
      });

    return () => {
      window.removeEventListener("pointerdown", enableNotifications);
      window.removeEventListener("keydown", enableNotifications);
      removeOpenPathListener?.();
    };
  }, []);

  const sidebarTranslations = {
    en: {
      dashboard: "Dashboard",
      myAccount: "My Account",
      messages: "Message",
      customers: "Customers",
      consultantCustomers: "Consultant Customers",
      travelCustomers: "Travel Customers",
      technologyCustomers: "Technology Customers",
      mediaCustomers: "Media Customers",
      projects: "Projects",
      projectSales: "Project Sales",
      employees: "Employees & Attendance",
      allEmployees: "All Employees",
      employeeAttendance: "Employee Attendance",
      packages: "Packages",
      visaPackage: "Visa Package",
      travelPackage: "Travel Package",
      technologyPackage: "Technology Package",
      mediaPackage: "Media Package",
      reception: "Reception",
      suppliers: "Suppliers",
      assets: "Assets",
      finances: "Finances",
      reports: "Reports",
      settings: "Settings",
      aiAgent: "AI Agent",
      recycleBin: "Recycle Bin",
      helpCenter: "Help Center",
      developer: "Developer",
      faq: "FAQ",
      userGuide: "User Guide",
      termsPrivacy: "Terms & Privacy",
    },
    dr: {
      dashboard: "داشبورد",
      myAccount: "حساب من",
      messages: "پیام",
      customers: "مشتریان",
      consultantCustomers: "مشتریان مشاوره",
      travelCustomers: "مشتریان سفر",
      technologyCustomers: "مشتریان تکنالوژی",
      mediaCustomers: "مشتریان رسانه",
      projects: "پروژه‌ها",
      projectSales: "فروش پروژه",
      employees: "کارمندان و حاضری",
      allEmployees: "همه کارمندان",
      employeeAttendance: "حاضری کارمندان",
      packages: "پکیج‌ها",
      visaPackage: "پکیج ویزه",
      travelPackage: "پکیج سفر",
      technologyPackage: "پکیج تکنالوژی",
      mediaPackage: "پکیج رسانه",
      reception: "پذیرش",
      suppliers: "تأمین‌کنندگان",
      assets: "دارایی‌ها",
      finances: "امور مالی",
      reports: "گزارش‌ها",
      settings: "تنظیمات",
      aiAgent: "دستیار هوشمند",
      recycleBin: "سطل بازیافت",
      helpCenter: "مرکز راهنما",
      developer: "توسعه‌دهنده",
      faq: "پرسش‌های متداول",
      userGuide: "راهنمای کاربر",
      termsPrivacy: "شرایط و حریم خصوصی",
    },
    ps: {
      dashboard: "ډشبورډ",
      myAccount: "زما حساب",
      messages: "پیغام",
      customers: "پېرودونکي",
      consultantCustomers: "مشورتي پېرودونکي",
      travelCustomers: "د سفر پېرودونکي",
      technologyCustomers: "د ټکنالوژۍ پېرودونکي",
      mediaCustomers: "د رسنیو پېرودونکي",
      projects: "پروژې",
      projectSales: "د پروژې پلور",
      employees: "کارکوونکي او حاضري",
      allEmployees: "ټول کارکوونکي",
      employeeAttendance: "د کارکوونکو حاضري",
      packages: "بستې",
      visaPackage: "د ویزې بسته",
      travelPackage: "د سفر بسته",
      technologyPackage: "د ټکنالوژۍ بسته",
      mediaPackage: "د رسنیو بسته",
      reception: "استقبال",
      suppliers: "عرضه کوونکي",
      assets: "شتمنۍ",
      finances: "مالي چارې",
      reports: "راپورونه",
      settings: "تنظیمات",
      aiAgent: "هوښیار مرستیال",
      recycleBin: "کثافات",
      helpCenter: "د مرستې مرکز",
      developer: "پراختیا ورکوونکی",
      faq: "عامې پوښتنې",
      userGuide: "د کارن لارښود",
      termsPrivacy: "شرایط او محرمیت",
    },
  };

  const sidebarText =
    sidebarTranslations[interfaceLanguage] || sidebarTranslations.en;

  const assignmentAlertReadyRef =
    useRef(false);

  const assignmentSoundRef =
    useRef(null);

  const [sessionId, setSessionId] = useState(() =>
    localStorage.getItem("isp-system-session")
  );

  const company = settings[0] || {};
  const systemName = company.companyName || "Afghan Power";
  const systemSubtitle = company.systemSubtitle || "Asset & Inventory Management";
  const effectiveAccounts = accounts.some((account) => String(account.id) === "default-admin")
    ? accounts
    : [defaultAdminAccount, ...accounts];
  const signedInAccount = effectiveAccounts.find(
    (account) =>
      String(account.id) === String(sessionId)
  );

  const linkedEmployee = employees.find(
    (employee) =>
      String(employee.id) ===
      String(signedInAccount?.employeeId)
  );

  const linkedEmployeeRoles = Array.isArray(
    linkedEmployee?.roles
  )
    ? linkedEmployee.roles
    : linkedEmployee?.role
      ? [linkedEmployee.role]
      : [];

  const linkedEmployeeDepartments = Array.isArray(
    linkedEmployee?.departments
  )
    ? linkedEmployee.departments
    : linkedEmployee?.department
      ? [linkedEmployee.department]
      : [];

  const signedInAccountRoles = Array.isArray(
    signedInAccount?.roles
  )
    ? signedInAccount.roles
    : signedInAccount?.primaryRole
      ? [signedInAccount.primaryRole]
      : signedInAccount?.role
        ? [signedInAccount.role]
        : [];

  const signedInAccountHasOnlyGenericEmployeeRole =
    signedInAccountRoles.length === 1 &&
    String(signedInAccountRoles[0] || "")
      .trim()
      .toLowerCase() === "employee";

  const effectiveUserRoles =
    signedInAccountRoles.length &&
    !signedInAccountHasOnlyGenericEmployeeRole
      ? signedInAccountRoles
      : linkedEmployeeRoles.length
        ? linkedEmployeeRoles
        : signedInAccountRoles;

  const signedInAccountDepartments = Array.isArray(
    signedInAccount?.departments
  )
    ? signedInAccount.departments
    : signedInAccount?.department
      ? [signedInAccount.department]
      : [];

  const effectiveUserDepartments =
    linkedEmployeeDepartments.length
      ? linkedEmployeeDepartments
      : signedInAccountDepartments;

  const employeeHasAdminRole =
    linkedEmployeeRoles.some((role) => {
      const normalizedRole = String(role || "")
        .trim()
        .toLowerCase();

      return (
        normalizedRole === "admin" ||
        normalizedRole === "full admin" ||
        normalizedRole === "full administrator" ||
        normalizedRole === "administrator"
      );
    });

  const accountRole = String(
    signedInAccount?.role || ""
  )
    .trim()
    .toLowerCase();

  const accountHasAdminRole =
    signedInAccount?.isDefaultAdmin === true ||
    signedInAccount?.isAdmin === true ||
    signedInAccount?.isFullAdmin === true ||
    signedInAccount?.permissions?.all === true ||
    signedInAccount?.accountType === "admin" ||
    accountRole === "admin" ||
    accountRole === "full admin" ||
    accountRole === "full administrator" ||
    accountRole === "administrator";

  const isAdminAccount =
    accountHasAdminRole ||
    employeeHasAdminRole;

  /*
   * کاربر نهایی سیستم:
   * اگر کارمند نقش Admin یا Full Admin داشته باشد،
   * حساب او به‌صورت خودکار حساب Admin در نظر گرفته می‌شود.
   */
  const currentUser = signedInAccount
    ? {
      ...signedInAccount,
      roles: effectiveUserRoles,
      primaryRole:
        effectiveUserRoles[0] ||
        signedInAccount.primaryRole ||
        signedInAccount.role,
      departments: effectiveUserDepartments,
      department:
        effectiveUserDepartments[0] ||
        signedInAccount.department,

      ...(isAdminAccount
        ? {
          role: "Admin",
          accountType: "admin",
          isAdmin: true,
          isFullAdmin: true,

          permissions: {
            ...(signedInAccount.permissions || {}),
            all: true,
          },
        }
        : {}),
    }
    : null;

  useEffect(() => {
    if (sessionId) {
      axios.defaults.headers.common["x-isp-session-id"] = String(sessionId);
      return;
    }

    delete axios.defaults.headers.common["x-isp-session-id"];
  }, [sessionId]);

  useEffect(() => {
    if (!currentUser) {
      localStorage.removeItem("isp-current-user");
      return;
    }

    localStorage.setItem(
      "isp-current-user",
      JSON.stringify({
        id: currentUser.id || "",
        employeeId: currentUser.employeeId || "",
        fullName: currentUser.fullName || "",
        username: currentUser.username || "",
        email: currentUser.email || "",
        role: currentUser.role || "",
        primaryRole: currentUser.primaryRole || "",
        accountType: currentUser.accountType || "",
        roles: Array.isArray(currentUser.roles) ? currentUser.roles : [],
      })
    );
  }, [currentUser]);


    const currentAccountIds = [
  currentUser?.id,
  currentUser?.employeeId,
  linkedEmployee?.id,
  linkedEmployee?.employeeId,
]
  .filter(Boolean)
  .map((value) => String(value));

const currentAccountNames = [
  currentUser?.fullName,
  currentUser?.username,
  currentUser?.email,
  linkedEmployee?.fullName,
  linkedEmployee?.email,
]
  .filter(Boolean)
  .map((value) =>
    String(value).trim().toLowerCase()
  );

const myAssignedCustomers = customers
  .filter((customer) => {
    const assignedIds = [
      customer.assignedEmployeeId,
      customer.assignedAccountId,
    ]
      .filter(Boolean)
      .map((value) => String(value));

    const assignedName = String(
      customer.assignedEmployeeName || ""
    )
      .trim()
      .toLowerCase();

    return (
      assignedIds.some((assignedId) =>
        currentAccountIds.includes(assignedId)
      ) ||
      currentAccountNames.includes(
        assignedName
      )
    );
  })
  .sort(
    (first, second) =>
      new Date(
        second.assignedAt ||
          second.updatedAt ||
          second.createdAt ||
          0
      ) -
      new Date(
        first.assignedAt ||
          first.updatedAt ||
          first.createdAt ||
          0
      )
  );
  /*
   * فقط کارمند عادی باید EmployeeDashboard را ببیند.
   * Admin و Full Admin وارد داشبورد عمومی سیستم می‌شوند.
   */
  const currentUserRoles = Array.isArray(currentUser?.roles)
    ? currentUser.roles
    : currentUser?.primaryRole
      ? [currentUser.primaryRole]
      : linkedEmployeeRoles;

  const isReceptionAccount = currentUserRoles.some(
    (role) =>
      String(role || "")
        .trim()
        .toLowerCase() === "reception"
  );

  const isCallCenterAccount = currentUserRoles.some(
    (role) => {
      const normalizedRole = String(role || "")
        .trim()
        .toLowerCase();

      return (
        normalizedRole === "call center" ||
        normalizedRole === "callcenter"
      );
    }
  );

  const isEmployeeAccount =
    currentUser?.accountType === "employee" &&
    !isAdminAccount &&
    (!isReceptionAccount || isCallCenterAccount);

  /*
   * Keep assignments fresh without hammering Supabase.
   * The collection hook already performs a background refresh. Here we only
   * refresh immediately when the app becomes visible again or when another
   * part of the app announces an assignment change.
   */
  useEffect(() => {
    if (!currentUser || !customersLoaded) return undefined;

    let refreshing = false;
    const refreshAssignments = async () => {
      if (refreshing || !navigator.onLine) return;
      refreshing = true;
      try {
        await loadCustomers();
      } finally {
        refreshing = false;
      }
    };

    const handleImmediateRefresh = () => refreshAssignments();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") refreshAssignments();
    };

    window.addEventListener(
      "isp-customer-assignment-updated",
      handleImmediateRefresh
    );
    window.addEventListener("online", handleImmediateRefresh);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener(
        "isp-customer-assignment-updated",
        handleImmediateRefresh
      );
      window.removeEventListener("online", handleImmediateRefresh);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [currentUser?.id, customersLoaded, loadCustomers]);

  /*
   * Notify the currently assigned account whenever a new
   * request reaches it. Seen assignment keys are stored per
   * account so refreshing the browser does not replay old
   * alerts.
   */
  useEffect(() => {
    if (
      !currentUser ||
      !customersLoaded
    ) {
      return;
    }

    const accountKey = String(
      currentUser.id ||
        currentUser.employeeId ||
        linkedEmployee?.id ||
        "unknown"
    );

    const storageKey =
      `isp-seen-customer-assignments:${accountKey}`;

    let seenKeys = [];

    try {
      const parsed = JSON.parse(
        localStorage.getItem(storageKey) ||
          "[]"
      );

      seenKeys = Array.isArray(parsed)
        ? parsed
        : [];
    } catch {
      seenKeys = [];
    }

    const seenSet = new Set(seenKeys);

    const assignmentKey = (customer) =>
      [
        customer.id,
        customer.assignedEmployeeId ||
          customer.assignedAccountId ||
          "",
        customer.assignedAt ||
          customer.updatedAt ||
          customer.createdAt ||
          "",
      ].join("|");

    const currentAssignments =
      myAssignedCustomers.filter(
        (customer) =>
          String(
            customer.assignmentStatus ||
              "Pending"
          ).toLowerCase() === "pending"
      );

    /*
     * On the first collection load, remember already-existing
     * requests without playing a sound. Later assignments
     * trigger both the toast and the audio.
     */
    if (!assignmentAlertReadyRef.current) {
      currentAssignments.forEach(
        (customer) => {
          seenSet.add(
            assignmentKey(customer)
          );
        }
      );

      localStorage.setItem(
        storageKey,
        JSON.stringify(
          [...seenSet].slice(-300)
        )
      );

      assignmentAlertReadyRef.current = true;
      return;
    }

    const newAssignments =
      currentAssignments.filter(
        (customer) =>
          !seenSet.has(
            assignmentKey(customer)
          )
      );

    if (!newAssignments.length) {
      return;
    }

    newAssignments.forEach((customer) => {
      seenSet.add(
        assignmentKey(customer)
      );

      const customerName =
        customer.fullName ||
        customer.customerName ||
        customer.personName ||
        "New customer";

      const customerType =
        customer.customerType ||
        "customer";

      notify(
        `${customerName} (${customerType}) has been assigned to you.`,
        "info",
        {
          system: true,
          title: "New Customer Request",
          path: `/my-account#customer:${encodeURIComponent(
            String(customer.id || customer.customerId || "")
          )}`,
        }
      );
    });

    localStorage.setItem(
      storageKey,
      JSON.stringify(
        [...seenSet].slice(-300)
      )
    );

    try {
      if (!assignmentSoundRef.current) {
        assignmentSoundRef.current =
          new Audio(
            "/sounds/open-up-587.mp3"
          );

        assignmentSoundRef.current.preload =
          "auto";

        assignmentSoundRef.current.volume =
          0.8;
      }

      assignmentSoundRef.current.currentTime =
        0;

      const playResult =
        assignmentSoundRef.current.play();

      if (
        playResult &&
        typeof playResult.catch ===
          "function"
      ) {
        playResult.catch(() => {
          /*
           * Some browsers block audio until the user first
           * interacts with the page. The visual notification
           * still appears in that case.
           */
        });
      }
    } catch {
      // Keep visual alerts working if audio is unavailable.
    }
  }, [
    customers,
    customersLoaded,
    currentUser?.id,
    currentUser?.employeeId,
    linkedEmployee?.id,
  ]);

  useEffect(() => {
    const isFollowUpPath =
      location.pathname.startsWith(
        "/customer-follow-up/"
      );

    const receptionAllowedPaths = [
      "/",
      "/reception",
      "/my-account",
      "/messages",
    ];

    if (
      isReceptionAccount &&
      !isCallCenterAccount &&
      !receptionAllowedPaths.includes(
        location.pathname
      ) &&
      !isFollowUpPath
    ) {
      window.location.hash = "#/reception";
      return;
    }

    const employeeAllowedPaths = [
      "/",
      "/my-account",
      "/messages",
      ...(isReceptionAccount ? ["/reception"] : []),
    ];

    if (
      isEmployeeAccount &&
      !employeeAllowedPaths.includes(
        location.pathname
      ) &&
      !isFollowUpPath
    ) {
      window.location.hash = "#/";
    }
  }, [
    isReceptionAccount,
    isCallCenterAccount,
    isEmployeeAccount,
    location.pathname,
  ]);

  useEffect(() => {
    window.addEventListener("company-settings-updated", loadSettings);
    return () => window.removeEventListener("company-settings-updated", loadSettings);
  }, [loadSettings]);

  useEffect(() => {
    const closeSidebarInfo = (event) => {
      if (
        sidebarInfoRef.current &&
        !sidebarInfoRef.current.contains(event.target)
      ) {
        setSidebarInfoOpen(false);
      }
    };

    const closeWithEscape = (event) => {
      if (event.key === "Escape") {
        setSidebarInfoOpen(false);
      }
    };

    document.addEventListener("mousedown", closeSidebarInfo);
    document.addEventListener("keydown", closeWithEscape);

    return () => {
      document.removeEventListener(
        "mousedown",
        closeSidebarInfo
      );

      document.removeEventListener(
        "keydown",
        closeWithEscape
      );
    };
  }, []);

  useEffect(() => {
    if (!accountsLoaded) return;
    if (accounts.some((account) => String(account.id) === "default-admin")) return;
    setAccounts([defaultAdminAccount, ...accounts]);
  }, [accountsLoaded, accounts, setAccounts]);

  const login = (account) => {
    localStorage.setItem("isp-system-session", String(account.id));
    setSessionId(String(account.id));
  };

  const logout = () => {
    localStorage.removeItem("isp-system-session");
    setSessionId(null);
  };

  const menuItems = [
    { to: "/", label: sidebarText.dashboard, moduleKey: "dashboard", icon: LayoutDashboard },
    {
      to: "/reception",
      label: sidebarText.reception,
      moduleKey: "customers",
      icon: UserRoundCog,
    },
    { to: "/suppliers", label: sidebarText.suppliers, moduleKey: "suppliers", icon: Building2 },
    { to: "/office-assets", label: sidebarText.assets, moduleKey: "dashboard", icon: Armchair, },
    { to: "/finance", label: sidebarText.finances, moduleKey: "finance", icon: WalletCards },
    { to: "/reports", label: sidebarText.reports, moduleKey: "reports", icon: FileBarChart },
    { to: "/settings", label: sidebarText.settings, moduleKey: "settings", icon: SettingsIcon },
    { to: "/agent", label: sidebarText.aiAgent, moduleKey: "agent", icon: Bot },
    { to: "/recycle-bin", label: sidebarText.recycleBin, moduleKey: "dashboard", icon: Trash2 },
  ];

  const sidebarInfoLinks = [
    {
      key: "help-center",
      label: sidebarText.helpCenter,
      icon: HelpCircle,
      to: "/help-center",
    },
    {
      key: "developer",
      label: sidebarText.developer,
      icon: Code2,
      to: "/developer",
    },
    {
      key: "faq",
      label: sidebarText.faq,
      icon: CircleHelp,
      to: "/faq",
    },
    {
      key: "user-guide",
      label: sidebarText.userGuide,
      icon: BookOpen,
      to: "/user-guide",
    },
    {
      key: "terms-privacy",
      label: sidebarText.termsPrivacy,
      icon: ShieldCheck,
      to: "/terms-privacy",
    },
  ];

  const protect = (moduleKey, element) => (
    <ProtectedModule currentUser={currentUser} moduleKey={moduleKey}>
      {element}
    </ProtectedModule>
  );

  let appContent;

  const coreSystemReady = accountsLoaded && (!sessionId || employeesLoaded);

  if (!coreSystemReady) {
    appContent = (
      <div className="system-boot-screen" role="status" aria-live="polite">
        <div className="system-boot-loader" aria-hidden="true" />
        <p>Preparing your workspace...</p>
      </div>
    );
  } else if (!currentUser) {
    appContent = (
      <Suspense fallback={<div className="page-loading">Loading...</div>}>
        <Login
          accounts={effectiveAccounts}
          setAccounts={setAccounts}
          onLogin={login}
          company={company}
        />
      </Suspense>
    );
  } else {
    appContent = (
      <div className="app" dir={interfaceLanguage === "en" ? "ltr" : "rtl"}>
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-logo">
              <img src={brandLogo} alt="Afghan Power" />
            </div>

            <div>
              <h2>{systemName}</h2>
              <p>{systemSubtitle}</p>
            </div>

            <Header.Actions currentUser={currentUser} onLogout={logout} compact />
          </div>

          <nav className="menu">

          {!isAdminAccount && (
<>
  <NavLink to="/my-account">
    <CircleUserRound size={17}/>
    <span>{sidebarText.myAccount}</span>
  </NavLink>

</>
)}
          <NavLink to="/messages">
            <MessageCircle size={17} />
            <span>{sidebarText.messages}</span>
          </NavLink>

          {canViewModule(currentUser, "dashboard") && (
              <NavLink to="/">
                <LayoutDashboard size={17} />
                <span>{sidebarText.dashboard}</span>
              </NavLink>
            )}

            {!isAdminAccount &&
              isReceptionAccount &&
              canViewModule(currentUser, "customers") && (
                <NavLink to="/reception">
                  <UserRoundCog size={17} />
                  <span>{sidebarText.reception}</span>
                </NavLink>
              )}

            {!isEmployeeAccount &&
              !isReceptionAccount &&
              canViewModule(currentUser, "customers") && (
                <NavLink to="/customers">
                  <Users size={17} />
                  <span>{sidebarText.customers}</span>
                </NavLink>
              )}

            {!isEmployeeAccount && canViewModule(currentUser, "dashboard") && (
              <NavLink to="/projects">
                <FolderKanban size={17} />
                <span>{sidebarText.projects}</span>
              </NavLink>
            )}

            {!isEmployeeAccount && canViewModule(currentUser, "dashboard") && (
              <NavLink to="/employees">
                <UserRoundCog size={17} />
                <span>{sidebarText.employees}</span>
              </NavLink>
            )}

            {!isEmployeeAccount && canViewModule(currentUser, "dashboard") && (
              <NavLink to="/packages">
                <Package size={17} />
                <span>{sidebarText.packages}</span>
              </NavLink>
            )}

            {!isEmployeeAccount && menuItems
              .filter((item) => item.to !== "/" && canViewModule(currentUser, item.moduleKey))
              .map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.to} to={item.to}>
                    <Icon size={17} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
          </nav>
          <div
            className="sidebar-version-area"
            ref={sidebarInfoRef}
          >
            <div className="sidebar-version-row">
              <span className="sidebar-version-label">
                v0.0.1 • Afghan Power
              </span>

              <button
                type="button"
                className={`sidebar-version-info-btn ${sidebarInfoOpen ? "active" : ""
                  }`}
                onClick={() =>
                  setSidebarInfoOpen((previous) => !previous)
                }
                aria-label="Open information menu"
                aria-expanded={sidebarInfoOpen}
                title="Information"
              >
                <Info size={16} />
              </button>
            </div>

            {sidebarInfoOpen && (
              <div className="sidebar-simple-dropdown">
                {sidebarInfoLinks.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.key}
                      to={item.to}
                      className="sidebar-simple-dropdown-link"
                      onClick={() => setSidebarInfoOpen(false)}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <main className="main">
          <Header company={company} currentUser={currentUser} onLogout={logout} />
          <GlobalTableEnhancer />

          <div className="page-content">
            <Suspense fallback={<div className="page-loading">Loading...</div>}>
              <Routes>
                <Route path="/" element={isEmployeeAccount ? <EmployeeDashboard currentUser={currentUser} /> : protect("dashboard", <Dashboard />)} />
                <Route
                  path="/projects"
                  element={protect("dashboard", <ProjectsHub />)}
                />

                <Route
  path="/reports/customers"
  element={<CustomerReport company={company} />}
/>
            <Route
  path="/reports/projects"
  element={<ProjectReport company={company} />}
/>
            <Route
  path="/reports/employees"
  element={<EmployeeReport company={company} />}
/>
            <Route
  path="/reports/suppliers"
  element={<SupplierReport company={company} />}
/>
<Route
  path="/reports/reception"
  element={<ReceptionReport company={company} />}
/>
<Route
  path="/reports/financial"
  element={<ReportFinancial company={company} />}
/>
                <Route
                  path="/reception"
                  element={protect(
                    "customers",
                    <Reception currentUser={currentUser} />
                  )}
                />
                <Route path="/employees" element={<EmployeesHub />} />
                <Route
                  path="/employees/attendance"
                  element={<EmployeesHub initialSection="attendance" />}
                />
                <Route
                  path="/employees/salaries"
                  element={
                    <ModulePlaceholder
                      title="Employee Salaries"
                      description="Manage fixed and percentage-based employee salaries."
                      items={[
                        "Fixed salaries",
                        "Percentage salaries",
                        "Salary payment history",
                      ]}
                    />
                  }
                />
                <Route
                  path="/employees/:id/performance"
                  element={<EmployeePerformance />}
                />
                <Route path="/employees/:id" element={<EmployeeDetails accounts={accounts} setAccounts={setAccounts} />} />

                <Route
                  path="/office-assets"
                  element={protect("dashboard", <OfficeAssets />)}
                />
                <Route
                  path="/my-account"
                  element={
                    <MyAccount
                      currentUser={currentUser}
                      employee={linkedEmployee}
                      assignedCustomers={
                        myAssignedCustomers
                      }
                    />
                  }
                />

                <Route
                  path="/messages"
                  element={
                    <Messages
                      currentUser={currentUser}
                    />
                  }
                />


                <Route
                  path="/customer-follow-up/:id"
                  element={
                    <CustomerFollowUp
                      currentUser={currentUser}
                    />
                  }
                />

                <Route
                  path="/office-assets/:assetId"
                  element={protect("dashboard", <OfficeAssetDetails />)}
                />

                <Route
                  path="/project-sales"
                  element={protect("dashboard", <ProjectsHub initialSection="sales" />)}
                />
                <Route
                  path="/project-sales-bills"
                  element={protect("dashboard", <ProjectsHub initialSection="bills" />)}
                />
                <Route
                  path="/recycle-bin"
                  element={protect("dashboard", <RecycleBin />)}
                />
                <Route
                  path="/packages"
                  element={protect(
                    "dashboard",
                    <Packages />
                  )}
                />
                <Route
                  path="/packages/visa"
                  element={protect(
                    "dashboard",
                    <Packages initialSection="visa" />
                  )}
                />
                <Route
                  path="/packages/travel"
                  element={protect(
                    "dashboard",
                    <Packages initialSection="travel" />
                  )}
                />
                <Route
                  path="/packages/technology"
                  element={protect(
                    "dashboard",
                    <Packages initialSection="technology" />
                  )}
                />
                <Route
                  path="/packages/media"
                  element={protect(
                    "dashboard",
                    <Packages initialSection="media" />
                  )}
                />

                <Route path="/suppliers" element={protect("suppliers", <Suppliers currentUser={currentUser} />)} />
                <Route path="/suppliers/:id" element={protect("suppliers", <SupplierDetails />)} />

                <Route path="/customers" element={protect("customers", <ConsultantCustomers currentUser={currentUser} />)} />
                <Route path="/customers/consultants" element={protect("customers", <ConsultantCustomers currentUser={currentUser} />)} />
                <Route path="/customers/travel" element={protect("customers", <ConsultantCustomers mode="travel" currentUser={currentUser} />)} />
                <Route path="/customers/technology" element={protect("customers", <ConsultantCustomers mode="technology" currentUser={currentUser} />)} />
                <Route path="/customers/media" element={protect("customers", <ConsultantCustomers mode="media" currentUser={currentUser} />)} />
                <Route path="/customers/:id" element={<Navigate to="/customers/consultants" replace />} />
                <Route path="/finance" element={protect("finance", <Finance />)} />
                <Route path="/reports" element={protect("reports", <Reports />)} />
                <Route path="/agent" element={protect("agent", <Agent />)} />
                <Route
                  path="/user-management"
                  element={protect(
                    "userManagement",
                    <UserManagement
                      accounts={effectiveAccounts}
                      setAccounts={setAccounts}
                      currentUser={currentUser}
                    />
                  )}
                />
                <Route path="/settings" element={protect("settings", <Settings />)} />

                <Route
                  path="/help-center"
                  element={<HelpCenter />}
                />

                <Route
                  path="/developer"
                  element={<Developer />}
                />

                <Route
                  path="/faq"
                  element={<FAQ />}
                />

                <Route
                  path="/user-guide"
                  element={<UserGuide />}
                />

                <Route
                  path="/terms-privacy"
                  element={<TermsPrivacy />}
                />

                <Route
                  path="/accounts"
                  element={protect(
                    "userManagement",
                    <Accounts
                      accounts={accounts}
                      setAccounts={setAccounts}
                      currentUser={currentUser}
                    />
                  )}
                />

                <Route
                  path="*"
                  element={
                    <ModulePlaceholder
                      title="Page Not Found"
                      description="The requested page does not exist in the current ISP system."
                    />
                  }
                />
              </Routes>
            </Suspense>
          </div>
        </main>

        <ToastHost />
      </div>
    );
  }

  return (
    <>
      {appContent}
      {!currentUser && <ToastHost />}
    </>
  );
}

export default App;
