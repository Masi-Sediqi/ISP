import { useState } from "react";
import { Bell, Settings, User, Moon } from "lucide-react";

function Header() {
  const [openMenu, setOpenMenu] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  function toggleDarkMode() {
    setDarkMode(!darkMode);
    document.body.classList.toggle("dark-mode");
  }

  return (
    <header className="topbar">
      <div className="header-title">
        <h1>داشبورد عمومی</h1>
        <p>تحلیل وضعیت سیستم مدیریت حمل و نقل</p>
      </div>

      <div className="top-actions">
        <input className="search-input" placeholder="جستجو..." />

        <div className="header-menu">
          <button className="icon-btn" onClick={() => setOpenMenu(openMenu === "alerts" ? null : "alerts")}>
            <Bell size={18} />
          </button>

          {openMenu === "alerts" && (
            <div className="dropdown">
              <strong>هشدارها</strong>
              <p>3 سفر در انتظار تایید است</p>
              <p>1 موتر نیاز به ترمیم دارد</p>
            </div>
          )}
        </div>

        <button className="icon-btn" onClick={toggleDarkMode}>
          <Moon size={18} />
        </button>

        <div className="header-menu">
          <button className="icon-btn" onClick={() => setOpenMenu(openMenu === "settings" ? null : "settings")}>
            <Settings size={18} />
          </button>

          {openMenu === "settings" && (
            <div className="dropdown">
              <strong>تنظیمات</strong>
              <p>تنظیمات سیستم</p>
              <p>مدیریت کاربران</p>
            </div>
          )}
        </div>

        <div className="header-menu profile-menu">
          <button className="profile-btn" onClick={() => setOpenMenu(openMenu === "profile" ? null : "profile")}>
            <User size={18} />
          </button>

          {openMenu === "profile" && (
            <div className="dropdown profile-dropdown">
              <strong>هارون رشید</strong>
              <p>مدیر سیستم</p>
              <p>ویرایش پروفایل</p>
              <p>خروج از سیستم</p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
