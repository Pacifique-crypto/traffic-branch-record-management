const mongoose = require("mongoose");

const connectDB = async () => {
  let connected = false;
  while (!connected) {
    try {
      console.log("Connecting to MongoDB...");
      await mongoose.connect(process.env.MONGO_URI);
      console.log("MongoDB Connected ✅");
      connected = true;
    } catch (error) {
      console.error("MongoDB connection failed:", error.message);
      console.log("Retrying in 5 seconds...");
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};

module.exports = connectDB;