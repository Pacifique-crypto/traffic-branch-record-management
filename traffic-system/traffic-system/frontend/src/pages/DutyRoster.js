import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

const days = [
  { day: "Mon", date: "23 Oct" },
  { day: "Tue", date: "24 Oct" },
  { day: "Wed", date: "25 Oct" },
  { day: "Thu", date: "26 Oct" },
  { day: "Fri", date: "27 Oct" },
  { day: "Sat", date: "28 Oct" },
  { day: "Sun", date: "29 Oct" },
];

function DutyRoster() {
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState(0);
  const [form, setForm] = useState({
    shift: "",
    officerId: "",
    location: "",
    day: "26",
    month: "Sep",
    year: "2026",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleAssign = () => {
    if (!form.shift || !form.officerId || !form.location) {
      alert("Please fill in all fields.");
      return;
    }
    alert(`Shift assigned successfully!\nShift: ${form.shift}\nOfficer: ${form.officerId}\nLocation: ${form.location}`);
    setForm({ shift: "", officerId: "", location: "", day: "26", month: "Sep", year: "2026" });
  };

  return (
    <Layout>
      <div className="page-box">
        {/* Header row */}
        <div className="dr-header-row">
          <h2 className="page-heading" style={{ marginBottom: 0 }}>Duty Roster</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="dr-week-label">&lt;Oct 23 – Oct 29, 2026&gt;</span>
            <button className="btn-view-schedule" onClick={() => navigate("/duty-roster/schedule")}>
              📋 View Full Schedule
            </button>
          </div>
        </div>

        {/* Weekly calendar strip */}
        <div className="dr-week-strip">
          {days.map((d, i) => (
            <div
              key={i}
              className={`dr-day-cell ${selectedDay === i ? "dr-day-active" : ""}`}
              onClick={() => setSelectedDay(i)}
            >
              <span className="dr-day-name">{d.day}</span>
              <span className="dr-day-date">{d.date}</span>
            </div>
          ))}
        </div>

        {/* Assign Duty Shift form */}
        <div className="dr-form-box">
          <h3 className="dr-form-title">Assign Duty Shift</h3>

          <div className="dr-form-grid">
            <div className="dr-field-row">
              <label className="dr-field-label">Shift:</label>
              <select
                className="dr-field-input"
                name="shift"
                value={form.shift}
                onChange={handleChange}
              >
                <option value="">Select Shift</option>
                <option>Daytime Accident Investigation</option>
                <option>Daytime Motorcycle Patrol</option>
                <option>Night Patrol</option>
                <option>Court Duties</option>
                <option>Traffic Branch Duties</option>
              </select>
            </div>

            <div className="dr-field-row">
              <label className="dr-field-label">Officer:</label>
              <input
                className="dr-field-input"
                name="officerId"
                placeholder="Enter officer ID"
                value={form.officerId}
                onChange={handleChange}
              />
            </div>

            <div className="dr-field-row">
              <label className="dr-field-label">Location:</label>
              <input
                className="dr-field-input"
                name="location"
                placeholder="Enter location"
                value={form.location}
                onChange={handleChange}
              />
            </div>

            <div className="dr-field-row">
              <label className="dr-field-label">Date:</label>
              <div style={{ display: "flex", gap: "6px" }}>
                <select className="dr-field-input-sm" name="day" value={form.day} onChange={handleChange}>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
                <select className="dr-field-input-sm" name="month" value={form.month} onChange={handleChange}>
                  {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
                <select className="dr-field-input-sm" name="year" value={form.year} onChange={handleChange}>
                  {["2025","2026","2027"].map((y) => <option key={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>

          <button className="btn-assign" onClick={handleAssign}>Assign</button>
        </div>
      </div>
    </Layout>
  );
}

export default DutyRoster;