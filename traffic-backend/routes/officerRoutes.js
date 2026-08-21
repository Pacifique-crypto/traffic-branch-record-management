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
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    let officer = await Officer.findOne({
      $or: [
        { username: username.trim() },
        { policeId: username.trim() },
        { nic: username.trim() }
      ]
    });

    if (!officer) {
      // Fallback check Admin collection for OIC / IT Admin
      const Admin = require("../models/Admin");
      const admin = await Admin.findOne({ username: username.trim() });
      if (admin) {
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
          return res.status(400).json({ message: "Invalid password" });
        }
        const token = jwt.sign(
          { id: admin._id, _id: admin._id, role: admin.role, username: admin.username },
          process.env.JWT_SECRET,
          { expiresIn: "24h" }
        );
        return res.json({
          message: "Login successful",
          token,
          user: {
            id: admin._id,
            fullName: admin.fullName,
            username: admin.username,
            role: admin.role
          },
          officer: {
            _id: admin._id,
            fullName: admin.fullName,
            username: admin.username,
            role: admin.role,
            email: admin.email || ""
          }
        });
      }

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
      { id: officer._id, _id: officer._id, role: officer.role || "officer", username: officer.username, policeId: officer.policeId },
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
    const mongoose = require("mongoose");
    const Admin = require("../models/Admin");

    let userDoc = null;
    const uId = req.user?.id || req.user?._id;
    if (uId && mongoose.Types.ObjectId.isValid(uId)) {
      userDoc = await Officer.findById(uId).select("-password");
    }

    if (!userDoc && req.user?.username) {
      userDoc = await Officer.findOne({ username: req.user.username }).select("-password");
    }

    if (!userDoc && req.user?.policeId) {
      userDoc = await Officer.findOne({ policeId: req.user.policeId }).select("-password");
    }

    // Fallback check Admin model if not found in Officer model
    if (!userDoc && uId && mongoose.Types.ObjectId.isValid(uId)) {
      userDoc = await Admin.findById(uId).select("-password");
    }
    if (!userDoc && req.user?.username) {
      userDoc = await Admin.findOne({ username: req.user.username }).select("-password");
    }

    if (!userDoc) {
      return res.status(404).json({ message: "Logged-in officer profile not found." });
    }

    res.json(userDoc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE LOGGED-IN OFFICER PROFILE
router.put("/me", verifyToken, async (req, res) => {
  try {
    console.log("[PROFILE UPDATE]");
    console.log("User ID:", req.user?.id || req.user?._id);
    console.log("Username:", req.user?.username);
    console.log("Police ID:", req.user?.policeId);
    console.log("Role:", req.user?.role);

    const mongoose = require("mongoose");
    const Admin = require("../models/Admin");
    const updateData = { ...req.body };

    // Strip protected fields that cannot be self-modified
    delete updateData.role;
    delete updateData.status;
    delete updateData.policeId;
    delete updateData.nic;

    if (updateData.name && !updateData.fullName) {
      updateData.fullName = updateData.name;
    }

    const userRole = (req.user?.role || "").toLowerCase().trim();
    const isITOfficer = ["admin", "it officer", "itofficer", "it_officer", "it", "it officer/admin", "it officer admin", "oic", "oic traffic branch"].some(r => userRole.includes(r));

    // Strip work details for normal traffic officers
    if (!isITOfficer) {
      delete updateData.rank;
      delete updateData.station;
      delete updateData.assignedArea;
      delete updateData.joinedDate;
    }

    // 1. Identify Officer by JWT req.user with strict priority
    let targetOfficer = null;
    const uId = req.user?.id || req.user?._id;
    if (uId && mongoose.Types.ObjectId.isValid(uId)) {
      targetOfficer = await Officer.findById(uId);
    }
    if (!targetOfficer && req.user?.username) {
      targetOfficer = await Officer.findOne({ username: req.user.username });
    }
    if (!targetOfficer && req.user?.policeId) {
      targetOfficer = await Officer.findOne({ policeId: req.user.policeId });
    }

    // 2. If Officer found, update Officer & sync Admin
    if (targetOfficer) {
      if (updateData.newPassword || updateData.password) {
        const targetPw = updateData.newPassword || updateData.password;
        if (updateData.currentPassword) {
          const match = await bcrypt.compare(updateData.currentPassword, targetOfficer.password);
          if (!match) {
            return res.status(400).json({ message: "Current password does not match" });
          }
        }
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(targetPw, salt);
      } else {
        delete updateData.password;
      }
      delete updateData.newPassword;
      delete updateData.currentPassword;

      const updatedOfficer = await Officer.findByIdAndUpdate(
        targetOfficer._id,
        { $set: updateData },
        { new: true }
      ).select("-password");

      // Sync Admin model if matching account exists
      if (targetOfficer.username) {
        const adminDoc = await Admin.findOne({ username: targetOfficer.username });
        if (adminDoc) {
          if (updateData.fullName) adminDoc.fullName = updateData.fullName;
          if (updateData.email !== undefined) adminDoc.email = updateData.email;
          if (updateData.password) adminDoc.password = updateData.password;
          await adminDoc.save();
        }
      }

      return res.json(updatedOfficer);
    }

    // 3. Fallback: Search Admin model by JWT req.user
    let admin = null;
    if (uId && mongoose.Types.ObjectId.isValid(uId)) {
      admin = await Admin.findById(uId);
    }
    if (!admin && req.user?.username) {
      admin = await Admin.findOne({ username: req.user.username });
    }

    if (admin) {
      if (updateData.fullName) admin.fullName = updateData.fullName;
      if (updateData.email !== undefined) admin.email = updateData.email;
      if (updateData.newPassword || updateData.password) {
        const targetPw = updateData.newPassword || updateData.password;
        if (updateData.currentPassword) {
          const match = await bcrypt.compare(updateData.currentPassword, admin.password);
          if (!match) {
            return res.status(400).json({ message: "Current password does not match" });
          }
        }
        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(targetPw, salt);
      }
      await admin.save();
      const resAdmin = admin.toObject();
      delete resAdmin.password;
      return res.json(resAdmin);
    }

    return res.status(404).json({ message: "Logged-in officer profile not found." });
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
    if (paramId === "me" || String(paramId) === String(req.user.id) || String(paramId) === String(req.user._id)) {
      if (req.user.id && mongoose.Types.ObjectId.isValid(req.user.id)) {
        officerToUpdate = await Officer.findById(req.user.id);
      } else if (req.user._id && mongoose.Types.ObjectId.isValid(req.user._id)) {
        officerToUpdate = await Officer.findById(req.user._id);
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

    const isSelf = paramId === "me" ||
                   String(officerToUpdate._id) === String(req.user.id) ||
                   String(officerToUpdate._id) === String(req.user._id) ||
                   (req.user.username && String(officerToUpdate.username).toLowerCase() === String(req.user.username).toLowerCase()) ||
                   (req.user.policeId && officerToUpdate.policeId === req.user.policeId) ||
                   (officerToUpdate.policeId && req.user.username === officerToUpdate.policeId);

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
      delete updateData.status;
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