import { lazy, Suspense } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import Header from "./components/Header";
import ToastHost from "./components/ToastHost";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Cars = lazy(() => import("./pages/Cars"));
const CarDetails = lazy(() => import("./pages/CarDetails"));
const Travels = lazy(() => import("./pages/Travels"));
const TravelDetails = lazy(() => import("./pages/TravelDetails"));
const Drivers = lazy(() => import("./pages/Drivers"));
const Customers = lazy(() => import("./pages/Customers"));
const CustomerDetails = lazy(() => import("./pages/CustomerDetails"));
const Finance = lazy(() => import("./pages/Finance"));
const Reports = lazy(() => import("./pages/Reports"));
const TravelReport = lazy(() => import("./pages/TravelReport"));

function App() {
  return (
    <div className="app" dir="rtl">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">T</div>
          <div style={{ fontFamily: "'Vazirmatn', sans-serif" }}>
            <h2>ترانسپورت</h2>
            <p>مدیریت حمل و نقل</p>
          </div>
        </div>

        <nav className="menu">
          <NavLink to="/">داشبورد</NavLink>
          <NavLink to="/cars">موترها</NavLink>
          <NavLink to="/travels">مقصدها و سفرها</NavLink>
          <NavLink to="/drivers">رانندگان</NavLink>
          <NavLink to="/customers">مشتری‌ها</NavLink>
          <NavLink to="/finance">عواید و مصارف</NavLink>
          <NavLink to="/reports">گزارشات</NavLink>
          <a>تنظیمات</a>
        </nav>

        <button className="logout">خروج از سیستم</button>
      </aside>

      <main className="main">
        <Header />
        <Suspense fallback={<div className="page-loading">در حال بارگذاری...</div>}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cars" element={<Cars />} />
            <Route path="/cars/:id" element={<CarDetails />} />
            <Route path="/travels" element={<Travels />} />
            <Route path="/travels/:id" element={<TravelDetails />} />
            <Route path="/drivers" element={<Drivers />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetails />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/reports/travels" element={<TravelReport />} />
          </Routes>
        </Suspense>
      </main>
      <ToastHost />
    </div>
  );
}

export default App;
