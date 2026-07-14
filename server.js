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
app.use(express.json());

// routes
const officerRoutes = require("./routes/officerRoutes");
app.use("/api/officers", officerRoutes);

const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes);

// ✅ ADD HERE
const dataRoutes = require("./routes/dataRoutes");
app.use("/api", dataRoutes);

// test route
app.get("/", (req, res) => {
  res.send("API Running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});