import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const roles = ["OIC", "Traffic Officer", "Administrator"];

function Login() {
  const navigate = useNavigate();
  const [step, setStep]       = useState(1); // 1 = role, 2 = credentials
  const [role, setRole]       = useState("");
  const [dropOpen, setDropOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState("");

  // STEP 1 — Role selection
  const handleEnter = () => {
    if (!role) { setError("Please select a user role."); return; }
    setError("");
    setStep(2);
  };

  // STEP 2 — Login
  const handleLogin = () => {
    setError("");
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userRole", role);
    navigate("/dashboard");
  };

  return (
    <div className="nlp-page">
      <div className="nlp-card">

        {/* Logo */}
        <img
          src="https://images.seeklogo.com/logo-png/37/1/sri-lanka-police-logo-png_seeklogo-374521.png"
          alt="Sri Lanka Police"
          className="nlp-logo"
        />
        <h2 className="nlp-title">SRI LANKA POLICE</h2>
        <p className="nlp-subtitle">Traffic Branch- Negombo</p>

        {/* ── STEP 1 — Role Selection ── */}
        {step === 1 && (
          <>
            <div className="nlp-field-label">UserRole</div>

            {/* Custom dropdown */}
            <div className="nlp-dropdown-wrap">
              <div
                className="nlp-dropdown-box"
                onClick={() => { setDropOpen(!dropOpen); setError(""); }}
              >
                <span className="nlp-drop-icon">👤</span>
                <span className="nlp-drop-value" style={{ color: role ? "#1e293b" : "#94a3b8" }}>
                  {role || ""}
                </span>
                <span className="nlp-drop-arrow">▾</span>
              </div>

              {dropOpen && (
                <div className="nlp-dropdown-list">
                  {roles.map((r) => (
                    <div
                      key={r}
                      className={`nlp-dropdown-item ${role === r ? "nlp-drop-selected" : ""}`}
                      onClick={() => { setRole(r); setDropOpen(false); }}
                    >
                      {r}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && <p className="nlp-error">{error}</p>}

            <button className="nlp-btn" onClick={handleEnter}>Enter</button>
          </>
        )}

        {/* ── STEP 2 — Username & Password ── */}
        {step === 2 && (
          <>
            <div className="nlp-field-label">UserName</div>
            <div className="nlp-input-box">
              <span className="nlp-input-icon">👤</span>
              <input
                className="nlp-input"
                type="text"
                placeholder=""
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="nlp-field-label" style={{ marginTop: "14px" }}>Password</div>
            <div className="nlp-input-box">
              <span className="nlp-input-icon">🔒</span>
              <input
                className="nlp-input"
                type="password"
                placeholder=""
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="nlp-error">{error}</p>}

            <div className="nlp-options-row">
              <label className="nlp-remember">
                <input type="checkbox" /> Remember me
              </label>
              <Link to="/reset-password" className="nlp-forgot">Reset password</Link>
            </div>

            <button className="nlp-btn" onClick={handleLogin}>Login</button>

            <button
              className="nlp-back-btn"
              onClick={() => { setStep(1); setError(""); }}
            >
              ← Back
            </button>
          </>
        )}

        <p className="nlp-footer">
          © 2024 Sri Lanka Police Traffic Branch<br />All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default Login;