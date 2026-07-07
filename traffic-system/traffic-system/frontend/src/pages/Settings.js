import React, { useState } from "react";
import Layout from "../components/Layout";

function Settings() {
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState({ id: "256 556 656", name: "PS Perera", rank: "Traffic Officer" });
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("Sinhala");
  const [fontSize, setFontSize] = useState(false);
  const [notifAccident, setNotifAccident] = useState(true);
  const [notifViolation, setNotifViolation] = useState(true);
  const [notifSystem, setNotifSystem] = useState(true);
  const [notifShift, setNotifShift] = useState(false);
  const [notifEmergency, setNotifEmergency] = useState(true);

  const handleSave = () => {
    setEditMode(false);
    alert("Profile saved successfully!");
  };

  return (
    <Layout>
      <div className="page-box">
        <h2 className="page-heading">Settings</h2>

        {/* ── Officer Profile Settings ── */}
        <div className="settings-section">
          <h3 className="settings-section-title">Officer Profile Settings</h3>
          <div className="profile-card">
            <div className="profile-info">
              {editMode ? (
                <div className="profile-fields">
                  <div className="field-group">
                    <label className="field-label">ID</label>
                    <input className="field-input" value={profile.id} onChange={(e) => setProfile({ ...profile, id: e.target.value })} />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Name</label>
                    <input className="field-input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Rank</label>
                    <input className="field-input" value={profile.rank} onChange={(e) => setProfile({ ...profile, rank: e.target.value })} />
                  </div>
                </div>
              ) : (
                <div className="profile-fields">
                  <div className="profile-row"><span className="profile-label">ID</span><span className="profile-value">{profile.id}</span></div>
                  <div className="profile-row"><span className="profile-label">Name</span><span className="profile-value">{profile.name}</span></div>
                  <div className="profile-row"><span className="profile-label">Rank</span><span className="profile-value">{profile.rank}</span></div>
                </div>
              )}
            </div>

            <div className="profile-right">
              <div className="profile-avatar-big">👮</div>
              {editMode ? (
                <button className="btn-save-profile" onClick={handleSave}>✓ Save</button>
              ) : (
                <button className="btn-edit-profile" onClick={() => setEditMode(true)}>✏ Edit</button>
              )}
            </div>
          </div>
        </div>

        {/* ── App Preferences ── */}
        <div className="settings-section">
          <h3 className="settings-section-title">App Preferences</h3>

          <div className="pref-row">
            <span className="pref-label">Dark Mode</span>
            <div className={`toggle ${darkMode ? "toggle-on" : ""}`} onClick={() => setDarkMode(!darkMode)}>
              <div className="toggle-thumb" />
            </div>
          </div>

          <div className="pref-row">
            <span className="pref-label">Language selection</span>
            <select
              className="pref-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option>Sinhala</option>
              <option>English</option>
              <option>Tamil</option>
            </select>
          </div>

          <div className="pref-row">
            <span className="pref-label">Font size</span>
            <div className={`toggle ${fontSize ? "toggle-on" : ""}`} onClick={() => setFontSize(!fontSize)}>
              <div className="toggle-thumb" />
            </div>
          </div>
        </div>

        {/* ── Notification Settings ── */}
        <div className="settings-section">
          <h3 className="settings-section-title">Notification Setting</h3>

          {[
            { label: "Accident Alerts",   val: notifAccident,  set: setNotifAccident },
            { label: "Violation Alerts",  val: notifViolation, set: setNotifViolation },
            { label: "System Maintenance",val: notifSystem,    set: setNotifSystem },
            { label: "Shift Updates",     val: notifShift,     set: setNotifShift },
            { label: "Emergency Alerts",  val: notifEmergency, set: setNotifEmergency },
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
    </Layout>
  );
}

export default Settings;