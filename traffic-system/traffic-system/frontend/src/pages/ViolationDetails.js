import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import OICLayout from "../layouts/OICLayout";

const violationData = {
  "VID-1024": {
    id: "VID-1024",
    date: "2023-04-03",
    time: "10:30 AM",
    location: "Negombo Town, Main Road",
    type: "No Seat Belt",
    status: "Pending",
    fine: "LKR 2,500",
    driver: {
      name: "KP Jayasinghe",
      nic: "199012345678",
      phone: "+94 771 234 567",
    },
    vehicle: {
      plate: "WP BA 5678",
      make: "Honda",
      model: "Fit",
      vin: "HND-567GH34567",
    },
    officer: {
      name: "PS Perera",
      badge: "#32451",
      station: "Negombo Traffic",
    },
    evidence: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=60",
      "https://images.unsplash.com/photo-1504215680853-026ed2a45def?w=200&q=60",
    ],
  },
  "VID-1020": {
    id: "VID-1020",
    date: "2023-04-02",
    time: "08:15 AM",
    location: "Main Street, Negombo",
    type: "Speeding",
    status: "Pending",
    fine: "LKR 5,000",
    driver: {
      name: "AR Fernando",
      nic: "198567890123",
      phone: "+94 712 987 654",
    },
    vehicle: {
      plate: "WP CA 1234",
      make: "Toyota",
      model: "Corolla",
      vin: "TYT-123AB45678",
    },
    officer: {
      name: "PS Perera",
      badge: "#32451",
      station: "Negombo Traffic",
    },
    evidence: [
      "https://images.unsplash.com/photo-1603123853880-a92fec8ccf6a?w=200&q=60",
    ],
  },
};

const defaultViolation = (id) => ({
  id,
  date: "2023-04-02",
  time: "09:00 AM",
  location: "Negombo Road",
  type: "Speeding",
  status: "Pending",
  fine: "LKR 3,000",
  driver: { name: "Unknown", nic: "N/A", phone: "N/A" },
  vehicle: { plate: "N/A", make: "N/A", model: "N/A", vin: "N/A" },
  officer: { name: "PS Perera", badge: "#32451", station: "Negombo Traffic" },
  evidence: [],
});

const statusColor = (s) => {
  if (s === "Pending") return "#f59e0b";
  if (s === "Paid")    return "#22c55e";
  return "#94a3b8";
};

function ViolationDetails() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const [editMode, setEditMode] = useState(false);

  const violation = violationData[id] || defaultViolation(id);

  return (
    <OICLayout>
      <div className="page-box">

        {/* Header */}
        <div className="detail-header">
          <button className="back-btn" onClick={() => navigate("/tor")}>
            ‹ Violation ID-{violation.id}
          </button>
          <button className="edit-btn" onClick={() => setEditMode(!editMode)}>
            {editMode ? "Save ✓" : "Edit ▾"}
          </button>
        </div>

        {/* Violation Details */}
        <div className="detail-section">
          <h3 className="detail-section-title">Violation Details</h3>

          <div className="detail-row">
            <span className="detail-icon"></span>
            <span className="detail-text">{violation.date} &nbsp; {violation.time}</span>
          </div>

          <div className="detail-row" style={{ justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="detail-icon"></span>
              <span className="detail-text">{violation.location}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="detail-icon"></span>
              <span className="detail-text">{violation.type}</span>
            </div>
          </div>

          <div className="detail-row" style={{ justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="detail-icon"></span>
              <span className="detail-text">Fine: <strong>{violation.fine}</strong></span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="detail-icon"></span>
              <span
                className="severity-badge"
                style={{ background: statusColor(violation.status) }}
              >
                {violation.status}
              </span>
            </div>
          </div>
        </div>

        {/* Driver & Vehicle */}
        <div className="detail-section">
          <h3 className="detail-section-title">Driver &amp; Vehicle Information</h3>
          <div className="dv-grid">
            {/* Driver */}
            <div className="dv-col">
              <div className="dv-row">
                <span className="dv-icon"></span>
                <div>
                  <p className="dv-name">{violation.driver.name}</p>
                  <p className="dv-sub">NIC: {violation.driver.nic}</p>
                  <p className="dv-sub"> {violation.driver.phone}</p>
                </div>
              </div>
            </div>
            {/* Vehicle */}
            <div className="dv-col">
              <div className="dv-row">
                <span className="dv-icon"></span>
                <div>
                  <p className="dv-name">{violation.vehicle.plate}</p>
                  <p className="dv-sub">{violation.vehicle.make}</p>
                  <p className="dv-sub">{violation.vehicle.model} — {violation.vehicle.vin}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reporting Officer */}
        <div className="detail-section">
          <h3 className="detail-section-title">Reporting Officer</h3>
          <div className="dv-row">
            <span className="dv-icon"></span>
            <div>
              <p className="dv-name">{violation.officer.name}</p>
              <p className="dv-sub">Badge: {violation.officer.badge}</p>
              <p className="dv-sub">Station: {violation.officer.station}</p>
            </div>
          </div>
        </div>

        {/* Evidence */}
        {violation.evidence.length > 0 && (
          <div className="detail-section">
            <h3 className="detail-section-title">Evidence (Photos &amp; Attachments)</h3>
            <div className="evidence-grid">
              {violation.evidence.map((src, i) => (
                <img key={i} src={src} alt={`evidence-${i}`} className="evidence-img" />
              ))}
            </div>
            <div className="attachment-row">
              <span className="detail-icon"></span>
              <span className="detail-text attach-link">Attachments</span>
            </div>
          </div>
        )}

      </div>
    </OICLayout>
  );
}

export default ViolationDetails;