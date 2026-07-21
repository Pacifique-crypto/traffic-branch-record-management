const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

const Admin = require("../models/Admin");

// ===========================
// REGISTER ADMIN / OIC
// ===========================
router.post("/register", async (req, res) => {
  try {
    const { fullName, username, password, role } = req.body;

    const existing = await Admin.findOne({ username });

    if (existing) {
      return res.status(400).json({
        message: "Username already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = new Admin({
      fullName,
      username,
      password: hashedPassword,
      role,
    });

    await admin.save();

    res.json({
      message: "Account created successfully",
    });

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// ===========================
// LOGIN ADMIN / OIC
// ===========================
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    const match = await bcrypt.compare(password, admin.password);

    if (!match) {
      return res.status(400).json({
        message: "Invalid password",
      });
    }

    res.json({
      message: "Login successful",
      admin: {
        id: admin._id,
        fullName: admin.fullName,
        username: admin.username,
        role: admin.role,
      },
    });

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// ===========================
// SEED ADMIN EMAILS ON LOAD
// ===========================
const seedAdminEmails = async () => {
  try {
    const admin = await Admin.findOne({ username: "admin" });
    if (admin && (!admin.email || admin.email === "")) {
      admin.email = "itofficer@negombo.police.lk";
      await admin.save();
    }
    const oic = await Admin.findOne({ username: "oic" });
    if (oic && (!oic.email || oic.email === "")) {
      oic.email = "oic@negombo.police.lk";
      await oic.save();
    }
  } catch (err) {
    console.error("Failed to seed admin emails:", err);
  }
};
seedAdminEmails();

// ===========================
// EMAIL OTP HELPER
// ===========================
const sendOtpEmail = async (email, otp, roleName) => {
  console.log(`[OTP VERIFICATION] OTP for ${email} (${roleName}) is: ${otp}`);
  
  const user = process.env.EMAIL_USER || "apacifique2500@gmail.com";
  const pass = (process.env.EMAIL_PASS || "brsfctnvllncupev").replace(/\s+/g, "");

  if (!user || !pass) {
    console.log("[SMTP] EMAIL_USER / EMAIL_PASS not set in environment variables. OTP printed to logs:", otp);
    return { success: false, reason: "SMTP credentials not configured" };
  }

  try {
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: { user, pass }
    });

    const mailOptions = {
      from: `"Sri Lanka Police Traffic System" <${user}>`,
      to: email,
      subject: `Traffic Branch System — ${roleName} Password Reset OTP`,
      text: `Your password reset OTP for ${roleName} account is: ${otp}. Valid for 15 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; max-width: 520px; margin: 0 auto;">
          <div style="background-color: #0f172a; padding: 16px 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 700;">SRI LANKA POLICE — TRAFFIC BRANCH</h2>
            <p style="color: #94a3b8; font-size: 11px; margin: 4px 0 0;">Password Reset Request (${roleName})</p>
          </div>
          <div style="padding: 20px 10px;">
            <p style="color: #334155; font-size: 14px; margin-top: 0;">Hello ${roleName},</p>
            <p style="color: #334155; font-size: 14px; line-height: 1.5;">You requested a password reset for your <strong>${roleName}</strong> account. Please use the following 6-digit One-Time Password (OTP) to complete your verification:</p>
            <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; padding: 18px; font-size: 32px; font-weight: 800; text-align: center; border-radius: 8px; letter-spacing: 6px; color: #0f172a; margin: 20px 0;">
              ${otp}
            </div>
            <p style="font-size: 12px; color: #64748b; line-height: 1.4;">This OTP code will expire in 15 minutes. If you did not initiate this request, please ignore this email.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email successfully delivered to ${email} for ${roleName}`);
    return { success: true };
  } catch (err) {
    console.error("Error sending OTP email via Nodemailer:", err);
    return { success: false, error: err.message };
  }
};

// ===========================
// FORGOT PASSWORD - REQUEST OTP
// ===========================
router.post("/forgot-password", async (req, res) => {
  try {
    const { email, role, username } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Please enter your Gmail address." });
    }

    let targetRole = "admin";
    if (role && role.toLowerCase().includes("oic")) {
      targetRole = "oic";
    } else if (username && username.toLowerCase().includes("oic")) {
      targetRole = "oic";
    }

    // 1. PRIORITIZE lookup by explicit role / username
    let admin = null;
    if (role || username) {
      const uname = username || (targetRole === "oic" ? "oic" : "admin");
      admin = await Admin.findOne({ username: uname });
      if (!admin) {
        admin = await Admin.findOne({ role: targetRole });
      }
    }

    // 2. Fallback lookup by email
    if (!admin) {
      admin = await Admin.findOne({ email: email.trim() });
    }

    if (!admin) {
      return res.status(404).json({ message: "No officer account found for password reset." });
    }

    // Update the targeted officer's email in MongoDB Atlas
    admin.email = email.trim();

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    admin.resetOtp = otp;
    admin.resetOtpExpires = Date.now() + 15 * 60 * 1000; // 15 mins
    await admin.save();

    const roleTitle = admin.role === "oic" ? "OIC Traffic Branch" : "IT Officer Admin";

    // Send email to Gmail
    const mailRes = await sendOtpEmail(email.trim(), otp, roleTitle);

    let msg = `OTP sent successfully to ${email} for ${roleTitle}. Please check your inbox.`;
    if (!mailRes.success) {
      msg = `OTP generated for ${roleTitle} (${email}). (Test OTP: ${otp})`;
    }

    res.json({
      message: msg,
      emailSent: mailRes.success,
      testOtp: !mailRes.success ? otp : undefined
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===========================
// VERIFY OTP
// ===========================
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp, role, username } = req.body;
    if (!otp) {
      return res.status(400).json({ message: "OTP code is required." });
    }

    let targetRole = role && role.toLowerCase().includes("oic") ? "oic" : "admin";
    if (username && username.toLowerCase().includes("oic")) targetRole = "oic";

    // Find account by OTP & role
    let admin = await Admin.findOne({
      role: targetRole,
      resetOtp: otp.trim(),
      resetOtpExpires: { $gt: Date.now() }
    });

    if (!admin) {
      // Fallback search by OTP alone
      admin = await Admin.findOne({
        resetOtp: otp.trim(),
        resetOtpExpires: { $gt: Date.now() }
      });
    }

    if (!admin) {
      return res.status(400).json({ message: "Invalid or expired OTP code. Please check and try again." });
    }

    res.json({ message: "OTP verified successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===========================
// RESET PASSWORD
// ===========================
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword, role, username } = req.body;
    if (!otp || !newPassword) {
      return res.status(400).json({ message: "OTP and new password are required." });
    }

    let targetRole = role && role.toLowerCase().includes("oic") ? "oic" : "admin";
    if (username && username.toLowerCase().includes("oic")) targetRole = "oic";

    // Prioritize updating the specifically targeted role (oic vs admin)
    let admin = await Admin.findOne({
      role: targetRole,
      resetOtp: otp.trim(),
      resetOtpExpires: { $gt: Date.now() }
    });

    if (!admin) {
      admin = await Admin.findOne({
        resetOtp: otp.trim(),
        resetOtpExpires: { $gt: Date.now() }
      });
    }

    if (!admin) {
      return res.status(400).json({ message: "Invalid or expired OTP code." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    admin.password = hashedPassword;
    admin.resetOtp = undefined;
    admin.resetOtpExpires = undefined;
    await admin.save();

    const roleName = admin.role === "oic" ? "OIC Traffic Branch" : "IT Officer";
    console.log(`Password successfully updated for ${admin.username} (${roleName})`);

    res.json({ message: `Password reset successfully for ${roleName}! You can now login.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;