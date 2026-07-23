import React, { useState, useEffect } from "react";
import OICLayout from "../layouts/OICLayout";
import { FiAlertTriangle, FiAlertCircle, FiCalendar, FiCheckSquare, FiFileText, FiUserCheck, FiTruck } from "react-icons/fi";
import { getAccidents, getViolations, getOfficers, getVehicles } from "../api";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
};

const timeAgo = (dateStr) => {
  if (!dateStr) return "Just now";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Just now";
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} mins ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
};

function OICDashboard() {
  const officer = JSON.parse(localStorage.getItem("officer") || "{}");
  const name    = officer.name || "PS Perera";

  const [accidentsCount, setAccidentsCount] = useState(0);
  const [violationsCount, setViolationsCount] = useState(0);
  const [recentLogs, setRecentLogs]           = useState([]);
  const [verifications, setVerifications]     = useState([]);
  const [loading, setLoading]                 = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        // Fetch in parallel
        const [accs, viols, officers, vehicles] = await Promise.all([
          getAccidents().catch(() => []),
          getViolations().catch(() => []),
          getOfficers().catch(() => []),
          getVehicles().catch(() => [])
        ]);

        setAccidentsCount(accs.length || 0);
        setViolationsCount(viols.length || 0);

        // Compile Combined Recent Log
        const combined = [];
        (accs || []).slice(0, 2).forEach(a => {
          const dateStr = a.accidentDate || "";
          const datePart = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr.split(" ")[0];
          combined.push({
            name: "Accident Entry",
            sub: `Type: ${a.description ? a.description.replace("Type: ", "") : a.type || "Collision"} | ${datePart}`,
            value: a.id ? a.id.slice(-6).toUpperCase() : "ACD-NEW",
            tag: a.severity || "MINOR",
            tagColor: a.severity === "FATAL" ? "#dc2626" : "#2563eb",
            tagBg: a.severity === "FATAL" ? "#fee2e2" : "#dbeafe",
            date: new Date(a.createdAt || a.accidentDate || 0)
          });
        });

        (viols || []).slice(0, 2).forEach(v => {
          const dateStr = v.violationDate || "";
          const datePart = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr.split(" ")[0];
          const actionVal = v.actionTaken || v.action || "Issued";
          combined.push({
            name: "Traffic Offence",
            sub: `Type: ${v.violationType || v.offence} | ${datePart}`,
            value: v.id ? v.id.slice(-6).toUpperCase() : "VID-NEW",
            tag: actionVal,
            tagColor: actionVal === "Court Referral" ? "#dc2626" : "#b45309",
            tagBg: actionVal === "Court Referral" ? "#fee2e2" : "#fef9c3",
            date: new Date(v.createdAt || v.violationDate || 0)
          });
        });

        combined.sort((a, b) => b.date - a.date);
        setRecentLogs(combined.slice(0, 3));

        // Compile Live Pending Verifications
        const list = [];

        // 1. Pending Accidents
        (accs || []).forEach(a => {
          if (a.status && a.status.toLowerCase() === "pending") {
            list.push({
              id: `acc-${a.id || a._id}`,
              icon: <FiAlertTriangle size={18} color="#dc2626" />,
              iconBg: "#fee2e2",
              badge: "Accident Reported",
              badgeColor: "#dc2626",
              badgeBg: "#fee2e2",
              code: a.referenceNumber || `#ACD-${(a.id || a._id || "").slice(-4).toUpperCase()}`,
              title: a.location || "Collision Reported",
              sub: `Log submitted by ${a.submittingOfficer || a.assistantOfficer || "Traffic Officer"}`,
              time: timeAgo(a.createdAt || a.accidentDate),
              date: new Date(a.createdAt || a.accidentDate || 0),
              status: a.severity || "High Priority",
              statusColor: a.severity === "FATAL" ? "#dc2626" : "#2563eb",
            });
          }
        });

        // 2. Pending Violations
        (viols || []).forEach(v => {
          if (v.status && v.status.toLowerCase() === "pending") {
            list.push({
              id: `viol-${v.id || v._id}`,
              icon: <FiFileText size={18} color="#2563eb" />,
              iconBg: "#dbeafe",
              badge: "Violation Reported",
              badgeColor: "#2563eb",
              badgeBg: "#dbeafe",
              code: v.id ? `#TOR-${v.id.slice(-4).toUpperCase()}` : "#TOR-NEW",
              title: v.violationType || v.offence || "Traffic Offence",
              sub: `Submitted by ${v.submittingOfficer || "Traffic Officer"}`,
              time: timeAgo(v.createdAt || v.violationDate),
              date: new Date(v.createdAt || v.violationDate || 0),
              status: "Standard Review",
              statusColor: "#64748b",
            });
          }
        });

        // 3. Pending Officers
        (officers || []).forEach(o => {
          if (o.status && o.status.toLowerCase() === "pending") {
            list.push({
              id: `off-${o.id || o._id}`,
              icon: <FiUserCheck size={18} color="#4f46e5" />,
              iconBg: "#e0e7ff",
              badge: "Officer Approval Pending",
              badgeColor: "#4f46e5",
              badgeBg: "#e0e7ff",
              code: `#OFF-${o.policeId || "NEW"}`,
              title: `Register Request: ${o.fullName}`,
              sub: `NIC: ${o.nic} | Rank: ${o.rank || "Constable"}`,
              time: timeAgo(o.createdAt),
              date: new Date(o.createdAt || 0),
              status: "HR Action Required",
              statusColor: "#64748b",
            });
          }
        });

        // 4. Pending Vehicles
        (vehicles || []).forEach(vh => {
          if (vh.status && vh.status.toLowerCase() === "pending") {
            list.push({
              id: `veh-${vh.id || vh._id}`,
              icon: <FiTruck size={18} color="#475569" />,
              iconBg: "#f1f5f9",
              badge: "Vehicle Approval Pending",
              badgeColor: "#475569",
              badgeBg: "#e2e8f0",
              code: `#VEH-${vh.registrationNo || "NEW"}`,
              title: `Registration: ${vh.vehicleType || "Vehicle"}`,
              sub: `Dept No: ${vh.deptNo || "N/A"} | Assigned: ${vh.assignedOfficer || "Unassigned"}`,
              time: timeAgo(vh.createdAt),
              date: new Date(vh.createdAt || 0),
              status: "Transit Review",
              statusColor: "#64748b",
            });
          }
        });

        list.sort((a, b) => b.date - a.date);
        setVerifications(list);
      } catch (err) {
        console.error("Failed to load OIC dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const stats = [
    { icon: <FiAlertTriangle size={24} />, value: accidentsCount, label: "Active\nAccidents",  bg: "#dbeafe", iconBg: "#bfdbfe", iconColor: "#2563eb" },
    { icon: <FiAlertCircle  size={24} />, value: violationsCount, label: "Active\nViolations", bg: "#dcfce7", iconBg: "#bbf7d0", iconColor: "#16a34a" },
    { icon: <FiCalendar     size={24} />, value: verifications.length, label: "Pending\nApprovals", bg: "#f3e8ff", iconBg: "#e9d5ff", iconColor: "#7c3aed" },
  ];

  return (
    <OICLayout>
      {/* Greeting */}
      <div className="pro-greeting-row">
        <div>
          <h1 className="pro-greeting">{getGreeting()}, {name} 👋</h1>
          <p className="pro-greeting-sub">Here's what's happening at Negombo Traffic Branch today.</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="pro-stat-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {stats.map((s, i) => (
          <div className="pro-stat-card" key={i} style={{ background: s.bg }}>
            <div className="pro-stat-icon-wrap" style={{ background: s.iconBg, color: s.iconColor }}>
              {s.icon}
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

        {/* Pending Verifications */}
        <div className="pro-dash-card">
          <div className="pending-verif-header">
            <div className="pending-verif-title-wrap">
              <FiCheckSquare size={18} color="#1e3a5f" />
              <h3 className="pending-verif-title">Pending Verifications</h3>
            </div>
            <a href="#/tasks" onClick={(e) => e.preventDefault()} className="pending-verif-view-all">View All Tasks</a>
          </div>
          <div className="pending-verif-list">
            {loading ? (
              <p style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>Loading verifications...</p>
            ) : verifications.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>✅</p>
                <p style={{ fontWeight: 600, color: "#1e293b" }}>All verifications complete</p>
                <p style={{ fontSize: 13, marginTop: 4 }}>No pending approvals from Negombo traffic branch at this time.</p>
              </div>
            ) : (
              verifications.map((item) => (
                <div className="pending-verif-item" key={item.id}>
                  <div className="pending-verif-icon-box" style={{ background: item.iconBg }}>
                    {item.icon}
                  </div>
                  <div className="pending-verif-body">
                    <div className="pending-verif-meta-row">
                      <span className="pending-verif-badge" style={{ color: item.badgeColor, background: item.badgeBg }}>
                        {item.badge}
                      </span>
                      <span className="pending-verif-code">{item.code}</span>
                    </div>
                    <h4 className="pending-verif-item-title">{item.title}</h4>
                    <p className="pending-verif-item-sub">{item.sub}</p>
                  </div>
                  <div className="pending-verif-right">
                    <span className="pending-verif-time">{item.time}</span>
                    <span className="pending-verif-status" style={{ color: item.statusColor }}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="pro-dash-card">
          <div className="pro-dash-card-header">
            <span style={{ fontSize: 18 }}>📋</span>
            <h3 className="pro-dash-card-title">Recent Activity Log</h3>
          </div>
          <div className="pro-donations">
            {recentLogs.map((d, i) => (
              <div className="pro-donation-item" key={i}>
                <div>
                  <p className="pro-donation-name">{d.name}</p>
                  <p className="pro-donation-sub">{d.sub}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p className="pro-donation-value">{d.value}</p>
                  <span className="pro-donation-tag" style={{ color: d.tagColor, background: d.tagBg }}>{d.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </OICLayout>
  );
}

export default OICDashboard;