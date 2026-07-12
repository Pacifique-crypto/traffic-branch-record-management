import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMail, FiKey, FiLock, FiArrowLeft, FiEye, FiEyeOff } from "react-icons/fi";

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

  const handleSendOtp = (e) => {
    e.preventDefault();
    setError("");
    if (!email) { setError("Please enter your email address."); return; }
    if (!email.includes("@")) { setError("Please enter a valid email address."); return; }
    setLoading(true);
    // Simulate OTP send — in production, call your API
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setSentOtp(generatedOtp);
    console.log("OTP (dev only):", generatedOtp); // remove in production
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 900);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setError("");
    if (!otp) { setError("Please enter the OTP."); return; }
    if (otp !== sentOtp) { setError("Invalid OTP. Please try again."); return; }
    setStep(3);
  };

  const handleReset = (e) => {
    e.preventDefault();
    setError("");
    if (!newPw) { setError("Please enter a new password."); return; }
    if (newPw.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (newPw !== confirmPw) { setError("Passwords do not match."); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert("Password reset successfully! Please login with your new password.");
      navigate("/login");
    }, 900);
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
              <button type="button" className="rp-resend-btn" onClick={() => { setSentOtp(Math.floor(100000 + Math.random() * 900000).toString()); alert("New OTP sent!"); }}>
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