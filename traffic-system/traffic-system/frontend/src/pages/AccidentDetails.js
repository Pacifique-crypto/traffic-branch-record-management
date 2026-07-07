import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { getAccidentById } from "../api";

function AccidentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [editMode, setEditMode] = useState(false);
  const [accident, setAccident] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccident();
  }, []);

  const loadAccident = async () => {
    try {
      const data = await getAccidentById(id);
      setAccident(data);
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
          <h2>Loading accident details...</h2>
        </div>
      </Layout>
    );
  }

  if (!accident) {
    return (
      <Layout>
        <div className="page-box">
          <h2>Accident not found.</h2>
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
            onClick={() => navigate("/accidents")}
          >
            ← Accident ID - {accident._id.slice(-6).toUpperCase()}
          </button>

          <button
            className="edit-btn"
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? "Save ✓" : "Edit ▾"}
          </button>

        </div>

        {/* Accident Details */}

        <div className="detail-section">

          <h3 className="detail-section-title">
            Accident Details
          </h3>

          <div className="detail-row">

            <span className="detail-icon">📅</span>

            <span className="detail-text">
              {accident.accidentDate}
            </span>

          </div>

          <div
            className="detail-row"
            style={{
              justifyContent: "space-between",
            }}
          >

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >

              <span className="detail-icon">
                📍
              </span>

              <span className="detail-text">
                {accident.location}
              </span>

            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >

              <span className="detail-icon">
                ⚠️
              </span>

              <span className="detail-text">
                {accident.severity}
              </span>

            </div>

          </div>

          <div
            className="detail-row"
            style={{
              marginTop: "10px",
            }}
          >

            <span className="detail-icon">
              📌
            </span>

            <span
              className="detail-text"
              style={{
                fontWeight: "bold",
                color:
                  accident.status === "Pending"
                    ? "#f97316"
                    : "#22c55e",
              }}
            >
              {accident.status}
            </span>

          </div>

        </div>

        {/* Driver & Vehicle */}
        {/* Driver & Vehicle */}

        <div className="detail-section">

          <h3 className="detail-section-title">
            Driver & Vehicle Details
          </h3>

          <div className="dv-grid">

            {/* Driver */}

            <div className="dv-col">

              <div className="dv-row">

                <span className="dv-icon">👤</span>

                <div>

                  <p className="dv-name">
                    {accident.driver}
                  </p>

                  <p className="dv-sub">
                    Driver Information
                  </p>

                </div>

              </div>

            </div>

            {/* Vehicle */}

            <div className="dv-col">

              <div className="dv-row">

                <span className="dv-icon">🚘</span>

                <div>

                  <p className="dv-name">
                    {accident.vehicle}
                  </p>

                  <p className="dv-sub">
                    Vehicle Information
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* Evidence */}

        <div className="detail-section">

          <h3 className="detail-section-title">
            Evidence
          </h3>

          <div className="evidence-grid">

            {accident.evidencePhoto ? (

              <img
                src={accident.evidencePhoto}
                alt="Evidence"
                className="evidence-img"
              />

            ) : (

              <div
                style={{
                  width: "100%",
                  padding: "40px",
                  textAlign: "center",
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

export default AccidentDetails;