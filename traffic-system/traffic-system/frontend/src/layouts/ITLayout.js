import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiGrid, FiUsers, FiSettings, FiLogOut, FiBell, FiFileText, FiAlertTriangle, FiAlertCircle, FiCalendar, FiTruck
} from "react-icons/fi";
import { useLanguage } from "../context/LanguageContext";

function ITLayout({ children }) {
  const location = useLocation();
  const navigate  = useNavigate();
  const { t }     = useLanguage();

  const officer   = JSON.parse(localStorage.getItem("officer") || "{}");
  const name      = officer.name || t("itOfficer");
  const initial   = name.charAt(0).toUpperCase();

  const navItems = [
    { label: t("dashboard"),          path: "/dashboard",          icon: <FiGrid /> },
    { label: t("accidents"),          path: "/accidents",          icon: <FiAlertTriangle /> },
    { label: t("violations"),         path: "/tor",                icon: <FiAlertCircle /> },
    { label: t("reports"),            path: "/reports",            icon: <FiFileText /> },
    { label: t("dutyRoster"),         path: "/duty-roster",        icon: <FiCalendar /> },
    { label: t("vehicleManagement"), path: "/vehicle-management", icon: <FiTruck /> },
    { label: t("userManagement"),    path: "/user-management",    icon: <FiUsers /> },
  ];

  const handleLogout = () => {
    const confirmed = window.confirm(t("language") === "Sinhala" ? "ඔබට මෙම පද්ධතියෙන් ඉවත් වීමට අවශ්‍ය බව තහවුරුද?" : "Are you sure you want to log out?");
    if (!confirmed) return;
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
            <span>{t("settings")}</span>
          </Link>
          <button className="pro-signout-btn" onClick={handleLogout}>
            <FiLogOut style={{ marginRight: 8 }} /> {t("signOut")}
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
              <p className="pro-topbar-title">{t("sriLankaPolice")}</p>
              <p className="pro-topbar-sub">{t("trafficBranchNegombo")}</p>
            </div>
          </div>
          <div className="pro-topbar-right">
            <button className="pro-topbar-bell" onClick={() => navigate("/notifications")} title={t("notifications")}>
              <FiBell size={18} />
            </button>
            <div className="pro-topbar-officer">
              <div className="pro-topbar-avatar" style={{ background: "#7c3aed" }}>{initial}</div>
              <div>
                <p className="pro-topbar-name">{name}</p>
                <p className="pro-topbar-role">{t("itOfficer")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pro-content">{children}</div>
      </main>
    </div>
  );
}

export default ITLayout;