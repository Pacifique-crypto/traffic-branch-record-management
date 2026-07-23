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
const uri = "mongodb://dulyasenadheera2_db_user:Yavindi2@ac-aplgv7x-shard-00-00.ls9lz8r.mongodb.net:27017,ac-aplgv7x-shard-00-01.ls9lz8r.mongodb.net:27017,ac-aplgv7x-shard-00-02.ls9lz8r.mongodb.net:27017/trafficDB?ssl=true&replicaSet=atlas-tsyjfd-shard-0&authSource=admin&appName=Cluster0";

mongoose.connect(uri).then(async () => {
  const Officer = mongoose.model("Officer", new mongoose.Schema({}, { strict: false }));
  const list = await Officer.find({});
  console.log("Officers in database:", list.map(o => ({ username: o.username, fullName: o.fullName, role: o.role, status: o.status })));
  process.exit(0);
}).catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
