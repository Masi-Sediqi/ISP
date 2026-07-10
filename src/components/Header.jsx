import { useState } from "react";
import { Bell, LogOut, Moon, Search, Settings, User, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useJsonCollection } from "../hooks/useJsonCollection";

function Header({ currentUser, onLogout }) {
  const [openMenu, setOpenMenu] = useState(null);
  const [darkMode, setDarkMode] = useState(
    document.body.classList.contains("dark-mode")
  );

  const [assets] = useJsonCollection("assets");
  const [towerAssets] = useJsonCollection("towerAssets");
  const [securityDeposits] = useJsonCollection("securityDeposits");

  const damagedOrLostAssets = assets.filter((asset) =>
    ["Damaged", "Lost"].includes(asset.status)
  );

  const pendingTowerAssets = towerAssets.filter(
    (item) => item.installationStatus === "Pending"
  );

  const outstandingDeposits = securityDeposits.filter((item) =>
    ["Outstanding", "Held"].includes(item.status)
  );

  const alertCount =
    damagedOrLostAssets.length + pendingTowerAssets.length + outstandingDeposits.length;

  function toggleDarkMode() {
    setDarkMode(!darkMode);
    document.body.classList.toggle("dark-mode");
  }

  return (
    <header className="topbar">
      <div className="header-search">
        <Search size={17} />
        <input placeholder="Search system..." aria-label="Search system" />
      </div>

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
            <div className="dropdown alert-dropdown">
              <strong>Alerts</strong>
              <p>Total alerts: {alertCount}</p>

              <ul>
                <li>Damaged / lost assets: {damagedOrLostAssets.length}</li>
                <li>Pending tower installations: {pendingTowerAssets.length}</li>
                <li>Outstanding deposits: {outstandingDeposits.length}</li>
              </ul>
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

        <Link className="icon-btn" to="/settings" aria-label="Settings">
          <Settings size={18} />
        </Link>

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
    </header>
  );
}

export default Header;