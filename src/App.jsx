import { lazy, Suspense, useEffect, useState } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import Header from "./components/Header";
import ToastHost from "./components/ToastHost";
import { useJsonCollection } from "./hooks/useJsonCollection";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Suppliers = lazy(() => import("./pages/Suppliers"));
const SupplierDetails = lazy(() => import("./pages/SupplierDetails"));
const AssetInventory = lazy(() => import("./pages/AssetInventory"));
const TowerAssets = lazy(() => import("./pages/TowerAssets"));
const Customers = lazy(() => import("./pages/Customers"));
const CustomerDevices = lazy(() => import("./pages/CustomerDevices"));
const Accounts = lazy(() => import("./pages/Accounts"));
const Login = lazy(() => import("./pages/Login"));

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

function App() {
  const [settings, , loadSettings] = useJsonCollection("settings");
  const [accounts, setAccounts, , accountsLoaded] = useJsonCollection("accounts");
  const [sessionId, setSessionId] = useState(() =>
    localStorage.getItem("isp-system-session")
  );

  const company = settings[0] || {};
  const currentUser = accounts.find(
    (account) => String(account.id) === String(sessionId)
  );

  useEffect(() => {
    window.addEventListener("company-settings-updated", loadSettings);
    return () => window.removeEventListener("company-settings-updated", loadSettings);
  }, [loadSettings]);

  const login = (account) => {
    localStorage.setItem("isp-system-session", String(account.id));
    setSessionId(String(account.id));
  };

  const logout = () => {
    localStorage.removeItem("isp-system-session");
    setSessionId(null);
  };

  const menuItems = [
    { to: "/", label: "Dashboard" },
    { to: "/suppliers", label: "Suppliers" },
    { to: "/assets", label: "Asset & Inventory" },
    { to: "/tower-assets", label: "Tower Assets" },
    { to: "/customers", label: "Customers" },
    { to: "/customer-devices", label: "Customer Devices" },
    { to: "/device-transfers", label: "Device Transfers" },
    { to: "/device-history", label: "Device History" },
    { to: "/disconnections", label: "Disconnections" },
    { to: "/security-deposits", label: "Security Deposits" },
    { to: "/employees", label: "Employees" },
  ];

  if (!accountsLoaded) {
    return (
      <>
        <div className="page-loading">Preparing system...</div>
        <ToastHost />
      </>
    );
  }

  if (!currentUser) {
    return (
      <>
        <Suspense fallback={<div className="page-loading">Loading...</div>}>
          <Login
            accounts={accounts}
            setAccounts={setAccounts}
            onLogin={login}
            company={company}
          />
        </Suspense>
        <ToastHost />
      </>
    );
  }

  return (
    <div className="app" dir="ltr">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">
            {company.logo ? (
              <img src={company.logo} alt="Company Logo" />
            ) : (
              (company.companyName || "I").slice(0, 1)
            )}
          </div>

          <div>
            <h2>{company.companyName || "ISP Assets"}</h2>
            <p>Asset & Inventory Management</p>
          </div>
        </div>

        <nav className="menu">
          {menuItems.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button className="logout" onClick={logout}>
          Logout
        </button>
      </aside>

      <main className="main">
        <Header company={company} currentUser={currentUser} onLogout={logout} />

        <div className="page-content">
          <Suspense fallback={<div className="page-loading">Loading...</div>}>
            <Routes>
              <Route path="/" element={<Dashboard />} />

              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/suppliers/:id" element={<SupplierDetails />} />

              <Route path="/assets" element={<AssetInventory />} />

              <Route path="/tower-assets" element={<TowerAssets />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/customer-devices" element={<CustomerDevices />} />

          
              <Route
                path="/device-transfers"
                element={
                  <ModulePlaceholder
                    title="Device Transfer Management"
                    description="Track transfers between main stock, towers, and customers."
                    items={[
                      "Main stock transfer",
                      "Tower transfer",
                      "Customer transfer",
                      "Transfer history",
                    ]}
                  />
                }
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
                element={
                  <Accounts
                    accounts={accounts}
                    setAccounts={setAccounts}
                    currentUser={currentUser}
                  />
                }
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

export default App;