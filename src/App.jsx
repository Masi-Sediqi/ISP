import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import { MessageCircle } from "lucide-react";
import {
  Routes,
  Route,
  Link,
  NavLink,
  useLocation,
} from "react-router-dom";

import {
  Armchair,
  Banknote,
  BookOpen,
  CalendarCheck,
  Bot,
  BriefcaseBusiness,
  Building2,
  Clapperboard,
  CircleHelp,
  Code2,
  Cpu,
  ChevronDown,
  FileBarChart,
  FileText,
  FolderKanban,
  HelpCircle,
  Info,
  LayoutDashboard,
  Plane,
  Package,
  ReceiptText,
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
import { useJsonCollection } from "./hooks/useJsonCollection";
import { canViewModule } from "./utils/permissions";
import { notify } from "./utils/notify";
import ReportFinancial from "./pages/ReportFinancial";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const MyAccount = lazy(() =>
  import("./pages/MyAccount")
);
const Suppliers = lazy(() => import("./pages/Suppliers"));
const SupplierDetails = lazy(() => import("./pages/SupplierDetails"));
const Customers = lazy(() => import("./pages/Customers"));
const ConsultantCustomers = lazy(() => import("./pages/ConsultantCustomers"));
const CustomerDetails = lazy(() => import("./pages/CustomerDetails"));
const Accounts = lazy(() => import("./pages/Accounts"));
const Finance = lazy(() => import("./pages/Finance"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const Agent = lazy(() => import("./pages/Agent"));
const Employees = lazy(() => import("./pages/Employees"));
const EmployeeDetails = lazy(() => import("./pages/EmployeeDetails"));
const EmployeeDashboard = lazy(() => import("./pages/EmployeeDashboard"));
const EmployeeAttendance = lazy(() => import("./pages/EmployeeAttendance"));
import ProjectReport from "./pages/ProjectReport";
import EmployeeReport from "./pages/EmployeeReport";
import SupplierReport from "./pages/SupplierReport";
import ReceptionReport from "./pages/ReceptionReport";
const OfficeAssets = lazy(() => import("./pages/OfficeAssets"));
const OfficeAssetDetails = lazy(() => import("./pages/OfficeAssetDetails"));

const Projects = lazy(() => import("./pages/Projects"));
const ProjectLicense = lazy(() => import("./pages/ProjectLicense"));
const ProjectSales = lazy(() => import("./pages/ProjectSales"));
const Login = lazy(() => import("./pages/Login"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const Developer = lazy(() => import("./pages/Developer"));

import CustomerReport from "./pages/CustomerReport";
const TermsPrivacy = lazy(
  () => import("./pages/TermsPrivacy")
);
const FAQ = lazy(() =>
  import("./pages/FAQ")
);
const Reception = lazy(() => import("./pages/Reception"));
const CustomerFollowUp = lazy(() => import("./pages/CustomerFollowUp"));
const VisaPackages = lazy(() => import("./pages/VisaPackages"));
const TravelPackages = lazy(() => import("./pages/TravelPackages"));
const TechnologyPackages = lazy(() => import("./pages/TechnologyPackages"));
const MediaPackages = lazy(() => import("./pages/MediaPackages"));


const UserGuide = lazy(() => import("./pages/UserGuide"));

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
  const [employees] =
    useJsonCollection("employees");
    const [
      customers,
      ,
      loadCustomers,
      customersLoaded,
    ] = useJsonCollection("customers");
  
  const [sidebarInfoOpen, setSidebarInfoOpen] = useState(false);
  const [customerMenuOpen, setCustomerMenuOpen] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [employeeMenuOpen, setEmployeeMenuOpen] = useState(false);
  const [packageMenuOpen, setPackageMenuOpen] = useState(false);
  const sidebarInfoRef = useRef(null);

  const assignmentAlertReadyRef =
    useRef(false);

  const assignmentSoundRef =
    useRef(null);

  const [sessionId, setSessionId] = useState(() =>
    localStorage.getItem("isp-system-session")
  );

  const company = settings[0] || {};
  const systemName = company.companyName || "ISP Smart";
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

  const employeeHasAdminRole =
    linkedEmployeeRoles.some((role) => {
      const normalizedRole = String(role || "")
        .trim()
        .toLowerCase();

      return (
        normalizedRole === "admin" ||
        normalizedRole === "full admin" ||
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

  const isEmployeeAccount =
    currentUser?.accountType === "employee" &&
    !isAdminAccount &&
    !isReceptionAccount;

  /*
   * Refresh the customer collection while the app is open.
   * This makes newly assigned requests appear without a
   * manual browser refresh.
   */
  useEffect(() => {
    if (!currentUser || !customersLoaded) {
      return undefined;
    }

    let refreshing = false;

    const refreshAssignments = async () => {
      if (refreshing) return;

      refreshing = true;

      try {
        await loadCustomers();
      } finally {
        refreshing = false;
      }
    };

    const intervalId = window.setInterval(
      refreshAssignments,
      1500
    );

    const reloadFromSystemEvent = () => {
      refreshAssignments();
    };

    window.addEventListener(
      "isp-customer-assignment-updated",
      reloadFromSystemEvent
    );

    return () => {
      window.clearInterval(intervalId);

      window.removeEventListener(
        "isp-customer-assignment-updated",
        reloadFromSystemEvent
      );
    };
  }, [
    currentUser?.id,
    customersLoaded,
    loadCustomers,
  ]);

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
        "info"
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
      "/reception",
      "/my-account",
    ];

    if (
      isReceptionAccount &&
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
    { to: "/", label: "Dashboard", moduleKey: "dashboard", icon: LayoutDashboard },
    {
      to: "/reception",
      label: "Reception",
      moduleKey: "customers",
      icon: UserRoundCog,
    },
    { to: "/suppliers", label: "Suppliers", moduleKey: "suppliers", icon: Building2 },
    { to: "/finance", label: "Finances", moduleKey: "finance", icon: WalletCards },
    { to: "/reports", label: "Reports", moduleKey: "reports", icon: FileBarChart },
    { to: "/settings", label: "Settings", moduleKey: "settings", icon: SettingsIcon },
    { to: "/agent", label: "AI Agent", moduleKey: "agent", icon: Bot },
    { to: "/recycle-bin", label: "Recycle Bin", moduleKey: "dashboard", icon: Trash2 },
    { to: "/office-assets", label: "Assets", moduleKey: "dashboard", icon: Armchair, }
  ];

  const customerMenuItems = [
    { to: "/customers/consultants", label: "Consultant Customers", icon: BriefcaseBusiness },
    { to: "/customers/travel", label: "Travel Customers", icon: Plane },
    { to: "/customers/technology", label: "Technology Customers", icon: Cpu },
    { to: "/customers/media", label: "Media Customers", icon: Clapperboard },

  ];

  const projectMenuItems = [
    { to: "/projects", label: "Projects", icon: FolderKanban },
    { to: "/project-sales", label: "Project Sales", icon: ReceiptText },
    { to: "/project-license", label: "Project License", icon: FileText },
  ];

  const employeeMenuItems = [
    { to: "/employees", label: "All Employees", icon: Users },
    { to: "/employees/attendance", label: "Employee Attendance", icon: CalendarCheck },
  ];

  const packageMenuItems = [
    {
      to: "/packages/visa",
      label: "Visa Package",
      icon: FileText,
    },
    {
      to: "/packages/travel",
      label: "Travel Package",
      icon: Plane,
    },
    {
      to: "/packages/technology",
      label: "Technology Package",
      icon: Cpu,
    },
    {
      to: "/packages/media",
      label: "Media Package",
      icon: Clapperboard,
    },
  ];

  const sidebarInfoLinks = [
    {
      key: "help-center",
      label: "Help Center",
      icon: HelpCircle,
      to: "/help-center",
    },
    {
      key: "developer",
      label: "Developer",
      icon: Code2,
      to: "/developer",
    },
    {
      key: "faq",
      label: "FAQ",
      icon: CircleHelp,
      to: "/faq",
    },
    {
      key: "user-guide",
      label: "User Guide",
      icon: BookOpen,
      to: "/user-guide",
    },
    {
      key: "terms-privacy",
      label: "Terms & Privacy",
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

  if (!accountsLoaded) {
    appContent = <div className="page-loading">Preparing system...</div>;
  } else if (!currentUser) {
    appContent = (
      <Suspense fallback={<div className="page-loading">Loading...</div>}>
        <Login
          accounts={accounts}
          setAccounts={setAccounts}
          onLogin={login}
          company={company}
        />
      </Suspense>
    );
  } else {
    appContent = (
      <div className="app" dir="ltr">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-logo">
              {company.logo ? (
                <img src={company.logo} alt="Company Logo" />
              ) : (
                systemName.slice(0, 1)
              )}
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
    <span>My Account</span>
  </NavLink>

</>
)}
          {!isReceptionAccount && (
              <NavLink to="/">
                <LayoutDashboard size={17} />
                <span>Dashboard</span>
              </NavLink>
            )}

            {!isEmployeeAccount &&
              !isReceptionAccount &&
              canViewModule(currentUser, "customers") && (
                <div className={`sidebar-customer-menu ${customerMenuOpen ? "open" : ""}`}>
                  <button
                    type="button"
                    className="sidebar-customer-trigger"
                    onClick={() => setCustomerMenuOpen((open) => !open)}
                    aria-expanded={customerMenuOpen}
                  >
                    <span className="sidebar-menu-label">
                      <Users size={17} />
                      <span>Customers</span>
                    </span>
                    <ChevronDown className="sidebar-menu-chevron" size={15} />
                  </button>

                  {customerMenuOpen && (
                    <div className="sidebar-customer-submenu">
                      {customerMenuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.to}
                            to={item.to}
                            className={`${location.pathname}${location.search}` === item.to ? "active" : ""}
                          >
                            <Icon size={14} />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            {!isEmployeeAccount && canViewModule(currentUser, "dashboard") && (
              <div className={`sidebar-customer-menu ${projectMenuOpen ? "open" : ""}`}>
                <button
                  type="button"
                  className="sidebar-customer-trigger"
                  onClick={() => setProjectMenuOpen((open) => !open)}
                  aria-expanded={projectMenuOpen}
                >
                  <span className="sidebar-menu-label">
                    <FolderKanban size={17} />
                    <span>Projects</span>
                  </span>
                  <ChevronDown className="sidebar-menu-chevron" size={15} />
                </button>

                {projectMenuOpen && (
                  <div className="sidebar-customer-submenu">
                    {projectMenuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={location.pathname === item.to ? "active" : ""}
                        >
                          <Icon size={14} />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {!isEmployeeAccount && canViewModule(currentUser, "dashboard") && (
              <div className={`sidebar-customer-menu ${employeeMenuOpen ? "open" : ""}`}>
                <button
                  type="button"
                  className="sidebar-customer-trigger"
                  onClick={() => setEmployeeMenuOpen((open) => !open)}
                  aria-expanded={employeeMenuOpen}
                >
                  <span className="sidebar-menu-label">
                    <UserRoundCog size={17} />
                    <span>Employees</span>
                  </span>

                  <ChevronDown
                    className="sidebar-menu-chevron"
                    size={15}
                  />
                </button>

                {employeeMenuOpen && (
                  <div className="sidebar-customer-submenu">
                    {employeeMenuItems.map((item) => {
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={
                            location.pathname === item.to
                              ? "active"
                              : ""
                          }
                          onClick={() => setEmployeeMenuOpen(false)}
                        >
                          <Icon size={14} />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {!isEmployeeAccount && canViewModule(currentUser, "dashboard") && (
              <div className={`sidebar-customer-menu ${packageMenuOpen ? "open" : ""}`}>
                <button
                  type="button"
                  className="sidebar-customer-trigger"
                  onClick={() => setPackageMenuOpen((open) => !open)}
                  aria-expanded={packageMenuOpen}
                >
                  <span className="sidebar-menu-label">
                    <Package size={17} />
                    <span>Packages</span>
                  </span>

                  <ChevronDown
                    className="sidebar-menu-chevron"
                    size={15}
                  />
                </button>

                {packageMenuOpen && (
                  <div className="sidebar-customer-submenu">
                    {packageMenuItems.map((item) => {
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={
                            location.pathname === item.to
                              ? "active"
                              : ""
                          }
                          onClick={() => setPackageMenuOpen(false)}
                        >
                          <Icon size={14} />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
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
                v0.0.1 • ISP Smart
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
                  element={protect("dashboard", <Projects />)}
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
                <Route path="/employees" element={<Employees />} />
                <Route
                  path="/employees/attendance"
                  element={<EmployeeAttendance />}
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
                  path="/project-license"
                  element={protect("dashboard", <ProjectLicense />)}
                />
                <Route
                  path="/project-sales"
                  element={protect("dashboard", <ProjectSales />)}
                />
                <Route
                  path="/recycle-bin"
                  element={<ModulePlaceholder title="Recycle Bin" description="Review recently removed records and restore them when needed." items={["Deleted records", "Restore items", "Permanent cleanup"]} />}
                />
                <Route
                  path="/packages/visa"
                  element={protect(
                    "dashboard",
                    <VisaPackages />
                  )}
                />
                <Route
                  path="/packages/travel"
                  element={protect(
                    "dashboard",
                    <TravelPackages />
                  )}
                />
                <Route
                  path="/packages/technology"
                  element={protect(
                    "dashboard",
                    <TechnologyPackages />
                  )}
                />
                <Route
                  path="/packages/media"
                  element={protect(
                    "dashboard",
                    <MediaPackages />
                  )}
                />

                <Route path="/suppliers" element={protect("suppliers", <Suppliers currentUser={currentUser} />)} />
                <Route path="/suppliers/:id" element={protect("suppliers", <SupplierDetails />)} />

                <Route path="/customers" element={protect("customers", <Customers />)} />
                <Route path="/customers/consultants" element={protect("customers", <ConsultantCustomers />)} />
                <Route path="/customers/travel" element={protect("customers", <ConsultantCustomers mode="travel" />)} />
                <Route path="/customers/technology" element={protect("customers", <ConsultantCustomers mode="technology" />)} />
                <Route path="/customers/media" element={protect("customers", <ConsultantCustomers mode="media" />)} />
                <Route path="/customers/:id" element={protect("customers", <CustomerDetails />)} />
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