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
    const mapped = accidents.map(a => {
      const obj = a.toObject();
      obj.driver = obj.driver || obj.driverName;
      obj.vehicle = obj.vehicle || obj.vehicleNumber;
      obj.id = obj.id || obj._id;
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
router.get("/accidents/:id", async (req, res) => {
  try {
    const accident = await Accident.findById(req.params.id);

    if (!accident) {
      return res.status(404).json({
        message: "Accident not found",
      });
    }

    const obj = accident.toObject();
    obj.driver = obj.driver || obj.driverName;
    obj.vehicle = obj.vehicle || obj.vehicleNumber;
    obj.id = obj.id || obj._id;
    res.json(obj);

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
router.post("/accidents", async (req, res) => {
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

      vehicleNumber: finalVehicleNumber,
      vehicleClass: finalVehicleClass,
      vehicleAge: vehicleAge || 0,

      driverName: finalDriverName,
      driverAddress: driverAddress || "",
      driverAge: driverAge || 0,
      drivingLicence: drivingLicence || "",

      casualtyName: finalCasualtyName,
      casualtyAddress: finalCasualtyAddress,
      casualtyAge: finalCasualtyAge,
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
// ✅ GET ALL VIOLATIONS
// ==============================
router.get("/violations", async (req, res) => {
  try {
    const violations = await Violation.find().sort({ createdAt: -1 });
    const mapped = violations.map(v => {
      const obj = v.toObject();
      obj.id = obj.id || obj._id;
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
router.get("/violations/:id", async (req, res) => {
  try {
    const violation = await Violation.findById(req.params.id);

    if (!violation) {
      return res.status(404).json({
        message: "Violation not found",
      });
    }

    const obj = violation.toObject();
    obj.id = obj.id || obj._id;
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