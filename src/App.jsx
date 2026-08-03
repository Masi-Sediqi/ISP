import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Routes,
  Route,
  Link,
  NavLink,
  useLocation,
} from "react-router-dom";

import {
  Armchair,
  BookOpen,
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
  ReceiptText,
  Settings as SettingsIcon,
  ShieldCheck,
  Trash2,
  Users,
  UserRoundCog,
  WalletCards,
} from "lucide-react";
import Header from "./components/Header";
import GlobalTableEnhancer from "./components/GlobalTableEnhancer";
import StartupSplash from "./components/StartupSplash";
import ToastHost from "./components/ToastHost";
import { useJsonCollection } from "./hooks/useJsonCollection";
import { canViewModule } from "./utils/permissions";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Suppliers = lazy(() => import("./pages/Suppliers"));
const SupplierDetails = lazy(() => import("./pages/SupplierDetails"));
const SupplierAnalysis = lazy(() => import("./pages/SupplierAnalysis"));
const AssetInventory = lazy(() => import("./pages/AssetInventory"));
const MainStock = lazy(() => import("./pages/MainStock"));
const DeviceTransferManagement = lazy(() => import("./pages/DeviceTransferManagement"));
const TowerAssets = lazy(() => import("./pages/TowerAssets"));
const Customers = lazy(() => import("./pages/Customers"));
const ConsultantCustomers = lazy(() => import("./pages/ConsultantCustomers"));
const CustomerDetails = lazy(() => import("./pages/CustomerDetails"));
const Packages = lazy(() => import("./pages/Packages"));
const PackageFullDetail = lazy(() => import("./pages/PackageFullDetail"));
const Accounts = lazy(() => import("./pages/Accounts"));
const Finance = lazy(() => import("./pages/Finance"));
const Reports = lazy(() => import("./pages/Reports"));
const Repair = lazy(() => import("./pages/Repair"));
const Settings = lazy(() => import("./pages/Settings"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const Agent = lazy(() => import("./pages/Agent"));
const Employees = lazy(() => import("./pages/Employees"));
const EmployeeDetails = lazy(() => import("./pages/EmployeeDetails"));
const EmployeeDashboard = lazy(() => import("./pages/EmployeeDashboard"));

const OfficeAssets = lazy(() => import("./pages/OfficeAssets"));
const OfficeAssetDetails = lazy(() =>
  import("./pages/OfficeAssetDetails")
);

const Projects = lazy(() => import("./pages/Projects"));
const ProjectLicense = lazy(() => import("./pages/ProjectLicense"));
const ProjectSales = lazy(() => import("./pages/ProjectSales"));
const Login = lazy(() => import("./pages/Login"));
const AssetFullInformation = lazy(() => import("./pages/AssetFullInformation"));
const AssetAuditTrail = lazy(() => import("./pages/AssetAuditTrail"));
const AssetInsightDetails = lazy(() => import("./pages/AssetInsightDetails"));
const TowerLinks = lazy(() => import("./pages/TowerLinks"));
const CustomerIssueDevice = lazy(() => import("./pages/CustomerIssueDevice"));
const TowerAssetDetails = lazy(() => import("./pages/TowerAssetDetails"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const Developer = lazy(() => import("./pages/Developer"));
const TermsPrivacy = lazy(
  () => import("./pages/TermsPrivacy")
);
const FAQ = lazy(() =>
  import("./pages/FAQ")
);
const Reception = lazy(() => import("./pages/Reception"));


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
  const [sidebarInfoOpen, setSidebarInfoOpen] = useState(false);
  const [customerMenuOpen, setCustomerMenuOpen] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const sidebarInfoRef = useRef(null);
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

/*
 * فقط کارمند عادی باید EmployeeDashboard را ببیند.
 * Admin و Full Admin وارد داشبورد عمومی سیستم می‌شوند.
 */
const isEmployeeAccount =
  currentUser?.accountType === "employee" &&
  !isAdminAccount;

  useEffect(() => {
    if (isEmployeeAccount && location.pathname !== "/") {
      window.location.hash = "#/";
    }
  }, [isEmployeeAccount, location.pathname]);

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
    { to: "/employees", label: "Employees", moduleKey: "dashboard", icon: UserRoundCog },
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
    { to: "/customers?type=media", label: "Media Customers", icon: Clapperboard },

  ];

  const projectMenuItems = [
    { to: "/projects", label: "Projects", icon: FolderKanban },
    { to: "/project-sales", label: "Project Sales", icon: ReceiptText },
    { to: "/project-license", label: "Project License", icon: FileText },
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
            <NavLink to="/">
              <LayoutDashboard size={17} />
              <span>Dashboard</span>
            </NavLink>

            {!isEmployeeAccount && canViewModule(currentUser, "customers") && (
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
                  path="/reception"
                  element={protect(
                    "customers",
                    <Reception currentUser={currentUser} />
                  )}
                />
                <Route path="/employees" element={<Employees />} />
                <Route path="/employees/:id" element={<EmployeeDetails accounts={accounts} setAccounts={setAccounts} />} />

                <Route
                  path="/office-assets"
                  element={protect("dashboard", <OfficeAssets />)}
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

                <Route path="/suppliers" element={protect("suppliers", <Suppliers currentUser={currentUser} />)} />
                <Route path="/suppliers/:id/analysis" element={protect("suppliers", <SupplierAnalysis />)} />
                <Route path="/suppliers/:id" element={protect("suppliers", <SupplierDetails />)} />

                <Route path="/assets" element={protect("assets", <AssetInventory />)} />
                <Route path="/assets/:assetId/audit-trail" element={protect("assets", <AssetAuditTrail />)} />
                <Route path="/assets/:assetId/audit-trail/*" element={protect("assets", <AssetAuditTrail />)} />
                <Route path="/assets/:assetId/details/audit-trail" element={protect("assets", <AssetAuditTrail />)} />
                <Route path="/main-stock" element={protect("mainStock", <MainStock />)} />
                <Route path="/device-transfer-management" element={protect("deviceTransfer", <DeviceTransferManagement />)} />

                <Route path="/customers" element={protect("customers", <Customers />)} />
                <Route path="/customers/consultants" element={protect("customers", <ConsultantCustomers />)} />
                <Route path="/customers/travel" element={protect("customers", <ConsultantCustomers mode="travel" />)} />
                <Route path="/customers/technology" element={protect("customers", <ConsultantCustomers mode="technology" />)} />
                <Route path="/customers/:id" element={protect("customers", <CustomerDetails />)} />

                <Route path="/tower-assets" element={protect("towerAssets", <TowerAssets />)} />
                <Route path="/tower-links" element={protect("towerAssets", <TowerLinks />)} />
                <Route path="/finance" element={protect("finance", <Finance />)} />
                <Route path="/reports" element={protect("reports", <Reports />)} />
                <Route path="/repair" element={protect("repair", <Repair />)} />
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

                <Route path="/packages" element={protect("packages", <Packages />)} />
                <Route path="/packages/:packageId/details" element={protect("packages", <PackageFullDetail />)} />
                <Route path="/customers/:id/issue-device" element={protect("customers", <CustomerIssueDevice />)} />
                <Route path="/customers/:id/issue-device/:viewMode" element={protect("customers", <CustomerIssueDevice />)} />
                <Route
                  path="/tower-assets/:towerId/details"
                  element={protect("towerAssets", <TowerAssetDetails />)}
                />
                <Route
                  path="/assets/:assetId/details"
                  element={protect("assets", <AssetFullInformation />)}
                />
                <Route
                  path="/assets/:assetId/details/insights/:insightType"
                  element={protect("assets", <AssetInsightDetails />)}
                />
                <Route
                  path="/device-history"
                  element={
                    <ModulePlaceholder
                      title="Device History & Audit Trail"
                      description="Search any device by MAC address, serial number, or asset ID."
                      items={[
                        "Purchase history",
                        "Stock entry",
                        "Tower assignment",
                        "Customer assignment",
                        "Return to stock",
                        "Current status",
                      ]}
                    />
                  }
                />

                <Route
                  path="/disconnections"
                  element={
                    <ModulePlaceholder
                      title="Customer Disconnection Management"
                      description="Manage inactive customers and device recovery status."
                      items={[
                        "Inactive customers",
                        "Collected devices",
                        "Pending collection",
                        "Recovery status",
                      ]}
                    />
                  }
                />

                <Route
                  path="/security-deposits"
                  element={
                    <ModulePlaceholder
                      title="Security Deposit Management"
                      description="Manage deposits, refunds, held balances, and outstanding amounts."
                      items={[
                        "Deposit amount",
                        "Refund status",
                        "Held balance",
                        "Outstanding balance",
                      ]}
                    />
                  }
                />

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
                  path="/employees"
                  element={
                    <ModulePlaceholder
                      title="Employees"
                      description="Employee management module will be added later."
                      items={["Employee records", "Roles", "Permissions"]}
                    />
                  }
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
      <StartupSplash />
      {appContent}
      {!currentUser && <ToastHost />}
    </>
  );
}

export default App;
