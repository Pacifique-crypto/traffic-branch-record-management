import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiPrinter, FiPlus, FiUpload } from "react-icons/fi";
import { getViolationById, updateViolation } from "../api";

const vData = {
  "TR-2023-8842": {
    id: "TR-2023-8842",
    offence: "Driving Under the Influence (DUI)",
    lawSection: "Motor Traffic Act Sec. 151(1)",
    dateTime: "Oct 23, 2023 | 23:45 PM",
    place: "Galle Face Centre Road, Colombo 03",
    geoCoords: "6.9216° N, 19.8512° E",
    driver: {
      name: "K. Perera Kumara", nic: "742 134 5891",
      dlNo: "D-023894", licenseValidity: "Valid until 2026-12-31",
      address: "No. 45C, Temple Road, Kirulapone, Colombo 05",
    },
    vehicle: {
      no: "WP CAD-8842", type: "Motor Car (Sedan)",
      make: "Toyota Prius", color: "Pearl White", fuelType: "Hybrid",
    },
    officers: [
      { name: "Sgt. Jayasinghe (5421)", station: "Norris Station" },
      { name: "PC. Ratnayake (8832)",   station: "Radio Control" },
    ],
    description: "Vehicle was observed swerving across lanes on Galle Face Centre Road. Upon interception, the driver displayed clear signs of intoxication including slurred speech and odor of alcohol. Breathalyzer test conducted at 23:55 PM showed a reading of 0.08%, exceeding the legal limit. Driver was uncooperative during initial questioning.",
    actionTaken: "License Suspended – Pending Court Date",
    nextAppearance: "Nov 15, 2023 – MC Port",
    remarks: [{ text: "Case referred to HQ legal division. Prosecution pending vehicle report.", author: "OIC Negombo HQ" }],
    evidence: [
      { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&q=60", name: "Scene Flag" },
      { url: "https://images.unsplash.com/photo-1504215680853-026ed2a45def?w=100&q=60", name: "Breathalyzer" },
      { url: "https://images.unsplash.com/photo-1603123853880-a92fec8ccf6a?w=100&q=60", name: "St. Angle" },
    ],
  },
};

const defaultV = (id) => ({ ...vData["TR-2023-8842"], id });

function ViolationDetails() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const userRole = localStorage.getItem("userRole") || "IT Officer";
  const isOIC    = userRole === "OIC";

  let Layout;
  if (isOIC) Layout = require("../layouts/OICLayout").default;
  else        Layout = require("../layouts/ITLayout").default;

  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [remarks, setRemarks]     = useState([]);
  const [showNote, setShowNote]   = useState(false);
  const [newNote, setNewNote]     = useState("");
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const result = await getViolationById(id);
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
        console.error("Failed to load violation details:", err);
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
      const res = await updateViolation(id, { remarks: updatedRemarks });
      if (res && !res.error) {
        setRemarks(updatedRemarks);
        setNewNote("");
        setShowNote(false);
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
          Loading violation details...
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div style={{ padding: "40px", textAlign: "center", fontWeight: "bold", color: "#dc2626" }}>
          Violation record not found.
        </div>
      </Layout>
    );
  }

  const driver = {
    name: data.driver || "Unknown",
    nic: data.driverNIC || "Unknown",
    dlNo: data.drivingLicence || "Unknown",
    licenseValidity: data.licenseValidity || "N/A",
    address: data.driverAddress || "Unknown",
  };

  const vehicle = {
    no: data.vehicle || "Unknown",
    type: data.vehicleType || "Unknown",
    make: data.vehicleMake || "N/A",
    color: data.vehicleColor || "N/A",
    fuelType: data.vehicleFuelType || "N/A",
  };

  const officers = data.officers || [
    { name: data.assistantOfficer || "Unknown", station: "Negombo HQ" }
  ];

  const evidence = data.evidence || (
    data.evidencePhoto
      ? (Array.isArray(data.evidencePhoto)
          ? data.evidencePhoto.map((url, i) => ({ url, name: `Evidence Photo ${i + 1}` }))
          : [{ url: data.evidencePhoto, name: "Evidence Photo" }]
        )
      : []
  );

  return (
    <Layout>
      <div className="acd-page">
        {/* Breadcrumb */}
        <div className="acd-breadcrumb">
          <span onClick={() => navigate("/tor")} style={{ cursor: "pointer", color: "#64748b" }}>TOR</span>
          <span> › </span>
          <span style={{ color: "#0f172a" }}>{id}</span>
        </div>

        <div className="acd-header">
          <button className="acd-back-btn" onClick={() => navigate("/tor")}>
            <FiArrowLeft size={16} style={{ marginRight: 6 }} /> Ref No: {id}
          </button>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ textAlign: "right", fontSize: 12, color: "#64748b" }}>
              <p>Generated on Oct 24, 2023 • 10:20 PM</p>
            </div>
            <button className="acd-print-btn" onClick={() => window.print()}>
              <FiPrinter size={14} style={{ marginRight: 6 }} /> Print Report
            </button>
          </div>
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>Traffic Violation Report</h2>
        <p style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>Ref No: {id}</p>

        <div className="acd-two-col">
          {/* LEFT */}
          <div className="acd-left">

            {/* Offence Details */}
            <div className="acd-section">
              <div className="acd-section-title"><span>⚠️</span> OFFENCE DETAILS</div>
              <div className="acd-grid-2">
                <div><p className="acd-label">NAME OF OFFENCE</p><p className="acd-value">{data.violationType || data.offence}</p></div>
                <div><p className="acd-label">LAW SECTION</p><p className="acd-value">{data.lawSection}</p></div>
                <div><p className="acd-label">DATE AND TIME</p><p className="acd-value">{data.violationDate || data.dateTime}</p></div>
                <div><p className="acd-label">PLACE</p><p className="acd-value">{data.location || data.place}</p></div>
              </div>
              <div style={{ marginTop: 10 }}>
                <p className="acd-label">GEOGRAPHIC COORDINATES</p>
                <p className="acd-value">{data.geoCoords || "Not Available"}</p>
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="acd-section">
              <div className="acd-section-title"><span>🚗</span> VEHICLE DETAILS</div>
              <div className="acd-vehicle-number-big">{vehicle.no}</div>
              <div className="acd-grid-2" style={{ marginTop: 12 }}>
                <div><p className="acd-label">TYPE</p><p className="acd-value">{vehicle.type}</p></div>
                <div><p className="acd-label">MAKE / MODEL</p><p className="acd-value">{vehicle.make}</p></div>
                <div><p className="acd-label">COLOR</p><p className="acd-value">{vehicle.color}</p></div>
                <div><p className="acd-label">FUEL TYPE</p><p className="acd-value">{vehicle.fuelType}</p></div>
              </div>
            </div>

            {/* Officers */}
            <div className="acd-section">
              <div className="acd-section-title"><span>👮</span> OFFICERS DETECTING</div>
              <div className="acd-officers-grid">
                {officers.map((o, i) => (
                  <div className="acd-officer-card" key={i}>
                    <p style={{ fontSize: 11, color: "#64748b", marginBottom: 3 }}>Detecting Officer {String.fromCharCode(65+i)}</p>
                    <p className="acd-value">{o.name}</p>
                    <p style={{ fontSize: 12, color: "#94a3b8" }}>{o.station}</p>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, padding: "12px 14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <p className="acd-label">DESCRIPTION</p>
                <p className="acd-description" style={{ marginTop: 6 }}>{data.description || data.remarks || "No description provided."}</p>
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 20 }}>
                <div><p className="acd-label">ACTION TAKEN</p><p className="acd-value" style={{ color: "#dc2626" }}>{data.actionTaken || "Pending"}</p></div>
                <div><p className="acd-label">NEXT APPEARANCE</p><p className="acd-value">{data.nextAppearance || "N/A"}</p></div>
              </div>
            </div>

            {/* Evidence */}
            <div className="acd-section">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div className="acd-section-title" style={{ marginBottom: 0 }}><span>📎</span> EVIDENCE</div>
                <button className="acd-upload-btn"><FiUpload size={13} style={{ marginRight: 6 }} /> Upload More</button>
              </div>
              <div className="acd-evidence-grid">
                {evidence.map((e, i) => (
                  <div key={i} className="acd-evidence-item" onClick={() => setSelectedImage(e.url)}>
                    <img src={e.url} alt={e.name} className="acd-evidence-img" />
                    <p className="acd-evidence-name">{e.name}</p>
                  </div>
                ))}
              </div>
              {data.attachment && (
                <div className="acd-attachment-row" style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="acd-attachment-name" style={{ color: "#64748b" }}>📎 Attachment:</span>
                  <a href={data.attachment} download="Attachment.pdf" style={{ color: "#2563eb", textDecoration: "underline", fontWeight: 600, fontSize: 13 }}>
                    Download Attachment
                  </a>
                </div>
              )}
              {/* Voice Note Player */}
              {data.voiceNote && (
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
                  <p className="acd-label" style={{ marginBottom: 6, fontWeight: 600, fontSize: 12, color: "#64748b" }}>🎤 VOICE NOTE EVIDENCE</p>
                  <audio controls src={data.voiceNote} style={{ width: "100%" }} />
                </div>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div className="acd-right">

            {/* Driver Details */}
            <div className="acd-section">
              <div className="acd-section-title"><span>👤</span> DRIVER DETAILS</div>
              <p className="acd-bold" style={{ fontSize: 15, marginBottom: 10 }}>{driver.name}</p>
              <div className="acd-grid-2">
                <div><p className="acd-label">NIC</p><p className="acd-value">{driver.nic}</p></div>
                <div><p className="acd-label">DL NO</p><p className="acd-value">{driver.dlNo}</p></div>
              </div>
              <div style={{ marginTop: 10 }}>
                <p className="acd-label">REGISTERED ADDRESS</p>
                <p className="acd-value">{driver.address}</p>
              </div>
              <div style={{ marginTop: 10 }}>
                <p className="acd-label">LICENSE VALIDITY</p>
                <p className="acd-value" style={{ color: "#16a34a" }}>{driver.licenseValidity}</p>
              </div>
            </div>

            {/* Remarks */}
            <div className="acd-section">
              <div className="acd-section-title"><span>📝</span> REMARKS</div>
              {remarks.map((r, i) => (
                <div className="acd-remark-card" key={i}>
                  <p className="acd-remark-text">"{r.text}"</p>
                  <p className="acd-remark-author">— {r.author}</p>
                </div>
              ))}
              {isOIC && !showNote && (
                <button className="acd-add-note-btn" onClick={() => setShowNote(true)}>
                  <FiPlus size={14} style={{ marginRight: 6 }} /> Add Operational Note
                </button>
              )}
              {isOIC && showNote && (
                <div style={{ marginTop: 10 }}>
                  <textarea className="acd-note-input" placeholder="Enter operational note..." value={newNote} onChange={e => setNewNote(e.target.value)} rows={3} />
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button className="um-cancel-btn" onClick={() => setShowNote(false)}>Cancel</button>
                    <button className="um-submit-btn" onClick={addNote}>Add Note</button>
                  </div>
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

export default ViolationDetails;