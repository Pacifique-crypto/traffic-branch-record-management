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
      console.log("Admin email seeded successfully.");
    }
    const oic = await Admin.findOne({ username: "oic" });
    if (oic && (!oic.email || oic.email === "")) {
      oic.email = "oic@negombo.police.lk";
      await oic.save();
      console.log("OIC email seeded successfully.");
    }
  } catch (err) {
    console.error("Failed to seed admin emails:", err);
  }
};
seedAdminEmails();

// ===========================
// EMAIL OTP HELPER
// ===========================
const sendOtpEmail = async (email, otp) => {
  console.log(`[OTP VERIFICATION] OTP for ${email} is: ${otp}`);
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("SMTP credentials missing in environment variables. OTP printed in logs.");
    return;
  }

  try {
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"Sri Lanka Police" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Verification OTP",
      text: `Your password reset OTP is: ${otp}. It is valid for 15 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #1e3a8a;">Sri Lanka Police</h2>
          <p>You requested a password reset. Please use the following One-Time Password (OTP) to complete the verification:</p>
          <div style="background-color: #f1f5f9; padding: 12px; font-size: 24px; font-weight: 700; text-align: center; border-radius: 6px; letter-spacing: 4px; color: #1e3a8a;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #64748b; margin-top: 20px;">This OTP will expire in 15 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email successfully sent to ${email}`);
  } catch (err) {
    console.error("Error sending OTP email:", err);
  }
};

// ===========================
// FORGOT PASSWORD - REQUEST OTP
// ===========================
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Please enter your email address." });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "No registered administrator found with this email address." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    admin.resetOtp = otp;
    admin.resetOtpExpires = Date.now() + 15 * 60 * 1000; // 15 mins
    await admin.save();

    await sendOtpEmail(email, otp);

    res.json({ message: "OTP sent successfully to your registered email address." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===========================
// VERIFY OTP
// ===========================
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP code are required." });
    }

    const admin = await Admin.findOne({
      email,
      resetOtp: otp,
      resetOtpExpires: { $gt: Date.now() }
    });

    if (!admin) {
      return res.status(400).json({ message: "Invalid or expired OTP code. Please try again." });
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
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP and new password are required." });
    }

    const admin = await Admin.findOne({
      email,
      resetOtp: otp,
      resetOtpExpires: { $gt: Date.now() }
    });

    if (!admin) {
      return res.status(400).json({ message: "Invalid or expired OTP code." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    admin.password = hashedPassword;
    admin.resetOtp = undefined;
    admin.resetOtpExpires = undefined;
    await admin.save();

    res.json({ message: "Password reset successfully. You can now login with your new password." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;