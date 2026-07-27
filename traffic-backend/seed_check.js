const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Shift = require("./models/Shift");

const run = async () => {
  try {
    console.log("Connecting to MongoDB at:", process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    const count = await Shift.countDocuments();
    console.log("Current Shift count:", count);
    
    // Always clear and re-insert to make sure they are fresh and correctly formed
    console.log("Clearing and re-inserting Sri Lanka Traffic Police Shifts...");
    await Shift.deleteMany({});
    
    const seeded = await Shift.insertMany([
      { name: "Full Day Duty", startTime: "06:00", endTime: "18:00", description: "Traffic Control and General Duties", isActive: true },
      { name: "Early Motorcycle Patrol", startTime: "06:00", endTime: "14:00", description: "Motorcycle Patrol (Morning)", isActive: true },
      { name: "Late Motorcycle Patrol", startTime: "14:00", endTime: "22:00", description: "Motorcycle Patrol (Evening)", isActive: true },
      { name: "Evening Duty", startTime: "14:00", endTime: "22:00", description: "Traffic Control (Evening Peak)", isActive: true },
      { name: "Night Duty", startTime: "18:00", endTime: "06:00", description: "Night Patrol and Security Checks", isActive: true }
    ]);
    console.log("Successfully seeded shifts:", seeded);
  } catch (err) {
    console.error("Error during seed check:", err);
  }
  process.exit(0);
};
run();
