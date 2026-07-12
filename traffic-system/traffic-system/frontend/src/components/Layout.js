import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";

const navItems = [
  { label: "Dashboard",  path: "/dashboard" },
  { label: "AIR",        path: "/accidents" },
  { label: "TOR",        path: "/tor" },
  { label: "Reports",    path: "/reports"  },
  { label: "Duty Roster",path: "/duty-roster"  },
  { label: "Analytics",  path: "/analytics"  },
];

function Layout({ children }) {
  const location = useLocation();
  const navigate  = useNavigate();

  const officer = JSON.parse(localStorage.getItem("officer") || "{}");
  const role    = localStorage.getItem("userRole") || "Traffic Officer";
  const name    = officer.name || "PS Perera";
  const initial = name.charAt(0).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("officer");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  return (
    <div className="pro-layout">

      {/* ── SIDEBAR ── */}
      <aside className="pro-sidebar">

        {/* Brand */}
        <div className="pro-brand">
          <div className="pro-brand-icon">
            <img
              src="https://images.seeklogo.com/logo-png/37/1/sri-lanka-police-logo-png_seeklogo-374521.png"
              alt="SLP"
              style={{ width: 32, height: 32, objectFit: "contain" }}
            />
          </div>
          <div>
            <p className="pro-brand-name">SLP Portal</p>
            <p className="pro-brand-sub">Traffic Branch</p>
          </div>
        </div>

        {/* Nav label */}
        <p className="pro-nav-label">MAIN MENU</p>

        {/* Nav links */}
        <nav className="pro-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`pro-nav-link ${location.pathname === item.path ? "pro-nav-active" : ""}`}
            >
              <span className="pro-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Settings */}
        <div className="pro-sidebar-mid">
          <Link
            to="/settings"
            className={`pro-nav-link ${location.pathname === "/settings" ? "pro-nav-active" : ""}`}
          >
            <span className="pro-nav-icon"> </span>
            <span>Settings</span>
          </Link>
          <Link
            to="/notifications"
            className={`pro-nav-link ${location.pathname === "/notifications" ? "pro-nav-active" : ""}`}
          >
            <span className="pro-nav-icon"></span>
            <span>Notifications</span>
          </Link>
        </div>

        {/* Officer profile */}
        <div className="pro-officer-box">
          <div className="pro-officer-avatar">{initial}</div>
          <div className="pro-officer-info">
            <p className="pro-officer-name">{name}</p>
            <p className="pro-officer-role">◉ {role}</p>
          </div>
        </div>

        {/* Sign Out */}
        <div className="signout-container"></div>
<button className="pro-signout-btn" onClick={handleLogout}>
  <span className="signout-icon"></span>
  <FiLogOut className="signout-icon" />
  <span>Sign Out</span>
</button>

      </aside>

      {/* ── MAIN ── */}
      <main className="pro-main">

        {/* Top bar */}
        <div className="pro-topbar">
          <div className="pro-topbar-brand">
            <img
              src="https://images.seeklogo.com/logo-png/37/1/sri-lanka-police-logo-png_seeklogo-374521.png"
              alt="SLP"
              className="pro-topbar-logo"
            />
            <div>
              <p className="pro-topbar-title">Sri Lanka Police</p>
              <p className="pro-topbar-sub">Traffic Branch – Negombo</p>
            </div>
          </div>
          <div className="pro-topbar-right">
             
            <div className="pro-topbar-officer">
              <div className="pro-topbar-avatar">{initial}</div>
              <div>
                <p className="pro-topbar-name">{name}</p>
                <p className="pro-topbar-role">{role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pro-content">
          {children}
        </div>

      </main>
    </div>
  );
}

export default Layout;