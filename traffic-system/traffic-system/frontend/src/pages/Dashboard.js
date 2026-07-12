import React, { useState } from "react";
import Layout from "../components/Layout";
import UserRegistration from "./UserRegistration";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
};

const stats = [
  {   value: 1,      label: "Active\nAccidents",  color: "#dbeafe"  },
  {  value: 3,      label: "Active\nViolations", color: "#dcfce7" },
  {   value: 1,      label: "Pending\nFines",     color: "#fef3c7" },
  {   value: 0,      label: "Duties\nToday",      color: "#f3e8ff"  },
];

const inquiries = [
  {
    name: "Kasun Perera",
    email: "kasun@example.com",
    msg: "\"I witnessed an accident on Colombo Road. Who should I contact to report this?\"",
    status: "PENDING",
    statusColor: "#f59e0b",
    statusBg: "#fef3c7",
  },
  {
    name: "Nimal Silva",
    email: "nimal.s@example.com",
    msg: "\"Thank you for the quick response to the traffic complaint I filed last week.\"",
    status: "READ",
    statusColor: "#16a34a",
    statusBg: "#dcfce7",
  },
];

const donations = [
  { name: "Recent Accident", sub: "Type: Collision | 2/7/2026",  value: "ACD-1024", tag: "High",    tagColor: "#ef4444", tagBg: "#fee2e2" },
  { name: "Speed Violation", sub: "Type: Speeding | 15/6/2026",  value: "VID-1021", tag: "Pending", tagColor: "#f59e0b", tagBg: "#fef3c7" },
  { name: "Spot Fine",       sub: "Type: Fine | 1/6/2026",       value: "LKR 2,500",tag: "Paid",    tagColor: "#16a34a", tagBg: "#dcfce7" },
];

function Dashboard() {
  const [showRegister, setShowRegister] = useState(false);
  const officer = JSON.parse(localStorage.getItem("officer") || "{}");
  const name    = officer.name || "PS Perera";

  return (
    <Layout>
      {/* Greeting */}
      <div className="pro-greeting-row">
        <div>
          <h1 className="pro-greeting">{getGreeting()}, {name} </h1>
          <p className="pro-greeting-sub">Here's what's happening at Negombo Traffic Branch today.</p>
        </div>
        <button className="pro-btn-primary" onClick={() => setShowRegister(true)}>
          + Register Officer
        </button>
      </div>

      {/* Stat cards */}
      <div className="pro-stat-grid">
        {stats.map((s, i) => (
          <div className="pro-stat-card" key={i} style={{ background: s.color }}>
            <div className="pro-stat-icon-wrap" style={{ background: s.iconBg }}>
              <span style={{ fontSize: 22 }}>{s.icon}</span>
            </div>
            <div>
              <p className="pro-stat-value">{s.value}</p>
              <p className="pro-stat-label" style={{ whiteSpace: "pre-line" }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom two columns */}
      <div className="pro-dash-bottom">

        {/* Public Inquiries */}
        <div className="pro-dash-card">
          <div className="pro-dash-card-header">
            <span style={{ fontSize: 18 }}></span>
            <h3 className="pro-dash-card-title">Public Inquiries</h3>
          </div>
          <div className="pro-inquiries">
            {inquiries.map((inq, i) => (
              <div className="pro-inquiry-item" key={i}>
                <div className="pro-inquiry-top">
                  <div>
                    <span className="pro-inquiry-name">{inq.name}</span>
                    <span className="pro-inquiry-email"> ({inq.email})</span>
                  </div>
                  <span
                    className="pro-inquiry-badge"
                    style={{ color: inq.statusColor, background: inq.statusBg }}
                  >
                    {inq.status}
                  </span>
                </div>
                <p className="pro-inquiry-msg">{inq.msg}</p>
                {inq.status === "PENDING" && (
                  <button className="pro-mark-read-btn">✓ Mark Read</button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="pro-dash-card">
          <div className="pro-dash-card-header">
            <span style={{ fontSize: 18 }}></span>
            <h3 className="pro-dash-card-title">Recent Activity Log</h3>
          </div>
          <div className="pro-donations">
            {donations.map((d, i) => (
              <div className="pro-donation-item" key={i}>
                <div>
                  <p className="pro-donation-name">{d.name}</p>
                  <p className="pro-donation-sub">{d.sub}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p className="pro-donation-value">{d.value}</p>
                  <span
                    className="pro-donation-tag"
                    style={{ color: d.tagColor, background: d.tagBg }}
                  >
                    {d.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Registration modal */}
      {showRegister && (
        <div className="pro-modal-overlay" onClick={() => setShowRegister(false)}>
          <div className="pro-modal-box" onClick={(e) => e.stopPropagation()}>
            <UserRegistration onClose={() => setShowRegister(false)} />
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Dashboard;