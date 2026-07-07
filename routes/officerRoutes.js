const express = require("express");
const router = express.Router();
const Officer = require("../models/Officer");
const bcrypt = require("bcryptjs");

// REGISTER OFFICER
router.post("/register", async (req, res) => {
  try {
    const { fullName, dob, policeId, gender, contactNo, username, nic, password } = req.body;

    // 🔐 hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newOfficer = new Officer({
      fullName,
      dob,
      policeId,
      gender,
      contactNo,
      username,
      nic,
      password: hashedPassword // ✅ store hashed password
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

    const officer = await Officer.findOne({ username });

    if (!officer) {
      return res.status(400).json({ message: "User not found" });
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

    const updatedOfficer = await Officer.findByIdAndUpdate(
      req.params.id,
      req.body,
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