import React, { useState } from "react";
import OICLayout from "../layouts/OICLayout";
 

function Settings() {
  const userRole = localStorage.getItem("userRole");
  let LayoutComponent;
  if (userRole === "OIC") {
    LayoutComponent = require("../layouts/OICLayout").default;
  } else {
    LayoutComponent = require("../layouts/ITLayout").default;
  }
 
  const officer = JSON.parse(localStorage.getItem("officer") || "{}");
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile]   = useState({
    name:      officer.name || "PS Perera",
    rank:      officer.role || userRole || "OIC",
    contactNo: "+94 712 345 678",
    email:     "officer@slpolice.lk",
  });
 
  const [darkMode,       setDarkMode]       = useState(false);
  const [language,       setLanguage]       = useState("English");
  const [notifAccident,  setNotifAccident]  = useState(true);
  const [notifViolation, setNotifViolation] = useState(true);
  const [notifSystem,    setNotifSystem]    = useState(true);
  const [notifShift,     setNotifShift]     = useState(false);
  const [notifEmergency, setNotifEmergency] = useState(true);
 
  const handleSave = () => {
    localStorage.setItem("officer", JSON.stringify({ name: profile.name, role: profile.rank }));
    setEditMode(false);
    alert("Profile saved!");
  };
 
  return (
    <LayoutComponent>
      <div className="page-box">
        <h2 className="page-heading">Settings</h2>
 
        {/* Officer Profile */}
        <div className="settings-section">
          <h3 className="settings-section-title">Officer Profile Settings</h3>
          <div className="um-form-grid">
            {[
              { label: "Name",       key: "name" },
              { label: "Role",       key: "role" },
              { label: "Contact No", key: "contactNo" },
              { label: "Email",      key: "email" },
            ].map(({ label, key }) => (
              <div className="field-group" key={key}>
                <label className="field-label">{label}</label>
                {editMode ? (
                  <input className="field-input" value={profile[key]} onChange={e => setProfile({ ...profile, [key]: e.target.value })} />
                ) : (
                  <p style={{ fontSize: 13, color: "#374151", padding: "9px 0" }}>{profile[key]}</p>
                )}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
            {editMode ? (
              <>
                <button className="btn-cancel" onClick={() => setEditMode(false)}>Cancel</button>
                <button className="pro-btn-primary" onClick={handleSave}>Save Changes</button>
              </>
            ) : (
              <button className="pro-btn-primary" onClick={() => setEditMode(true)}>✏ Edit Profile</button>
            )}
          </div>
        </div>
 
        {/* App Preferences */}
        <div className="settings-section">
          <h3 className="settings-section-title">App Preferences</h3>
          <div className="pref-row">
            <span className="pref-label">Dark Mode</span>
            <div className={`toggle ${darkMode ? "toggle-on" : ""}`} onClick={() => setDarkMode(!darkMode)}>
              <div className="toggle-thumb" />
            </div>
          </div>
          <div className="pref-row">
            <span className="pref-label">Language</span>
            <select className="pref-select" value={language} onChange={e => setLanguage(e.target.value)}>
              <option>English</option>
              <option>Sinhala</option>
              <option>Tamil</option>
            </select>
          </div>
        </div>
 
        {/* Notification Settings */}
        <div className="settings-section">
          <h3 className="settings-section-title">Notification Settings</h3>
          {[
            { label: "Accident Alerts",    val: notifAccident,  set: setNotifAccident },
            { label: "Violation Alerts",   val: notifViolation, set: setNotifViolation },
            { label: "System Maintenance", val: notifSystem,    set: setNotifSystem },
            { label: "Shift Updates",      val: notifShift,     set: setNotifShift },
            { label: "Emergency Alerts",   val: notifEmergency, set: setNotifEmergency },
          ].map((item) => (
            <div className="pref-row" key={item.label}>
              <span className="pref-label">{item.label}</span>
              <div className={`toggle ${item.val ? "toggle-on" : ""}`} onClick={() => item.set(!item.val)}>
                <div className="toggle-thumb" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </LayoutComponent>
  );
}
 
export default Settings;