/**
 * Detailed Diagnostic Trace for Duty Roster Generation Algorithm on Roster 6aacf20d66b82ff1cf3353f4
 */
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Officer = require("./models/Officer");
const DutyAssignment = require("./models/DutyAssignment");
const DutyRoster = require("./models/DutyRoster");
const { validateAssignment, formatDateStr } = require("./services/rosterValidator");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/traffic_db";

async function runTrace() {
  try {
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 3000 });
    } catch (e) {
      await mongoose.connect("mongodb://127.0.0.1:27017/traffic_db", { serverSelectionTimeoutMS: 3000 });
    }

    console.log("==========================================================================");
    console.log(" TRACING VALIDATION FOR ROSTER 6aacf20d66b82ff1cf3353f4 ON 2026-09-22");
    console.log("==========================================================================");

    const activeOfficers = await Officer.find({ status: "Active" });
    const targetRoster = await DutyRoster.findById("6aacf20d66b82ff1cf3353f4");
    console.log("Target Roster:", targetRoster ? `${targetRoster._id} (${targetRoster.rosterReference}) [Start: ${targetRoster.weekStart} to ${targetRoster.weekEnd}]` : "NOT FOUND");

    const courtDutyOfficerIds = (targetRoster?.courtDutyOfficers || []).map(id => String(id));
    console.log("Designated Court Officer IDs for this roster:", courtDutyOfficerIds);

    const targetDate = new Date("2026-09-22T00:00:00.000Z");

    const slotsToTest = [
      { name: "Court Duty", shift: "08:00–16:00", count: 2, location: "Magistrate Court" },
      { name: "Accident Investigation Duty", shift: "06:00–18:00", count: 2, location: "Main Station / Field" },
      { name: "119 Motorcycle Patrol", shift: "06:00–18:00", count: 2, location: "Emergency Response Patrol" },
      { name: "Point Duty", shift: "06:00–14:00", count: 4, location: "Poruthota & Main Junctions" },
      { name: "Traffic Branch Duty", shift: "06:00–18:00", count: 2, location: "Traffic Branch HQ" }
    ];

    for (const slot of slotsToTest) {
      console.log(`\n=== EVALUATING SLOT: ${slot.name} | Shift: ${slot.shift} | Req: ${slot.count} ===`);
      let eligibleCount = 0;
      for (const off of activeOfficers) {
        const val = await validateAssignment(
          {
            officer: off._id,
            date: targetDate,
            dutyType: slot.name,
            shift: slot.shift,
            location: slot.location,
            roster: targetRoster?._id
          },
          { courtDutyOfficerIds }
        );

        const existingAssignments = await DutyAssignment.find({
          officer: off._id,
          date: {
            $gte: new Date("2026-09-20T00:00:00Z"),
            $lte: new Date("2026-09-25T23:59:59Z")
          }
        });

        const existStr = existingAssignments.map(a => `${formatDateStr(a.date)} [${a.dutyType} ${a.shift} Roster:${a.roster}]`).join("; ");

        if (val.valid) {
          eligibleCount++;
          console.log(`  ✅ ELIGIBLE: ${off.policeId} ${off.fullName} | Workload/Existing: ${existStr || 'None'}`);
        } else {
          console.log(`  ❌ REJECTED: ${off.policeId} ${off.fullName} | Code: ${val.code} | Reason: "${val.message}"`);
        }
      }
      console.log(`  => Total Eligible Officers for ${slot.name}: ${eligibleCount}`);
    }

  } catch (err) {
    console.error("Trace error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

runTrace();
