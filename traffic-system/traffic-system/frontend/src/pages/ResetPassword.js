import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMail, FiKey, FiLock, FiArrowLeft, FiEye, FiEyeOff, FiUser } from "react-icons/fi";
import { forgotPassword, verifyOtp, resetPassword } from "../api";

function ResetPassword() {
  const navigate                  = useNavigate();
  const [step, setStep]           = useState(1);
  const [role, setRole]           = useState("oic");
  const [email, setEmail]         = useState("");
  const [otp, setOtp]             = useState("");
  const [newPw, setNewPw]         = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [showCPw, setShowCPw]     = useState(false);
  const [error, setError]         = useState("");
  const [infoMsg, setInfoMsg]     = useState("");
  const [loading, setLoading]     = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMsg("");

    if (!email) {
      setError("Please enter your Gmail address.");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid Gmail address.");
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPassword(email, role);
      if (res && !res.error && (res.message?.includes("OTP sent") || res.message?.includes("generated"))) {
        if (res.testOtp) {
          setInfoMsg(`OTP sent! (Test OTP: ${res.testOtp})`);
        } else {
          setInfoMsg(`OTP sent successfully to ${email}. Please check your Gmail inbox!`);
        }
        setStep(2);
      } else {
        setError(res.message || res.error || "Failed to send OTP.");
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (!otp) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOtp(email, otp, role);
      if (res && !res.error && !res.message?.includes("Invalid")) {
        setStep(3);
      } else {
        setError(res.message || res.error || "Invalid OTP. Please try again.");
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    if (!newPw) {
      setError("Please enter a new password.");
      return;
    }
    if (newPw.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(email, otp, newPw, role);
      if (res && !res.error && !res.message?.includes("Invalid")) {
        alert(res.message || "Password reset successfully! Please login with your new password.");
        navigate("/login");
      } else {
        setError(res.message || res.error || "Failed to reset password.");
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-pro">
      <div className="login-card-pro" style={{ maxWidth: 420 }}>

        {/* Back Button */}
        <button
          className="rp-back-pro"
          onClick={() => (step === 1 ? navigate("/login") : setStep(step - 1))}
        >
          <FiArrowLeft style={{ marginRight: 6 }} /> Back
        </button>

        <h2 className="rp-title-pro">Reset Password</h2>
        <p className="rp-sub-pro">
          {step === 1 && "Select your account and enter your Gmail address to receive an OTP directly in your inbox."}
          {step === 2 && `Enter the 6-digit OTP sent to ${email}`}
          {step === 3 && "Enter and confirm your new password."}
        </p>

        {/* Step indicator */}
        <div className="rp-steps-pro">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={`rp-step-circle ${step >= s ? "rp-step-done" : ""}`}>{s}</div>
              {s < 3 && <div className={`rp-step-line ${step > s ? "rp-step-line-done" : ""}`} />}
            </React.Fragment>
          ))}
        </div>
        <div className="rp-step-labels">
          <span>Gmail</span>
          <span>OTP</span>
          <span>Password</span>
        </div>

        {/* STEP 1 — Role & Gmail Address */}
        {step === 1 && (
          <form onSubmit={handleSendOtp}>

            <div className="login-field-pro">
              <label className="login-label-pro">Account Type</label>
              <div className="login-input-wrap-pro">
                <FiUser className="login-icon-pro" />
                <select
                  className="login-input-pro"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{ cursor: "pointer", appearance: "auto" }}
                >
                  <option value="oic">OIC (OIC Traffic Branch)</option>
                  <option value="admin">IT Officer (System Admin)</option>
                </select>
              </div>
            </div>

            <div className="login-field-pro">
              <label className="login-label-pro">Gmail Address</label>
              <div className="login-input-wrap-pro">
                <FiMail className="login-icon-pro" />
                <input
                  className="login-input-pro"
                  type="email"
                  placeholder="Enter your Gmail (e.g. name@gmail.com)"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                />
              </div>
            </div>

            {error && <p className="login-error-pro">{error}</p>}

            <button className="login-btn-pro" type="submit" disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP to Gmail"}
            </button>
          </form>
        )}

        {/* STEP 2 — Enter OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            {infoMsg && (
              <p style={{ fontSize: 12, color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px 12px", borderRadius: 8, marginBottom: 14 }}>
                {infoMsg}
              </p>
            )}

            <div className="login-field-pro">
              <label className="login-label-pro">Enter 6-Digit OTP</label>
              <div className="login-input-wrap-pro">
                <FiKey className="login-icon-pro" />
                <input
                  className="login-input-pro otp-input"
                  type="text"
                  placeholder="6-digit OTP code"
                  value={otp}
                  maxLength={6}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ""));
                    setError("");
                  }}
                />
              </div>
            </div>

            {error && <p className="login-error-pro">{error}</p>}

            <p className="rp-resend-pro">
              Didn't receive the email?{" "}
              <button
                type="button"
                className="rp-resend-btn"
                onClick={async () => {
                  try {
                    const res = await forgotPassword(email, role);
                    if (res?.testOtp) {
                      alert(`New OTP generated: ${res.testOtp}`);
                    } else {
                      alert("New OTP sent to your Gmail inbox!");
                    }
                  } catch (err) {
                    alert("Failed to resend OTP.");
                  }
                }}
              >
                Resend OTP
              </button>
            </p>

            <button className="login-btn-pro" type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        )}

        {/* STEP 3 — New Password */}
        {step === 3 && (
          <form onSubmit={handleReset}>
            <div className="login-field-pro">
              <label className="login-label-pro">New Password</label>
              <div className="login-input-wrap-pro">
                <FiLock className="login-icon-pro" />
                <input
                  className="login-input-pro"
                  type={showPw ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={newPw}
                  onChange={(e) => {
                    setNewPw(e.target.value);
                    setError("");
                  }}
                />
                <button
                  type="button"
                  className="login-eye-pro"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <div className="login-field-pro">
              <label className="login-label-pro">Confirm New Password</label>
              <div className="login-input-wrap-pro">
                <FiLock className="login-icon-pro" />
                <input
                  className="login-input-pro"
                  type={showCPw ? "text" : "password"}
                  placeholder="Re-enter new password"
                  value={confirmPw}
                  onChange={(e) => {
                    setConfirmPw(e.target.value);
                    setError("");
                  }}
                />
                <button
                  type="button"
                  className="login-eye-pro"
                  onClick={() => setShowCPw(!showCPw)}
                >
                  {showCPw ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {error && <p className="login-error-pro">{error}</p>}

            <button className="login-btn-pro" type="submit" disabled={loading}>
              {loading ? "Resetting Password..." : "Reset Password"}
            </button>
          </form>
        )}

        <p className="login-footer-pro" style={{ marginTop: 20 }}>
          © 2026 Sri Lanka Police Traffic Branch<br />All rights reserved.
        </p>

      </div>
    </div>
  );
}

export default ResetPassword;