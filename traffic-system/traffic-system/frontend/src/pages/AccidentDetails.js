import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiPrinter, FiPlus, FiPaperclip, FiUpload } from "react-icons/fi";

const accidentData = {
  "ACD-1020": {
    id: "ACD-1020",
    // Section 1
    date: "2023-04-02", time: "08:00 AM", station: "Negombo HQ (Zone 4)",
    location: "Main Street, Negombo", accidentType: "Head-on Collision",
    severityType: "FATAL", inquiringOfficer: "IP Wijesekara (ID: 4425)",
    // Section 2
    vehicles: [
      { no: "01", vehicleNo: "WP KA 3421", vehicleClass: "Car / Sedan", age: "5 Years" },
      { no: "02", vehicleNo: "CP BC 1902", vehicleClass: "Motorcycle",   age: "2 Years" },
    ],
    // Section 3
    drivers: [
      { vehicle: "01", name: "K. Jayasinghe", age: 34, dlNo: "B00238IV", address: "No. 12, Flower Rd, Colombo 03" },
      { vehicle: "02", name: "M. Fahan",       age: 22, dlNo: "G0238IVU", address: "54A, Main St, Negombo" },
    ],
    // Section 4
    killed: [{ name: "M. Fahan", gender: "Male", age: 22, address: "152, Perera Lane, Negombo" }],
    injured: [],
    // Section 5
    description: "Vehicle 01 (KA 3421) was traveling north-bound on Main Street at an estimated speed of 75km/h. According to eyewitness accounts and CCTV footage from the 'Kings Place' entrance, the driver lost control while attempting an illegal overtake near the junction. The vehicle crossed the double yellow line and collided head-on with a stationary motorcycle (BC 1902) parked legally at the curb. Impact resulted in immediate structural damage to both vehicles and severe trauma to the motorcycle operator.",
    // Section 6
    remarks: [{ text: "Case referred to HQ legal division. Prosecution pending vehicle mechanical report. Driver in custody.", author: "OIC Negombo HQ" }],
    // Section 7
    evidence: [
      { type: "image", url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=120&q=60", name: "Scene Flag" },
      { type: "image", url: "https://images.unsplash.com/photo-1504215680853-026ed2a45def?w=120&q=60", name: "Bell Housing" },
      { type: "image", url: "https://images.unsplash.com/photo-1603123853880-a92fec8ccf6a?w=120&q=60", name: "St. Angle" },
    ],
    attachments: ["Medical_Report_ACD1020.pdf"],
  },
};

const defaultData = (id) => ({ ...accidentData["ACD-1020"], id });

function AccidentDetails() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const userRole = localStorage.getItem("userRole") || "IT Officer";
  const isOIC    = userRole === "OIC";

  let Layout;
  if (isOIC) Layout = require("../layouts/OICLayout").default;
  else        Layout = require("../layouts/ITLayout").default;

  const data = accidentData[id] || defaultData(id);

  const [remarks, setRemarks]         = useState(data.remarks);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [newNote, setNewNote]         = useState("");

  const addNote = () => {
    if (!newNote.trim()) return;
    const officer = JSON.parse(localStorage.getItem("officer") || "{}");
    setRemarks([...remarks, { text: newNote, author: officer.name || "OIC" }]);
    setNewNote("");
    setShowNoteInput(false);
  };

  const severityColors = { FATAL: "#dc2626", SERIOUS: "#b45309", MINOR: "#2563eb", PROPERTY: "#7c3aed" };
  const sc = severityColors[data.severityType] || "#374151";

  return (
    <Layout>
      <div className="acd-page">
        {/* Breadcrumb + header */}
        <div className="acd-breadcrumb">
          <span onClick={() => navigate("/accidents")} style={{ cursor: "pointer", color: "#64748b" }}>Dashboard</span>
          <span> › </span>
          <span onClick={() => navigate("/accidents")} style={{ cursor: "pointer", color: "#64748b" }}>Accident Registry</span>
          <span> › </span>
          <span style={{ color: "#0f172a" }}>{id}</span>
        </div>

        <div className="acd-header">
          <button className="acd-back-btn" onClick={() => navigate("/accidents")}>
            <FiArrowLeft size={16} style={{ marginRight: 6 }} /> Accident Ref. No: {id}
          </button>
          <button className="acd-print-btn" onClick={() => window.print()}>
            <FiPrinter size={14} style={{ marginRight: 6 }} /> Print Report
          </button>
        </div>

        <div className="acd-two-col">
          {/* LEFT COLUMN */}
          <div className="acd-left">

            {/* Section 1: Overview */}
            <div className="acd-section">
              <div className="acd-section-title"><span>🕐</span> SECTION 1: ACCIDENT OVERVIEW</div>
              <div className="acd-grid-2">
                <div><p className="acd-label">DATE & TIME</p><p className="acd-value">{data.date} | {data.time}</p></div>
                <div><p className="acd-label">STATION</p><p className="acd-value">{data.station}</p></div>
                <div><p className="acd-label">LOCATION</p><p className="acd-value">{data.location}</p></div>
                <div><p className="acd-label">ACCIDENT TYPE</p><p className="acd-value">{data.accidentType}</p></div>
                <div>
                  <p className="acd-label">SEVERITY TYPE</p>
                  <span className="acd-severity-pill" style={{ background: sc }}>
                    {data.severityType}
                  </span>
                </div>
                <div><p className="acd-label">INQUIRING OFFICERS</p><p className="acd-value">{data.inquiringOfficer}</p></div>
              </div>
            </div>

            {/* Section 2: Vehicles */}
            <div className="acd-section">
              <div className="acd-section-title"><span>🚗</span> SECTION 2: VEHICLES DETAILS</div>
              <div className="acd-vehicles-grid">
                {data.vehicles.map((v, i) => (
                  <div className="acd-vehicle-card" key={i}>
                    <p className="acd-label">VEHICLE {v.no}</p>
                    <div className="acd-grid-2" style={{ marginTop: 8 }}>
                      <div><p className="acd-label">VEHICLE NO</p><p className="acd-value acd-bold">{v.vehicleNo}</p></div>
                      <div><p className="acd-label">CLASS</p><p className="acd-value">{v.vehicleClass}</p></div>
                      <div><p className="acd-label">AGE</p><p className="acd-value">{v.age}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Drivers */}
            <div className="acd-section">
              <div className="acd-section-title"><span>👤</span> SECTION 3: DRIVERS DETAILS</div>
              <table className="acd-table">
                <thead>
                  <tr>
                    <th>VEHICLE</th><th>NAME</th><th>AGE</th><th>DL NOS</th><th>ADDRESS</th>
                  </tr>
                </thead>
                <tbody>
                  {data.drivers.map((d, i) => (
                    <tr key={i}>
                      <td>{d.vehicle}</td>
                      <td>{d.name}</td>
                      <td>{d.age}</td>
                      <td>{d.dlNo}</td>
                      <td>{d.address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Section 5: Description */}
            <div className="acd-section">
              <div className="acd-section-title"><span>📋</span> SECTION 5: DESCRIPTION</div>
              <p className="acd-description">{data.description}</p>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="acd-right">

            {/* Section 4: Killed/Injured */}
            <div className="acd-section">
              <div className="acd-section-title"><span>⚠️</span> SECTION 4: KILLED/INJURED DETAILS</div>
              {data.killed.map((k, i) => (
                <div className="acd-casualty-card" key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span className="acd-bold">{k.name}</span>
                    <span className="acd-killed-badge">KILLED</span>
                  </div>
                  <div className="acd-grid-2">
                    <div><p className="acd-label">GENDER</p><p className="acd-value">{k.gender}</p></div>
                    <div><p className="acd-label">AGE</p><p className="acd-value">{k.age}</p></div>
                  </div>
                  <div><p className="acd-label">ADDRESS</p><p className="acd-value">{k.address}</p></div>
                </div>
              ))}
            </div>

            {/* Section 6: Remarks */}
            <div className="acd-section">
              <div className="acd-section-title"><span>📝</span> SECTION 6: REMARKS</div>
              {remarks.map((r, i) => (
                <div className="acd-remark-card" key={i}>
                  <p className="acd-remark-text">"{r.text}"</p>
                  <p className="acd-remark-author">— {r.author}</p>
                </div>
              ))}
              {/* OIC can add operational note */}
              {isOIC && !showNoteInput && (
                <button className="acd-add-note-btn" onClick={() => setShowNoteInput(true)}>
                  <FiPlus size={14} style={{ marginRight: 6 }} /> Add Operational Note
                </button>
              )}
              {isOIC && showNoteInput && (
                <div style={{ marginTop: 12 }}>
                  <textarea
                    className="acd-note-input"
                    placeholder="Enter your operational note..."
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    rows={3}
                  />
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button className="um-cancel-btn" onClick={() => setShowNoteInput(false)}>Cancel</button>
                    <button className="um-submit-btn" onClick={addNote}>Add Note</button>
                  </div>
                </div>
              )}
            </div>

            {/* Section 7: Evidence */}
            <div className="acd-section">
              <div className="acd-section-title"><span>📎</span> SECTION 7: EVIDENCES AND ATTACHEMENT MARK</div>
              <div className="acd-evidence-grid">
                {data.evidence.map((e, i) => (
                  <div key={i} className="acd-evidence-item">
                    <img src={e.url} alt={e.name} className="acd-evidence-img" />
                    <p className="acd-evidence-name">{e.name}</p>
                  </div>
                ))}
              </div>
              {/* Attachments */}
              {data.attachments.map((a, i) => (
                <div className="acd-attachment-row" key={i}>
                  <FiPaperclip size={14} color="#64748b" />
                  <span className="acd-attachment-name">{a}</span>
                </div>
              ))}
              {!isOIC && (
                <button className="acd-upload-btn">
                  <FiUpload size={13} style={{ marginRight: 6 }} /> Upload More
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}

export default AccidentDetails;