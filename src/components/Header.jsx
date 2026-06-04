import { useState } from "react";
import { Bell, LogOut, Moon, Search, Settings, User, Users } from "lucide-react";
import { Link } from "react-router-dom";

function Header({ currentUser, onLogout }) {
  const [openMenu, setOpenMenu] = useState(null);
  const [darkMode, setDarkMode] = useState(document.body.classList.contains("dark-mode"));

  function toggleDarkMode() {
    setDarkMode(!darkMode);
    document.body.classList.toggle("dark-mode");
  }

  return (
    <header className="topbar">
      <div className="header-search">
        <Search size={17} />
        <input placeholder="جستجو در سیستم..." aria-label="جستجو در سیستم" />
      </div>

      <div className="top-actions">
        <Link className="header-account-link" to="/accounts"><Users size={17} /> اکونت‌ها</Link>

        <div className="header-menu">
          <button className="icon-btn" onClick={() => setOpenMenu(openMenu === "alerts" ? null : "alerts")} aria-label="هشدارها">
            <Bell size={18} />
          </button>
          {openMenu === "alerts" && <div className="dropdown"><strong>هشدارها</strong><p>سفرهای در انتظار و موترهای نیازمند بررسی را مشاهده کنید.</p></div>}
        </div>

        <button className="icon-btn" onClick={toggleDarkMode} aria-label="تغییر حالت نمایش"><Moon size={18} /></button>
        <Link className="icon-btn" to="/settings" aria-label="تنظیمات"><Settings size={18} /></Link>

        <div className="header-menu profile-menu">
          <button className="profile-btn" onClick={() => setOpenMenu(openMenu === "profile" ? null : "profile")} aria-label="پروفایل">
            <User size={18} />
          </button>
          {openMenu === "profile" && (
            <div className="dropdown profile-dropdown">
              <strong>{currentUser?.fullName || currentUser?.email || currentUser?.username}</strong>
              <p>{currentUser?.email || "اکونت قدیمی؛ ایمیل را تنظیم کنید"}</p>
              <button className="dropdown-logout" onClick={onLogout}><LogOut size={15} /> خروج از سیستم</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
