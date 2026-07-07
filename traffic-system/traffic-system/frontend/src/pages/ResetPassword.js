import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function ResetPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleReset = () => {
    setLoading(true);
    setTimeout(() => {
      navigate("/login");
    }, 500);
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
        <p className="branch">Reset Password</p>

        <div className="input-box">
          <span>📧</span>
          <input type="email" placeholder="Email address"/>
        </div>

        <button className="login-btn" onClick={handleReset} disabled={loading}>
          {loading ? "Sending..." : "Send Email"}  
        </button>
         <br /> <br />

        <div className="input-box">
          <span>🔒</span>
          <input type="password" placeholder="New password" />
        </div>

        <div className="input-box">
          <span>🔒</span>
          <input type="password" placeholder="Confirm new password" />
        </div>

        <button className="login-btn" onClick={handleReset} disabled={loading}>
          {loading ? "Resetting..." : "Reset Password"}
        </button>

        <div style={{ marginTop: "14px" }}>
          <Link to="/login" className="reset-link">← Back to Login</Link>
        </div>

        <p className="footer">© 2024 Sri Lanka Police. All rights reserved.</p>
      </div>
    </div>
  );
}

export default ResetPassword;