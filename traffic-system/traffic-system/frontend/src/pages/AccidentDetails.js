import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiPrinter, FiPlus, FiPaperclip, FiUpload, FiCheckCircle } from "react-icons/fi";
import { getAccidentById, updateAccident } from "../api";

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

function AccidentDetails() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const userRole = localStorage.getItem("userRole") || "IT Officer";
  const isOIC    = userRole === "OIC";

  let Layout;
  if (isOIC) Layout = require("../layouts/OICLayout").default;
  else        Layout = require("../layouts/ITLayout").default;

  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [remarks, setRemarks]         = useState([]);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [newNote, setNewNote]         = useState("");
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const result = await getAccidentById(id);
        setData(result);
        if (result.remarks) {
          if (Array.isArray(result.remarks)) {
            setRemarks(result.remarks);
          } else if (typeof result.remarks === "string") {
            setRemarks([{ text: result.remarks, author: "Reporting Officer" }]);
          } else {
            setRemarks([]);
          }
        } else {
          setRemarks([]);
        }
      } catch (err) {
        console.error("Failed to load accident details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const addNote = async () => {
    if (!newNote.trim()) return;
    const officer = JSON.parse(localStorage.getItem("officer") || "{}");
    const updatedRemarks = [...remarks, { text: newNote, author: officer.name || "OIC" }];
    
    try {
      const res = await updateAccident(id, { remarks: updatedRemarks });
      if (res && !res.error) {
        setRemarks(updatedRemarks);
        setNewNote("");
        setShowNoteInput(false);
      } else {
        alert(res.error || "Failed to save operational note.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving operational note to server.");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ padding: "40px", textAlign: "center", fontWeight: "bold" }}>
          Loading accident details...
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div style={{ padding: "40px", textAlign: "center", fontWeight: "bold", color: "#dc2626" }}>
          Accident record not found.
        </div>
      </Layout>
    );
  }

  const dateStr = data.accidentDate || "";
  const [datePart, timePart] = dateStr.includes("T") ? dateStr.split("T") : dateStr.split(" ");
  const dateVal = datePart;
  const timeVal = timePart ? timePart.slice(0, 5) : "";

  const vehicles = data.vehicles || [
    { no: "01", vehicleNo: data.vehicleNumber || "Unknown", vehicleClass: data.vehicleClass || "Unknown", age: `${data.vehicleAge || 0} Years` }
  ];

  const drivers = data.drivers || [
    { vehicle: "01", name: data.driverName || data.driver || "Unknown", age: data.driverAge || "Unknown", dlNo: data.drivingLicence || "Unknown", address: data.driverAddress || "Unknown" }
  ];

  const killed = data.killed || (data.casualtyStatus === "Killed" ? [{ name: data.casualtyName, gender: data.casualtyGender, age: data.casualtyAge, address: data.casualtyAddress }] : []);
  const injured = data.injured || (data.casualtyStatus === "Injured" ? [{ name: data.casualtyName, gender: data.casualtyGender, age: data.casualtyAge, address: data.casualtyAddress }] : []);
  const evidence = data.evidence || (
    data.evidencePhoto
      ? (Array.isArray(data.evidencePhoto)
          ? data.evidencePhoto.map((url, i) => ({ type: "image", url, name: `Evidence Photo ${i + 1}` }))
          : [{ type: "image", url: data.evidencePhoto, name: "Evidence Photo" }]
        )
      : []
  );

  const severityColors = { FATAL: "#dc2626", SERIOUS: "#b45309", MINOR: "#2563eb", PROPERTY: "#7c3aed" };
  const sc = severityColors[data.severity] || "#374151";

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
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {isOIC && data.status !== "Completed" && (
              <button
                className="acd-verify-btn"
                onClick={async () => {
                  try {
                    const res = await updateAccident(id, { status: "Completed" });
                    if (res && !res.error) {
                      setData({ ...data, status: "Completed" });
                      alert("Accident record verified and checked successfully.");
                    } else {
                      alert(res.error || "Failed to verify record.");
                    }
                  } catch (err) {
                    console.error(err);
                    alert("Error connecting to server.");
                  }
                }}
                style={{
                  background: "#22c55e",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: 14,
                }}
              >
                <FiCheckCircle size={14} style={{ marginRight: 6 }} /> Mark as Checked
              </button>
            )}
            {isOIC && data.status === "Completed" && (
              <span style={{ display: "flex", alignItems: "center", color: "#22c55e", fontWeight: "600", gap: "6px", fontSize: 14 }}>
                <FiCheckCircle size={16} /> Checked & Verified
              </span>
            )}
            <button className="acd-print-btn" onClick={() => window.print()}>
              <FiPrinter size={14} style={{ marginRight: 6 }} /> Print Report
            </button>
          </div>
        </div>

        <div className="acd-two-col">
          {/* LEFT COLUMN */}
          <div className="acd-left">

            {/* Section 1: Overview */}
            <div className="acd-section">
              <div className="acd-section-title"><span>🕐</span> SECTION 1: ACCIDENT OVERVIEW</div>
              <div className="acd-grid-2">
                <div><p className="acd-label">DATE & TIME</p><p className="acd-value">{dateVal} | {timeVal}</p></div>
                <div><p className="acd-label">STATION</p><p className="acd-value">{data.station}</p></div>
                <div><p className="acd-label">LOCATION</p><p className="acd-value">{data.location}</p></div>
                <div><p className="acd-label">ACCIDENT TYPE</p><p className="acd-value">{data.accidentType || data.description || "Collision"}</p></div>
                <div>
                  <p className="acd-label">SEVERITY TYPE</p>
                  <span className="acd-severity-pill" style={{ background: sc }}>
                    {data.severity}
                  </span>
                </div>
                <div><p className="acd-label">INQUIRING OFFICERS</p><p className="acd-value">{data.assistantOfficer || data.officer || "Unknown"}</p></div>
              </div>
            </div>

            {/* Section 2: Vehicles */}
            <div className="acd-section">
              <div className="acd-section-title"><span>🚗</span> SECTION 2: VEHICLES DETAILS</div>
              <div className="acd-vehicles-grid">
                {vehicles.map((v, i) => (
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
                  {drivers.map((d, i) => (
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
              {killed.map((k, i) => (
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
              {injured.map((inju, i) => (
                <div className="acd-casualty-card" key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span className="acd-bold">{inju.name}</span>
                    <span className="acd-injured-badge" style={{ background: "#fef3c7", color: "#d97706" }}>INJURED</span>
                  </div>
                  <div className="acd-grid-2">
                    <div><p className="acd-label">GENDER</p><p className="acd-value">{inju.gender}</p></div>
                    <div><p className="acd-label">AGE</p><p className="acd-value">{inju.age}</p></div>
                  </div>
                  <div><p className="acd-label">ADDRESS</p><p className="acd-value">{inju.address}</p></div>
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
                {evidence.map((e, i) => (
                  <div key={i} className="acd-evidence-item" onClick={() => setSelectedImage(e.url)}>
                    <img src={e.url} alt={e.name} className="acd-evidence-img" />
                    <p className="acd-evidence-name">{e.name}</p>
                  </div>
                ))}
              </div>
              {/* Attachments */}
              {(data.attachments || []).map((a, i) => (
                <div className="acd-attachment-row" key={i}>
                  <FiPaperclip size={14} color="#64748b" />
                  <span className="acd-attachment-name">{a}</span>
                </div>
              ))}
              {data.attachment && (
                <div className="acd-attachment-row" style={{ marginTop: 10 }}>
                  <FiPaperclip size={14} color="#64748b" />
                  <a href={data.attachment} download="Attachment.pdf" className="acd-attachment-name" style={{ color: "#2563eb", textDecoration: "underline", fontWeight: 600 }}>
                    Download Attachment
                  </a>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            cursor: "zoom-out"
          }}
          onClick={() => setSelectedImage(null)}
        >
          <img 
            src={selectedImage} 
            alt="Evidence Detail" 
            style={{
              maxWidth: "90%",
              maxHeight: "80%",
              borderRadius: "8px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              border: "3px solid #ffffff",
              objectFit: "contain"
            }} 
          />
          <button 
            style={{
              marginTop: 20,
              backgroundColor: "#ef4444",
              color: "#ffffff",
              border: "none",
              padding: "10px 24px",
              borderRadius: "6px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
            }}
            onClick={() => setSelectedImage(null)}
          >
            Close Preview
          </button>
        </div>
      )}
    </Layout>
  );
}

export default AccidentDetails;