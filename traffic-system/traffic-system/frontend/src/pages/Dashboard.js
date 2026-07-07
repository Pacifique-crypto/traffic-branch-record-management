import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import Layout from "../components/Layout";
import UserRegistration from "./UserRegistration";
import { getOfficers, deleteOfficer } from "../api";

function Dashboard() {
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [officers, setOfficers] = useState([]);

  // Load officers from MongoDB
  const loadOfficers = async () => {
    try {
      const data = await getOfficers();
      setOfficers(data);
    } catch (error) {
      console.error(error);
      alert("Failed to load officers");
    }
  };

  useEffect(() => {
    loadOfficers();
  }, []);

  const stats = [
    {
      label: "Accidents",
      value: 1,
      color: "#f87171",
      icon: "🚗",
      bg: "#fee2e2",
    },
    {
      label: "Violations",
      value: 3,
      color: "#fb923c",
      icon: "⚠️",
      bg: "#ffedd5",
    },
    {
      label: "Active Users",
      value: officers.length,
      color: "#34d399",
      icon: "👥",
      bg: "#d1fae5",
    },
    {
      label: "Fines LKR",
      value: "15,000",
      color: "#60a5fa",
      icon: "💰",
      bg: "#dbeafe",
    },
  ];

  const incidents = [
    {
      type: "Accident Reported",
      desc: "Two-vehicle collision reported in Negombo Road",
      time: "7 mins ago",
      color: "#ef4444",
    },
    {
      type: "Violation Reported",
      desc: "Speed limit exceeded in Chilaw Road. Fine issued.",
      time: "15 mins ago",
      color: "#f97316",
    },
  ];

  return (
    <Layout>
      <div className="dashboard-wrapper">
        <h2 className="dashboard-title">Dashboard</h2>

        {/* Stats */}
        <div className="stat-cards">
          {stats.map((s, i) => (
            <div
              className="stat-card"
              key={i}
              style={{ background: s.bg }}
            >
              <div className="stat-top">
                <span className="stat-label">{s.label}</span>
                <span className="stat-icon">{s.icon}</span>
              </div>

              <div
                className="stat-value"
                style={{ color: s.color }}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Incidents */}
        <div className="section-box">
          <h3 className="section-title">Recent Incident Details</h3>

          <div className="incidents-list">
            {incidents.map((inc, i) => (
              <div className="incident-row" key={i}>
                <div className="incident-left">
                  <span
                    className="incident-dot"
                    style={{ background: inc.color }}
                  ></span>

                  <div>
                    <p className="incident-type">{inc.type}</p>
                    <p className="incident-desc">{inc.desc}</p>
                  </div>
                </div>

                <span className="incident-time">{inc.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Officer Management */}
        <div className="section-box">
          <div className="section-header-row">
            <h3 className="section-title">Officer Management</h3>

            <button
              className="btn-add"
              onClick={() => setShowRegisterModal(true)}
            >
              Add Officer +
            </button>
          </div>

          <table
            style={{
              width: "100%",
              marginTop: "20px",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr>
                <th>Name</th>
                <th>Police ID</th>
                <th>Username</th>
                <th>Contact</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {officers.map((officer) => (
                <tr key={officer._id}>
                  <td>{officer.fullName}</td>
                  <td>{officer.policeId}</td>
                  <td>{officer.username}</td>
                  <td>{officer.contactNo}</td>

                  <td>
                    <button
                      className="btn-delete"
                      onClick={async () => {
                        if (
                          window.confirm(
                            "Are you sure you want to delete this officer?"
                          )
                        ) {
                          await deleteOfficer(officer._id);
                          loadOfficers();
                        }
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registration Modal */}
      {showRegisterModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowRegisterModal(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <UserRegistration
              onClose={() => {
                setShowRegisterModal(false);
                loadOfficers();
              }}
            />
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Dashboard;