import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "AIR", path: "/accidents", icon: "🚗" },
  { label: "TOR", path: "/tor", icon: "👤" },
  { label: "SFR", path: "/sfr", icon: "⬤" },
  { label: "DLR", path: "/dlr", icon: "📋" },
  { label: "Reports", path: "/reports", icon: "📄" },
  { label: "Duty Roster", path: "/duty-roster", icon: "📝" },
  { label: "Analytics", path: "/analytics", icon: "📊" },
  { label: "Duty Schedule", path: "/duty-schedule", icon: "📅" },
];

function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("officer");
    navigate("/login");
  };

  return (
    <div className="layout">
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="sidebar-logo">
          
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${location.pathname === item.path ? "active" : ""}`}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <Link to="/settings" className={`sidebar-link ${location.pathname === "/settings" ? "active" : ""}`}>
            <span className="sidebar-icon">⚙️</span>
            <span className="sidebar-label">Settings</span>
          </Link>
          <button className="sidebar-link sidebar-logout-btn" onClick={handleLogout}>
            <span className="sidebar-icon">🚪</span>
            <span className="sidebar-label">Logout</span>
          </button>
        </div>
      </div>

      {/* MAIN AREA */}
      <div className="main">
        {/* NAVBAR */}
        <div className="navbar">
          <div className="navbar-brand">
            <img
              src="https://images.seeklogo.com/logo-png/37/1/sri-lanka-police-logo-png_seeklogo-374521.png"
              alt="Sri Lanka Police"
              className="navbar-logo-img"
            />
            <div className="navbar-title-group">
              <span className="navbar-title">Sri Lanka Police</span>
              <span className="navbar-subtitle">Traffic Branch - Negombo</span>
            </div>
          </div>

          <div className="navbar-right">
            <button className="notif-btn" onClick={() => navigate("/notifications")}>🔔</button>
            <div className="officer-info">
              <div>
                <p className="officer-name">PS Perera</p>
                <p className="officer-role">Traffic Officer</p>
                <p className="officer-id">256 556 656</p>
              </div>
              <div className="officer-avatar">👮</div>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="content">{children}</div>
      </div>
    </div>
  );
}

export default Layout;