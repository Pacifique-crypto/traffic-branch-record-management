const express = require("express");
const router = express.Router();
const { verifyToken, authorizeRoles } = require("../middlewares/authMiddleware");
const Officer = require("../models/Officer");
const bcrypt = require("bcryptjs");

// REGISTER OFFICER
router.post("/register", verifyToken, authorizeRoles("oic", "admin"), async (req, res) => {
  try {
    console.log("Register payload received on backend:", req.body);
    const targetUsername = (username && username.trim()) ? username.trim() : (policeId || "").trim();
    const targetPoliceId = (policeId && policeId.trim()) ? policeId.trim() : targetUsername;

    const existing = await Officer.findOne({ $or: [{ policeId: targetPoliceId }, { username: targetUsername }, { nic }] });
    if (existing) {
      return res.status(400).json({ message: "Officer already registered with this NIC, Username or Police ID" });
    }

    // 🔐 hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newOfficer = new Officer({
      fullName,
      dob: dob ? dob : undefined,
      policeId: targetPoliceId,
      gender,
      contactNo,
      username: targetUsername,
      nic,
      password: hashedPassword,
      email,
      rank,
      role,
      address,
      status: status || "Pending"
    });

    await newOfficer.save();
    res.status(201).json({ message: "Officer registered successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const jwt = require("jsonwebtoken");

// LOGIN OFFICER
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const officer = await Officer.findOne({ $or: [{ username }, { policeId: username }] });

    if (!officer) {
      return res.status(400).json({ message: "User not found" });
    }

    if (officer.status === "Pending") {
      return res.status(400).json({ message: "Your account is pending OIC approval." });
    }

    if (officer.status === "Deactive") {
      return res.status(400).json({ message: "Your account has been deactivated." });
    }

    // 🔐 compare password
    const isMatch = await bcrypt.compare(password, officer.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: officer._id, role: officer.role || "officer", username: officer.username },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    const officerProfile = officer.toObject();
    delete officerProfile.password;

    res.json({
      message: "Login successful",
      token,
      user: {
        id: officer._id,
        fullName: officer.fullName,
        username: officer.username,
        policeId: officer.policeId,
        role: officer.role || "officer",
      },
      officer: officerProfile
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET LOGGED-IN OFFICER PROFILE
router.get("/me", verifyToken, async (req, res) => {
  try {
    const officer = await Officer.findById(req.user.id).select("-password");
    if (!officer) {
      return res.status(404).json({ message: "Officer profile not found" });
    }
    res.json(officer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE LOGGED-IN OFFICER PROFILE
router.put("/me", verifyToken, async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData.password;
    delete updateData.role;

    // Check if user is an IT officer or admin
    const userRole = (req.user.role || "").toLowerCase().trim();
    const isITOfficer = ["admin", "it officer", "itofficer", "it_officer", "it", "it officer/admin", "it officer admin", "oic", "oic traffic branch"].some(r => userRole.includes(r));

    // Non-IT officers (regular traffic officers) cannot modify work information
    if (!isITOfficer) {
      delete updateData.rank;
      delete updateData.station;
      delete updateData.assignedArea;
      delete updateData.joinedDate;
    }

    const mongoose = require("mongoose");
    let targetOfficer = null;
    if (req.user && req.user.id && mongoose.Types.ObjectId.isValid(req.user.id)) {
      targetOfficer = await Officer.findById(req.user.id);
    }
    if (!targetOfficer && req.user && req.user.username) {
      targetOfficer = await Officer.findOne({ username: req.user.username });
    }

    if (!targetOfficer) {
      return res.status(404).json({ message: "Officer profile not found" });
    }

    const updatedOfficer = await Officer.findByIdAndUpdate(
      targetOfficer._id,
      updateData,
      { new: true }
    ).select("-password");

    res.json(updatedOfficer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET ALL OFFICERS
router.get("/", verifyToken, authorizeRoles("oic", "admin"), async (req, res) => {
  try {
    const officers = await Officer.find().select("-password");
    res.json(officers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE OFFICER BY ID OR USERNAME OR POLICE ID
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const userRole = (req.user.role || "").toLowerCase().trim();
    const adminRoles = ["admin", "it officer", "itofficer", "it_officer", "it", "it officer/admin", "it officer admin", "oic", "oic traffic branch"];
    const isManager = adminRoles.some(r => userRole.includes(r));

    const mongoose = require("mongoose");
    const paramId = req.params.id;

    let officerToUpdate = null;
    if (paramId === "me" || String(paramId) === String(req.user.id)) {
      if (req.user.id && mongoose.Types.ObjectId.isValid(req.user.id)) {
        officerToUpdate = await Officer.findById(req.user.id);
      }
    }

    if (!officerToUpdate) {
      if (mongoose.Types.ObjectId.isValid(paramId)) {
        officerToUpdate = await Officer.findById(paramId);
      }
    }

    if (!officerToUpdate) {
      officerToUpdate = await Officer.findOne({
        $or: [
          { policeId: paramId },
          { username: paramId },
          { nic: paramId },
          ...(req.user.username ? [{ username: req.user.username }] : []),
          ...(req.user.policeId ? [{ policeId: req.user.policeId }] : [])
        ]
      });
    }

    if (!officerToUpdate) {
      return res.status(404).json({ message: "Officer profile not found" });
    }

    const isSelf = String(officerToUpdate._id) === String(req.user.id) ||
                   (req.user.username && officerToUpdate.username === req.user.username) ||
                   (req.user.policeId && officerToUpdate.policeId === req.user.policeId) ||
                   paramId === "me";

    if (!isSelf && !isManager) {
      return res.status(403).json({ message: "Forbidden. You do not have permission." });
    }

    const updateData = { ...req.body };
    delete updateData.password;
    delete updateData.role;

    // Non-IT/non-manager officers cannot modify work information fields
    if (!isManager) {
      delete updateData.rank;
      delete updateData.station;
      delete updateData.assignedArea;
      delete updateData.joinedDate;
    }

    if (req.body.password && isManager) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(req.body.password, salt);
    }

    const updatedOfficer = await Officer.findByIdAndUpdate(
      officerToUpdate._id,
      updateData,
      { new: true }
    ).select("-password");

    res.json(updatedOfficer);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE OFFICER
router.delete("/:id", verifyToken, authorizeRoles("admin"), async (req, res) => {
  try {

    await Officer.findByIdAndDelete(req.params.id);

    res.json({
      message: "Officer deleted successfully",
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;