import React, { useState, useEffect } from "react";
import {
  FiTruck, FiCheckCircle, FiXCircle, FiMoreVertical,
  FiUserPlus, FiCheck, FiX, FiSearch, FiAlertTriangle,
  FiPlus, FiClock, FiEdit, FiUserCheck, FiTool, FiEye,
  FiCalendar, FiRefreshCw, FiInfo
} from "react-icons/fi";
import { getVehicles, registerVehicle, updateVehicle, deleteVehicle, getOfficers } from "../api";

const PAGE_SIZE = 5;

// Helper to render vehicle type icon matching Image 1
const VehicleTypeIcon = ({ type }) => {
  const t = (type || "").toLowerCase();
  if (t.includes("motorcycle") || t.includes("bike")) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <circle cx="5.5" cy="17.5" r="3.5"/>
        <circle cx="18.5" cy="17.5" r="3.5"/>
        <path d="M15 6h1.5a2.5 2.5 0 0 1 2.5 2.5V11l-3 3h-3l-2.5-3.5L8 14H4.5"/>
        <path d="M12 17.5V14l-3-4H6"/>
      </svg>
    );
  }
  if (t.includes("van")) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M17 18h2a2 2 0 0 0 2-2v-5c0-.8-.3-1.5-.9-2l-2.6-2.6a2 2 0 0 0-1.4-.6H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h2"/>
        <circle cx="7" cy="18" r="2"/>
        <path d="M9 18h6"/>
        <circle cx="17" cy="18" r="2"/>
      </svg>
    );
  }
  // Default Car icon
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 1 12v4c0 .6.4 1 1 1h2"/>
      <circle cx="7" cy="17" r="2"/>
      <path d="M9 17h6"/>
      <circle cx="17" cy="17" r="2"/>
    </svg>
  );
};

// Helper to calculate initials for Officer Avatar
const getInitials = (name) => {
  if (!name || name === "Unassigned" || name === "Not Assigned") return "";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

function VehicleManagement() {
  const userRole = localStorage.getItem("userRole") || "IT Officer";
  let LayoutComponent;
  if (userRole === "OIC") {
    LayoutComponent = require("../layouts/OICLayout").default;
  } else {
    LayoutComponent = require("../layouts/ITLayout").default;
  }

  const [vehicles, setVehicles]           = useState([]);
  const [approvals, setApprovals]         = useState([]);
  const [officers, setOfficers]           = useState([]);
  const [search, setSearch]               = useState("");
  const [typeFilter, setTypeFilter]       = useState("All");
  const [statusFilter, setStatusFilter]   = useState("All");
  const [page, setPage]                   = useState(1);
  const [loading, setLoading]             = useState(true);

  // Modals
  const [showRegister, setShowRegister]             = useState(false);
  const [detailsVehicle, setDetailsVehicle]         = useState(null);
  const [changeOfficerTarget, setChangeOfficerTarget] = useState(null);
  const [assignOfficerTarget, setAssignOfficerTarget] = useState(null);
  const [rejectTarget, setRejectTarget]             = useState(null);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [vData, oData] = await Promise.all([
        getVehicles().catch(() => []),
        getOfficers().catch(() => [])
      ]);

      if (Array.isArray(vData)) {
        const isPending  = (s) => Boolean(s && String(s).toUpperCase() === "PENDING");
        const isRejected = (s) => Boolean(s && String(s).toUpperCase() === "REJECTED");

        const activeOrFleet = vData
          .filter(v => !isPending(v.status) && !isRejected(v.status))
          .map(v => ({ ...v, id: v._id }));

        const pending = vData
          .filter(v => isPending(v.status))
          .map(v => ({ ...v, id: v._id }));

        setVehicles(activeOrFleet);
        setApprovals(pending);
      } else {
        setVehicles([]);
        setApprovals([]);
      }

      if (Array.isArray(oData)) {
        setOfficers(oData.filter(o => o.status === "Active" || o.status === "Approved"));
      } else {
        setOfficers([]);
      }
    } catch (err) {
      console.error("Failed to fetch vehicles/officers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Stats
  const totalFleet       = vehicles.length;
  const activeUnits      = vehicles.filter(v => v.status === "AVAILABLE" || v.status === "Active" || v.status === "Approved").length;
  const maintenanceCount = vehicles.filter(v => v.status === "MAINTENANCE" || v.status === "Maintenance").length;
  const pendingCount     = approvals.length;

  // Filter + paginate
  const filtered = vehicles.filter(v => {
    const matchesSearch =
      (v.registrationNo || "").toLowerCase().includes(search.toLowerCase()) ||
      (v.deptNo || "").toLowerCase().includes(search.toLowerCase()) ||
      (v.chassisNo || "").toLowerCase().includes(search.toLowerCase()) ||
      (v.assignedOfficer || "").toLowerCase().includes(search.toLowerCase()) ||
      (v.vehicleType || "").toLowerCase().includes(search.toLowerCase());
    const matchesType   = typeFilter === "All" || v.vehicleType === typeFilter;
    const matchesStatus = statusFilter === "All" || v.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleApprove = async (id) => {
    try {
      const res = await updateVehicle(id, { status: "AVAILABLE" });
      if (res && !res.error) {
        fetchAllData();
      } else {
        alert(res.error || "Failed to approve vehicle.");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to server.");
    }
  };

  const handleConfirmReject = async (id, remarks) => {
    try {
      const res = await updateVehicle(id, { status: "Rejected", rejectionRemarks: remarks });
      if (res && !res.error) {
        setRejectTarget(null);
        fetchAllData();
      } else {
        alert(res.error || "Failed to reject vehicle.");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to server.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vehicle record?")) return;
    try {
      const res = await deleteVehicle(id);
      if (res && !res.error) {
        fetchAllData();
      } else {
        alert(res.error || "Failed to delete vehicle.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting vehicle.");
    }
  };

  return (
    <LayoutComponent>
      <div className="um-page">

        {/* ── Header ── */}
        <div className="um-header">
          <div>
            <h1 className="um-title">Vehicle Management</h1>
            <p className="um-subtitle">
              {userRole === "OIC"
                ? "Manage vehicle approvals and monitor operational fleet records."
                : "Register, assign, and manage Sri Lanka Police operational fleet."}
            </p>
          </div>
          {userRole === "IT Officer" && (
            <button className="um-register-btn" onClick={() => setShowRegister(true)}>
              <FiPlus size={15} style={{ marginRight: 6 }} /> Register New Vehicle
            </button>
          )}
        </div>

        {/* ── Stat Cards ── */}
        <div className="um-stats">
          <div className="um-stat-card">
            <div>
              <p className="um-stat-label">TOTAL FLEET</p>
              <p className="um-stat-value">{totalFleet}</p>
            </div>
            <div className="um-stat-icon" style={{ background: "#dbeafe", color: "#2563eb" }}>
              <FiTruck size={22} />
            </div>
          </div>
          <div className="um-stat-card">
            <div>
              <p className="um-stat-label">ACTIVE UNITS</p>
              <p className="um-stat-value" style={{ color: "#16a34a" }}>{activeUnits}</p>
            </div>
            <div className="um-stat-icon" style={{ background: "#dcfce7", color: "#16a34a" }}>
              <FiCheckCircle size={22} />
            </div>
          </div>
          <div className="um-stat-card">
            <div>
              <p className="um-stat-label">MAINTENANCE</p>
              <p className="um-stat-value" style={{ color: "#f59e0b" }}>{maintenanceCount}</p>
            </div>
            <div className="um-stat-icon" style={{ background: "#fef3c7", color: "#b45309" }}>
              <FiTool size={22} />
            </div>
          </div>
          <div className="um-stat-card">
            <div>
              <p className="um-stat-label">PENDING APPROVAL</p>
              <p className="um-stat-value" style={{ color: "#ef4444" }}>{pendingCount}</p>
            </div>
            <div className="um-stat-icon" style={{ background: "#fee2e2", color: "#ef4444" }}>
              <FiClock size={22} />
            </div>
          </div>
        </div>

        {/* ── OIC: New Vehicle Approvals (Preserved Approval Flow) ── */}
        {userRole === "OIC" && approvals.length > 0 && (
          <div className="um-section-card">
            <div className="um-section-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <FiTruck size={18} color="#1e3a5f" />
                <h3 className="um-section-title">New Vehicle Approvals</h3>
              </div>
            </div>
            <table className="um-table">
              <thead>
                <tr>
                  <th>REGISTRATION NO</th>
                  <th>DEPT NO</th>
                  <th>VEHICLE TYPE</th>
                  <th>ASSIGNED OFFICER</th>
                  <th>APPROVE / REJECT</th>
                  <th>DETAILS</th>
                </tr>
              </thead>
              <tbody>
                {approvals.map(v => (
                  <tr key={v.id} className="um-tr">
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="um-avatar" style={{ background: "#0f172a", color: "#fff" }}>
                          <VehicleTypeIcon type={v.vehicleType} />
                        </div>
                        <p className="um-officer-name" style={{ color: "#1e3a8a", fontWeight: "bold", margin: 0 }}>
                          {v.registrationNo}
                        </p>
                      </div>
                    </td>
                    <td>
                      <p style={{ fontWeight: 600, fontSize: 13, color: "#1e293b", margin: 0 }}>
                        {v.deptNo}
                      </p>
                    </td>
                    <td>
                      <span className="um-role-badge">{v.vehicleType || "Patrol Car"}</span>
                    </td>
                    <td>
                      <p style={{ fontWeight: 600, fontSize: 13, color: "#475569", margin: 0 }}>
                        {v.assignedOfficer || "Unassigned"}
                      </p>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="um-approve-btn" onClick={() => handleApprove(v.id)} title="Approve">
                          <FiCheck size={14} />
                        </button>
                        <button className="um-reject-btn" onClick={() => setRejectTarget(v)} title="Reject">
                          <FiX size={14} />
                        </button>
                      </div>
                    </td>
                    <td>
                      <FiMoreVertical
                        size={18}
                        onClick={() => setDetailsVehicle(v)}
                        style={{ cursor: "pointer", color: "#64748b" }}
                        title="View Full Details"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="um-view-all">View all {approvals.length} pending requests</p>
          </div>
        )}

        {/* ── Vehicle Registry Table (Image 1 Layout) ── */}
        <div className="um-section-card" style={{ background: "#ffffff", borderRadius: 16, padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div className="um-section-header" style={{ marginBottom: 18 }}>
            <h3 className="um-section-title" style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Vehicle Registry</h3>
          </div>

          {/* Search & Filters */}
          <div className="um-search-row" style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            <div className="um-search-wrap" style={{ flex: 1, display: "flex", alignItems: "center", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 14px" }}>
              <FiSearch size={15} color="#94a3b8" style={{ marginRight: 8 }} />
              <input
                className="um-search-input"
                placeholder="Search by reg no, dept no, vehicle type, officer..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, width: "100%", color: "#0f172a" }}
              />
            </div>
            <select
              className="um-filter-select"
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
              style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 14px", fontSize: 13, color: "#374151", outline: "none" }}
            >
              <option value="All">All Vehicle Types</option>
              <option value="Patrol Car">Patrol Car</option>
              <option value="Motorcycle">Motorcycle</option>
              <option value="Recovery Truck">Recovery Truck</option>
              <option value="Van">Van</option>
              <option value="SUV">SUV</option>
              <option value="Jeep">Jeep</option>
            </select>
            <select
              className="um-filter-select"
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 14px", fontSize: 13, color: "#374151", outline: "none" }}
            >
              <option value="All">All Status</option>
              <option value="AVAILABLE">Active / Available</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="OUT OF SERVICE">Out of Service</option>
            </select>
          </div>

          {/* Table */}
          <table className="um-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.06em" }}>REG NO</th>
                <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.06em" }}>VEHICLE TYPE</th>
                <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.06em" }}>ASSIGNED OFFICER</th>
                <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.06em" }}>STATUS</th>
                <th style={{ textAlign: "right", padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.06em" }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "32px", color: "#64748b", fontWeight: 600 }}>
                    No vehicles found in registry.
                  </td>
                </tr>
              ) : (
                paginated.map(v => {
                  const isAssigned = Boolean(
                    v.assignedOfficer &&
                    v.assignedOfficer !== "Unassigned" &&
                    v.assignedOfficer !== "Not Assigned" &&
                    v.assignedOfficer.trim() !== ""
                  );

                  const initials = isAssigned ? getInitials(v.assignedOfficer) : "";
                  const vinText  = v.chassisNo ? `VIN: ${v.chassisNo}` : (v.deptNo ? `VIN: ${v.deptNo}` : "VIN: SLP-00432-B");

                  const isMaintenance = v.status === "MAINTENANCE" || v.status === "Maintenance";
                  const isOutOfService = v.status === "OUT OF SERVICE" || v.status === "Out of Service";

                  const statusLabel = isMaintenance ? "Maintenance" : (isOutOfService ? "Out of Service" : "Active");
                  const statusBg    = isMaintenance ? "#fff8e1" : (isOutOfService ? "#fee2e2" : "#e6f4ea");
                  const statusColor = isMaintenance ? "#b45309" : (isOutOfService ? "#dc2626" : "#1e7e34");

                  return (
                    <tr key={v.id} className="um-tr" style={{ borderBottom: "1px solid #f1f5f9" }}>
                      {/* REG NO */}
                      <td style={{ padding: "14px 16px" }}>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: "#0f172a" }}>{v.registrationNo}</p>
                        <p style={{ margin: "2px 0 0 0", fontSize: 11, color: "#94a3b8" }}>{vinText}</p>
                      </td>

                      {/* VEHICLE TYPE */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#334155" }}>
                          <VehicleTypeIcon type={v.vehicleType} />
                          <span style={{ fontWeight: 600, fontSize: 13, color: "#334155" }}>
                            {v.vehicleType ? (v.vehicleType.includes("Car") ? "Car" : v.vehicleType) : "Car"}
                          </span>
                        </div>
                      </td>

                      {/* ASSIGNED OFFICER */}
                      <td style={{ padding: "14px 16px" }}>
                        {isAssigned ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#0b1d3a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                              {initials}
                            </div>
                            <span style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>{v.assignedOfficer}</span>
                          </div>
                        ) : (
                          <span style={{ fontStyle: "italic", color: "#94a3b8", fontSize: 13 }}>Not Assigned</span>
                        )}
                      </td>

                      {/* STATUS */}
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ background: statusBg, color: statusColor, padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, display: "inline-block" }}>
                          {statusLabel}
                        </span>
                      </td>

                      {/* ACTION */}
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
                          {/* 3 Dots Button -> Opens Technical Details Modal */}
                          <button
                            onClick={() => setDetailsVehicle(v)}
                            title="View Full Vehicle Details"
                            style={{
                              width: 36, height: 36, borderRadius: "50%", border: "none", background: "#f1f5f9",
                              color: "#334155", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                              transition: "all 0.15s"
                            }}
                            onMouseOver={e => e.currentTarget.style.background = "#e2e8f0"}
                            onMouseOut={e => e.currentTarget.style.background = "#f1f5f9"}
                          >
                            <FiMoreVertical size={18} />
                          </button>

                          {/* Change Officer or Assign Officer Button */}
                          {isAssigned ? (
                            <button
                              onClick={() => setChangeOfficerTarget(v)}
                              style={{
                                background: "#526075", color: "#ffffff", border: "none", borderRadius: 8,
                                padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                                transition: "all 0.15s", whiteSpace: "nowrap"
                              }}
                              onMouseOver={e => e.currentTarget.style.background = "#334155"}
                              onMouseOut={e => e.currentTarget.style.background = "#526075"}
                            >
                              Change Officer
                            </button>
                          ) : (
                            <button
                              onClick={() => setAssignOfficerTarget(v)}
                              style={{
                                background: "#0b1d3a", color: "#ffffff", border: "none", borderRadius: 8,
                                padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                                transition: "all 0.15s", whiteSpace: "nowrap"
                              }}
                              onMouseOver={e => e.currentTarget.style.background = "#071326"}
                              onMouseOut={e => e.currentTarget.style.background = "#0b1d3a"}
                            >
                              Assign Officer
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Pagination Matching Image 1 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
              Showing {filtered.length === 0 ? 0 : ((page - 1) * PAGE_SIZE) + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} vehicles
            </p>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc",
                  color: "#334155", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14
                }}
              >
                ‹
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  style={{
                    width: 32, height: 32, borderRadius: 8, border: page === i + 1 ? "none" : "1px solid #e2e8f0",
                    background: page === i + 1 ? "#0b1d3a" : "#f8fafc", color: page === i + 1 ? "#ffffff" : "#334155",
                    fontWeight: page === i + 1 ? 700 : 500, cursor: "pointer", fontSize: 13
                  }}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={page === totalPages || totalPages === 0}
                onClick={() => setPage(p => p + 1)}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc",
                  color: "#334155", cursor: (page === totalPages || totalPages === 0) ? "not-allowed" : "pointer",
                  opacity: (page === totalPages || totalPages === 0) ? 0.4 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14
                }}
              >
                ›
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ══ REGISTER VEHICLE MODAL (Preserved for OIC Approval Flow) ══ */}
      {showRegister && (
        <RegisterVehicleModal
          officers={officers}
          onClose={() => setShowRegister(false)}
          onSave={async (vehicleData) => {
            try {
              const officer = JSON.parse(localStorage.getItem("officer") || "{}");
              const submitterName = officer.name || officer.fullName || "IT Officer";
              const res = await registerVehicle({
                ...vehicleData,
                status: "PENDING",
                submittedBy: submitterName
              });
              if (res && !res.error) {
                fetchAllData();
                setShowRegister(false);
              } else {
                alert(res.message || res.error || "Failed to register vehicle.");
              }
            } catch (err) {
              console.error(err);
              alert("Error connecting to server.");
            }
          }}
        />
      )}

      {/* ══ VEHICLE DETAILS MODAL (Eye Icon Click) ══ */}
      {detailsVehicle && (
        <VehicleDetailsModal
          vehicle={detailsVehicle}
          onClose={() => setDetailsVehicle(null)}
        />
      )}

      {/* ══ CHANGE ASSIGNED OFFICER MODAL (Image 2) ══ */}
      {changeOfficerTarget && (
        <ChangeOfficerModal
          vehicle={changeOfficerTarget}
          officers={officers}
          onClose={() => setChangeOfficerTarget(null)}
          onSave={async (vehicleId, newOfficer, transferDate) => {
            try {
              const res = await updateVehicle(vehicleId, {
                assignedOfficer: newOfficer,
                transferDate: transferDate
              });
              if (res && !res.error) {
                fetchAllData();
                setChangeOfficerTarget(null);
              } else {
                alert(res.error || "Failed to change assigned officer.");
              }
            } catch (err) {
              console.error(err);
              alert("Error connecting to server.");
            }
          }}
        />
      )}

      {/* ══ ASSIGN OFFICER MODAL (Image 3) ══ */}
      {assignOfficerTarget && (
        <AssignOfficerModal
          vehicle={assignOfficerTarget}
          officers={officers}
          onClose={() => setAssignOfficerTarget(null)}
          onSave={async (vehicleId, assignedOfficer, assignmentDate) => {
            try {
              const res = await updateVehicle(vehicleId, {
                assignedOfficer: assignedOfficer,
                assignmentDate: assignmentDate
              });
              if (res && !res.error) {
                fetchAllData();
                setAssignOfficerTarget(null);
              } else {
                alert(res.error || "Failed to assign officer.");
              }
            } catch (err) {
              console.error(err);
              alert("Error connecting to server.");
            }
          }}
        />
      )}

      {/* ══ REJECT CONFIRMATION MODAL (OIC Approval Flow) ══ */}
      {rejectTarget && (
        <RejectConfirmModal
          vehicle={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleConfirmReject}
        />
      )}
    </LayoutComponent>
  );
}

// ─── Change Assigned Officer Modal (Image 2) ────────────────────────
function ChangeOfficerModal({ vehicle, officers, onClose, onSave }) {
  const [selectedOfficer, setSelectedOfficer] = useState("");
  const [transferDate, setTransferDate] = useState(() => new Date().toISOString().split("T")[0]);

  return (
    <div className="um-modal-overlay">
      <div className="um-modal" style={{ maxWidth: 480, overflow: "hidden", borderRadius: 16 }}>
        {/* Header - Dark Navy */}
        <div style={{ background: "#0b1d3a", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", color: "#fff" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fff" }}>Change Assigned Officer</h3>
            <p style={{ margin: "4px 0 0 0", fontSize: 12, color: "#94a3b8" }}>Vehicle Reassignment Process</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 20, cursor: "pointer", padding: "0 4px" }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px" }}>
          {/* Top Card Box */}
          <div style={{ background: "#f0f4f9", borderRadius: 12, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: "#0b1d3a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <VehicleTypeIcon type={vehicle.vehicleType} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.05em" }}>VEHICLE ID</p>
                <p style={{ margin: "2px 0 0 0", fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{vehicle.registrationNo}</p>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.05em" }}>CURRENT STATE</p>
              <p style={{ margin: "2px 0 0 0", fontSize: 12, fontWeight: 600, color: "#475569" }}>
                Current Officer: <span style={{ color: "#0f172a", fontWeight: 700 }}>{vehicle.assignedOfficer || "Unassigned"}</span>
              </p>
            </div>
          </div>

          {/* Info Banner */}
          <div style={{ background: "#f1f5f9", borderLeft: "4px solid #334155", borderRadius: "0 8px 8px 0", padding: "12px 14px", margin: "16px 0", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <FiInfo size={18} color="#475569" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ margin: 0, fontSize: 12, color: "#475569", fontStyle: "italic", lineHeight: 1.5 }}>
              The transfer date will be recorded as the return date for the current officer and the assignment date for the new officer.
            </p>
          </div>

          {/* Form Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: "0.05em", marginBottom: 6 }}>NEW OFFICER</label>
              <select
                className="um-field-input"
                value={selectedOfficer}
                onChange={e => setSelectedOfficer(e.target.value)}
                style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: selectedOfficer ? "#0f172a" : "#64748b", width: "100%", outline: "none" }}
              >
                <option value="">Select New Officer</option>
                {officers.map(o => (
                  <option key={o._id || o.id} value={o.fullName}>
                    {o.fullName} ({o.rank || "Officer"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: "0.05em", marginBottom: 6 }}>TRANSFER DATE</label>
              <input
                type="date"
                className="um-field-input"
                value={transferDate}
                onChange={e => setTransferDate(e.target.value)}
                style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#0f172a", width: "100%", outline: "none" }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: "#f8fafc", padding: "14px 24px", display: "flex", justifyContent: "flex-end", gap: 12, borderTop: "1px solid #e2e8f0" }}>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "8px 16px" }}>
            Cancel
          </button>
          <button
            onClick={() => {
              if (!selectedOfficer) return alert("Please select a new officer.");
              onSave(vehicle.id || vehicle._id, selectedOfficer, transferDate);
            }}
            style={{ background: "#0b1d3a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
          >
            <FiRefreshCw size={14} /> Save Transfer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Assign Officer Modal (Image 3) ─────────────────────────────────
function AssignOfficerModal({ vehicle, officers, onClose, onSave }) {
  const [selectedOfficer, setSelectedOfficer] = useState("");
  const [assignmentDate, setAssignmentDate] = useState(() => new Date().toISOString().split("T")[0]);

  return (
    <div className="um-modal-overlay">
      <div className="um-modal" style={{ maxWidth: 440, overflow: "hidden", borderRadius: 16 }}>
        {/* Header - White header with Dark Officer Icon */}
        <div style={{ padding: "20px 24px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#0b1d3a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FiUserPlus size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Assign Officer</h3>
              <p style={{ margin: "3px 0 0 0", fontSize: 12, color: "#64748b" }}>
                Context: Vehicle: <span style={{ fontWeight: 700, color: "#0f172a" }}>{vehicle.registrationNo}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 20, cursor: "pointer", padding: "0 4px" }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: "0.05em", marginBottom: 6 }}>SELECT OFFICER</label>
              <select
                className="um-field-input"
                value={selectedOfficer}
                onChange={e => setSelectedOfficer(e.target.value)}
                style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: selectedOfficer ? "#0f172a" : "#64748b", width: "100%", outline: "none" }}
              >
                <option value="">Search for available officers...</option>
                {officers.map(o => (
                  <option key={o._id || o.id} value={o.fullName}>
                    {o.fullName} ({o.rank || "Officer"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: "0.05em", marginBottom: 6 }}>ASSIGNMENT DATE</label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  type="date"
                  className="um-field-input"
                  value={assignmentDate}
                  onChange={e => setAssignmentDate(e.target.value)}
                  style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", paddingRight: 110, fontSize: 13, color: "#0f172a", width: "100%", outline: "none" }}
                />
                <span style={{ position: "absolute", right: 10, background: "#e2e8f0", color: "#475569", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4, pointerEvents: "none" }}>
                  DEFAULT: TODAY
                </span>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div style={{ background: "#edf5ff", border: "1px solid #d0e1fd", borderRadius: 10, padding: "14px 16px", marginTop: 20, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <FiInfo size={18} color="#2563eb" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ margin: 0, fontSize: 12, color: "#334155", lineHeight: 1.5 }}>
              Assigning an officer to this vehicle will update the unit's active patrol status and reflect in the Duty Management dashboard immediately.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px 20px", display: "flex", justifyContent: "flex-end", gap: 12, borderTop: "1px solid #f1f5f9" }}>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "8px 16px" }}>
            Cancel
          </button>
          <button
            onClick={() => {
              if (!selectedOfficer) return alert("Please select an officer to assign.");
              onSave(vehicle.id || vehicle._id, selectedOfficer, assignmentDate);
            }}
            style={{ background: "#0b1d3a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
          >
            <FiCheckCircle size={15} /> Assign
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Register Vehicle Modal Component (Preserved OIC approval submission) ───
function RegisterVehicleModal({ onClose, onSave, officers = [] }) {
  const [form, setForm] = useState({
    registrationNo: "",
    deptNo: "",
    chassisNo: "",
    engineNo: "",
    vehicleType: "Patrol Car",
    makeModel: "",
    year: new Date().getFullYear(),
    color: "",
    fuelType: "Diesel (Super)",
    engineCapacity: "",
    cylinders: 4,
    tyreSize: "",
    fuelTankCapacity: "",
    oilCapacity: "",
    registrationDate: new Date().toISOString().split("T")[0],
    revenueLicenseExpiry: "",
    insuranceExpiry: "",
    emissionTestExpiry: "",
    assignedOfficer: "Unassigned",
    branch: "Negombo Traffic Div.",
    remarks: ""
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = () => {
    if (!form.registrationNo.trim()) return setError("Registration Number is required.");
    if (!form.deptNo.trim()) return setError("Department Number is required.");
    onSave(form);
  };

  return (
    <div className="um-modal-overlay">
      <div className="um-modal" style={{ maxWidth: 780, maxHeight: "90vh", overflowY: "auto" }}>
        <div className="um-modal-header">
          <div>
            <h3 className="um-modal-title">Register New Vehicle</h3>
            <p className="um-modal-sub">Fill in the vehicle technical & allocation details. Will require OIC approval.</p>
          </div>
          <button className="um-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="um-modal-body">
          <div className="um-field-row">
            <div className="um-field">
              <label className="um-field-label">REGISTRATION NO *</label>
              <input className="um-field-input" name="registrationNo" placeholder="e.g. WP KA-1234" value={form.registrationNo} onChange={handleChange} />
            </div>
            <div className="um-field">
              <label className="um-field-label">DEPARTMENT NO *</label>
              <input className="um-field-input" name="deptNo" placeholder="e.g. SLP-TRAF-2026" value={form.deptNo} onChange={handleChange} />
            </div>
          </div>

          <div className="um-field-row">
            <div className="um-field">
              <label className="um-field-label">CHASSIS NO (VIN)</label>
              <input className="um-field-input" name="chassisNo" placeholder="VIN Number..." value={form.chassisNo} onChange={handleChange} />
            </div>
            <div className="um-field">
              <label className="um-field-label">ENGINE NO</label>
              <input className="um-field-input" name="engineNo" placeholder="Engine Serial..." value={form.engineNo} onChange={handleChange} />
            </div>
          </div>

          <div className="um-field-row">
            <div className="um-field">
              <label className="um-field-label">VEHICLE TYPE *</label>
              <select className="um-field-input" name="vehicleType" value={form.vehicleType} onChange={handleChange}>
                <option value="Patrol Car">Patrol Car</option>
                <option value="Motorcycle">Motorcycle</option>
                <option value="Recovery Truck">Recovery Truck</option>
                <option value="Van">Van</option>
                <option value="SUV">SUV</option>
                <option value="Jeep">Jeep</option>
              </select>
            </div>
            <div className="um-field">
              <label className="um-field-label">MODEL / MAKE</label>
              <input className="um-field-input" name="makeModel" placeholder="e.g. Toyota Hilux 2022" value={form.makeModel} onChange={handleChange} />
            </div>
          </div>

          <div className="um-field-row">
            <div className="um-field">
              <label className="um-field-label">MANUFACTURING YEAR</label>
              <input className="um-field-input" name="year" type="number" value={form.year} onChange={handleChange} />
            </div>
            <div className="um-field">
              <label className="um-field-label">COLOR</label>
              <input className="um-field-input" name="color" placeholder="e.g. Navy Blue / White" value={form.color} onChange={handleChange} />
            </div>
          </div>

          <div className="um-field-row">
            <div className="um-field">
              <label className="um-field-label">FUEL TYPE</label>
              <select className="um-field-input" name="fuelType" value={form.fuelType} onChange={handleChange}>
                <option value="Diesel (Super)">Diesel (Super)</option>
                <option value="Petrol (Octane 95)">Petrol (Octane 95)</option>
                <option value="Octane 92">Octane 92</option>
                <option value="Hybrid / Electric">Hybrid / Electric</option>
              </select>
            </div>
            <div className="um-field">
              <label className="um-field-label">ENGINE CAPACITY</label>
              <input className="um-field-input" name="engineCapacity" placeholder="e.g. 2500 cc" value={form.engineCapacity} onChange={handleChange} />
            </div>
          </div>

          <div className="um-field-row">
            <div className="um-field">
              <label className="um-field-label">NO OF CYLINDERS</label>
              <input className="um-field-input" name="cylinders" type="number" value={form.cylinders} onChange={handleChange} />
            </div>
            <div className="um-field">
              <label className="um-field-label">TYRE SIZE</label>
              <input className="um-field-input" name="tyreSize" placeholder="e.g. 215/65 R16" value={form.tyreSize} onChange={handleChange} />
            </div>
          </div>

          <div className="um-field-row">
            <div className="um-field">
              <label className="um-field-label">FUEL TANK CAPACITY</label>
              <input className="um-field-input" name="fuelTankCapacity" placeholder="e.g. 60 Liters" value={form.fuelTankCapacity} onChange={handleChange} />
            </div>
            <div className="um-field">
              <label className="um-field-label">ENGINE OIL CAPACITY</label>
              <input className="um-field-input" name="oilCapacity" placeholder="e.g. 4.5 Liters" value={form.oilCapacity} onChange={handleChange} />
            </div>
          </div>

          <div className="um-field-row">
            <div className="um-field">
              <label className="um-field-label">REVENUE LICENSE EXPIRY</label>
              <input className="um-field-input" name="revenueLicenseExpiry" type="date" value={form.revenueLicenseExpiry} onChange={handleChange} />
            </div>
            <div className="um-field">
              <label className="um-field-label">INSURANCE EXPIRY</label>
              <input className="um-field-input" name="insuranceExpiry" type="date" value={form.insuranceExpiry} onChange={handleChange} />
            </div>
          </div>

          <div className="um-field-row">
            <div className="um-field">
              <label className="um-field-label">EMISSION TEST EXPIRY</label>
              <input className="um-field-input" name="emissionTestExpiry" type="date" value={form.emissionTestExpiry} onChange={handleChange} />
            </div>
            <div className="um-field">
              <label className="um-field-label">ASSIGNED OFFICER</label>
              <select className="um-field-input" name="assignedOfficer" value={form.assignedOfficer} onChange={handleChange}>
                <option value="Unassigned">Unassigned</option>
                {officers.map(o => (
                  <option key={o._id || o.id} value={o.fullName}>{o.fullName} ({o.rank || "Officer"})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="um-field-row">
            <div className="um-field">
              <label className="um-field-label">ASSIGNED BRANCH</label>
              <select className="um-field-input" name="branch" value={form.branch} onChange={handleChange}>
                <option value="Negombo Traffic Div.">Negombo Traffic Div.</option>
                <option value="Negombo Central Div.">Negombo Central Div.</option>
                <option value="Kochchikade Post">Kochchikade Post</option>
                <option value="Katunayake Highway Div.">Katunayake Highway Div.</option>
              </select>
            </div>
            <div className="um-field">
              <label className="um-field-label">REMARKS / NOTES</label>
              <input className="um-field-input" name="remarks" placeholder="Optional notes..." value={form.remarks} onChange={handleChange} />
            </div>
          </div>

          {error && <p className="um-error">{error}</p>}
        </div>

        <div className="um-modal-footer">
          <button className="um-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="um-submit-btn" onClick={handleSubmit}>Register Vehicle</button>
        </div>
      </div>
    </div>
  );
}

// ─── Vehicle Details Modal Component (Eye Icon Click) ────────────────
function VehicleDetailsModal({ vehicle, onClose }) {
  return (
    <div className="um-modal-overlay">
      <div className="um-modal um-details-modal" style={{ maxWidth: 580 }}>
        <div className="um-modal-header">
          <div>
            <h3 className="um-modal-title">Vehicle Technical Profile</h3>
            <p className="um-modal-sub">Reg No: {vehicle.registrationNo}</p>
          </div>
          <button className="um-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="um-modal-body" style={{ padding: "20px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", margin: 0 }}>REGISTRATION NUMBER</p>
              <p style={{ fontSize: 15, fontWeight: 800, color: "#1e3a8a", margin: "3px 0 0 0" }}>{vehicle.registrationNo}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", margin: 0 }}>DEPARTMENT NUMBER</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "3px 0 0 0" }}>{vehicle.deptNo}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", margin: 0 }}>VEHICLE TYPE</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", margin: "3px 0 0 0" }}>{vehicle.vehicleType}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", margin: 0 }}>MAKE & MODEL</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", margin: "3px 0 0 0" }}>{vehicle.makeModel || "N/A"}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", margin: 0 }}>ASSIGNED OFFICER</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#2563eb", margin: "3px 0 0 0" }}>{vehicle.assignedOfficer || "Unassigned"}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", margin: 0 }}>APPROVAL STATUS</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: vehicle.status === "Pending" ? "#b45309" : "#16a34a", margin: "3px 0 0 0" }}>
                {vehicle.status || "AVAILABLE"}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", margin: 0 }}>SUBMITTED BY</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#475569", margin: "3px 0 0 0" }}>{vehicle.submittedBy || "IT Officer"}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", margin: 0 }}>BRANCH / DIVISION</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#475569", margin: "3px 0 0 0" }}>{vehicle.branch || "Negombo Traffic Div."}</p>
            </div>
          </div>

          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div><p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>CHASSIS NO (VIN)</p><p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", margin: 0 }}>{vehicle.chassisNo || "N/A"}</p></div>
            <div><p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>ENGINE NO</p><p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", margin: 0 }}>{vehicle.engineNo || "N/A"}</p></div>
            <div><p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>FUEL TYPE</p><p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", margin: 0 }}>{vehicle.fuelType || "Diesel"}</p></div>
            <div><p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>COLOR</p><p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", margin: 0 }}>{vehicle.color || "N/A"}</p></div>
          </div>

          {vehicle.rejectionRemarks && (
            <div style={{ marginTop: 16, padding: 12, background: "#fee2e2", borderRadius: 10, border: "1px solid #fca5a5" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#991b1b", margin: 0 }}>OIC REJECTION REMARKS</p>
              <p style={{ fontSize: 13, color: "#7f1d1d", margin: "4px 0 0 0" }}>"{vehicle.rejectionRemarks}"</p>
            </div>
          )}
        </div>

        <div className="um-modal-footer">
          <button className="um-submit-btn" onClick={onClose}>Close Profile</button>
        </div>
      </div>
    </div>
  );
}

// ─── Reject Confirm Modal Component ──────────────────────────────
function RejectConfirmModal({ vehicle, onClose, onConfirm }) {
  const [remarks, setRemarks] = useState("");

  return (
    <div className="um-modal-overlay">
      <div className="um-modal" style={{ maxWidth: 450 }}>
        <div className="um-modal-header" style={{ borderBottom: "1px solid #fee2e2" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ background: "#fee2e2", padding: 8, borderRadius: 10, color: "#dc2626", display: "flex" }}>
              <FiAlertTriangle size={20} />
            </div>
            <div>
              <h3 className="um-modal-title" style={{ color: "#991b1b" }}>Reject Vehicle Registration</h3>
              <p className="um-modal-sub">Reg No: {vehicle.registrationNo}</p>
            </div>
          </div>
          <button className="um-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="um-modal-body">
          <p style={{ fontSize: 14, color: "#334155", margin: "0 0 16px 0" }}>
            Are you sure you want to reject this vehicle registration request?
          </p>

          <div className="um-field-full">
            <label className="um-field-label">REJECTION REMARKS (OPTIONAL)</label>
            <textarea
              className="um-field-input um-textarea"
              placeholder="Enter reason for rejection..."
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </div>

        <div className="um-modal-footer">
          <button className="um-cancel-btn" onClick={onClose}>Cancel</button>
          <button
            className="um-submit-btn"
            style={{ background: "#dc2626", borderColor: "#dc2626" }}
            onClick={() => onConfirm(vehicle.id || vehicle._id, remarks)}
          >
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
}

export default VehicleManagement;

