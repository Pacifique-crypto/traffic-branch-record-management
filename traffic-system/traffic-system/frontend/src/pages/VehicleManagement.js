import React, { useState, useEffect } from "react";
import {
  FiTruck, FiCheckCircle, FiXCircle, FiMoreVertical,
  FiUserPlus, FiCheck, FiX, FiSearch, FiAlertTriangle,
  FiPlus, FiClock, FiEdit, FiUserCheck, FiTool
} from "react-icons/fi";
import { getVehicles, registerVehicle, updateVehicle, deleteVehicle, getOfficers } from "../api";

const PAGE_SIZE = 5;

const typeIcons = {
  "Patrol Car": "🚗",
  "Motorcycle": "🏍️",
  "Recovery Truck": "🚛",
  "Van": "🚐",
  "SUV": "🚙",
  "Jeep": "🚘",
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
  const [showRegister, setShowRegister]   = useState(false);
  const [detailsVehicle, setDetailsVehicle] = useState(null);
  const [assignTarget, setAssignTarget]   = useState(null);
  const [rejectTarget, setRejectTarget]   = useState(null);

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
  const maintenanceCount = vehicles.filter(v => v.status === "MAINTENANCE").length;
  const pendingCount     = approvals.length;

  // Filter + paginate
  const filtered = vehicles.filter(v => {
    const matchesSearch =
      (v.registrationNo || "").toLowerCase().includes(search.toLowerCase()) ||
      (v.deptNo || "").toLowerCase().includes(search.toLowerCase()) ||
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

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
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

        {/* ── OIC: New Vehicle Approvals ── */}
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
                          {typeIcons[v.vehicleType] || "🚗"}
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

        {/* ── Vehicle Registry Table ── */}
        <div className="um-section-card">
          <div className="um-section-header">
            <h3 className="um-section-title">Vehicle Registry</h3>
          </div>

          {/* Search & Filters */}
          <div className="um-search-row">
            <div className="um-search-wrap">
              <FiSearch size={15} color="#94a3b8" />
              <input
                className="um-search-input"
                placeholder="Search by reg no, dept no, vehicle type, officer..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <select
              className="um-filter-select"
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
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
            >
              <option value="All">All Status</option>
              <option value="AVAILABLE">Available</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="OUT OF SERVICE">Out of Service</option>
            </select>
          </div>

          {/* Table */}
          <table className="um-table">
            <thead>
              <tr>
                <th>REGISTRATION NO</th>
                <th>DEPT NO</th>
                <th>VEHICLE TYPE</th>
                <th>ASSIGNED OFFICER</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "#64748b", fontWeight: 600 }}>
                    No vehicles found in registry.
                  </td>
                </tr>
              ) : (
                paginated.map(v => {
                  const statusBg =
                    v.status === "AVAILABLE" || v.status === "Active" || v.status === "Approved"
                      ? "#dcfce7"
                      : v.status === "MAINTENANCE"
                      ? "#fef3c7"
                      : "#fee2e2";
                  const statusColor =
                    v.status === "AVAILABLE" || v.status === "Active" || v.status === "Approved"
                      ? "#16a34a"
                      : v.status === "MAINTENANCE"
                      ? "#b45309"
                      : "#dc2626";

                  return (
                    <tr key={v.id} className="um-tr">
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div className="um-avatar" style={{ background: "#1e3a5f", color: "#fff" }}>
                            {typeIcons[v.vehicleType] || "🚗"}
                          </div>
                          <div>
                            <p className="um-officer-name">{v.registrationNo}</p>
                            <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>{v.makeModel || "N/A"}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <p style={{ fontWeight: 600, fontSize: 13, color: "#1e293b", margin: 0 }}>{v.deptNo}</p>
                      </td>
                      <td>
                        <p style={{ fontWeight: 600, fontSize: 13, color: "#475569", margin: 0 }}>{v.vehicleType}</p>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <p style={{ fontWeight: 600, fontSize: 13, color: "#1e293b", margin: 0 }}>
                            {v.assignedOfficer || "Unassigned"}
                          </p>
                          <button
                            onClick={() => setAssignTarget(v)}
                            title="Assign Officer"
                            style={{
                              border: "none", background: "#f1f5f9", padding: "4px 8px",
                              borderRadius: "6px", cursor: "pointer", color: "#2563eb", fontSize: "11px", fontWeight: 600
                            }}
                          >
                            <FiUserCheck size={12} style={{ marginRight: 3 }} /> Assign
                          </button>
                        </div>
                      </td>
                      <td>
                        <span className="um-status-badge" style={{ background: statusBg, color: statusColor }}>
                          {v.status || "AVAILABLE"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <FiMoreVertical
                            size={18}
                            onClick={() => setDetailsVehicle(v)}
                            style={{ cursor: "pointer", color: "#64748b" }}
                            title="View Full Details"
                          />
                          {userRole === "IT Officer" && (
                            <button
                              onClick={() => handleDelete(v.id)}
                              title="Delete Record"
                              style={{
                                border: "none", background: "#fee2e2", color: "#dc2626",
                                padding: "4px 8px", borderRadius: "6px", cursor: "pointer", fontSize: 11, fontWeight: 600
                              }}
                            >
                              Delete
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="um-pagination">
              <p className="um-page-info">
                Showing {((page - 1) * PAGE_SIZE) + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} vehicles
              </p>
              <div className="um-page-btns">
                <button className="um-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    className={`um-page-btn ${page === i + 1 ? "um-page-active" : ""}`}
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button className="um-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ══ REGISTER VEHICLE MODAL (IT Officer) ══ */}
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

      {/* ══ VEHICLE DETAILS MODAL (3 dots) ══ */}
      {detailsVehicle && (
        <VehicleDetailsModal
          vehicle={detailsVehicle}
          onClose={() => setDetailsVehicle(null)}
        />
      )}

      {/* ══ ASSIGN OFFICER MODAL ══ */}
      {assignTarget && (
        <AssignOfficerModal
          vehicle={assignTarget}
          officers={officers}
          onClose={() => setAssignTarget(null)}
          onSave={async (vehicleId, officerName) => {
            try {
              const res = await updateVehicle(vehicleId, { assignedOfficer: officerName });
              if (res && !res.error) {
                fetchAllData();
                setAssignTarget(null);
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

      {/* ══ REJECT CONFIRMATION MODAL (OIC) ══ */}
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

// ─── Register Vehicle Modal Component ─────────────────────────────
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

// ─── Vehicle Details Modal Component ─────────────────────────────
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

// ─── Assign Officer Modal Component ──────────────────────────────
function AssignOfficerModal({ vehicle, officers, onClose, onSave }) {
  const [selectedOfficer, setSelectedOfficer] = useState(vehicle.assignedOfficer || "Unassigned");

  return (
    <div className="um-modal-overlay">
      <div className="um-modal" style={{ maxWidth: 440 }}>
        <div className="um-modal-header">
          <div>
            <h3 className="um-modal-title">Assign Vehicle Officer</h3>
            <p className="um-modal-sub">Reg No: {vehicle.registrationNo}</p>
          </div>
          <button className="um-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="um-modal-body">
          <div className="um-field-full">
            <label className="um-field-label">SELECT OFFICER TO ASSIGN *</label>
            <select
              className="um-field-input"
              value={selectedOfficer}
              onChange={(e) => setSelectedOfficer(e.target.value)}
            >
              <option value="Unassigned">Unassigned (Pool Vehicle)</option>
              {officers.map(o => (
                <option key={o._id || o.id} value={o.fullName}>
                  {o.fullName} ({o.rank || "Officer"})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="um-modal-footer">
          <button className="um-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="um-submit-btn" onClick={() => onSave(vehicle.id || vehicle._id, selectedOfficer)}>
            Save Assignment
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
