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

const dataRoutes = require("./routes/dataRoutes");
app.use("/api", dataRoutes);

// Auto-seed initial vehicle fleet
const Vehicle = require("./models/Vehicle");
const seedVehicles = async () => {
  try {
    const count = await Vehicle.countDocuments();
    if (count === 0) {
      console.log("Seeding initial fleet registry...");
      await Vehicle.insertMany([
        { registrationNo: "WP KA-3421", deptNo: "SLP-TRF-08", vehicleType: "Patrol Car", assignedOfficer: "PC Perera", status: "AVAILABLE" },
        { registrationNo: "WP CP-5520", deptNo: "SLP-TRF-15", vehicleType: "Motorcycle", assignedOfficer: "SI Jayawardena", status: "MAINTENANCE" },
        { registrationNo: "WP LG-1092", deptNo: "SLP-TRF-02", vehicleType: "Recovery Truck", assignedOfficer: "Unassigned", status: "OUT OF SERVICE" },
        { registrationNo: "WP KA-9823", deptNo: "SLP-TRF-21", vehicleType: "Patrol Car", assignedOfficer: "PC Fernando", status: "AVAILABLE" },
        { registrationNo: "WP CA-4401", deptNo: "SLP-TRF-09", vehicleType: "Motorcycle", assignedOfficer: "WPC Silva", status: "AVAILABLE" }
      ]);
      console.log("Seeding complete! ✅");
    }
  } catch (err) {
    console.error("Failed to seed initial fleet:", err);
  }
};
seedVehicles();

// test route
app.get("/", (req, res) => {
  res.send("API Running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});