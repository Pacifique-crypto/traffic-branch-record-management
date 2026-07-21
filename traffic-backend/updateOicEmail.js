const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
dns.setDefaultResultOrder("ipv4first");

const orig = dns.lookup;
dns.lookup = (h, o, c) => {
  if (typeof o === "function") { c = o; o = {}; }
  if (h && h.endsWith("mongodb.net")) {
    dns.resolve4(h, (err, addrs) => {
      if (err || !addrs || addrs.length === 0) return orig(h, o, c);
      c(null, addrs[0], 4);
    });
  } else {
    orig(h, o, c);
  }
};

const mongoose = require("mongoose");
require("dotenv").config();

const connectAndRun = async () => {
  let connected = false;
  while (!connected) {
    try {
      console.log("Connecting to MongoDB Atlas...");
      await mongoose.connect(process.env.MONGO_URI);
      console.log("MongoDB Connected ✅");
      connected = true;
    } catch (err) {
      console.error("Connection failed, retrying in 2 seconds...", err.message);
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  const Admin = mongoose.model("Admin", new mongoose.Schema({}, { strict: false }));
  
  // IT Officer -> apacifique2500@gmail.com
  const r1 = await Admin.updateOne({ username: "admin" }, { $set: { email: "apacifique2500@gmail.com" } });
  
  // OIC -> adebapacifique@gmail.com
  const r2 = await Admin.updateOne({ username: "oic" }, { $set: { email: "adebapacifique@gmail.com" } });

  console.log("Admin email update result:", r1);
  console.log("OIC email update result:", r2);

  const list = await Admin.find({});
  console.log("Current accounts in Atlas:", list.map(a => ({ username: a.username, role: a.role, email: a.email })));
  process.exit(0);
};

connectAndRun();
