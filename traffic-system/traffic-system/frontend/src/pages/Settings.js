import React, { useState, useEffect } from "react";
import {
  FiUser,
  FiSettings,
  FiShield,
  FiMoon,
  FiGlobe,
  FiCalendar,
  FiClock,
  FiLock,
  FiInfo,
  FiChevronRight,
  FiCamera,
  FiEdit2,
  FiPhone,
  FiMail,
  FiCheck,
  FiX,
  FiKey,
  FiActivity,
  FiAlertCircle
} from "react-icons/fi";
import { getMyProfile, updateMyProfile, updateMyPassword, getSystemHealth } from "../api";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { useFormat } from "../context/FormatContext";

function Settings() {
  const userRole = localStorage.getItem("userRole") || "OIC";
  const { darkMode, toggleDarkMode } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { dateFormat, setDateFormat, timeFormat, setTimeFormat } = useFormat();

  // Dynamically load layout based on user role (OIC or IT Officer)
  let LayoutComponent;
  if (userRole === "IT Officer" || userRole === "IT_OFFICER" || userRole === "IT Officer ") {
    LayoutComponent = require("../layouts/ITLayout").default;
  } else {
    LayoutComponent = require("../layouts/OICLayout").default;
  }

  const officer = JSON.parse(localStorage.getItem("officer") || "{}");
  
  // Profile state initialized with fallback defaults matching role
  const isIT = userRole === "IT Officer" || userRole === "IT_OFFICER";
  const defaultName = isIT ? "System Administrator" : (officer.name || "PS Perera");
  const defaultRole = isIT ? "IT Officer" : "OIC";

  const [profile, setProfile] = useState({
    name: officer.name || defaultName,
    role: officer.role || defaultRole,
    contactNo: officer.contactNo || "+94 712 345 678",
    email: officer.email || "officer@slpolice.lk",
  });

  // System Health state for About System modal
  const [dbStatus, setDbStatus] = useState("Connected");

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'edit_profile', 'change_password', 'security', 'about'

  // Edit profile form state
  const [editForm, setEditForm] = useState({ ...profile });
  const [saveMessage, setSaveMessage] = useState("");

  // Change password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordMessage, setPasswordMessage] = useState("");

  // Fetch live officer profile from backend on mount
  useEffect(() => {
    const fetchLiveProfile = async () => {
      const liveData = await getMyProfile();
      if (liveData) {
        const updatedOfficer = {
          ...officer,
          ...liveData,
          name: liveData.fullName || liveData.name || officer.name,
          role: liveData.role || officer.role
        };
        localStorage.setItem("officer", JSON.stringify(updatedOfficer));
        setProfile({
          name: liveData.fullName || liveData.name || defaultName,
          role: liveData.role || defaultRole,
          contactNo: liveData.contactNo || officer.contactNo || "+94 712 345 678",
          email: liveData.email || officer.email || "officer@slpolice.lk",
        });
      }
    };
    fetchLiveProfile();
  }, []);

  // Fetch live system health on modal open
  useEffect(() => {
    if (activeModal === "about") {
      const checkHealth = async () => {
        const res = await getSystemHealth();
        if (res && res.database === "connected") {
          setDbStatus("Connected");
        } else {
          setDbStatus("Unavailable");
        }
      };
      checkHealth();
    }
  }, [activeModal]);

  // Handlers
  const handleOpenEditProfile = () => {
    setEditForm({ ...profile });
    setSaveMessage("");
    setActiveModal("edit_profile");
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveMessage("Saving changes to database...");
    try {
      const payload = {
        fullName: editForm.name,
        name: editForm.name,
        email: editForm.email,
        contactNo: editForm.contactNo,
      };

      const result = await updateMyProfile(payload);
      if (result.ok) {
        const updatedDoc = result.data || {};
        const updatedOfficer = {
          ...officer,
          ...updatedDoc,
          name: updatedDoc.fullName || editForm.name,
          fullName: updatedDoc.fullName || editForm.name,
          contactNo: updatedDoc.contactNo || editForm.contactNo,
          email: updatedDoc.email || editForm.email,
        };

        setProfile({
          name: updatedOfficer.fullName || updatedOfficer.name || editForm.name,
          role: editForm.role,
          contactNo: updatedOfficer.contactNo || editForm.contactNo,
          email: updatedOfficer.email || editForm.email,
        });

        localStorage.setItem("officer", JSON.stringify(updatedOfficer));
        setSaveMessage("Profile updated successfully in database!");
        setTimeout(() => {
          setActiveModal(null);
          setSaveMessage("");
        }, 1200);
      } else {
        setSaveMessage(result.data?.message || result.error || "Failed to update profile on server.");
      }
    } catch (err) {
      console.error("Error in handleSaveProfile:", err);
      setSaveMessage("Error updating profile on server.");
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      setPasswordMessage("Please enter your current password.");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage("New password must be at least 6 characters.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage("New passwords do not match.");
      return;
    }

    setPasswordMessage("Updating password in database...");
    try {
      const result = await updateMyPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        password: passwordForm.newPassword,
      });

      if (result.ok) {
        setPasswordMessage("Password changed successfully in database!");
        setTimeout(() => {
          setActiveModal(null);
          setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
          setPasswordMessage("");
        }, 1200);
      } else {
        setPasswordMessage(result.data?.message || result.error || "Failed to update password.");
      }
    } catch (err) {
      console.error("Error in handleSavePassword:", err);
      setPasswordMessage("Error updating password on server.");
    }
  };

  const handleToggleDarkMode = () => {
    toggleDarkMode();
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  const handleDateFormatChange = (e) => {
    setDateFormat(e.target.value);
  };

  const handleTimeFormatChange = (e) => {
    setTimeFormat(e.target.value);
  };

  const initialLetter = (profile.name || "S").charAt(0).toUpperCase();

  return (
    <LayoutComponent>
      <div className="page-box" style={{ minHeight: "100%" }}>
        
        {/* Header */}
        <div className="settings-header">
          <h2 className="settings-main-title">{t("settingsTitle")}</h2>
          <p className="settings-sub-title">{t("settingsSubTitle")}</p>
        </div>

        {/* Top Grid: Profile Information & App Preferences */}
        <div className="settings-grid-2col">
          
          {/* Card 1: Profile Information */}
          <div className="settings-card-box">
            <div className="settings-card-header">
              <div className="settings-card-icon-wrap" style={{ background: "#eff6ff", color: "#2563eb" }}>
                <FiUser />
              </div>
              <span className="settings-card-title-text">{t("profileInformation")}</span>
            </div>

            <div className="settings-profile-layout">
              {/* Left Column: Avatar & Role */}
              <div className="settings-profile-left">
                <div className="settings-avatar-container">
                  <div className="settings-avatar-circle">
                    {initialLetter}
                  </div>
                  <button className="settings-avatar-cam-btn" title="Change Avatar" onClick={handleOpenEditProfile}>
                    <FiCamera />
                  </button>
                </div>
                <div className="settings-profile-name">{profile.name}</div>
                <span className="settings-role-pill">{profile.role}</span>
              </div>

              {/* Right Column: Key Details */}
              <div className="settings-profile-right">
                <div className="settings-info-item">
                  <span className="settings-info-icon"><FiUser /></span>
                  <span className="settings-info-label">{t("fullName")}</span>
                  <span className="settings-info-val">{profile.name}</span>
                </div>

                <div className="settings-info-item">
                  <span className="settings-info-icon"><FiShield /></span>
                  <span className="settings-info-label">{t("role")}</span>
                  <span className="settings-info-val">{profile.role}</span>
                </div>

                <div className="settings-info-item">
                  <span className="settings-info-icon"><FiPhone /></span>
                  <span className="settings-info-label">{t("contactNo")}</span>
                  <span className="settings-info-val">{profile.contactNo}</span>
                </div>

                <div className="settings-info-item">
                  <span className="settings-info-icon"><FiMail /></span>
                  <span className="settings-info-label">{t("email")}</span>
                  <span className="settings-info-val">{profile.email}</span>
                </div>
              </div>
            </div>

            <button className="settings-edit-profile-btn" onClick={handleOpenEditProfile}>
              <FiEdit2 size={13} /> {t("editProfile")}
            </button>
          </div>

          {/* Card 2: App Preferences */}
          <div className="settings-card-box">
            <div className="settings-card-header">
              <div className="settings-card-icon-wrap" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                <FiSettings />
              </div>
              <span className="settings-card-title-text">{t("appPreferences")}</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              
              {/* Dark Mode */}
              <div className="pref-item-row">
                <div className="pref-item-left">
                  <div className="pref-item-icon-wrap">
                    <FiMoon />
                  </div>
                  <div>
                    <div className="pref-item-title">{t("darkMode")}</div>
                    <div className="pref-item-desc">{t("darkModeDesc")}</div>
                  </div>
                </div>
                <div className={`toggle ${darkMode ? "toggle-on" : ""}`} onClick={handleToggleDarkMode}>
                  <div className="toggle-thumb" />
                </div>
              </div>

              {/* Language */}
              <div className="pref-item-row">
                <div className="pref-item-left">
                  <div className="pref-item-icon-wrap">
                    <FiGlobe />
                  </div>
                  <div>
                    <div className="pref-item-title">{t("language")}</div>
                    <div className="pref-item-desc">{t("languageDesc")}</div>
                  </div>
                </div>
                <select className="pref-dropdown-select" value={language} onChange={handleLanguageChange}>
                  <option value="English">English</option>
                  <option value="Sinhala">Sinhala (සිංහල)</option>
                </select>
              </div>

              {/* Date Format */}
              <div className="pref-item-row">
                <div className="pref-item-left">
                  <div className="pref-item-icon-wrap">
                    <FiCalendar />
                  </div>
                  <div>
                    <div className="pref-item-title">{t("dateFormat")}</div>
                    <div className="pref-item-desc">{t("dateFormatDesc")}</div>
                  </div>
                </div>
                <select className="pref-dropdown-select" value={dateFormat} onChange={handleDateFormatChange}>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                </select>
              </div>

              {/* Time Format */}
              <div className="pref-item-row">
                <div className="pref-item-left">
                  <div className="pref-item-icon-wrap">
                    <FiClock />
                  </div>
                  <div>
                    <div className="pref-item-title">{t("timeFormat")}</div>
                    <div className="pref-item-desc">{t("timeFormatDesc")}</div>
                  </div>
                </div>
                <select className="pref-dropdown-select" value={timeFormat} onChange={handleTimeFormatChange}>
                  <option value="24-Hour">24-Hour</option>
                  <option value="12-Hour">12-Hour (AM/PM)</option>
                </select>
              </div>

            </div>
          </div>

        </div>

        {/* Bottom Card: System & Account */}
        <div className="system-account-card">
          <div className="settings-card-header" style={{ marginBottom: 16 }}>
            <div className="settings-card-icon-wrap" style={{ background: "#fef3c7", color: "#d97706" }}>
              <FiShield />
            </div>
            <span className="settings-card-title-text">{t("systemAndAccount")}</span>
          </div>

          <div className="system-account-list">
            
            {/* Change Password */}
            <div className="sys-account-row" onClick={() => setActiveModal("change_password")}>
              <div className="sys-account-left">
                <div className="sys-account-icon-wrap">
                  <FiLock />
                </div>
                <div>
                  <div className="sys-account-title">{t("changePassword")}</div>
                  <div className="sys-account-desc">{t("changePasswordDesc")}</div>
                </div>
              </div>
              <div className="sys-account-chevron">
                <FiChevronRight />
              </div>
            </div>

            {/* Account Security */}
            <div className="sys-account-row" onClick={() => setActiveModal("security")}>
              <div className="sys-account-left">
                <div className="sys-account-icon-wrap">
                  <FiShield />
                </div>
                <div>
                  <div className="sys-account-title">{t("accountSecurity")}</div>
                  <div className="sys-account-desc">{t("accountSecurityDesc")}</div>
                </div>
              </div>
              <div className="sys-account-chevron">
                <FiChevronRight />
              </div>
            </div>

            {/* About System */}
            <div className="sys-account-row" onClick={() => setActiveModal("about")}>
              <div className="sys-account-left">
                <div className="sys-account-icon-wrap">
                  <FiInfo />
                </div>
                <div>
                  <div className="sys-account-title">{t("aboutSystem")}</div>
                  <div className="sys-account-desc">{t("aboutSystemDesc")}</div>
                </div>
              </div>
              <div className="sys-account-chevron">
                <FiChevronRight />
              </div>
            </div>

          </div>
        </div>

        {/* ====================================================== */}
        {/* MODALS */}
        {/* ====================================================== */}

        {/* 1. Edit Profile Modal */}
        {activeModal === "edit_profile" && (
          <div className="pro-modal-overlay">
            <div className="pro-modal-box" style={{ width: 440, padding: 24, borderRadius: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>{t("editProfile")}</h3>
                <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#64748b" }} onClick={() => setActiveModal(null)}>
                  <FiX />
                </button>
              </div>

              {saveMessage && (
                <div style={{ background: "#dcfce7", color: "#166534", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                  <FiCheck /> {saveMessage}
                </div>
              )}

              <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>{t("fullName")}</label>
                  <input
                    type="text"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, fontSize: 13 }}
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>{t("role")}</label>
                  <input
                    type="text"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, fontSize: 13 }}
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>{t("contactNo")}</label>
                  <input
                    type="text"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, fontSize: 13 }}
                    value={editForm.contactNo}
                    onChange={(e) => setEditForm({ ...editForm, contactNo: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>{t("email")}</label>
                  <input
                    type="email"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, fontSize: 13 }}
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                  <button type="button" className="btn-cancel" style={{ padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13 }} onClick={() => setActiveModal(null)}>
                    {t("cancel")}
                  </button>
                  <button type="submit" className="pro-btn-primary" style={{ padding: "8px 18px", borderRadius: 8 }}>
                    {t("saveChanges")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 2. Change Password Modal */}
        {activeModal === "change_password" && (
          <div className="pro-modal-overlay">
            <div className="pro-modal-box" style={{ width: 420, padding: 24, borderRadius: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                  <FiKey style={{ color: "#2563eb" }} /> {t("changePassword")}
                </h3>
                <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#64748b" }} onClick={() => setActiveModal(null)}>
                  <FiX />
                </button>
              </div>

              {passwordMessage && (
                <div
                  style={{
                    background: passwordMessage.includes("successfully") ? "#dcfce7" : "#fee2e2",
                    color: passwordMessage.includes("successfully") ? "#166534" : "#991b1b",
                    padding: "10px 14px",
                    borderRadius: 8,
                    fontSize: 13,
                    marginBottom: 14,
                  }}
                >
                  {passwordMessage}
                </div>
              )}

              <form onSubmit={handleSavePassword} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>{t("currentPassword")}</label>
                  <input
                    type="password"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, fontSize: 13 }}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>{t("newPassword")}</label>
                  <input
                    type="password"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, fontSize: 13 }}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>{t("confirmNewPassword")}</label>
                  <input
                    type="password"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, fontSize: 13 }}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                  <button type="button" className="btn-cancel" style={{ padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13 }} onClick={() => setActiveModal(null)}>
                    {t("cancel")}
                  </button>
                  <button type="submit" className="pro-btn-primary" style={{ padding: "8px 18px", borderRadius: 8 }}>
                    {t("updatePassword")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 3. Account Security Modal */}
        {activeModal === "security" && (
          <div className="pro-modal-overlay">
            <div className="pro-modal-box" style={{ width: 460, padding: 24, borderRadius: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                  <FiShield style={{ color: "#d97706" }} /> {t("securityOverviewTitle")}
                </h3>
                <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#64748b" }} onClick={() => setActiveModal(null)}>
                  <FiX />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                
                {/* 2FA Section - Unconfigured State (Part 5 Compliance) */}
                <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{t("twoFactorAuth")}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{t("twoFactorDesc")}</div>
                    </div>
                    <span style={{ fontSize: 11, background: "#f1f5f9", color: "#64748b", padding: "3px 10px", borderRadius: 12, fontWeight: 600 }}>
                      Not Configured
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "#d97706", display: "flex", alignItems: "center", gap: 6, marginTop: 6, background: "#fffbeb", padding: "6px 10px", borderRadius: 6 }}>
                    <FiAlertCircle style={{ flexShrink: 0 }} /> {t("twoFactorNotConfigured")}
                  </div>
                </div>

                {/* Active Session Section (Part 6 Compliance) */}
                <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{t("activeSession")}</div>
                  <div style={{ fontSize: 12, color: "#475569", display: "flex", alignItems: "center", gap: 6 }}>
                    <FiActivity style={{ color: "#16a34a" }} /> {t("currentBrowserSession")}
                  </div>
                </div>

                {/* Security Audit Section (Part 7 Compliance) */}
                <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{t("securityAudit")}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>● {t("passwordChangeNotAvailable")}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>● {t("secureConnectionInfo")}</div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                  <button type="button" className="pro-btn-primary" style={{ padding: "8px 18px", borderRadius: 8 }} onClick={() => setActiveModal(null)}>
                    {t("done")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. About System Modal */}
        {activeModal === "about" && (
          <div className="pro-modal-overlay">
            <div className="pro-modal-box" style={{ width: 440, padding: 24, borderRadius: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                  <FiInfo style={{ color: "#2563eb" }} /> {t("aboutSystemTitle")}
                </h3>
                <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#64748b" }} onClick={() => setActiveModal(null)}>
                  <FiX />
                </button>
              </div>

              <div style={{ textAlign: "center", padding: "12px 0 18px", borderBottom: "1px solid #f1f5f9" }}>
                <img
                  src="https://images.seeklogo.com/logo-png/37/1/sri-lanka-police-logo-png_seeklogo-374521.png"
                  alt="SL Police Logo"
                  style={{ width: 48, height: "auto", marginBottom: 10 }}
                />
                <h4 style={{ fontSize: 15, fontWeight: 700 }}>{t("departmentName")}</h4>
                <p style={{ fontSize: 12, color: "#64748b" }}>{t("systemSubName")}</p>
                <span style={{ fontSize: 11, background: "#eff6ff", color: "#2563eb", padding: "3px 12px", borderRadius: 12, fontWeight: 600, display: "inline-block", marginTop: 8 }}>
                  {t("version")} 2.4.0 ({t("build")} 2026)
                </span>
              </div>

              <div style={{ padding: "14px 0", display: "flex", flexDirection: "column", gap: 10, fontSize: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>{t("division")}:</span>
                  <span style={{ fontWeight: 600 }}>{t("negomboDivision")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>{t("supportedRoles")}:</span>
                  <span style={{ fontWeight: 600 }}>OIC, IT Officer, Traffic Officer</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>{t("databaseConnection")}:</span>
                  <span style={{ fontWeight: 600, color: dbStatus === "Connected" ? "#16a34a" : "#dc2626" }}>
                    {dbStatus === "Connected" ? t("connected") : t("unavailable")}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <button type="button" className="pro-btn-primary" style={{ padding: "8px 18px", borderRadius: 8 }} onClick={() => setActiveModal(null)}>
                  {t("close")}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </LayoutComponent>
  );
}

export default Settings;