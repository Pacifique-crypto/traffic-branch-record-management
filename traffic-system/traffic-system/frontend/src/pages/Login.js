import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiUser, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { loginAdmin } from "../api";

function Login() {
  const navigate = useNavigate();
  const [username, setUsername]   = useState("");
  const [password, setPassword]   = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!username || !password) { setError("Please enter username and password."); return; }

    setLoading(true);
    try {
      const res = await loginAdmin(username, password);
      if (res && res.admin) {
        let mappedRole = res.admin.role;
        if (mappedRole === "admin") {
          mappedRole = "IT Officer";
        } else if (mappedRole === "oic") {
          mappedRole = "OIC";
        }

        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userRole", mappedRole);
        localStorage.setItem("officer", JSON.stringify({ name: res.admin.fullName, role: mappedRole }));
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
      <div className="login-card-pro">
        <img
          src="https://images.seeklogo.com/logo-png/37/1/sri-lanka-police-logo-png_seeklogo-374521.png"
          alt="Sri Lanka Police"
          className="login-logo-pro"
        />
        <h2 className="login-title-pro">SRI LANKA POLICE</h2>
        <p className="login-sub-pro">Traffic Branch - Negombo</p>

        <form onSubmit={handleLogin}>
          <div className="login-field-pro">
            <label className="login-label-pro">Username</label>
            <div className="login-input-wrap-pro">
              <FiUser className="login-icon-pro" />
              <input
                className="login-input-pro"
                type="text"
                placeholder="Enter username"
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
                placeholder="Enter password"
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
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="login-footer-pro">
          © 2024 Sri Lanka Police Traffic Branch<br />All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default Login;