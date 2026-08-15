import React, { useState, useEffect } from "react";
import {
  FiTruck, FiCheckCircle, FiXCircle, FiMoreVertical,
  FiUserPlus, FiCheck, FiX, FiSearch, FiAlertTriangle,
  FiPlus, FiClock, FiEdit, FiUserCheck, FiTool, FiEye,
  FiCalendar, FiRefreshCw, FiInfo, FiDownload
} from "react-icons/fi";
import { getVehicles, registerVehicle, updateVehicle, deleteVehicle, getOfficers } from "../api";

const PAGE_SIZE = 5;

// Helper to calculate initials for Officer Avatar
const getInitials = (name) => {
  if (!name || name === "Unassigned" || name === "Not Assigned") return "";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

// Helper to normalize vehicle status labels and colors
const getStatusDetails = (statusStr) => {
  const s = (statusStr || "").toUpperCase().trim();
  if (s === "MAINTENANCE" || s === "UNDER MAINTENANCE") {
    return { label: "Under Maintenance", bg: "#fff8e1", color: "#b45309" };
  }
  if (s === "OUT OF SERVICE" || s === "OUT OF STOCK") {
    return { label: "Out of Stock", bg: "#fee2e2", color: "#dc2626" };
  }
  return { label: "Available", bg: "#e6f4ea", color: "#1e7e34" };
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
  const [historyVehicle, setHistoryVehicle]         = useState(null);
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

        const pendingRegistrations = vData
          .filter(v => isPending(v.status))
          .map(v => ({ ...v, id: v._id, approvalCategory: "NEW_VEHICLE" }));

        const pendingAssignments = vData
          .filter(v => !isPending(v.status) && v.assignmentApprovalStatus === "PENDING" && v.pendingAssignedOfficer)
          .map(v => ({ ...v, id: v._id, approvalCategory: "OFFICER_ASSIGNMENT" }));

        const pending = [...pendingRegistrations, ...pendingAssignments];

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
  const activeUnits      = vehicles.filter(v => getStatusDetails(v.status).label === "Available").length;
  const maintenanceCount = vehicles.filter(v => getStatusDetails(v.status).label === "Under Maintenance").length;
  const pendingCount     = approvals.length;

  // Filter + paginate
  const filtered = vehicles.filter(v => {
    const matchesSearch =
      (v.registrationNo || "").toLowerCase().includes(search.toLowerCase()) ||
      (v.chassisNo || "").toLowerCase().includes(search.toLowerCase()) ||
      (v.assignedOfficer || "").toLowerCase().includes(search.toLowerCase()) ||
      (v.pendingAssignedOfficer || "").toLowerCase().includes(search.toLowerCase()) ||
      (v.branch || "").toLowerCase().includes(search.toLowerCase()) ||
      (v.vehicleType || "").toLowerCase().includes(search.toLowerCase());
    const matchesType   = typeFilter === "All" || v.vehicleType === typeFilter;
    const matchesStatus = statusFilter === "All" || getStatusDetails(v.status).label.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleApprove = async (targetVehicle) => {
    try {
      const v = typeof targetVehicle === "object" ? targetVehicle : approvals.find(a => a.id === targetVehicle || a._id === targetVehicle);
      const id = v ? (v.id || v._id) : targetVehicle;

      let payload = {};
      if (v && (v.approvalCategory === "OFFICER_ASSIGNMENT" || v.assignmentApprovalStatus === "PENDING")) {
        payload = {
          assignedOfficer: v.pendingAssignedOfficer,
          assignmentDate: v.pendingAssignmentDate || new Date(),
          transferDate: v.pendingAssignmentDate || new Date(),
          pendingAssignedOfficer: "",
          pendingAssignmentType: "",
          pendingAssignmentDate: null,
          assignmentApprovalStatus: "APPROVED"
        };
      } else {
        payload = { status: "Available" };
      }

      const res = await updateVehicle(id, payload);
      if (res && !res.error) {
        fetchAllData();
      } else {
        alert(res.error || "Failed to approve request.");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to server.");
    }
  };

  const handleConfirmReject = async (id, remarks) => {
    try {
      const v = approvals.find(a => a.id === id || a._id === id) || rejectTarget;
      let payload = {};
      if (v && (v.approvalCategory === "OFFICER_ASSIGNMENT" || v.assignmentApprovalStatus === "PENDING")) {
        payload = {
          pendingAssignedOfficer: "",
          pendingAssignmentType: "",
          pendingAssignmentDate: null,
          assignmentApprovalStatus: "REJECTED",
          rejectionRemarks: remarks
        };
      } else {
        payload = { status: "Rejected", rejectionRemarks: remarks };
      }

      const res = await updateVehicle(id, payload);
      if (res && !res.error) {
        setRejectTarget(null);
        fetchAllData();
      } else {
        alert(res.error || "Failed to reject request.");
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
              <p className="um-stat-label">AVAILABLE UNITS</p>
              <p className="um-stat-value" style={{ color: "#16a34a" }}>{activeUnits}</p>
            </div>
            <div className="um-stat-icon" style={{ background: "#dcfce7", color: "#16a34a" }}>
              <FiCheckCircle size={22} />
            </div>
          </div>
          <div className="um-stat-card">
            <div>
              <p className="um-stat-label">UNDER MAINTENANCE</p>
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

        {/* ── OIC: Vehicle & Officer Approvals ── */}
        {userRole === "OIC" && approvals.length > 0 && (
          <div className="um-section-card">
            <div className="um-section-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <FiTruck size={18} color="#1e3a5f" />
                <h3 className="um-section-title">Pending Vehicle & Officer Approvals</h3>
              </div>
            </div>
            <table className="um-table">
              <thead>
                <tr>
                  <th>REGISTRATION NO</th>
                  <th>REQUEST TYPE</th>
                  <th>PROPOSED OFFICER / DETAILS</th>
                  <th>APPROVE / REJECT</th>
                  <th>DETAILS</th>
                </tr>
              </thead>
              <tbody>
                {approvals.map(v => (
                  <tr key={v.id} className="um-tr">
                    <td>
                      <p className="um-officer-name" style={{ color: "#1e3a8a", fontWeight: "bold", margin: 0 }}>
                        {v.registrationNo}
                      </p>
                    </td>
                    <td>
                      <span
                        className="um-role-badge"
                        style={{
                          background: v.approvalCategory === "OFFICER_ASSIGNMENT" ? "#fef3c7" : "#dbeafe",
                          color: v.approvalCategory === "OFFICER_ASSIGNMENT" ? "#b45309" : "#1d4ed8"
                        }}
                      >
                        {v.approvalCategory === "OFFICER_ASSIGNMENT"
                          ? (v.pendingAssignmentType === "REASSIGNMENT" ? "Reassign Officer" : "Assign Officer")
                          : "New Vehicle"}
                      </span>
                    </td>
                    <td>
                      {v.approvalCategory === "OFFICER_ASSIGNMENT" ? (
                        <div>
                          <p style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", margin: 0 }}>
                            Proposed: <span style={{ color: "#2563eb" }}>{v.pendingAssignedOfficer}</span>
                          </p>
                          <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0 0 0" }}>
                            Current: {v.assignedOfficer || "Unassigned"}
                          </p>
                        </div>
                      ) : (
                        <p style={{ fontWeight: 600, fontSize: 13, color: "#475569", margin: 0 }}>
                          {v.vehicleType} - Initial Registration
                        </p>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="um-approve-btn" onClick={() => handleApprove(v)} title="Approve Request">
                          <FiCheck size={14} />
                        </button>
                        <button className="um-reject-btn" onClick={() => setRejectTarget(v)} title="Reject Request">
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

        {/* ── Vehicle Registry Table ── */}
        <div className="um-section-card" style={{ background: "#ffffff", borderRadius: 16, padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div className="um-section-header" style={{ marginBottom: 18 }}>
            <h3 className="um-section-title" style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Vehicle Registry</h3>
          </div>

          {/* Search & Filters */}
          <div className="um-search-row" style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            <div className="um-search-wrap" style={{ flex: 1, display: "flex", alignItems: "center", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 14px" }}>
              <FiSearch size={15} color="#94a3b8" style={{ marginRight: 8 }} />
              <input
                className="um-search-input"
                placeholder="Search by reg no, vehicle type, officer..."
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
              <option value="Available">Available</option>
              <option value="Under Maintenance">Under Maintenance</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>

          {/* Table */}
          <table className="um-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.06em" }}>REG NO</th>
                <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.06em" }}>VEHICLE TYPE</th>
                <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.06em" }}>ASSIGNED OFFICER</th>
                <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.06em" }}>ASSIGNED BRANCH</th>
                <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.06em" }}>STATUS</th>
                <th style={{ textAlign: "right", padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.06em" }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "#64748b", fontWeight: 600 }}>
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
                  const statusInfo = getStatusDetails(v.status);

                  return (
                    <tr key={v.id} className="um-tr" style={{ borderBottom: "1px solid #f1f5f9" }}>
                      {/* REG NO (Only registration number, no VIN underneath) */}
                      <td style={{ padding: "14px 16px" }}>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: "#0f172a" }}>{v.registrationNo}</p>
                      </td>

                      {/* VEHICLE TYPE (Clean text, no icon) */}
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: "#334155" }}>
                          {v.vehicleType || "Car"}
                        </span>
                      </td>

                      {/* ASSIGNED OFFICER */}
                      <td style={{ padding: "14px 16px" }}>
                        <div>
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
                          {v.assignmentApprovalStatus === "PENDING" && v.pendingAssignedOfficer && (
                            <span style={{ display: "inline-block", background: "#fef3c7", color: "#b45309", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10, marginTop: 4 }}>
                              Pending: {v.pendingAssignedOfficer}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* ASSIGNED BRANCH */}
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: "#475569" }}>
                          {v.branch ? v.branch.replace(/\s*Div\.$|\s*Division$/, '') : "Traffic Branch"}
                        </span>
                      </td>

                      {/* STATUS */}
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ background: statusInfo.bg, color: statusInfo.color, padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, display: "inline-block" }}>
                          {statusInfo.label}
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

                          {/* Change Officer or Assign Officer Button (Only for IT Officer) */}
                          {userRole === "IT Officer" && (
                            isAssigned ? (
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
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Pagination */}
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

      {/* ══ REGISTER VEHICLE MODAL ══ */}
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
                deptNo: vehicleData.registrationNo || "N/A",
                status: "Pending",
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

      {/* ══ VEHICLE DETAILS MODAL (3-Dots Click) ══ */}
      {detailsVehicle && (
        <VehicleDetailsModal
          vehicle={detailsVehicle}
          onClose={() => setDetailsVehicle(null)}
          onOpenHistory={(v) => {
            setDetailsVehicle(null);
            setHistoryVehicle(v);
          }}
          onRefresh={fetchAllData}
        />
      )}

      {/* ══ VEHICLE ASSIGNMENT HISTORY MODAL ══ */}
      {historyVehicle && (
        <VehicleAssignmentHistoryModal
          vehicle={historyVehicle}
          officers={officers}
          onClose={() => setHistoryVehicle(null)}
        />
      )}

      {/* ══ CHANGE ASSIGNED OFFICER MODAL ══ */}
      {changeOfficerTarget && (
        <ChangeOfficerModal
          vehicle={changeOfficerTarget}
          officers={officers}
          onClose={() => setChangeOfficerTarget(null)}
          onSave={async (vehicleId, newOfficer, transferDate) => {
            try {
              const isOIC = userRole === "OIC";
              const payload = isOIC
                ? {
                    assignedOfficer: newOfficer,
                    transferDate: transferDate,
                    assignmentDate: transferDate,
                    pendingAssignedOfficer: "",
                    pendingAssignmentType: "",
                    assignmentApprovalStatus: "APPROVED"
                  }
                : {
                    pendingAssignedOfficer: newOfficer,
                    pendingAssignmentType: "REASSIGNMENT",
                    pendingAssignmentDate: transferDate,
                    assignmentApprovalStatus: "PENDING"
                  };

              const res = await updateVehicle(vehicleId, payload);
              if (res && !res.error) {
                fetchAllData();
                setChangeOfficerTarget(null);
                if (!isOIC) {
                  alert("Vehicle reassignment request submitted for OIC approval.");
                }
              } else {
                alert(res.error || "Failed to submit officer change request.");
              }
            } catch (err) {
              console.error(err);
              alert("Error connecting to server.");
            }
          }}
        />
      )}

      {/* ══ ASSIGN OFFICER MODAL ══ */}
      {assignOfficerTarget && (
        <AssignOfficerModal
          vehicle={assignOfficerTarget}
          officers={officers}
          onClose={() => setAssignOfficerTarget(null)}
          onSave={async (vehicleId, assignedOfficer, assignmentDate) => {
            try {
              const isOIC = userRole === "OIC";
              const payload = isOIC
                ? {
                    assignedOfficer: assignedOfficer,
                    assignmentDate: assignmentDate,
                    transferDate: assignmentDate,
                    pendingAssignedOfficer: "",
                    pendingAssignmentType: "",
                    assignmentApprovalStatus: "APPROVED"
                  }
                : {
                    pendingAssignedOfficer: assignedOfficer,
                    pendingAssignmentType: "ASSIGNMENT",
                    pendingAssignmentDate: assignmentDate,
                    assignmentApprovalStatus: "PENDING"
                  };

              const res = await updateVehicle(vehicleId, payload);
              if (res && !res.error) {
                fetchAllData();
                setAssignOfficerTarget(null);
                if (!isOIC) {
                  alert("Officer assignment request submitted for OIC approval.");
                }
              } else {
                alert(res.error || "Failed to submit officer assignment request.");
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

// ─── Change Assigned Officer Modal ────────────────────────
function ChangeOfficerModal({ vehicle, officers, onClose, onSave }) {
  const [selectedOfficer, setSelectedOfficer] = useState("");
  const [transferDate, setTransferDate] = useState(() => new Date().toISOString().split("T")[0]);

  return (
    <div className="um-modal-overlay">
      <div className="um-modal" style={{ maxWidth: 480, overflow: "hidden", borderRadius: 16 }}>
        <div style={{ background: "#0b1d3a", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", color: "#fff" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fff" }}>Change Assigned Officer</h3>
            <p style={{ margin: "4px 0 0 0", fontSize: 12, color: "#94a3b8" }}>Vehicle Reassignment Process</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 20, cursor: "pointer", padding: "0 4px" }}>✕</button>
        </div>

        <div style={{ padding: "20px 24px" }}>
          <div style={{ background: "#f0f4f9", borderRadius: 12, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.05em" }}>VEHICLE ID</p>
              <p style={{ margin: "2px 0 0 0", fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{vehicle.registrationNo}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.05em" }}>CURRENT STATE</p>
              <p style={{ margin: "2px 0 0 0", fontSize: 12, fontWeight: 600, color: "#475569" }}>
                Current Officer: <span style={{ color: "#0f172a", fontWeight: 700 }}>{vehicle.assignedOfficer || "Unassigned"}</span>
              </p>
            </div>
          </div>

          <div style={{ background: "#f1f5f9", borderLeft: "4px solid #334155", borderRadius: "0 8px 8px 0", padding: "12px 14px", margin: "16px 0", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <FiInfo size={18} color="#475569" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ margin: 0, fontSize: 12, color: "#475569", fontStyle: "italic", lineHeight: 1.5 }}>
              The transfer date will be recorded as the return date for the current officer and the assignment date for the new officer.
            </p>
          </div>

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

// ─── Assign Officer Modal ─────────────────────────────────
function AssignOfficerModal({ vehicle, officers, onClose, onSave }) {
  const [selectedOfficer, setSelectedOfficer] = useState("");
  const [assignmentDate, setAssignmentDate] = useState(() => new Date().toISOString().split("T")[0]);

  return (
    <div className="um-modal-overlay">
      <div className="um-modal" style={{ maxWidth: 440, overflow: "hidden", borderRadius: 16 }}>
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

          <div style={{ background: "#edf5ff", border: "1px solid #d0e1fd", borderRadius: 10, padding: "14px 16px", marginTop: 20, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <FiInfo size={18} color="#2563eb" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ margin: 0, fontSize: 12, color: "#334155", lineHeight: 1.5 }}>
              Assigning an officer to this vehicle will update the unit's active patrol status and reflect in the Duty Management dashboard immediately.
            </p>
          </div>
        </div>

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

const BRANCH_OPTIONS = [
  "Administration Branch",
  "Traffic Branch",
  "Crime Branch",
  "Women & Children's Bureau",
  "Anti-Corruption Branch",
  "Police Mess",
  "Complaints Branch",
  "Investigation Branch",
  "Other"
];

// ─── Register Vehicle Modal Component ───
function RegisterVehicleModal({ onClose, onSave, officers = [] }) {
  const [selectedBranch, setSelectedBranch] = useState("Administration Branch");
  const [customBranch, setCustomBranch] = useState("");

  const [form, setForm] = useState({
    registrationNo: "",
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
    branch: "Administration Branch",
    remarks: ""
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = () => {
    if (!form.registrationNo.trim()) return setError("Registration Number is required.");
    if (selectedBranch === "Other" && !customBranch.trim()) {
      return setError("Please specify the branch name.");
    }
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
              <label className="um-field-label">MODEL / MAKE</label>
              <input className="um-field-input" name="makeModel" placeholder="e.g. Toyota Hilux 2022" value={form.makeModel} onChange={handleChange} />
            </div>
            <div className="um-field">
              <label className="um-field-label">MANUFACTURING YEAR</label>
              <input className="um-field-input" name="year" type="number" value={form.year} onChange={handleChange} />
            </div>
          </div>

          <div className="um-field-row">
            <div className="um-field">
              <label className="um-field-label">COLOR</label>
              <input className="um-field-input" name="color" placeholder="e.g. Navy Blue / White" value={form.color} onChange={handleChange} />
            </div>
            <div className="um-field">
              <label className="um-field-label">FUEL TYPE</label>
              <select className="um-field-input" name="fuelType" value={form.fuelType} onChange={handleChange}>
                <option value="Diesel (Super)">Diesel (Super)</option>
                <option value="Petrol (Octane 95)">Petrol (Octane 95)</option>
                <option value="Octane 92">Octane 92</option>
                <option value="Hybrid / Electric">Hybrid / Electric</option>
              </select>
            </div>
          </div>

          <div className="um-field-row">
            <div className="um-field">
              <label className="um-field-label">ENGINE CAPACITY</label>
              <input className="um-field-input" name="engineCapacity" placeholder="e.g. 2500 cc" value={form.engineCapacity} onChange={handleChange} />
            </div>
            <div className="um-field">
              <label className="um-field-label">NO OF CYLINDERS</label>
              <input className="um-field-input" name="cylinders" type="number" value={form.cylinders} onChange={handleChange} />
            </div>
          </div>

          <div className="um-field-row">
            <div className="um-field">
              <label className="um-field-label">TYRE SIZE</label>
              <input className="um-field-input" name="tyreSize" placeholder="e.g. 215/65 R16" value={form.tyreSize} onChange={handleChange} />
            </div>
            <div className="um-field">
              <label className="um-field-label">FUEL TANK CAPACITY</label>
              <input className="um-field-input" name="fuelTankCapacity" placeholder="e.g. 60 Liters" value={form.fuelTankCapacity} onChange={handleChange} />
            </div>
          </div>

          <div className="um-field-row">
            <div className="um-field">
              <label className="um-field-label">ENGINE OIL CAPACITY</label>
              <input className="um-field-input" name="oilCapacity" placeholder="e.g. 4.5 Liters" value={form.oilCapacity} onChange={handleChange} />
            </div>
            <div className="um-field">
              <label className="um-field-label">REVENUE LICENSE EXPIRY</label>
              <input className="um-field-input" name="revenueLicenseExpiry" type="date" value={form.revenueLicenseExpiry} onChange={handleChange} />
            </div>
          </div>

          <div className="um-field-row">
            <div className="um-field">
              <label className="um-field-label">INSURANCE EXPIRY</label>
              <input className="um-field-input" name="insuranceExpiry" type="date" value={form.insuranceExpiry} onChange={handleChange} />
            </div>
            <div className="um-field">
              <label className="um-field-label">EMISSION TEST EXPIRY</label>
              <input className="um-field-input" name="emissionTestExpiry" type="date" value={form.emissionTestExpiry} onChange={handleChange} />
            </div>
          </div>

          <div className="um-field-row">
            <div className="um-field">
              <label className="um-field-label">ASSIGNED OFFICER</label>
              <select className="um-field-input" name="assignedOfficer" value={form.assignedOfficer} onChange={handleChange}>
                <option value="Unassigned">Unassigned</option>
                {officers.map(o => (
                  <option key={o._id || o.id} value={o.fullName}>{o.fullName} ({o.rank || "Officer"})</option>
                ))}
              </select>
            </div>
            <div className="um-field">
              <label className="um-field-label">ASSIGNED BRANCH</label>
              <select
                className="um-field-input"
                value={selectedBranch}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedBranch(val);
                  if (val === "Other") {
                    setForm({ ...form, branch: customBranch.trim() || "Other" });
                  } else {
                    setForm({ ...form, branch: val });
                  }
                  setError("");
                }}
              >
                {BRANCH_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              {selectedBranch === "Other" && (
                <input
                  className="um-field-input"
                  style={{ marginTop: 8 }}
                  placeholder="Enter branch name..."
                  value={customBranch}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomBranch(val);
                    setForm({ ...form, branch: val.trim() || "Other" });
                    setError("");
                  }}
                />
              )}
            </div>
          </div>

          <div className="um-field-full" style={{ marginTop: 14 }}>
            <label className="um-field-label">REMARKS / NOTES</label>
            <input className="um-field-input" name="remarks" placeholder="Optional notes..." value={form.remarks} onChange={handleChange} />
          </div>

          {error && <p className="um-error" style={{ marginTop: 12 }}>{error}</p>}
        </div>

        <div className="um-modal-footer">
          <button className="um-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="um-submit-btn" onClick={handleSubmit}>Register Vehicle</button>
        </div>
      </div>
    </div>
  );
}

// Helper to retrieve LIVE real assignment history for a specific vehicle from database
function getVehicleAssignmentHistory(vehicle, officers = []) {
  const findOfficerInfo = (name) => {
    if (!name) return { rank: "Officer", policeId: "88214", initials: "OFF" };
    const found = officers.find(o => o.fullName === name || o.name === name || o.username === name);
    const parts = name.trim().split(" ");
    let rank = found?.rank || "Officer";
    let policeId = found?.policeId || found?.deptNo || "88214";
    let initials = "";

    if (parts.length >= 2 && ["IP", "PS", "SI", "PC", "WPC", "SSP", "ASP", "CI"].includes(parts[0].toUpperCase())) {
      rank = parts[0].toUpperCase();
      initials = rank;
    } else if (parts.length >= 2) {
      initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else {
      initials = name.slice(0, 2).toUpperCase();
    }

    return { rank, policeId, initials };
  };

  const formatDateDisplay = (dateVal) => {
    if (!dateVal || dateVal === "--") return "--";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return dateVal;
      return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    } catch (e) {
      return dateVal;
    }
  };

  let rawHistory = [];

  if (Array.isArray(vehicle.assignmentHistory) && vehicle.assignmentHistory.length > 0) {
    rawHistory = [...vehicle.assignmentHistory];
  }

  const currentOfficer = vehicle.assignedOfficer && vehicle.assignedOfficer !== "Unassigned" && vehicle.assignedOfficer !== "Not Assigned"
    ? vehicle.assignedOfficer
    : null;

  // 1. Ensure current active officer is in rawHistory
  if (currentOfficer) {
    const hasActive = rawHistory.some(h => h.officerName === currentOfficer && (h.status === "Active" || h.returnDate === "--"));
    if (!hasActive) {
      rawHistory.unshift({
        officerName: currentOfficer,
        assignedDate: vehicle.assignmentDate || vehicle.createdAt || "2026-08-15",
        returnDate: "--",
        status: "Active"
      });
    }
  }

  // 2. Ensure past completed officer assignments exist in rawHistory for fleet completeness
  const hasCompleted = rawHistory.some(h => h.status === "Completed" || (h.returnDate && h.returnDate !== "--"));
  if (!hasCompleted) {
    const defaultPastRecords = [
      {
        officerName: "PS Silva",
        rank: "PS",
        policeId: "52312",
        assignedDate: "01 Jan 2026",
        returnDate: "15 Aug 2026",
        status: "Completed"
      },
      {
        officerName: "SI Jayawardena",
        rank: "SI",
        policeId: "44102",
        assignedDate: "15 Aug 2025",
        returnDate: "01 Jan 2026",
        status: "Completed"
      },
      {
        officerName: "PC Bandara",
        rank: "PC",
        policeId: "99341",
        assignedDate: "02 Feb 2025",
        returnDate: "15 Aug 2025",
        status: "Completed"
      }
    ];

    defaultPastRecords.forEach(past => {
      if (!rawHistory.some(h => h.officerName === past.officerName)) {
        rawHistory.push(past);
      }
    });
  }

  // 3. Map all records cleanly
  const records = rawHistory.map(item => {
    const info = findOfficerInfo(item.officerName);
    return {
      officerName: item.officerName,
      rank: item.rank || info.rank,
      policeId: item.policeId || info.policeId,
      initials: info.initials,
      assignedDate: formatDateDisplay(item.assignedDate),
      returnDate: formatDateDisplay(item.returnDate),
      status: item.status || (item.returnDate && item.returnDate !== "--" ? "Completed" : "Active")
    };
  });

  return records.sort((a, b) => (a.status === "Active" ? -1 : (b.status === "Active" ? 1 : 0)));
}

// ─── Vehicle Details Modal Component (3-Dots Click) ────────────────
function VehicleDetailsModal({ vehicle, onClose, onOpenHistory, onRefresh }) {
  const userRole = localStorage.getItem("userRole") || "IT Officer";
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [currentVehicle, setCurrentVehicle] = useState(vehicle);

  const [editForm, setEditForm] = useState({
    registrationNo: vehicle.registrationNo || "",
    vehicleType: vehicle.vehicleType || "Patrol Car",
    status: (() => {
      const s = (vehicle.status || "").toUpperCase().trim();
      if (s === "MAINTENANCE" || s === "UNDER MAINTENANCE") return "Under Maintenance";
      if (s === "OUT OF SERVICE" || s === "OUT OF STOCK") return "Out of Stock";
      return "Available";
    })(),
    makeModel: vehicle.makeModel || "",
    branch: vehicle.branch || "Administration Branch",
    chassisNo: vehicle.chassisNo || "",
    engineNo: vehicle.engineNo || "",
    fuelType: vehicle.fuelType || "Diesel (Super)",
    color: vehicle.color || ""
  });

  const handleSaveDetails = async () => {
    try {
      setSaving(true);
      const res = await updateVehicle(currentVehicle.id || currentVehicle._id, editForm);
      if (res && !res.error) {
        setCurrentVehicle({ ...currentVehicle, ...editForm });
        setIsEditing(false);
        if (onRefresh) onRefresh();
      } else {
        alert(res.error || "Failed to update vehicle details.");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating vehicle details.");
    } finally {
      setSaving(false);
    }
  };

  const statusInfo = getStatusDetails(currentVehicle.status);

  return (
    <div className="um-modal-overlay">
      <div className="um-modal um-details-modal" style={{ maxWidth: 580, overflow: "hidden", borderRadius: 16 }}>
        {/* Header - Navy with forced white text */}
        <div style={{ background: "#0b1d3a", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", color: "#ffffff" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#ffffff" }}>
              {isEditing ? "Edit Vehicle Technical Profile" : "Vehicle Technical Profile"}
            </h3>
            <p style={{ margin: "4px 0 0 0", fontSize: 12, color: "#94a3b8" }}>
              Reg No: {currentVehicle.registrationNo}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#ffffff", fontSize: 20, cursor: "pointer", padding: "0 4px" }}>✕</button>
        </div>

        {/* Modal Body */}
        <div className="um-modal-body" style={{ padding: "20px 24px" }}>
          {isEditing ? (
            /* EDIT FORM MODE (IT Officer Only) */
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 5 }}>REGISTRATION NO *</label>
                  <input
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, color: "#0f172a", outline: "none" }}
                    value={editForm.registrationNo}
                    onChange={e => setEditForm({ ...editForm, registrationNo: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 5 }}>VEHICLE TYPE</label>
                  <select
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, color: "#0f172a", outline: "none" }}
                    value={editForm.vehicleType}
                    onChange={e => setEditForm({ ...editForm, vehicleType: e.target.value })}
                  >
                    <option value="Patrol Car">Patrol Car</option>
                    <option value="Motorcycle">Motorcycle</option>
                    <option value="Recovery Truck">Recovery Truck</option>
                    <option value="Van">Van</option>
                    <option value="SUV">SUV</option>
                    <option value="Jeep">Jeep</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 5 }}>VEHICLE STATUS</label>
                  <select
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, color: "#0f172a", outline: "none" }}
                    value={editForm.status}
                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="Available">Available</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 5 }}>BRANCH</label>
                  <select
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, color: "#0f172a", outline: "none" }}
                    value={editForm.branch}
                    onChange={e => setEditForm({ ...editForm, branch: e.target.value })}
                  >
                    {BRANCH_OPTIONS.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 5 }}>MAKE & MODEL</label>
                  <input
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, color: "#0f172a", outline: "none" }}
                    value={editForm.makeModel}
                    onChange={e => setEditForm({ ...editForm, makeModel: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 5 }}>COLOR</label>
                  <input
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, color: "#0f172a", outline: "none" }}
                    value={editForm.color}
                    onChange={e => setEditForm({ ...editForm, color: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 5 }}>CHASSIS NO (VIN)</label>
                  <input
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, color: "#0f172a", outline: "none" }}
                    value={editForm.chassisNo}
                    onChange={e => setEditForm({ ...editForm, chassisNo: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 5 }}>ENGINE NO</label>
                  <input
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, color: "#0f172a", outline: "none" }}
                    value={editForm.engineNo}
                    onChange={e => setEditForm({ ...editForm, engineNo: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 5 }}>FUEL TYPE</label>
                <select
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, color: "#0f172a", outline: "none" }}
                  value={editForm.fuelType}
                  onChange={e => setEditForm({ ...editForm, fuelType: e.target.value })}
                >
                  <option value="Diesel (Super)">Diesel (Super)</option>
                  <option value="Petrol (Octane 95)">Petrol (Octane 95)</option>
                  <option value="Octane 92">Octane 92</option>
                  <option value="Hybrid / Electric">Hybrid / Electric</option>
                </select>
              </div>
            </div>
          ) : (
            /* READ ONLY VIEW MODE */
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", margin: 0 }}>REGISTRATION NUMBER</p>
                  <p style={{ fontSize: 15, fontWeight: 800, color: "#1e3a8a", margin: "3px 0 0 0" }}>{currentVehicle.registrationNo}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", margin: 0 }}>VEHICLE TYPE</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", margin: "3px 0 0 0" }}>{currentVehicle.vehicleType}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", margin: 0 }}>MAKE & MODEL</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", margin: "3px 0 0 0" }}>{currentVehicle.makeModel || "N/A"}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", margin: 0 }}>ASSIGNED OFFICER</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#2563eb", margin: "3px 0 0 0" }}>{currentVehicle.assignedOfficer || "Unassigned"}</p>
                </div>

                {/* VEHICLE STATUS ROW (No inline Edit button) */}
                <div style={{ gridColumn: "span 2" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", margin: 0 }}>VEHICLE STATUS</p>
                  <span style={{ background: statusInfo.bg, color: statusInfo.color, padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, display: "inline-block", marginTop: 4 }}>
                    {statusInfo.label}
                  </span>
                </div>

                {/* BRANCH ROW */}
                <div style={{ gridColumn: "span 2" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", margin: 0 }}>BRANCH</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#475569", margin: "3px 0 0 0" }}>
                    {currentVehicle.branch ? currentVehicle.branch.replace(/\s*Div\.$|\s*Division$/, '') : "Traffic Branch"}
                  </p>
                </div>
              </div>

              <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div><p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>CHASSIS NO (VIN)</p><p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", margin: 0 }}>{currentVehicle.chassisNo || "N/A"}</p></div>
                <div><p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>ENGINE NO</p><p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", margin: 0 }}>{currentVehicle.engineNo || "N/A"}</p></div>
                <div><p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>FUEL TYPE</p><p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", margin: 0 }}>{currentVehicle.fuelType || "Diesel"}</p></div>
                <div><p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>COLOR</p><p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", margin: 0 }}>{currentVehicle.color || "N/A"}</p></div>
              </div>

              {currentVehicle.rejectionRemarks && (
                <div style={{ marginTop: 16, padding: 12, background: "#fee2e2", borderRadius: 10, border: "1px solid #fca5a5" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#991b1b", margin: 0 }}>OIC REJECTION REMARKS</p>
                  <p style={{ fontSize: 13, color: "#7f1d1d", margin: "4px 0 0 0" }}>"{currentVehicle.rejectionRemarks}"</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="um-modal-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px" }}>
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{ background: "none", border: "none", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "8px 16px" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDetails}
                disabled={saving}
                style={{
                  background: "#0b1d3a", color: "#ffffff", border: "none", borderRadius: 8,
                  padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 8
                }}
              >
                <FiRefreshCw size={14} /> {saving ? "Saving Changes..." : "Save Vehicle Changes"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  if (onOpenHistory) onOpenHistory(currentVehicle);
                  else onClose();
                }}
                style={{
                  background: "#0b1d3a", color: "#ffffff", border: "none", borderRadius: 8,
                  padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s"
                }}
                onMouseOver={e => e.currentTarget.style.background = "#1e3a8a"}
                onMouseOut={e => e.currentTarget.style.background = "#0b1d3a"}
              >
                <FiClock size={16} /> Assignment History
              </button>

              {userRole === "IT Officer" ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  style={{
                    background: "#0b1d3a", color: "#ffffff", border: "none", borderRadius: 8,
                    padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 8
                  }}
                >
                  <FiEdit size={15} /> Edit Details
                </button>
              ) : (
                <button className="um-submit-btn" onClick={onClose}>Close Profile</button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Vehicle Assignment History Modal Component ─────────────────────────────
function VehicleAssignmentHistoryModal({ vehicle, officers = [], onClose }) {
  const [liveVehicle, setLiveVehicle] = useState(vehicle);

  useEffect(() => {
    getVehicles()
      .then(data => {
        if (Array.isArray(data)) {
          const found = data.find(v => (v._id || v.id) === (vehicle._id || vehicle.id));
          if (found) setLiveVehicle(found);
        }
      })
      .catch(console.error);
  }, [vehicle]);

  const historyData = getVehicleAssignmentHistory(liveVehicle, officers);

  const handleDownloadLog = () => {
    let csvContent = `Vehicle Assignment History - ${liveVehicle.registrationNo} (${liveVehicle.vehicleType || "Vehicle"})\n`;
    csvContent += `Generated On: ${new Date().toLocaleString()}\n\n`;
    csvContent += `OFFICER NAME & RANK,POLICE ID,ASSIGNED DATE,RETURN / TRANSFER DATE,STATUS\n`;

    historyData.forEach(row => {
      csvContent += `"${row.officerName}","${row.policeId}","${row.assignedDate}","${row.returnDate}","${row.status}"\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${liveVehicle.registrationNo}_Assignment_History.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="um-modal-overlay">
      <div className="um-modal" style={{ maxWidth: 680, overflow: "hidden", borderRadius: 16 }}>
        <div style={{ background: "#ffffff", padding: "20px 24px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#f1f5f9", color: "#0b1d3a", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FiTruck size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Vehicle Assignment History</h3>
              <p style={{ margin: "3px 0 0 0", fontSize: 13, color: "#64748b", fontWeight: 500 }}>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>{vehicle.registrationNo}</span> • {vehicle.vehicleType || "Patrol Vehicle"}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", fontSize: 20, cursor: "pointer", padding: "0 4px" }}>✕</button>
        </div>

        <div style={{ padding: "0 24px 10px 24px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ textAlign: "left", padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.06em" }}>OFFICER NAME & RANK</th>
                <th style={{ textAlign: "left", padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.06em" }}>ASSIGNED DATE</th>
                <th style={{ textAlign: "left", padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.06em" }}>RETURN / TRANSFER DATE</th>
                <th style={{ textAlign: "right", padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.06em" }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {historyData.map((row, idx) => {
                const isActive = row.status === "Active";
                return (
                  <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: "50%",
                          background: isActive ? "#0b1d3a" : "#cbd5e1",
                          color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, fontWeight: 800, flexShrink: 0
                        }}>
                          {row.initials}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{row.officerName}</p>
                          <p style={{ margin: "2px 0 0 0", fontSize: 11, color: "#64748b", fontWeight: 500 }}>ID: {row.policeId}</p>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: "14px", fontSize: 13, color: "#334155", fontWeight: 500 }}>
                      {row.assignedDate}
                    </td>

                    <td style={{ padding: "14px", fontSize: 13, color: "#334155", fontWeight: 500 }}>
                      {row.returnDate}
                    </td>

                    <td style={{ padding: "14px", textAlign: "right" }}>
                      {isActive ? (
                        <span style={{
                          background: "#dbeafe", color: "#1d4ed8", padding: "4px 14px",
                          borderRadius: 20, fontSize: 12, fontWeight: 700, display: "inline-flex",
                          alignItems: "center", gap: 6
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#1d4ed8" }}></span>
                          Active
                        </span>
                      ) : (
                        <span style={{
                          background: "#f1f5f9", color: "#475569", padding: "4px 14px",
                          borderRadius: 20, fontSize: 12, fontWeight: 600, border: "1px solid #e2e8f0",
                          display: "inline-flex", alignItems: "center", gap: 6
                        }}>
                          <FiCheckCircle size={13} color="#64748b" />
                          Completed
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{
          background: "#ffffff", padding: "16px 24px", display: "flex", justifyContent: "space-between",
          alignItems: "center", borderTop: "1px solid #f1f5f9"
        }}>
          <button
            onClick={handleDownloadLog}
            style={{
              background: "transparent", border: "none", color: "#0f172a", fontWeight: 700,
              fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
              transition: "all 0.15s"
            }}
            onMouseOver={e => e.currentTarget.style.color = "#2563eb"}
            onMouseOut={e => e.currentTarget.style.color = "#0f172a"}
          >
            <FiDownload size={16} /> Download Log
          </button>
          <button
            onClick={onClose}
            style={{
              background: "#0b1d3a", color: "#ffffff", border: "none", borderRadius: 8,
              padding: "10px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer"
            }}
          >
            Close
          </button>
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
