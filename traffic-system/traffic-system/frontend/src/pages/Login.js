import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { adminLogin } from "../api";
function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
const [password, setPassword] = useState("");

const handleLogin = async () => {
  setLoading(true);

  try {
    const response = await adminLogin(username, password);

    if (response.message === "Login successful") {
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("admin", JSON.stringify(response.admin));

      alert("Login successful!");

      navigate("/dashboard");
    } else {
      alert(response.message);
    }
  } catch (error) {
    console.error(error);
    alert("Server error. Please try again.");
  }

  setLoading(false);
};

  return (
    <div className="login-page">
      <div className="login-card">
        <img
          src="https://images.seeklogo.com/logo-png/37/1/sri-lanka-police-logo-png_seeklogo-374521.png"
          alt="Sri Lanka Police"
          className="logo"
        />
        <h2>Sri Lanka Police</h2>
        <p className="branch">Traffic Branch - Negombo</p>

        <div className="input-box">
          <span>👤</span>
          <input
  type="text"
  placeholder="Username"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
/>
        </div>

        <div className="input-box">
          <span>🔒</span>
          <input
  type="password"
  placeholder="Password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
/>
        </div>

        <div className="login-options">
          <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <input type="checkbox" /> Remember me
          </label>
          <Link to="/reset-password">Forgot Password?</Link>
        </div>

        <button className="login-btn" onClick={handleLogin} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="footer">© 2024 Sri Lanka Police. All rights reserved.</p>
      </div>
    </div>
  );
}

export default Login;