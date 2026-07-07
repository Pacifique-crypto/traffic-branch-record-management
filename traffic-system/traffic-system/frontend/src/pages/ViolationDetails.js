import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { getViolationById } from "../api";

function ViolationDetails() {

  const { id } = useParams();

  const navigate = useNavigate();

  const [editMode, setEditMode] = useState(false);

  const [violation, setViolation] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {

    loadViolation();

  }, []);

  const loadViolation = async () => {

    try {

      const data = await getViolationById(id);

      setViolation(data);

    } catch (err) {

      console.log(err);

    } finally {

      setLoading(false);

    }

  };

  if (loading) {

    return (

      <Layout>

        <div className="page-box">

          <h2>Loading violation...</h2>

        </div>

      </Layout>

    );

  }

  if (!violation) {

    return (

      <Layout>

        <div className="page-box">

          <h2>Violation not found.</h2>

        </div>

      </Layout>

    );

  }

  return (
  <Layout>

    <div className="page-box">

      {/* Header */}

      <div className="detail-header">

        <button
          className="back-btn"
          onClick={() => navigate("/tor")}
        >
          ← Violation ID - {violation._id.slice(-6).toUpperCase()}
        </button>

        <button
          className="edit-btn"
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? "Save ✓" : "Edit ▾"}
        </button>

      </div>

      {/* ========================= */}
      {/* Violation Details */}
      {/* ========================= */}

      <div className="detail-section">

        <h3 className="detail-section-title">
          Violation Details
        </h3>

        <div className="detail-row">

          <span className="detail-icon">📅</span>

          <span className="detail-text">
            {violation.violationDate}
          </span>

        </div>

        <div
          className="detail-row"
          style={{ justifyContent: "space-between" }}
        >

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >

            <span className="detail-icon">📍</span>

            <span className="detail-text">
              {violation.location}
            </span>

          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >

            <span className="detail-icon">⚠️</span>

            <span className="detail-text">
              {violation.violationType}
            </span>

          </div>

        </div>

        <div
          className="detail-row"
          style={{ justifyContent: "space-between" }}
        >

          <div>

            <span
              className="detail-text"
              style={{
                fontWeight: "bold",
                color: "#1e3a8a",
              }}
            >
              💰 Fine : Rs. {violation.fineAmount}
            </span>

          </div>

          <div>

            <span
              className="detail-text"
              style={{
                fontWeight: "bold",
                color:
                  violation.status === "Pending"
                    ? "#f97316"
                    : "#22c55e",
              }}
            >
              📌 {violation.status}
            </span>

          </div>

        </div>

      </div>

      {/* ========================= */}
      {/* Driver & Vehicle */}
      {/* ========================= */}

      <div className="detail-section">

        <h3 className="detail-section-title">
          Driver & Vehicle Details
        </h3>

        <div className="dv-grid">

          <div className="dv-col">

            <div className="dv-row">

              <span className="dv-icon">
                👤
              </span>

              <div>

                <p className="dv-name">
                  {violation.driver}
                </p>

                <p className="dv-sub">
                  NIC : {violation.driverNIC}
                </p>

              </div>

            </div>

          </div>

          <div className="dv-col">

            <div className="dv-row">

              <span className="dv-icon">
                🚘
              </span>

              <div>

                <p className="dv-name">
                  {violation.vehicle}
                </p>

                <p className="dv-sub">
                  {violation.vehicleType}
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* ========================= */}
      {/* Remarks */}
      {/* ========================= */}

      <div className="detail-section">

        <h3 className="detail-section-title">
          Officer Remarks
        </h3>

        <p
          style={{
            color: "#555",
            lineHeight: "24px",
          }}
        >
          {violation.remarks}
        </p>

      </div>

      {/* ========================= */}
      {/* Evidence */}
      {/* ========================= */}

      <div className="detail-section">

        <h3 className="detail-section-title">
          Evidence
        </h3>

        <div className="evidence-grid">

          {violation.evidencePhoto ? (

            <img
              src={violation.evidencePhoto}
              alt="Evidence"
              className="evidence-img"
            />

          ) : (

            <div
              style={{
                padding: "40px",
                color: "#777",
              }}
            >
              No Evidence Uploaded
            </div>

          )}

        </div>

      </div>

    </div>

  </Layout>
);

}

export default ViolationDetails;