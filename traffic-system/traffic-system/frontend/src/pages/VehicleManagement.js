import React, { useState, useEffect } from "react";
import {
  FiTruck, FiCheckCircle, FiTool, FiAlertOctagon, FiPlus,
  FiSearch, FiMoreVertical, FiX, FiUserCheck, FiTrash2
} from "react-icons/fi";
import { getVehicles, registerVehicle, updateVehicle, deleteVehicle, getOfficers } from "../api";

const vehicleTypeOptions = ["Patrol Car", "Motorcycle", "Recovery Truck", "Jeep"];

function VehicleManagement() {
  const userRole = localStorage.getItem("userRole") || "IT Officer";
  let LayoutComponent;
  if (userRole === "OIC") {
    LayoutComponent = require("../layouts/OICLayout").default;
  } else {
    LayoutComponent = require("../layouts/ITLayout").default;
  }

  const [vehicles, setVehicles] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  // Modals state
  const [showRegister, setShowRegister] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Assign Officer Form
  const [assignForm, setAssignForm] = useState({
    vehicleId: "",
    officerName: ""
  });

  // Register Form
  const [registerForm, setRegisterForm] = useState({
    registrationNo: "",
    deptNo: "",
    vehicleType: "Patrol Car"
  });

  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      const vData = await getVehicles();
      if (Array.isArray(vData)) {
        setVehicles(vData);
      }
      const oData = await getOfficers();
      if (Array.isArray(oData)) {
        setOfficers(oData.filter(o => o.status === "Active"));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Stats calculation
  const totalVehicles = vehicles.length;
  const availableCount = vehicles.filter(v => v.status === "AVAILABLE").length;
  const maintenanceCount = vehicles.filter(v => v.status === "MAINTENANCE").length;
  const outOfServiceCount = vehicles.filter(v => v.status === "OUT OF SERVICE").length;

  // Filtering logic
  const filtered = vehicles.filter(v => {
    const matchesSearch =
      (v.registrationNo || "").toLowerCase().includes(search.toLowerCase()) ||
      (v.deptNo || "").toLowerCase().includes(search.toLowerCase()) ||
      (v.assignedOfficer || "").toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === "All" || v.vehicleType === typeFilter;
    const matchesStatus = statusFilter === "All" || v.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerForm.registrationNo || !registerForm.deptNo) {
      setError("Please fill all required fields.");
      return;
    }
    setError("");
    try {
      const res = await registerVehicle(registerForm);
      if (res && !res.error) {
        setShowRegister(false);
        setRegisterForm({ registrationNo: "", deptNo: "", vehicleType: "Patrol Car" });
        fetchData();
      } else {
        setError(res.message || res.error || "Failed to register vehicle.");
      }
    } catch (err) {
      setError("Error connecting to server.");
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignForm.vehicleId || !assignForm.officerName) {
      setError("Please fill all required fields.");
      return;
    }
    setError("");
    try {
      const res = await updateVehicle(assignForm.vehicleId, { assignedOfficer: assignForm.officerName });
      if (res && !res.error) {
        setShowAssign(false);
        setAssignForm({ vehicleId: "", officerName: "" });
        fetchData();
      } else {
        setError(res.error || "Failed to assign officer.");
      }
    } catch (err) {
      setError("Error connecting to server.");
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await updateVehicle(id, { status: newStatus });
      if (res && !res.error) {
        fetchData();
        setActiveMenuId(null);
      } else {
        alert(res.error || "Failed to update status.");
      }
    } catch (err) {
      alert("Error connecting to server.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to unregister this vehicle?")) return;
    try {
      const res = await deleteVehicle(id);
      if (res && !res.error) {
        fetchData();
        setActiveMenuId(null);
      } else {
        alert(res.error || "Failed to delete vehicle.");
      }
    } catch (err) {
      alert("Error connecting to server.");
    }
  };

  return (
    <LayoutComponent>
      <div className="um-page" style={{ position: "relative" }}>
        
        {/* Header */}
        <div className="um-header">
          <div>
            <h1 className="um-title">Vehicle Management</h1>
            <p className="um-subtitle">Official Fleet Registry & Deployment</p>
          </div>
          {userRole === "IT Officer" && (
            <div style={{ display: "flex", gap: 12 }}>
              <button
                className="um-register-btn"
                style={{ backgroundColor: "#475569" }}
                onClick={() => {
                  setError("");
                  setShowAssign(true);
                }}
              >
                <FiUserCheck size={15} style={{ marginRight: 6 }} /> Assign Officer
              </button>
              <button
                className="um-register-btn"
                onClick={() => {
                  setError("");
                  setShowRegister(true);
                }}
              >
                <FiPlus size={15} style={{ marginRight: 6 }} /> Register Vehicle
              </button>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="um-stats" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <div className="um-stat-card">
            <div>
              <p className="um-stat-label">TOTAL VEHICLES</p>
              <p className="um-stat-value">{totalVehicles}</p>
              <p style={{ fontSize: "11px", color: "#16a34a", marginTop: "4px" }}>↗ 2 added this month</p>
            </div>
            <div className="um-stat-icon" style={{ background: "#f1f5f9", color: "#475569" }}>
              <FiTruck size={22} />
            </div>
          </div>

          <div className="um-stat-card">
            <div>
              <p className="um-stat-label">AVAILABLE</p>
              <p className="um-stat-value" style={{ color: "#16a34a" }}>{availableCount}</p>
              <p style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>Currently on deployment</p>
            </div>
            <div className="um-stat-icon" style={{ background: "#dcfce7", color: "#16a34a" }}>
              <FiCheckCircle size={22} />
            </div>
          </div>

          <div className="um-stat-card">
            <div>
              <p className="um-stat-label">UNDER MAINTENANCE</p>
              <p className="um-stat-value" style={{ color: "#d97706" }}>{maintenanceCount}</p>
              <p style={{ fontSize: "11px", color: "#dc2626", marginTop: "4px" }}>⏰ 4 overdue service</p>
            </div>
            <div className="um-stat-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
              <FiTool size={22} />
            </div>
          </div>

          <div className="um-stat-card">
            <div>
              <p className="um-stat-label">OUT OF SERVICE</p>
              <p className="um-stat-value" style={{ color: "#dc2626" }}>{outOfServiceCount}</p>
              <p style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>Requiring replacement</p>
            </div>
            <div className="um-stat-icon" style={{ background: "#fee2e2", color: "#dc2626" }}>
              <FiAlertOctagon size={22} />
            </div>
          </div>
        </div>

        {/* Search and Filters row */}
        <div className="um-section-card" style={{ padding: "20px", marginBottom: "20px" }}>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
            <div className="um-search-wrap" style={{ flex: 1, minWidth: "250px" }}>
              <FiSearch size={15} color="#94a3b8" />
              <input
                className="um-search-input"
                placeholder="Search vehicle records..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <select
              className="um-filter-select"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              style={{
                padding: "10px 14px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                backgroundColor: "#ffffff",
                color: "#1e293b",
                fontWeight: "600",
                fontSize: "13px",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="All">Vehicle Type</option>
              {vehicleTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <select
              className="um-filter-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              style={{
                padding: "10px 14px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                backgroundColor: "#ffffff",
                color: "#1e293b",
                fontWeight: "600",
                fontSize: "13px",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="All">Status</option>
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
              <option value="OUT OF SERVICE">OUT OF SERVICE</option>
            </select>
          </div>
        </div>

        {/* Table Registry */}
        <div className="um-section-card">
          <div className="um-section-header">
            <h3 className="um-section-title">Vehicle Registry</h3>
          </div>

          <table className="um-table">
            <thead>
              <tr>
                <th>REGISTRATION NO.</th>
                <th>DEPT. NO.</th>
                <th>VEHICLE TYPE</th>
                <th>ASSIGNED OFFICER</th>
                <th>STATUS</th>
                {userRole === "IT Officer" && <th style={{ textAlign: "right" }}>ACTION</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={userRole === "IT Officer" ? 6 : 5} style={{ textAlign: "center", padding: "20px", fontWeight: "bold" }}>
                    Loading vehicle registry...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={userRole === "IT Officer" ? 6 : 5} style={{ textAlign: "center", padding: "20px" }}>
                    No vehicle records found.
                  </td>
                </tr>
              ) : (
                paginated.map((v) => {
                  const statusColors = {
                    AVAILABLE: { bg: "#dcfce7", color: "#15803d" },
                    MAINTENANCE: { bg: "#fef3c7", color: "#b45309" },
                    "OUT OF SERVICE": { bg: "#fee2e2", color: "#b91c1c" }
                  };
                  const sc = statusColors[v.status] || { bg: "#f1f5f9", color: "#374151" };

                  return (
                    <tr key={v._id} className="um-tr">
                      <td style={{ fontWeight: "700" }}>{v.registrationNo}</td>
                      <td style={{ color: "#475569", fontWeight: "500" }}>{v.deptNo}</td>
                      <td>{v.vehicleType}</td>
                      <td style={{ color: v.assignedOfficer === "Unassigned" ? "#94a3b8" : "#1e293b", fontWeight: "600" }}>
                        {v.assignedOfficer}
                      </td>
                      <td>
                        <span
                          style={{
                            backgroundColor: sc.bg,
                            color: sc.color,
                            padding: "4px 8px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "700"
                          }}
                        >
                          {v.status}
                        </span>
                      </td>
                      {userRole === "IT Officer" && (
                        <td style={{ textAlign: "right", position: "relative" }}>
                          <button
                            className="ar-dots-btn"
                            onClick={() => setActiveMenuId(activeMenuId === v._id ? null : v._id)}
                          >
                            <FiMoreVertical size={16} />
                          </button>
                          
                          {activeMenuId === v._id && (
                            <div
                              style={{
                                position: "absolute",
                                right: 10,
                                top: 35,
                                backgroundColor: "#ffffff",
                                border: "1px solid #e2e8f0",
                                borderRadius: "8px",
                                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                                zIndex: 10,
                                padding: "4px 0",
                                width: "160px",
                                textAlign: "left"
                              }}
                            >
                              <button
                                onClick={() => handleUpdateStatus(v._id, "AVAILABLE")}
                                style={{ width: "100%", padding: "8px 12px", border: "none", background: "none", textAlign: "left", cursor: "pointer", fontSize: "12px", fontWeight: "600", color: "#16a34a" }}
                              >
                                Set AVAILABLE
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(v._id, "MAINTENANCE")}
                                style={{ width: "100%", padding: "8px 12px", border: "none", background: "none", textAlign: "left", cursor: "pointer", fontSize: "12px", fontWeight: "600", color: "#d97706" }}
                              >
                                Set MAINTENANCE
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(v._id, "OUT OF SERVICE")}
                                style={{ width: "100%", padding: "8px 12px", border: "none", background: "none", textAlign: "left", cursor: "pointer", fontSize: "12px", fontWeight: "600", color: "#dc2626" }}
                              >
                                Set OUT OF SERVICE
                              </button>
                              <div style={{ height: "1px", backgroundColor: "#e2e8f0", margin: "4px 0" }} />
                              <button
                                onClick={() => {
                                  setAssignForm({ vehicleId: v._id, officerName: v.assignedOfficer === "Unassigned" ? "" : v.assignedOfficer });
                                  setShowAssign(true);
                                  setActiveMenuId(null);
                                }}
                                style={{ width: "100%", padding: "8px 12px", border: "none", background: "none", textAlign: "left", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}
                              >
                                Assign Officer
                              </button>
                              <button
                                onClick={() => handleDelete(v._id)}
                                style={{ width: "100%", padding: "8px 12px", border: "none", background: "none", textAlign: "left", cursor: "pointer", fontSize: "12px", fontWeight: "600", color: "#ef4444", display: "flex", alignItems: "center", gap: "6px" }}
                              >
                                <FiTrash2 size={12} /> Unregister
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="um-pagination">
            <p className="um-pagination-info">
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} vehicles
            </p>
            <div className="um-page-btns">
              <button className="um-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  className={`um-page-btn ${page === i + 1 ? "um-page-active" : ""}`}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button className="um-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
            </div>
          </div>
        </div>

        {/* REGISTER VEHICLE MODAL */}
        {showRegister && (
          <div className="um-modal-overlay">
            <div className="um-modal" style={{ maxWidth: "450px" }}>
              <div className="um-modal-header">
                <div>
                  <h2 className="um-modal-title">Register Vehicle</h2>
                  <p className="um-modal-sub">Add a new vehicle to the registry fleet.</p>
                </div>
                <button className="um-modal-close" onClick={() => setShowRegister(false)}><FiX size={18} /></button>
              </div>

              <form onSubmit={handleRegister}>
                <div className="um-modal-body">
                  <div className="um-field-full">
                    <label className="um-field-label">REGISTRATION NO. *</label>
                    <input
                      className="um-field-input"
                      placeholder="e.g. WP KA-3421"
                      value={registerForm.registrationNo}
                      onChange={(e) => setRegisterForm({ ...registerForm, registrationNo: e.target.value })}
                      required
                    />
                  </div>

                  <div className="um-field-full">
                    <label className="um-field-label">DEPARTMENT NO. *</label>
                    <input
                      className="um-field-input"
                      placeholder="e.g. SLP-TRF-08"
                      value={registerForm.deptNo}
                      onChange={(e) => setRegisterForm({ ...registerForm, deptNo: e.target.value })}
                      required
                    />
                  </div>

                  <div className="um-field-full">
                    <label className="um-field-label">VEHICLE TYPE *</label>
                    <select
                      className="um-field-input"
                      value={registerForm.vehicleType}
                      onChange={(e) => setRegisterForm({ ...registerForm, vehicleType: e.target.value })}
                    >
                      {vehicleTypeOptions.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>

                  {error && <p className="um-error">{error}</p>}
                </div>

                <div className="um-modal-footer">
                  <button type="button" className="um-cancel-btn" onClick={() => setShowRegister(false)}>Cancel</button>
                  <button type="submit" className="um-submit-btn">Register Vehicle</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ASSIGN OFFICER MODAL */}
        {showAssign && (
          <div className="um-modal-overlay">
            <div className="um-modal" style={{ maxWidth: "450px" }}>
              <div className="um-modal-header">
                <div>
                  <h2 className="um-modal-title">Assign Deployment</h2>
                  <p className="um-modal-sub">Assign an officer to an active patrol vehicle.</p>
                </div>
                <button className="um-modal-close" onClick={() => setShowAssign(false)}><FiX size={18} /></button>
              </div>

              <form onSubmit={handleAssign}>
                <div className="um-modal-body">
                  <div className="um-field-full">
                    <label className="um-field-label">SELECT VEHICLE *</label>
                    <select
                      className="um-field-input"
                      value={assignForm.vehicleId}
                      onChange={(e) => setAssignForm({ ...assignForm, vehicleId: e.target.value })}
                      required
                    >
                      <option value="">Select Registration...</option>
                      {vehicles.map(v => (
                        <option key={v._id} value={v._id}>
                          {v.registrationNo} ({v.deptNo}) - {v.assignedOfficer}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="um-field-full">
                    <label className="um-field-label">SELECT ACTIVE OFFICER *</label>
                    <select
                      className="um-field-input"
                      value={assignForm.officerName}
                      onChange={(e) => setAssignForm({ ...assignForm, officerName: e.target.value })}
                      required
                    >
                      <option value="">Select Officer...</option>
                      <option value="Unassigned">Unassigned</option>
                      {officers.map(o => (
                        <option key={o._id} value={o.fullName}>{o.fullName} ({o.rank})</option>
                      ))}
                    </select>
                  </div>

                  {error && <p className="um-error">{error}</p>}
                </div>

                <div className="um-modal-footer">
                  <button type="button" className="um-cancel-btn" onClick={() => setShowAssign(false)}>Cancel</button>
                  <button type="submit" className="um-submit-btn">Assign Officer</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </LayoutComponent>
  );
}

export default VehicleManagement;
