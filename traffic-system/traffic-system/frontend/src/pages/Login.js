import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FiUser,
  FiLock,
  FiEye,
  FiEyeOff,
  FiShield,
  FiUsers,
  FiTrendingUp,
  FiArrowRight,
} from "react-icons/fi";
import { loginAdmin } from "../api";
import bgImage from "../assets/traffic_police_bg.jpg";

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!username || !password) { setError("Please enter username and password."); return; }

    setLoading(true);
    try {
      const res = await loginAdmin(username, password);
      const user = res.user || res.admin;
      if (res && user) {
        let mappedRole = user.role;
        if (mappedRole === "admin") {
          mappedRole = "IT Officer";
        } else if (mappedRole === "oic") {
          mappedRole = "OIC";
        }

        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("token", res.token);
        localStorage.setItem("userRole", mappedRole);
        localStorage.setItem("officer", JSON.stringify({ name: user.fullName, role: mappedRole }));
        navigate("/dashboard");
        return;
      } else {
        setError(res.message || "Invalid username or password.");
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError("An error occurred. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-pro">
      <div className="login-container-pro">
        {/* Left Section - Sri Lanka Traffic Police visual panel */}
        <div className="login-left-panel" style={{ backgroundImage: `url(${bgImage})` }}>
          <div className="login-left-overlay">
            <div className="login-left-top">
              <h2 className="login-quote-heading">
                “Safer Roads<br />Brighter Tomorrows”
              </h2>
              <p className="login-quote-sub">
                Our Commitment<br />Your Safety
              </p>
            </div>

            <div className="login-left-features">
              <div className="login-feature-item">
                <FiShield className="login-feature-icon" />
                <span>Serve the People</span>
              </div>
              <div className="login-feature-divider"></div>

              <div className="login-feature-item">
                <FiUsers className="login-feature-icon" />
                <span>Ensure Safer Roads</span>
              </div>
              <div className="login-feature-divider"></div>

              <div className="login-feature-item">
                <FiTrendingUp className="login-feature-icon" />
                <span>Build a Safer Sri Lanka</span>
              </div>
            </div>

            <div className="login-left-bottom">
              <span>TOGETHER FOR A</span>
              <br />
              <strong>SAFER TOMORROW</strong>
            </div>
          </div>
        </div>

        {/* Right Section - Clean white login card */}
        <div className="login-card-pro">
          <div className="login-header-section">
            <img
              src="https://images.seeklogo.com/logo-png/37/1/sri-lanka-police-logo-png_seeklogo-374521.png"
              alt="Sri Lanka Police"
              className="login-logo-pro"
            />
            <h2 className="login-title-pro">SRI LANKA POLICE</h2>
            <p className="login-sub-pro">TRAFFIC BRANCH - NEGOMBO</p>

            <div className="login-motto-divider">
              <span className="login-motto-line"></span>
              <span className="login-motto-text">DISCIPLINE | SERVICE | SAFETY</span>
              <span className="login-motto-line"></span>
            </div>

            <h3 className="login-officer-title">Login</h3>
            <p className="login-officer-sub">Access your account to continue</p>
          </div>

          <form onSubmit={handleLogin} className="login-form-pro">
            <div className="login-field-pro">
              <label className="login-label-pro">Username</label>
              <div className="login-input-wrap-pro">
                <FiUser className="login-icon-pro" />
                <input
                  className="login-input-pro"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(""); }}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="login-field-pro">
              <label className="login-label-pro">Password</label>
              <div className="login-input-wrap-pro">
                <FiLock className="login-icon-pro" />
                <input
                  className="login-input-pro"
                  type={showPw ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  autoComplete="current-password"
                />
                <button type="button" className="login-eye-pro" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {error && <p className="login-error-pro">{error}</p>}

            <div className="login-options-pro">
              <label className="login-remember-pro">
                <input type="checkbox" /> Remember me
              </label>
              <Link to="/reset-password" className="login-forgot-pro">Forgot password?</Link>
            </div>

            <button className="login-btn-pro" type="submit" disabled={loading}>
              {loading ? "Logging in..." : (
                <>
                  LOGIN <FiArrowRight className="login-btn-arrow" />
                </>
              )}
            </button>
          </form>

          <div>
            <div className="login-footer-divider"></div>

            <div className="login-footer-pro">
              <p className="login-footer-system">Group 13 – Traffic Branch Management System</p>
              <p className="login-footer-branch">Sri Lanka Police – Traffic Branch, Negombo</p>
              <p className="login-footer-copy">© 2026 | All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;