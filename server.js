const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
dns.setDefaultResultOrder("ipv4first");

const originalLookup = dns.lookup;
dns.lookup = (hostname, options, callback) => {
  let isAll = false;
  let lookupOpts = options;
  if (typeof options === "function") {
    callback = options;
    lookupOpts = {};
  } else if (options && options.all) {
    isAll = true;
  }

  if (hostname && hostname.endsWith("mongodb.net")) {
    dns.resolve4(hostname, (err, addresses) => {
      if (err || !addresses || addresses.length === 0) {
        return originalLookup(hostname, lookupOpts, callback);
      }
      if (isAll) {
        const addrList = addresses.map(addr => ({ address: addr, family: 4 }));
        callback(null, addrList);
      } else {
        callback(null, addresses[0], 4);
      }
    });
  } else {
    originalLookup(hostname, lookupOpts, callback);
  }
};

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

// middlewares
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// routes
const officerRoutes = require("./routes/officerRoutes");
app.use("/api/officers", officerRoutes);

const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes);

const vehicleRoutes = require("./routes/vehicleRoutes");
app.use("/api/vehicles", vehicleRoutes);

const dutyRoutes = require("./routes/dutyRoutes");
app.use("/api/duties", dutyRoutes);

const leaveRoutes = require("./routes/leaveRoutes");
app.use("/api/leaves", leaveRoutes);

const demoDriverLicenceRoutes = require("./routes/demoDriverLicenceRoutes");
app.use("/api/demo-driver-licences", demoDriverLicenceRoutes);

const dataRoutes = require("./routes/dataRoutes");
app.use("/api", dataRoutes);

// Auto-seed initial demo driver licences
const DemoDriverLicence = require("./models/DemoDriverLicence");
const seedDemoDriverLicences = async () => {
  try {
    const demoRecords = [
      {
        licenceNumber: "DL-B1234567",
        fullName: "Kasun Perera",
        address: "No. 45, Main Street, Negombo",
        age: 27,
        nic: "199812345678",
        licenceStatus: "Valid"
      },
      {
        licenceNumber: "DL-B7654321",
        fullName: "Nimal Fernando",
        address: "No. 12, Beach Road, Negombo",
        age: 35,
        nic: "199112345679",
        licenceStatus: "Valid"
      },
      {
        licenceNumber: "DL-B2468135",
        fullName: "Amal Silva",
        address: "No. 78, Station Road, Kochchikade",
        age: 31,
        nic: "199512345680",
        licenceStatus: "Valid"
      },
      {
        licenceNumber: "DL-B9753186",
        fullName: "Dilshan Jayawardena",
        address: "No. 24, Main Road, Colombo",
        age: 42,
        nic: "198312345681",
        licenceStatus: "Valid"
      }
    ];

    for (const record of demoRecords) {
      await DemoDriverLicence.findOneAndUpdate(
        { licenceNumber: record.licenceNumber },
        { $set: record },
        { upsert: true, new: true }
      );
    }
    console.log("Demo driver licences auto-seeded successfully! ✅");
  } catch (err) {
    console.error("Failed to seed demo driver licences:", err);
  }
};
seedDemoDriverLicences();

// Auto-seed initial vehicle fleet
const Vehicle = require("./models/Vehicle");
const seedVehicles = async () => {
  try {
    const count = await Vehicle.countDocuments();
    if (count === 0) {
      console.log("Seeding initial fleet registry...");
      await Vehicle.insertMany([
        { registrationNo: "WP KA-3421", vehicleType: "Patrol Car", assignedOfficer: "PC Perera", status: "AVAILABLE" },
        { registrationNo: "WP CP-5520", vehicleType: "Motorcycle", assignedOfficer: "SI Jayawardena", status: "MAINTENANCE" },
        { registrationNo: "WP LG-1092", vehicleType: "Recovery Truck", assignedOfficer: "Unassigned", status: "OUT OF SERVICE" },
        { registrationNo: "WP KA-9823", vehicleType: "Patrol Car", assignedOfficer: "PC Fernando", status: "AVAILABLE" },
        { registrationNo: "WP CA-4401", vehicleType: "Motorcycle", assignedOfficer: "WPC Silva", status: "AVAILABLE" }
      ]);
      console.log("Seeding complete! ✅");
    }
  } catch (err) {
    console.error("Failed to seed initial fleet:", err);
  }
};
seedVehicles();

// Auto-seed initial operational shifts
const Shift = require("./models/Shift");
const seedShifts = async () => {
  try {
    const count = await Shift.countDocuments();
    if (count === 0) {
      console.log("Seeding initial operational police shifts...");
      await Shift.insertMany([
        { name: "Full Day Duty", startTime: "06:00", endTime: "18:00", description: "Traffic Control and General Duties", isActive: true },
        { name: "Early Motorcycle Patrol", startTime: "06:00", endTime: "14:00", description: "Motorcycle Patrol (Morning)", isActive: true },
        { name: "Late Motorcycle Patrol", startTime: "14:00", endTime: "22:00", description: "Motorcycle Patrol (Evening)", isActive: true },
        { name: "Evening Duty", startTime: "14:00", endTime: "22:00", description: "Traffic Control (Evening Peak)", isActive: true },
        { name: "Night Duty", startTime: "18:00", endTime: "06:00", description: "Night Patrol and Security Checks", isActive: true }
      ]);
      console.log("Operational shifts seeding complete! ✅");
    }
  } catch (err) {
    console.error("Failed to seed initial operational shifts:", err);
  }
};
seedShifts();

// test route
app.get("/", (req, res) => {
  res.send("API Running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});