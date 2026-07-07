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

module.exports = router;