const express = require("express");
const router = express.Router();
const { verifyToken, authorizeRoles } = require("../middlewares/authMiddleware");

const Accident = require("../models/Accident");
const Violation = require("../models/Violation");

const parseSafeInt = (val) => {
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? 0 : parsed;
};


// ==============================
// ✅ GET ALL ACCIDENTS
// ==============================
router.get("/accidents", verifyToken, authorizeRoles("officer", "oic", "admin"), async (req, res) => {
  try {
    const accidents = await Accident.find({}, { evidencePhoto: 0, voiceNote: 0, attachment: 0 }).sort({ createdAt: -1 });
    const mapped = accidents.map(a => {
      const obj = a.toObject();
      obj.driver = obj.driver || obj.driverName;
      obj.vehicle = obj.vehicle || obj.vehicleNumber;
      obj.id = obj.referenceNumber || obj._id.toString();
      return obj;
    });
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ==============================
// ✅ GET SINGLE ACCIDENT
// ==============================
router.get("/accidents/:id", verifyToken, authorizeRoles("officer", "oic", "admin"), async (req, res) => {
  try {
    const mongoose = require("mongoose");
    let query = {};
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      query = { _id: req.params.id };
    } else {
      query = { referenceNumber: req.params.id };
    }

    const accident = await Accident.findOne(query);

    if (!accident) {
      return res.status(404).json({
        message: "Accident not found",
      });
    }

    const obj = accident.toObject();
    obj.driver = obj.driver || obj.driverName;
    obj.vehicle = obj.vehicle || obj.vehicleNumber;
    obj.id = obj.referenceNumber || obj._id.toString();
    res.json(obj);

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// ==============================
// ✅ UPDATE ACCIDENT
// ==============================
router.put("/accidents/:id", verifyToken, authorizeRoles("oic", "admin"), async (req, res) => {
  try {
    const mongoose = require("mongoose");
    let query = {};
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      query = { _id: req.params.id };
    } else {
      query = { referenceNumber: req.params.id };
    }

    const updatedAccident = await Accident.findOneAndUpdate(
      query,
      req.body,
      { new: true }
    );

    if (!updatedAccident) {
      return res.status(404).json({
        message: "Accident not found",
      });
    }

    const obj = updatedAccident.toObject();
    obj.id = obj.referenceNumber || obj._id.toString();
    res.json(obj);

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// ==============================
// ✅ DELETE ACCIDENT
// ==============================
router.delete("/accidents/:id", verifyToken, authorizeRoles("oic", "admin"), async (req, res) => {
  try {
    const mongoose = require("mongoose");
    let query = {};
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      query = { _id: req.params.id };
    } else {
      query = { referenceNumber: req.params.id };
    }

    const deleted = await Accident.findOneAndDelete(query);

    if (!deleted) {
      return res.status(404).json({
        message: "Accident not found",
      });
    }

    res.json({
      message: "Accident deleted successfully",
    });

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// ==============================
//// ==============================
// ✅ ADD ACCIDENT
// ==============================
router.post("/accidents", verifyToken, authorizeRoles("officer", "oic", "admin"), async (req, res) => {
  try {

    const {
      accidentDate,
      dateTime,
      station,
      location,
      assistantOfficer,

      vehicleNumber,
      vehicleClass,
      vehicleAge,

      driverName,
      driverAddress,
      driverAge,
      drivingLicence,

      casualtyName,
      victimName,
      casualtyAddress,
      victimAddress,
      casualtyAge,
      victimAge,
      casualtyGender,
      gender,
      casualtyStatus,

      description,

      evidencePhoto,
      attachment,
      voiceNote,

      status,

      // Mobile app specific fields
      driver,
      vehicle,
      severity,
    } = req.body;

    const finalAccidentDate = accidentDate || dateTime || "";
    const finalDriverName = driverName || driver || "Unknown";
    const finalVehicleNumber = vehicleNumber || vehicle || "Unknown";
    const finalStation = station || "Negombo HQ";
    const finalVehicleClass = vehicleClass || "Unknown";
    const finalSeverity = severity || "MINOR";

    const finalCasualtyName = casualtyName || victimName || "";
    const finalCasualtyAddress = casualtyAddress || victimAddress || "";
    const finalCasualtyAge = casualtyAge || victimAge || 0;
    const finalCasualtyGender = casualtyGender || gender || "";
    const finalCasualtyStatus = casualtyStatus || (finalCasualtyName ? "Injured" : "");

    // Basic validation
    if (
      !finalAccidentDate ||
      !finalStation ||
      !location ||
      !finalVehicleNumber ||
      !finalVehicleClass ||
      !finalDriverName
    ) {
      return res.status(400).json({
        message: "Please fill all required fields.",
      });
    }

    const newAccident = new Accident({
      accidentDate: finalAccidentDate,
      station: finalStation,
      location,
      assistantOfficer: assistantOfficer || "",
      submittingOfficer: req.body.submittingOfficer || "",

      vehicleNumber: finalVehicleNumber,
      vehicleClass: finalVehicleClass,
      vehicleAge: parseSafeInt(vehicleAge),

      driverName: finalDriverName,
      driverAddress: driverAddress || "",
      driverAge: parseSafeInt(driverAge),
      drivingLicence: drivingLicence || "",

      casualtyName: finalCasualtyName,
      casualtyAddress: finalCasualtyAddress,
      casualtyAge: parseSafeInt(finalCasualtyAge),
      casualtyGender: finalCasualtyGender,
      casualtyStatus: finalCasualtyStatus,

      description: description || "",

      evidencePhoto: evidencePhoto || "",
      attachment: attachment || "",
      voiceNote: voiceNote || "",

      status: status || "Pending",
      severity: finalSeverity,
    });

    await newAccident.save();

    res.status(201).json({
      message: "Accident added successfully",
      accident: newAccident,
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      error: err.message,
    });

  }
});


// ==============================
// ==============================
// ✅ GET ALL VIOLATIONS
// ==============================
router.get("/violations", verifyToken, authorizeRoles("officer", "oic", "admin"), async (req, res) => {
  try {
    const violations = await Violation.find({}, { evidencePhoto: 0, voiceNote: 0, attachment: 0 }).sort({ createdAt: -1 });
    const mapped = violations.map(v => {
      const obj = v.toObject();
      obj.referenceNumber = obj.referenceNumber || `VO-${(obj._id || "").toString().slice(-4).toUpperCase()}`;
      obj.id = obj.referenceNumber || obj._id.toString();
      return obj;
    });
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================
// ✅ GET SINGLE VIOLATION
// ==============================
router.get("/violations/:id", verifyToken, authorizeRoles("officer", "oic", "admin"), async (req, res) => {
  try {
    const mongoose = require("mongoose");
    let violation = null;

    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      violation = await Violation.findById(req.params.id);
    }

    if (!violation) {
      violation = await Violation.findOne({ referenceNumber: req.params.id });
    }

    if (!violation) {
      const paramUpper = req.params.id.toUpperCase();
      const allViolations = await Violation.find();
      violation = allViolations.find(v => {
        const computedRef = (v.referenceNumber || `VO-${v._id.toString().slice(-4).toUpperCase()}`).toUpperCase();
        return computedRef === paramUpper || v._id.toString().toUpperCase().endsWith(paramUpper.replace(/^VO-/, ""));
      });
    }

    if (!violation) {
      return res.status(404).json({
        message: "Violation not found",
      });
    }

    const obj = violation.toObject();
    obj.referenceNumber = obj.referenceNumber || `VO-${(obj._id || "").toString().slice(-4).toUpperCase()}`;
    obj.id = obj.referenceNumber || obj._id.toString();
    res.json(obj);

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});


// ==============================
// ✅ ADD VIOLATION 🔥 (NEW)
// ==============================
router.post("/violations", verifyToken, authorizeRoles("officer", "oic", "admin"), async (req, res) => {
  try {
    const payload = { ...req.body };

    // Fallback calculation for fineAmount if missing or empty string
    if (!payload.fineAmount || payload.fineAmount === "") {
      const type = payload.violationType || payload.offence || "";
      switch (type) {
        case "Speeding":
          payload.fineAmount = 3000;
          break;
        case "No Helmet":
          payload.fineAmount = 2000;
          break;
        case "Seat Belt":
        case "Seat Belt Violation":
          payload.fineAmount = 2500;
          break;
        case "Signal Violation":
          payload.fineAmount = 5000;
          break;
        case "Using Mobile Phone":
          payload.fineAmount = 3000;
          break;
        case "Dangerous Driving":
        case "Drunk Driving":
          payload.fineAmount = 25000;
          break;
        case "No Driving License":
          payload.fineAmount = 5000;
          break;
        case "Parking Offence":
          payload.fineAmount = 1500;
          break;
        default:
          payload.fineAmount = 2000; // default fallback
      }
    }

    payload.fineAmount = parseSafeInt(payload.fineAmount);

    const newViolation = new Violation(payload);
    await newViolation.save();

    const obj = newViolation.toObject();
    obj.referenceNumber = obj.referenceNumber || `VO-${(obj._id || "").toString().slice(-4).toUpperCase()}`;
    obj.id = obj.referenceNumber || obj._id.toString();

    res.status(201).json({
      message: "Violation added successfully",
      violation: obj,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================
// ✅ UPDATE VIOLATION
// ==============================
router.put("/violations/:id", verifyToken, authorizeRoles("oic", "admin"), async (req, res) => {
  try {
    const mongoose = require("mongoose");
    let violation = null;

    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      violation = await Violation.findById(req.params.id);
    }
    if (!violation) {
      violation = await Violation.findOne({ referenceNumber: req.params.id });
    }
    if (!violation) {
      const paramUpper = req.params.id.toUpperCase();
      const allViolations = await Violation.find();
      violation = allViolations.find(v => {
        const computedRef = (v.referenceNumber || `VO-${v._id.toString().slice(-4).toUpperCase()}`).toUpperCase();
        return computedRef === paramUpper || v._id.toString().toUpperCase().endsWith(paramUpper.replace(/^VO-/, ""));
      });
    }

    if (!violation) {
      return res.status(404).json({ message: "Violation not found" });
    }

    Object.assign(violation, req.body);
    await violation.save();

    const obj = violation.toObject();
    obj.referenceNumber = obj.referenceNumber || `VO-${(obj._id || "").toString().slice(-4).toUpperCase()}`;
    obj.id = obj.referenceNumber || obj._id.toString();

    res.json(obj);

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// ==============================
// ✅ DELETE VIOLATION
// ==============================
router.delete("/violations/:id", verifyToken, authorizeRoles("oic", "admin"), async (req, res) => {
  try {
    const mongoose = require("mongoose");
    let targetId = null;

    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      targetId = req.params.id;
    } else {
      const violation = await Violation.findOne({ referenceNumber: req.params.id });
      if (violation) {
        targetId = violation._id;
      } else {
        const paramUpper = req.params.id.toUpperCase();
        const allViolations = await Violation.find();
        const found = allViolations.find(v => {
          const computedRef = (v.referenceNumber || `VO-${v._id.toString().slice(-4).toUpperCase()}`).toUpperCase();
          return computedRef === paramUpper || v._id.toString().toUpperCase().endsWith(paramUpper.replace(/^VO-/, ""));
        });
        if (found) targetId = found._id;
      }
    }

    if (targetId) {
      await Violation.findByIdAndDelete(targetId);
    }

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