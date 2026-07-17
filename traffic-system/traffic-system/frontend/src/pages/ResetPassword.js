import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMail, FiKey, FiLock, FiArrowLeft, FiEye, FiEyeOff } from "react-icons/fi";
import { forgotPassword, verifyOtp, resetPassword } from "../api";

// step 1 = enter email, step 2 = enter OTP, step 3 = new password
function ResetPassword() {
  const navigate  = useNavigate();
  const [step, setStep]           = useState(1);
  const [email, setEmail]         = useState("");
  const [otp, setOtp]             = useState("");
  const [newPw, setNewPw]         = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [showCPw, setShowCPw]     = useState(false);
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [sentOtp, setSentOtp]     = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (!email) { setError("Please enter your email address."); return; }
    if (!email.includes("@")) { setError("Please enter a valid email address."); return; }
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      if (res && !res.error && !res.message?.includes("No registered")) {
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
    if (!otp) { setError("Please enter the OTP."); return; }
    setLoading(true);
    try {
      const res = await verifyOtp(email, otp);
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
    if (!newPw) { setError("Please enter a new password."); return; }
    if (newPw.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (newPw !== confirmPw) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const res = await resetPassword(email, otp, newPw);
      if (res && !res.error && !res.message?.includes("Invalid")) {
        alert("Password reset successfully! Please login with your new password.");
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
      <div className="login-card-pro" style={{ maxWidth: 380 }}>

        {/* Back */}
        <button className="rp-back-pro" onClick={() => step === 1 ? navigate("/login") : setStep(step - 1)}>
          <FiArrowLeft style={{ marginRight: 6 }} /> Back
        </button>

        <h2 className="rp-title-pro">Reset Password</h2>
        <p className="rp-sub-pro">
          {step === 1 && "Enter your registered IT Officer email to receive an OTP."}
          {step === 2 && `Enter the 6-digit OTP sent to ${email}`}
          {step === 3 && "Enter and confirm your new password."}
        </p>

        {/* Step indicator */}
        <div className="rp-steps-pro">
          {[1,2,3].map((s) => (
            <React.Fragment key={s}>
              <div className={`rp-step-circle ${step >= s ? "rp-step-done" : ""}`}>{s}</div>
              {s < 3 && <div className={`rp-step-line ${step > s ? "rp-step-line-done" : ""}`} />}
            </React.Fragment>
          ))}
        </div>
        <div className="rp-step-labels">
          <span>Email</span><span>OTP</span><span>Password</span>
        </div>

        {/* STEP 1 — Email */}
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div className="login-field-pro">
              <label className="login-label-pro">Email Address</label>
              <div className="login-input-wrap-pro">
                <FiMail className="login-icon-pro" />
                <input
                  className="login-input-pro"
                  type="email"
                  placeholder="IT Officer email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                />
              </div>
            </div>
            {error && <p className="login-error-pro">{error}</p>}
            <button className="login-btn-pro" type="submit" disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* STEP 2 — OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <div className="login-field-pro">
              <label className="login-label-pro">Enter OTP</label>
              <div className="login-input-wrap-pro">
                <FiKey className="login-icon-pro" />
                <input
                  className="login-input-pro otp-input"
                  type="text"
                  placeholder="6-digit OTP"
                  value={otp}
                  maxLength={6}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/,"")); setError(""); }}
                />
              </div>
            </div>
            {error && <p className="login-error-pro">{error}</p>}
            <p className="rp-resend-pro">
              Didn't receive it?{" "}
              <button
                type="button"
                className="rp-resend-btn"
                onClick={async () => {
                  try {
                    await forgotPassword(email);
                    alert("New OTP sent!");
                  } catch (err) {
                    alert("Failed to resend OTP.");
                  }
                }}
              >
                Resend OTP
              </button>
            </p>
            <button className="login-btn-pro" type="submit">Verify OTP</button>
          </form>
        )}

        {/* STEP 3 — New password */}
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
                  onChange={(e) => { setNewPw(e.target.value); setError(""); }}
                />
                <button type="button" className="login-eye-pro" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>
            <div className="login-field-pro">
              <label className="login-label-pro">Confirm Password</label>
              <div className="login-input-wrap-pro">
                <FiLock className="login-icon-pro" />
                <input
                  className="login-input-pro"
                  type={showCPw ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={confirmPw}
                  onChange={(e) => { setConfirmPw(e.target.value); setError(""); }}
                />
                <button type="button" className="login-eye-pro" onClick={() => setShowCPw(!showCPw)}>
                  {showCPw ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>
            {error && <p className="login-error-pro">{error}</p>}
            <button className="login-btn-pro" type="submit" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <p className="login-footer-pro" style={{ marginTop: 20 }}>
          © 2024 Sri Lanka Police Traffic Branch<br />All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;