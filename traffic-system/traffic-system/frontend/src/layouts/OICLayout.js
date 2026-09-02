import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiGrid, FiAlertTriangle, FiAlertCircle, FiDollarSign,
  FiFileText, FiCalendar, FiBarChart2, FiSettings,
  FiLogOut, FiBell, FiUsers, FiTruck, FiShield, FiZap
} from "react-icons/fi";

const navItems = [
  { label: "Dashboard",          path: "/dashboard",          icon: <FiGrid /> },
  { label: "AIR",                path: "/accidents",          icon: <FiAlertTriangle /> },
  { label: "TOR",                path: "/tor",                icon: <FiAlertCircle /> },
  { label: "Reports & Analytics",path: "/reports",            icon: <FiFileText /> },
  { label: "Duty Roster",        path: "/duty-roster",        icon: <FiCalendar /> },
  { label: "Vehicle Log",        path: "/vehicle-management", icon: <FiTruck /> },
  { label: "User Management",    path: "/user-management",    icon: <FiUsers /> },
];

function OICLayout({ children }) {
  const location = useLocation();
  const navigate  = useNavigate();
  const officer   = JSON.parse(localStorage.getItem("officer") || "{}");
  const name      = officer.fullName || officer.name || "PS Perera";
  const badgeNo   = officer.policeId || "256 556 656";
  const initial   = name.charAt(0).toUpperCase();

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (!confirmed) return;
    localStorage.clear();
    navigate("/login");
  };

  const handleEmergencyAlert = () => {
    alert("🚨 EMERGENCY ALERT BROADCAST\nHigh priority traffic emergency notification dispatched to all active Negombo Division units.");
  };

  return (
    <div className="pro-layout">
      {/* SIDEBAR */}
      <aside className="pro-sidebar" style={{ background: "#1E2A3B" }}>
        <div className="pro-brand" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <img
            src="https://images.seeklogo.com/logo-png/37/1/sri-lanka-police-logo-png_seeklogo-374521.png"
            alt="SLP"
            style={{ width: 34, height: 34, objectFit: "contain" }}
          />
          <div>
            <p className="pro-brand-name" style={{ fontSize: 15 }}>Sri Lanka Police</p>
            <p className="pro-brand-sub" style={{ color: "#94a3b8" }}>Traffic Branch · Negombo</p>
          </div>
        </div>

        <nav className="pro-nav" style={{ marginTop: 16 }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path === "/reports" && location.pathname === "/analytics");
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`pro-nav-link ${isActive ? "pro-nav-active-custom" : ""}`}
                style={isActive ? {
                  background: "rgba(59, 130, 246, 0.15)",
                  color: "#ffffff",
                  fontWeight: 600,
                  borderLeft: "4px solid #3B82F6",
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0
                } : {}}
              >
                <span className="pro-nav-icon" style={{ color: isActive ? "#3B82F6" : "#94a3b8" }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="pro-sidebar-bottom" style={{ marginTop: "auto", padding: "16px 12px" }}>
          {/* Emergency Alert Button */}
          <button
            onClick={handleEmergencyAlert}
            style={{
              width: "100%",
              padding: "10px 14px",
              backgroundColor: "#EF4444",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              cursor: "pointer",
              marginBottom: 12,
              boxShadow: "0 2px 8px rgba(239, 68, 68, 0.4)",
              transition: "transform 0.15s ease"
            }}
          >
            <FiZap size={16} /> EMERGENCY ALERT
          </button>

          <Link
            to="/settings"
            className={`pro-nav-link ${location.pathname === "/settings" ? "pro-nav-active-custom" : ""}`}
            style={{ marginBottom: 6 }}
          >
            <span className="pro-nav-icon"><FiSettings /></span>
            <span>Settings</span>
          </Link>
          <button className="pro-signout-btn" onClick={handleLogout} style={{ margin: 0, width: "100%" }}>
            <FiLogOut style={{ marginRight: 8 }} /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="pro-main" style={{ background: "#F3F4F6" }}>
        {/* TOPBAR */}
        <div className="pro-topbar">
          <div className="pro-topbar-brand">
            <img
              src="https://images.seeklogo.com/logo-png/37/1/sri-lanka-police-logo-png_seeklogo-374521.png"
              alt="SLP"
              className="pro-topbar-logo"
            />
            <div>
              <p className="pro-topbar-title" style={{ fontSize: 16, fontWeight: 700 }}>Sri Lanka Police / Traffic Branch · Negombo</p>
              <p className="pro-topbar-sub">Operational Command & Control Center</p>
            </div>
          </div>
          <div className="pro-topbar-right">
            <button className="pro-topbar-bell" onClick={() => navigate("/notifications")} title="Notifications">
              <FiBell size={18} />
            </button>
            <div className="pro-topbar-officer">
              <div className="pro-topbar-avatar" style={{ backgroundColor: "#1E2A3B", color: "#ffffff", fontWeight: 700 }}>{initial}</div>
              <div>
                <p className="pro-topbar-name" style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{name}</p>
                <p className="pro-topbar-role" style={{ margin: 0, fontSize: 11, color: "#64748b" }}>Traffic Officer · {badgeNo}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pro-content" style={{ background: "#F3F4F6", padding: "24px 28px" }}>{children}</div>
      </main>
    </div>
  );
}

export default OICLayout;