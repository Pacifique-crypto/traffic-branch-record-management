import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiGrid, FiAlertTriangle, FiAlertCircle, FiDollarSign,
  FiFileText, FiCalendar, FiBarChart2, FiSettings,
  FiLogOut, FiBell, FiUsers, FiTruck
} from "react-icons/fi";

const navItems = [
  { label: "Dashboard",          path: "/dashboard",          icon: <FiGrid /> },
  { label: "AR",                 path: "/accidents",          icon: <FiAlertTriangle /> },
  { label: "TOR",                path: "/tor",                icon: <FiAlertCircle /> },
  { label: "Reports",            path: "/reports",            icon: <FiFileText /> },
  { label: "Duty Roster",        path: "/duty-roster",        icon: <FiCalendar /> },
  { label: "Vehicle Management", path: "/vehicle-management", icon: <FiTruck /> },
  { label: "Analytics",          path: "/analytics",          icon: <FiBarChart2 /> },
  { label: "Officer Management", path: "/user-management",    icon: <FiUsers /> },
];

function OICLayout({ children }) {
  const location = useLocation();
  const navigate  = useNavigate();
  const officer   = JSON.parse(localStorage.getItem("officer") || "{}");
  const name      = officer.name || "PS Perera";
  const initial   = name.charAt(0).toUpperCase();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="pro-layout">
      {/* SIDEBAR */}
      <aside className="pro-sidebar">
        <nav className="pro-nav" style={{ marginTop: 20 }}>
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

        <div className="pro-sidebar-bottom">
          <Link
            to="/settings"
            className={`pro-nav-link ${location.pathname === "/settings" ? "pro-nav-active" : ""}`}
          >
            <span className="pro-nav-icon"><FiSettings /></span>
            <span>Settings</span>
          </Link>
          <button className="pro-signout-btn" onClick={handleLogout}>
            <FiLogOut style={{ marginRight: 8 }} /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="pro-main">
        {/* TOPBAR */}
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
            <button className="pro-topbar-bell" onClick={() => navigate("/notifications")} title="Notifications">
              <FiBell size={18} />
            </button>
            <div className="pro-topbar-officer">
              <div className="pro-topbar-avatar">{initial}</div>
              <div>
                <p className="pro-topbar-name">{name}</p>
                <p className="pro-topbar-role">OIC</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pro-content">{children}</div>
      </main>
    </div>
  );
}

export default OICLayout;