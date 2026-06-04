import { lazy, Suspense, useEffect, useState } from "react";
import { Routes, Route, NavLink, useNavigate } from "react-router-dom";
import Header from "./components/Header";
import ToastHost from "./components/ToastHost";
import { useJsonCollection } from "./hooks/useJsonCollection";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Cars = lazy(() => import("./pages/Cars"));
const CarDetails = lazy(() => import("./pages/CarDetails"));
const Travels = lazy(() => import("./pages/Travels"));
const TravelDetails = lazy(() => import("./pages/TravelDetails"));
const DestinationDetails = lazy(() => import("./pages/DestinationDetails"));
const Drivers = lazy(() => import("./pages/Drivers"));
const Customers = lazy(() => import("./pages/Customers"));
const CustomerDetails = lazy(() => import("./pages/CustomerDetails"));
const CustomerReceipt = lazy(() => import("./pages/CustomerReceipt"));
const CustomerStatement = lazy(() => import("./pages/CustomerStatement"));
const Finance = lazy(() => import("./pages/Finance"));
const Reports = lazy(() => import("./pages/Reports"));
const TravelReport = lazy(() => import("./pages/TravelReport"));
const CarReport = lazy(() => import("./pages/CarReport"));
const CustomerReport = lazy(() => import("./pages/CustomerReport"));
const FinancialReport = lazy(() => import("./pages/FinancialReport"));
const FinancialStatement = lazy(() => import("./pages/FinancialStatement"));
const Settings = lazy(() => import("./pages/Settings"));
const Accounts = lazy(() => import("./pages/Accounts"));
const Login = lazy(() => import("./pages/Login"));

function App() {
  const navigate = useNavigate();
  const [settings, , loadSettings] = useJsonCollection("settings");
  const [accounts, setAccounts, , accountsLoaded] = useJsonCollection("accounts");
  const [sessionId, setSessionId] = useState(() => localStorage.getItem("travel-system-session"));
  const company = settings[0] || {};
  const currentUser = accounts.find((account) => String(account.id) === String(sessionId));

  useEffect(() => {
    window.addEventListener("company-settings-updated", loadSettings);
    return () => window.removeEventListener("company-settings-updated", loadSettings);
  }, [loadSettings]);

  const login = (account) => {
    localStorage.setItem("travel-system-session", String(account.id));
    setSessionId(String(account.id));
    navigate("/");
  };

  const logout = () => {
    localStorage.removeItem("travel-system-session");
    setSessionId(null);
  };

  if (!accountsLoaded) return <div className="page-loading">در حال آماده‌سازی سیستم...</div>;
  if (!currentUser) return <Suspense fallback={<div className="page-loading">در حال بارگذاری...</div>}><Login accounts={accounts} setAccounts={setAccounts} onLogin={login} company={company} /></Suspense>;

  return (
    <div className="app" dir="rtl">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">{company.logo ? <img src={company.logo} alt="لوگوی شرکت" /> : (company.companyName || "T").slice(0, 1)}</div>
          <div><h2>{company.companyName || "ترانسپورت"}</h2><p>مدیریت سفر و حمل و نقل</p></div>
        </div>
        <nav className="menu">
          <NavLink to="/">داشبورد</NavLink>
          <NavLink to="/cars">موترها</NavLink>
          <NavLink to="/travels">مقصدها و سفرها</NavLink>
          <NavLink to="/drivers">رانندگان</NavLink>
          <NavLink to="/customers">مشتری‌ها</NavLink>
          <NavLink to="/finance">عواید و مصارف</NavLink>
          <NavLink to="/reports">راپورها</NavLink>
          <NavLink to="/settings">تنظیمات</NavLink>
        </nav>
        <button className="logout" onClick={logout}>خروج از سیستم</button>
      </aside>

      <main className="main">
        <Header company={company} currentUser={currentUser} onLogout={logout} />
        <div className="page-content">
          <Suspense fallback={<div className="page-loading">در حال بارگذاری...</div>}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/cars" element={<Cars />} />
              <Route path="/cars/:id" element={<CarDetails />} />
              <Route path="/travels" element={<Travels />} />
              <Route path="/travels/:id" element={<TravelDetails />} />
              <Route path="/destinations/:name" element={<DestinationDetails />} />
              <Route path="/drivers" element={<Drivers />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/customers/:id" element={<CustomerDetails />} />
              <Route path="/customers/:id/print/:type/:recordId" element={<CustomerReceipt />} />
              <Route path="/customers/:id/statement" element={<CustomerStatement />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/reports/travels" element={<TravelReport />} />
              <Route path="/reports/cars" element={<CarReport />} />
              <Route path="/reports/customers" element={<CustomerReport />} />
              <Route path="/reports/finance" element={<FinancialReport />} />
              <Route path="/reports/finance/statement" element={<FinancialStatement />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/accounts" element={<Accounts accounts={accounts} setAccounts={setAccounts} currentUser={currentUser} />} />
            </Routes>
          </Suspense>
        </div>
      </main>
      <ToastHost />
    </div>
  );
}

export default App;
