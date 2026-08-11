const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const OfficerAvailability = require("../models/OfficerAvailability");
const Officer = require("../models/Officer");
const { verifyToken, authorizeRoles } = require("../middlewares/authMiddleware");

// Valid leave types
const VALID_LEAVE_TYPES = ["Annual", "Medical", "Emergency", "Other"];

// ==================================================
// 1. CREATE LEAVE RECORD
// ==================================================
router.post("/", verifyToken, authorizeRoles("admin", "it officer", "oic"), async (req, res) => {
  try {
    const { officer, startDate, endDate, leaveType, remarks } = req.body;

    // Required fields check
    if (!officer || !startDate || !endDate || !leaveType) {
      return res.status(400).json({ message: "Officer, start date, end date, and leave type are required." });
    }

    // Leave type validation
    if (typeof leaveType !== "string" || !leaveType.trim()) {
      return res.status(400).json({ message: "Leave type is required." });
    }

    // Officer existence check
    if (!mongoose.Types.ObjectId.isValid(officer)) {
      return res.status(400).json({ message: "Invalid Officer ID." });
    }
    const officerDoc = await Officer.findById(officer);
    if (!officerDoc) {
      return res.status(404).json({ message: "Officer not found." });
    }

    // Date parsing and normalization
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid start date or end date format." });
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // Date order check: endDate cannot be before startDate
    if (end < start) {
      return res.status(400).json({ message: "End date cannot be before start date." });
    }

    // Overlap prevention for the same officer
    const existingOverlap = await OfficerAvailability.findOne({
      officer: officer,
      startDate: { $lte: end },
      endDate: { $gte: start }
    });

    if (existingOverlap) {
      return res.status(400).json({
        message: `Officer ${officerDoc.fullName} already has a leave record overlapping with the selected dates (${new Date(existingOverlap.startDate).toLocaleDateString()} to ${new Date(existingOverlap.endDate).toLocaleDateString()}).`
      });
    }

    // Get createdBy from authenticated JWT token
    const createdBy = req.user.id || req.user._id;
    if (!createdBy) {
      return res.status(401).json({ message: "Unauthorized. User ID not found in token." });
    }

    const newLeave = new OfficerAvailability({
      officer,
      startDate: start,
      endDate: end,
      leaveType,
      remarks: remarks || "",
      createdBy
    });

    await newLeave.save();
    await newLeave.populate("officer", "fullName policeId rank username");

    res.status(201).json({
      message: "Officer leave recorded successfully.",
      leave: newLeave
    });

  } catch (error) {
    console.error("Error creating officer leave:", error);
    res.status(500).json({ error: error.message });
  }
});

// ==================================================
// 2. GET ALL LEAVE RECORDS
// ==================================================
router.get("/", verifyToken, async (req, res) => {
  try {
    const leaves = await OfficerAvailability.find()
      .populate("officer", "fullName policeId rank username")
      .sort({ startDate: -1 });

    res.json(leaves);
  } catch (error) {
    console.error("Error fetching officer leaves:", error);
    res.status(500).json({ error: error.message });
  }
});

// ==================================================
// 3. GET LEAVE RECORDS FOR A SPECIFIC OFFICER
// ==================================================
router.get("/officer/:officerId", verifyToken, async (req, res) => {
  try {
    const { officerId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(officerId)) {
      return res.status(400).json({ message: "Invalid Officer ID." });
    }

    const leaves = await OfficerAvailability.find({ officer: officerId })
      .populate("officer", "fullName policeId rank username")
      .sort({ startDate: -1 });

    res.json(leaves);
  } catch (error) {
    console.error("Error fetching leaves for officer:", error);
    res.status(500).json({ error: error.message });
  }
});

// ==================================================
// 4. UPDATE LEAVE RECORD
// ==================================================
router.put("/:id", verifyToken, authorizeRoles("admin", "it officer", "oic"), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Leave Record ID." });
    }

    const leaveRecord = await OfficerAvailability.findById(id);
    if (!leaveRecord) {
      return res.status(404).json({ message: "Leave record not found." });
    }

    const { startDate, endDate, leaveType, remarks, officer } = req.body;

    const targetOfficer = officer || leaveRecord.officer;
    const start = startDate ? new Date(startDate) : new Date(leaveRecord.startDate);
    const end = endDate ? new Date(endDate) : new Date(leaveRecord.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid start date or end date format." });
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (end < start) {
      return res.status(400).json({ message: "End date cannot be before start date." });
    }

    if (leaveType && (typeof leaveType !== "string" || !leaveType.trim())) {
      return res.status(400).json({ message: "Invalid leave type." });
    }

    // Overlap prevention excluding current record
    const existingOverlap = await OfficerAvailability.findOne({
      _id: { $ne: id },
      officer: targetOfficer,
      startDate: { $lte: end },
      endDate: { $gte: start }
    });

    if (existingOverlap) {
      return res.status(400).json({
        message: "Officer already has another leave record overlapping with the selected dates."
      });
    }

    if (officer) leaveRecord.officer = officer;
    leaveRecord.startDate = start;
    leaveRecord.endDate = end;
    if (leaveType) leaveRecord.leaveType = leaveType;
    if (remarks !== undefined) leaveRecord.remarks = remarks;

    await leaveRecord.save();
    await leaveRecord.populate("officer", "fullName policeId rank username");

    res.json({
      message: "Leave record updated successfully.",
      leave: leaveRecord
    });

  } catch (error) {
    console.error("Error updating officer leave:", error);
    res.status(500).json({ error: error.message });
  }
});

// ==================================================
// 5. DELETE LEAVE RECORD
// ==================================================
router.delete("/:id", verifyToken, authorizeRoles("admin", "it officer", "oic"), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Leave Record ID." });
    }

    const deleted = await OfficerAvailability.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Leave record not found." });
    }

    res.json({ message: "Leave record deleted successfully." });
  } catch (error) {
    console.error("Error deleting officer leave:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
