/**
 * Read-Only Diagnostic Script for Duty Roster & MongoDB State
 */
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const DutyRoster = require("./models/DutyRoster");
const DutyAssignment = require("./models/DutyAssignment");
const Officer = require("./models/Officer");
const OfficerAvailability = require("./models/OfficerAvailability");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/traffic_db";

async function diagnose() {
  try {
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 3000 });
      console.log("Connected to MongoDB Atlas.");
    } catch (err) {
      await mongoose.connect("mongodb://127.0.0.1:27017/traffic_db", { serverSelectionTimeoutMS: 3000 });
      console.log("Connected to local MongoDB.");
    }

    console.log("\n=================== 1. OFFICERS SUMMARY ===================");
    const officers = await Officer.find({});
    console.log(`Total Officers in DB: ${officers.length}`);
    officers.forEach(o => {
      console.log(`- ID: ${o._id} | PoliceId: ${o.policeId || 'NO_ID'} | Name: ${o.fullName || o.name} | Status: ${o.status} | CourtDutyFlag: ${o.isCourtDutyOfficer}`);
    });

    console.log("\n=================== 2. LEAVE / AVAILABILITY SUMMARY ===================");
    const leaves = await OfficerAvailability.find({});
    console.log(`Total Leave/Availability Records: ${leaves.length}`);
    leaves.forEach(l => {
      console.log(`- Officer: ${l.officer} | Type: ${l.availabilityType || l.leaveType} | Status: ${l.status} | Start: ${l.startDate} | End: ${l.endDate}`);
    });

    console.log("\n=================== 3. DUTY ROSTERS SUMMARY ===================");
    const rosters = await DutyRoster.find({}).sort({ createdAt: -1 });
    console.log(`Total Rosters in DB: ${rosters.length}`);
    for (const r of rosters) {
      console.log(`\nROSTER ID: ${r._id} | Ref: ${r.rosterReference} | Status: ${r.status} | Start: ${r.weekStart} | End: ${r.weekEnd}`);
      console.log(`  CourtDutyOfficers:`, r.courtDutyOfficers);
      console.log(`  Conflicts (${(r.conflicts || []).length}):`, r.conflicts);
      console.log(`  Regular Duties Config (${(r.regularDuties || []).length}):`, JSON.stringify(r.regularDuties, null, 2));
    }

    console.log("\n=================== 4. DUTY ASSIGNMENTS SUMMARY ===================");
    const assignments = await DutyAssignment.find({}).populate("officer", "fullName policeId rank").sort({ date: 1 });
    console.log(`Total Duty Assignments in DB: ${assignments.length}`);
    assignments.forEach(a => {
      const dStr = a.date ? a.date.toISOString().substring(0, 10) : 'NO_DATE';
      const offName = a.officer ? `${a.officer.policeId} ${a.officer.fullName}` : 'UNASSIGNED';
      console.log(`- Date: ${dStr} | RosterId: ${a.roster} | Duty: ${a.dutyType} | Shift: ${a.shift} (${a.startTime}-${a.endTime}) | OfficerId: ${a.officer?._id || a.officer} | Officer: ${offName}`);
    });

  } catch (err) {
    console.error("Diagnostic error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

diagnose();
