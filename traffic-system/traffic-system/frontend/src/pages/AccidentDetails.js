import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import OICLayout from "../layouts/OICLayout";

// Simulated data store — in a real app this comes from an API
const accidentData = {
  "ACD-1024": {
    id: "ACD-1024",
    date: "2023-04-03",
    time: "09:15 AM",
    location: "Colombo Road, Negombo Town",
    type: "Rear-end Collision",
    severity: "High",
    driver: {
      name: "PP Kumara Peris",
      badgeNo: "#32451",
      phone: "+94 712 345 678",
    },
    vehicle: {
      plate: "WP ABC 2345",
      make: "Toyota",
      model: "Prius",
      vin: "ING-908S3G3889",
    },
    evidence: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=60",
      "https://images.unsplash.com/photo-1504215680853-026ed2a45def?w=200&q=60",
      "https://images.unsplash.com/photo-1603123853880-a92fec8ccf6a?w=200&q=60",
    ],
  },
  "ACD-1020": {
    id: "ACD-1020",
    date: "2023-04-02",
    time: "08:00 AM",
    location: "Main Street, Negombo",
    type: "Collision",
    severity: "High",
    driver: {
      name: "K Jayasinghe",
      badgeNo: "#11023",
      phone: "+94 771 234 567",
    },
    vehicle: {
      plate: "WP KA 3421",
      make: "Honda",
      model: "Civic",
      vin: "HND-12345ABCDE",
    },
    evidence: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=60",
      "https://images.unsplash.com/photo-1504215680853-026ed2a45def?w=200&q=60",
    ],
  },
};

// Fallback for IDs not in our mock store
const defaultAccident = (id) => ({
  id,
  date: "2023-04-02",
  time: "10:00 AM",
  location: "Main Street, Negombo",
  type: "Collision",
  severity: "High",
  driver: { name: "Unknown Officer", badgeNo: "#00000", phone: "+94 700 000 000" },
  vehicle: { plate: "WP XXX 0000", make: "Toyota", model: "Corolla", vin: "TYT-000000000" },
  evidence: [
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=60",
  ],
});

function AccidentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);

  const accident = accidentData[id] || defaultAccident(id);

  return (
    <OICLayout>
      <div className="page-box">
        {/* Header row */}
        <div className="detail-header">
          <button className="back-btn" onClick={() => navigate("/accidents")}>
            ‹ Accident ID-{accident.id}
          </button>
          <button className="edit-btn" onClick={() => setEditMode(!editMode)}>
            {editMode ? "Save ✓" : "Edit ▾"}
          </button>
        </div>

        {/* Accident Details */}
        <div className="detail-section">
          <h3 className="detail-section-title">Accident Details</h3>
          <div className="detail-row">
            <span className="detail-icon"></span>
            <span className="detail-text">{accident.date} &nbsp; {accident.time}</span>
          </div>
          <div className="detail-row" style={{ justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="detail-icon"></span>
              <span className="detail-text">{accident.location}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="detail-icon"></span>
              <span className="detail-text">{accident.type}</span>
            </div>
          </div>
        </div>

        {/* Driver & Vehicle */}
        <div className="detail-section">
          <h3 className="detail-section-title">Driver &amp; Vehicle Informations</h3>
          <div className="dv-grid">
            {/* Driver */}
            <div className="dv-col">
              <div className="dv-row">
                <span className="dv-icon"></span>
                <div>
                  <p className="dv-name">{accident.driver.name}</p>
                  <p className="dv-sub">{accident.driver.badgeNo}</p>
                  <p className="dv-sub"> {accident.driver.phone}</p>
                </div>
              </div>
            </div>
            {/* Vehicle */}
            <div className="dv-col">
              <div className="dv-row">
                <span className="dv-icon"></span>
                <div>
                  <p className="dv-name">{accident.vehicle.plate}</p>
                  <p className="dv-sub">{accident.vehicle.make}</p>
                  <p className="dv-sub">{accident.vehicle.model} {accident.vehicle.vin}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Evidence */}
        <div className="detail-section">
          <h3 className="detail-section-title">Evidence (Photos &amp; Attachments)</h3>
          <div className="evidence-grid">
            {accident.evidence.map((src, i) => (
              <img key={i} src={src} alt={`evidence-${i}`} className="evidence-img" />
            ))}
          </div>
          <div className="attachment-row">
            <span className="detail-icon"></span>
            <span className="detail-text attach-link">Attachments</span>
          </div>
        </div>
      </div>
    </OICLayout>
  );
}

export default AccidentDetails;