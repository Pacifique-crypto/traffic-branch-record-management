const express = require("express");
const router = express.Router();

const Accident = require("../models/Accident");
const Violation = require("../models/Violation");


// ==============================
// ✅ GET ALL ACCIDENTS
// ==============================
router.get("/accidents", async (req, res) => {
  try {
    const accidents = await Accident.find().sort({ createdAt: -1 });
    res.json(accidents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ==============================
// ✅ GET SINGLE ACCIDENT
// ==============================
router.get("/accidents/:id", async (req, res) => {
  try {
    const accident = await Accident.findById(req.params.id);

    if (!accident) {
      return res.status(404).json({
        message: "Accident not found",
      });
    }

    res.json(accident);

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// ==============================
// ✅ ADD ACCIDENT
// ==============================
router.post("/accidents", async (req, res) => {
  try {
    console.log("========== ACCIDENT REQUEST ==========");
    console.log(req.body);
    console.log("======================================");

    const newAccident = new Accident(req.body);
    await newAccident.save();

    res.status(201).json({
      message: "Accident added successfully"
    });

  } catch (err) {
    console.log("ERROR:", err);

    res.status(500).json({
      error: err.message
    });
  }
});


// ==============================
// ✅ GET ALL VIOLATIONS
// ==============================
router.get("/violations", async (req, res) => {
  try {
    const violations = await Violation.find().sort({ createdAt: -1 });
    res.json(violations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================
// ✅ GET SINGLE VIOLATION
// ==============================
router.get("/violations/:id", async (req, res) => {
  try {
    const violation = await Violation.findById(req.params.id);

    if (!violation) {
      return res.status(404).json({
        message: "Violation not found",
      });
    }

    res.json(violation);

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});


// ==============================
// ✅ ADD VIOLATION 🔥 (NEW)
// ==============================
router.post("/violations", async (req, res) => {
  try {
    const newViolation = new Violation(req.body);
    await newViolation.save();

    res.status(201).json({
      message: "Violation added successfully"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================
// ✅ UPDATE VIOLATION
// ==============================
router.put("/violations/:id", async (req, res) => {
  try {

    const violation = await Violation.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );

    res.json(violation);

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// ==============================
// ✅ DELETE VIOLATION
// ==============================
router.delete("/violations/:id", async (req, res) => {
  try {

    await Violation.findByIdAndDelete(req.params.id);

    res.json({
      message: "Violation deleted successfully",
    });

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});


module.exports = router;