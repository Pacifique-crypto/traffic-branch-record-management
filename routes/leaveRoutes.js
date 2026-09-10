const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const OfficerAvailability = require("../models/OfficerAvailability");
const Officer = require("../models/Officer");
const Notification = require("../models/Notification");
const { verifyToken, authorizeRoles } = require("../middlewares/authMiddleware");

// Valid leave types
const VALID_LEAVE_TYPES = ["Annual", "Medical", "Emergency", "Casual", "Personal", "Other"];

// ==================================================
// 1. CREATE LEAVE RECORD
// ==================================================
router.post(["/", "/leaves", "/api/leaves"], verifyToken, async (req, res) => {
  try {
    const userRole = (req.user.role || "").toLowerCase().trim();
    const isAdminOrManager = ["admin", "it officer", "itofficer", "it_officer", "it", "oic", "oic traffic branch"].some(r => userRole.includes(r));

    let targetOfficerId;
    let initialStatus = "Pending";

    if (isAdminOrManager && req.body.officer) {
      targetOfficerId = req.body.officer;
      if (req.body.status && ["Pending", "Approved", "Rejected"].includes(req.body.status)) {
        initialStatus = req.body.status;
      }
    } else {
      // Traffic Officers can ONLY create leave for themselves, and status MUST be Pending
      targetOfficerId = req.user.id || req.user._id;
      initialStatus = "Pending";
    }

    const {
      startDate,
      endDate,
      leaveType,
      remarks,
      actingOfficer,
      handoverNotes,
      contactNo,
      address,
      supportingDocuments,
      medicalCertificateUrl
    } = req.body;

    // Required fields check
    if (!targetOfficerId || !startDate || !endDate || !leaveType) {
      return res.status(400).json({ message: "Officer, start date, end date, and leave type are required." });
    }

    // Leave type validation
    if (typeof leaveType !== "string" || !leaveType.trim()) {
      return res.status(400).json({ message: "Leave type is required." });
    }

    // Officer existence check
    const Admin = require("../models/Admin");
    if (!mongoose.Types.ObjectId.isValid(targetOfficerId)) {
      return res.status(400).json({ message: "Invalid Officer ID." });
    }
    let officerDoc = await Officer.findById(targetOfficerId);
    if (!officerDoc) {
      officerDoc = await Admin.findById(targetOfficerId);
    }
    if (!officerDoc) {
      return res.status(404).json({ message: "Officer profile not found." });
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

    // Calculate total duration (both start and end date count)
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Acting Officer validation
    let validActingOfficer = null;
    if (actingOfficer) {
      if (!mongoose.Types.ObjectId.isValid(actingOfficer)) {
        return res.status(400).json({ message: "Invalid Acting Officer ID." });
      }

      if (String(actingOfficer) === String(targetOfficerId)) {
        return res.status(400).json({ message: "Requesting officer cannot select themselves as acting officer." });
      }

      let actingOfficerDoc = await Officer.findById(actingOfficer);
      if (!actingOfficerDoc) {
        actingOfficerDoc = await Admin.findById(actingOfficer);
      }
      if (!actingOfficerDoc) {
        return res.status(404).json({ message: "Selected acting officer not found." });
      }

      if (actingOfficerDoc.status && actingOfficerDoc.status !== "Active" && actingOfficerDoc.status !== "active") {
        return res.status(400).json({ message: `Officer ${actingOfficerDoc.fullName} is not active and cannot be selected as acting officer.` });
      }

      validActingOfficer = actingOfficerDoc._id;
    }

    // Overlap prevention for the same officer (ignore rejected leave records)
    const existingOverlap = await OfficerAvailability.findOne({
      officer: targetOfficerId,
      status: { $ne: "Rejected" },
      startDate: { $lte: end },
      endDate: { $gte: start }
    });

    if (existingOverlap) {
      return res.status(400).json({
        message: `Officer ${officerDoc.fullName} already has an active leave record overlapping with the selected dates (${new Date(existingOverlap.startDate).toLocaleDateString()} to ${new Date(existingOverlap.endDate).toLocaleDateString()}).`
      });
    }

    // Get createdBy from authenticated JWT token
    const createdBy = req.user.id || req.user._id;

    // Process supporting documents
    let docsArray = [];
    if (Array.isArray(supportingDocuments) && supportingDocuments.length > 0) {
      docsArray = supportingDocuments.map(doc => ({
        fileName: doc.fileName || doc.name || "Supporting Document",
        fileUrl: doc.fileUrl || doc.uri || doc.url || "",
        mimeType: doc.mimeType || doc.type || "application/pdf"
      }));
    }

    let finalMedicalCertUrl = medicalCertificateUrl || "";
    if (!finalMedicalCertUrl && docsArray.length > 0) {
      finalMedicalCertUrl = docsArray[0].fileUrl;
    }

    const newLeave = new OfficerAvailability({
      officer: targetOfficerId,
      startDate: start,
      endDate: end,
      duration: durationDays,
      leaveType: leaveType.trim(),
      remarks: remarks || "",
      actingOfficer: validActingOfficer,
      handoverNotes: handoverNotes || "",
      contactNo: contactNo || officerDoc.contactNo || "",
      address: address || officerDoc.address || "",
      supportingDocuments: docsArray,
      medicalCertificateUrl: finalMedicalCertUrl,
      status: initialStatus,
      createdBy
    });

    await newLeave.save();

    await newLeave.populate([
      { path: "officer", select: "fullName policeId rank username contactNo address" },
      { path: "actingOfficer", select: "fullName policeId rank username" }
    ]);

    res.status(201).json({
      message: "Officer leave request submitted successfully.",
      leave: newLeave
    });

  } catch (error) {
    console.error("Error creating officer leave:", error);
    res.status(500).json({ error: error.message });
  }
});

// ==================================================
// 2. GET LEAVE RECORDS FOR LOGGED-IN OFFICER
// ==================================================
router.get(["/me", "/leaves/me", "/api/leaves/me"], verifyToken, async (req, res) => {
  try {
    const officerId = req.user.id || req.user._id;
    const leaves = await OfficerAvailability.find({ officer: officerId })
      .populate("officer", "fullName policeId rank username contactNo address")
      .populate("actingOfficer", "fullName policeId rank username")
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error) {
    console.error("Error fetching my leave requests:", error);
    res.status(500).json({ error: error.message });
  }
});

// ==================================================
// 3. GET ALL LEAVE RECORDS (OIC / Admin view)
// ==================================================
router.get(["/", "/leaves", "/api/leaves"], verifyToken, async (req, res) => {
  try {
    const leaves = await OfficerAvailability.find()
      .populate("officer", "fullName policeId rank username contactNo address")
      .populate("actingOfficer", "fullName policeId rank username")
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error) {
    console.error("Error fetching officer leaves:", error);
    res.status(500).json({ error: error.message });
  }
});

// ==================================================
// 4. GET LEAVE RECORDS FOR A SPECIFIC OFFICER
// ==================================================
router.get("/officer/:officerId", verifyToken, async (req, res) => {
  try {
    const { officerId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(officerId)) {
      return res.status(400).json({ message: "Invalid Officer ID." });
    }

    const leaves = await OfficerAvailability.find({ officer: officerId })
      .populate("officer", "fullName policeId rank username contactNo address")
      .populate("actingOfficer", "fullName policeId rank username")
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error) {
    console.error("Error fetching leaves for officer:", error);
    res.status(500).json({ error: error.message });
  }
});

// ==================================================
// 5. UPDATE LEAVE RECORD (Approve / Reject / Edit)
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

    const { startDate, endDate, leaveType, remarks, officer, status, rejectionRemarks, actingOfficer } = req.body;

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

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Overlap prevention excluding current record and non-rejected records
    const targetStatus = status || leaveRecord.status;
    if (targetStatus !== "Rejected") {
      const existingOverlap = await OfficerAvailability.findOne({
        _id: { $ne: id },
        officer: targetOfficer,
        status: { $ne: "Rejected" },
        startDate: { $lte: end },
        endDate: { $gte: start }
      });

      if (existingOverlap) {
        return res.status(400).json({
          message: "Officer already has another active leave record overlapping with the selected dates."
        });
      }
    }

    const previousStatus = leaveRecord.status;
    const statusChanged = status && status !== previousStatus;

    if (officer) leaveRecord.officer = officer;
    leaveRecord.startDate = start;
    leaveRecord.endDate = end;
    leaveRecord.duration = durationDays;
    if (leaveType) leaveRecord.leaveType = leaveType;
    if (remarks !== undefined) leaveRecord.remarks = remarks;
    if (status) leaveRecord.status = status;
    if (rejectionRemarks !== undefined) leaveRecord.rejectionRemarks = rejectionRemarks;
    if (actingOfficer !== undefined) leaveRecord.actingOfficer = actingOfficer;
    if (req.body.medicalCertificateUrl !== undefined) leaveRecord.medicalCertificateUrl = req.body.medicalCertificateUrl;
    if (req.body.supportingDocuments !== undefined) leaveRecord.supportingDocuments = req.body.supportingDocuments;

    await leaveRecord.save();

    // Create persistent notification ONLY when status transitions (prevents duplicate notifications)
    if (statusChanged && leaveRecord.officer) {
      try {
        const startStr = new Date(leaveRecord.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const endStr = new Date(leaveRecord.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const lTypeStr = leaveRecord.leaveType || "Leave";

        if (leaveRecord.status === "Approved") {
          await Notification.create({
            recipient: leaveRecord.officer,
            title: "Leave Request Approved",
            message: `Your ${lTypeStr} request from ${startStr} to ${endStr} has been approved by the OIC.`,
            type: "LEAVE_APPROVED",
            relatedLeave: leaveRecord._id
          });
        } else if (leaveRecord.status === "Rejected") {
          const reasonText = leaveRecord.rejectionRemarks ? ` Reason: ${leaveRecord.rejectionRemarks}` : "";
          await Notification.create({
            recipient: leaveRecord.officer,
            title: "Leave Request Rejected",
            message: `Your ${lTypeStr} request from ${startStr} to ${endStr} has been rejected by the OIC.${reasonText}`,
            type: "LEAVE_REJECTED",
            relatedLeave: leaveRecord._id,
            rejectionRemarks: leaveRecord.rejectionRemarks || ""
          });
        }
      } catch (notifErr) {
        console.error("Error creating notification on leave status update:", notifErr);
      }
    }

    await leaveRecord.populate([
      { path: "officer", select: "fullName policeId rank username contactNo address" },
      { path: "actingOfficer", select: "fullName policeId rank username" }
    ]);

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
// 6. DELETE LEAVE RECORD
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
