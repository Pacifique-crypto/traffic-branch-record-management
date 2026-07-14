const express = require("express");
const router = express.Router();
const Officer = require("../models/Officer");
const bcrypt = require("bcryptjs");

// REGISTER OFFICER
router.post("/register", async (req, res) => {
  try {
    console.log("Register payload received on backend:", req.body);
    const { fullName, dob, policeId, gender, contactNo, username, nic, password, email, rank, role, address, status } = req.body;

    const existing = await Officer.findOne({ $or: [{ policeId }, { username: username || policeId }, { nic }] });
    if (existing) {
      return res.status(400).json({ message: "Officer already registered with this Police ID, NIC, or Username" });
    }

    // 🔐 hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newOfficer = new Officer({
      fullName,
      dob,
      policeId,
      gender,
      contactNo,
      username: (username && username.trim()) ? username : policeId,
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

    res.json({
      message: "Login successful",
      officer: {
        id: officer._id,
        fullName: officer.fullName,
        policeId: officer.policeId
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET ALL OFFICERS
router.get("/", async (req, res) => {
  try {
    const officers = await Officer.find().select("-password");
    res.json(officers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// UPDATE OFFICER
router.put("/:id", async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }

    const updatedOfficer = await Officer.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select("-password");

    res.json(updatedOfficer);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE OFFICER
router.delete("/:id", async (req, res) => {
  try {

    await Officer.findByIdAndDelete(req.params.id);

    res.json({
      message: "Officer deleted successfully",
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// GET ALL OFFICERS
router.get("/", async (req, res) => {
  try {
    const officers = await Officer.find().select("-password");

    res.json(officers);

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});
module.exports = router;