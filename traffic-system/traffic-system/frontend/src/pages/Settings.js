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
  FiActivity
} from "react-icons/fi";
import { getMyProfile, updateMyProfile, updateMyPassword } from "../api";

function Settings() {
  const userRole = localStorage.getItem("userRole") || "OIC";
  
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

  // App preferences state with localStorage persistence
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("app_dark_mode") === "true"
  );
  const [language, setLanguage] = useState(
    localStorage.getItem("app_language") || "English"
  );
  const [dateFormat, setDateFormat] = useState(
    localStorage.getItem("app_date_format") || "YYYY-MM-DD"
  );
  const [timeFormat, setTimeFormat] = useState(
    localStorage.getItem("app_time_format") || "24-Hour"
  );

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

  // Account security toggle
  const [twoFactor, setTwoFactor] = useState(false);

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
    const nextVal = !darkMode;
    setDarkMode(nextVal);
    localStorage.setItem("app_dark_mode", nextVal.toString());
  };

  const handleLanguageChange = (e) => {
    const val = e.target.value;
    setLanguage(val);
    localStorage.setItem("app_language", val);
  };

  const handleDateFormatChange = (e) => {
    const val = e.target.value;
    setDateFormat(val);
    localStorage.setItem("app_date_format", val);
  };

  const handleTimeFormatChange = (e) => {
    const val = e.target.value;
    setTimeFormat(val);
    localStorage.setItem("app_time_format", val);
  };

  const initialLetter = (profile.name || "S").charAt(0).toUpperCase();

  return (
    <LayoutComponent>
      <div className="page-box" style={{ background: "#f8fafc", minHeight: "100%" }}>
        
        {/* Header */}
        <div className="settings-header">
          <h2 className="settings-main-title">Settings</h2>
          <p className="settings-sub-title">Manage your profile and application preferences</p>
        </div>

        {/* Top Grid: Profile Information & App Preferences */}
        <div className="settings-grid-2col">
          
          {/* Card 1: Profile Information */}
          <div className="settings-card-box">
            <div className="settings-card-header">
              <div className="settings-card-icon-wrap" style={{ background: "#eff6ff", color: "#2563eb" }}>
                <FiUser />
              </div>
              <span className="settings-card-title-text">Profile Information</span>
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
                  <span className="settings-info-label">Full Name</span>
                  <span className="settings-info-val">{profile.name}</span>
                </div>

                <div className="settings-info-item">
                  <span className="settings-info-icon"><FiShield /></span>
                  <span className="settings-info-label">Role</span>
                  <span className="settings-info-val">{profile.role}</span>
                </div>

                <div className="settings-info-item">
                  <span className="settings-info-icon"><FiPhone /></span>
                  <span className="settings-info-label">Contact No.</span>
                  <span className="settings-info-val">{profile.contactNo}</span>
                </div>

                <div className="settings-info-item">
                  <span className="settings-info-icon"><FiMail /></span>
                  <span className="settings-info-label">Email</span>
                  <span className="settings-info-val">{profile.email}</span>
                </div>
              </div>
            </div>

            <button className="settings-edit-profile-btn" onClick={handleOpenEditProfile}>
              <FiEdit2 size={13} /> Edit Profile
            </button>
          </div>

          {/* Card 2: App Preferences */}
          <div className="settings-card-box">
            <div className="settings-card-header">
              <div className="settings-card-icon-wrap" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                <FiSettings />
              </div>
              <span className="settings-card-title-text">App Preferences</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              
              {/* Dark Mode */}
              <div className="pref-item-row">
                <div className="pref-item-left">
                  <div className="pref-item-icon-wrap">
                    <FiMoon />
                  </div>
                  <div>
                    <div className="pref-item-title">Dark Mode</div>
                    <div className="pref-item-desc">Enable dark mode for the system</div>
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
                    <div className="pref-item-title">Language</div>
                    <div className="pref-item-desc">Select your preferred language</div>
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
                    <div className="pref-item-title">Date Format</div>
                    <div className="pref-item-desc">Select the date display format</div>
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
                    <div className="pref-item-title">Time Format</div>
                    <div className="pref-item-desc">Select the time display format</div>
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

        {/* Bottom Card: System & Account (Data Management removed as requested) */}
        <div className="system-account-card">
          <div className="settings-card-header" style={{ marginBottom: 16 }}>
            <div className="settings-card-icon-wrap" style={{ background: "#fef3c7", color: "#d97706" }}>
              <FiShield />
            </div>
            <span className="settings-card-title-text">System &amp; Account</span>
          </div>

          <div className="system-account-list">
            
            {/* Change Password */}
            <div className="sys-account-row" onClick={() => setActiveModal("change_password")}>
              <div className="sys-account-left">
                <div className="sys-account-icon-wrap">
                  <FiLock />
                </div>
                <div>
                  <div className="sys-account-title">Change Password</div>
                  <div className="sys-account-desc">Update your account password</div>
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
                  <div className="sys-account-title">Account Security</div>
                  <div className="sys-account-desc">Manage your account security settings</div>
                </div>
              </div>
              <div className="sys-account-chevron">
                <FiChevronRight />
              </div>
            </div>

            {/* NOTE: DATA MANAGEMENT REMOVED AS REQUESTED BY USER */}

            {/* About System */}
            <div className="sys-account-row" onClick={() => setActiveModal("about")}>
              <div className="sys-account-left">
                <div className="sys-account-icon-wrap">
                  <FiInfo />
                </div>
                <div>
                  <div className="sys-account-title">About System</div>
                  <div className="sys-account-desc">View system information and version</div>
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
            <div className="pro-modal-box" style={{ width: 440, background: "#ffffff", padding: 24, borderRadius: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Edit Profile Information</h3>
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
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Full Name</label>
                  <input
                    type="text"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Role / Title</label>
                  <input
                    type="text"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Contact Number</label>
                  <input
                    type="text"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
                    value={editForm.contactNo}
                    onChange={(e) => setEditForm({ ...editForm, contactNo: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Email Address</label>
                  <input
                    type="email"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                  <button type="button" className="btn-cancel" style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#f8fafc", cursor: "pointer", fontSize: 13 }} onClick={() => setActiveModal(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="pro-btn-primary" style={{ padding: "8px 18px", borderRadius: 8 }}>
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 2. Change Password Modal */}
        {activeModal === "change_password" && (
          <div className="pro-modal-overlay">
            <div className="pro-modal-box" style={{ width: 420, background: "#ffffff", padding: 24, borderRadius: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                  <FiKey style={{ color: "#2563eb" }} /> Change Password
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
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Current Password</label>
                  <input
                    type="password"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>New Password</label>
                  <input
                    type="password"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Confirm New Password</label>
                  <input
                    type="password"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                  <button type="button" style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#f8fafc", cursor: "pointer", fontSize: 13 }} onClick={() => setActiveModal(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="pro-btn-primary" style={{ padding: "8px 18px", borderRadius: 8 }}>
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 3. Account Security Modal */}
        {activeModal === "security" && (
          <div className="pro-modal-overlay">
            <div className="pro-modal-box" style={{ width: 460, background: "#ffffff", padding: 24, borderRadius: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                  <FiShield style={{ color: "#d97706" }} /> Account Security Overview
                </h3>
                <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#64748b" }} onClick={() => setActiveModal(null)}>
                  <FiX />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Two-Factor Authentication (2FA)</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>Require secondary verification code on login</div>
                  </div>
                  <div className={`toggle ${twoFactor ? "toggle-on" : ""}`} onClick={() => setTwoFactor(!twoFactor)}>
                    <div className="toggle-thumb" />
                  </div>
                </div>

                <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>Active Session</div>
                  <div style={{ fontSize: 12, color: "#475569", display: "flex", alignItems: "center", gap: 6 }}>
                    <FiActivity style={{ color: "#16a34a" }} /> Negombo Traffic Branch Workstation (Current)
                  </div>
                </div>

                <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>Security Audit</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>● Last Password Change: 14 days ago</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>● Encryption Protocol: SSL / TLS 1.3 Active</div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                  <button type="button" className="pro-btn-primary" style={{ padding: "8px 18px", borderRadius: 8 }} onClick={() => setActiveModal(null)}>
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. About System Modal */}
        {activeModal === "about" && (
          <div className="pro-modal-overlay">
            <div className="pro-modal-box" style={{ width: 440, background: "#ffffff", padding: 24, borderRadius: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                  <FiInfo style={{ color: "#2563eb" }} /> About System
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
                <h4 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Sri Lanka Police Department</h4>
                <p style={{ fontSize: 12, color: "#64748b" }}>Traffic Branch Record Management System</p>
                <span style={{ fontSize: 11, background: "#eff6ff", color: "#2563eb", padding: "3px 12px", borderRadius: 12, fontWeight: 600, display: "inline-block", marginTop: 8 }}>
                  Version 2.4.0 (Build 2026)
                </span>
              </div>

              <div style={{ padding: "14px 0", display: "flex", flexDirection: "column", gap: 10, fontSize: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Division:</span>
                  <span style={{ fontWeight: 600, color: "#0f172a" }}>Negombo Division</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Supported Roles:</span>
                  <span style={{ fontWeight: 600, color: "#0f172a" }}>OIC, IT Officer, Traffic Officer</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Database Connection:</span>
                  <span style={{ fontWeight: 600, color: "#16a34a" }}>Connected &amp; Synchronized</span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <button type="button" className="pro-btn-primary" style={{ padding: "8px 18px", borderRadius: 8 }} onClick={() => setActiveModal(null)}>
                  Close
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