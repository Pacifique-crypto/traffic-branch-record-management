import React, { useState } from "react";
import {
  FiUsers, FiCheckCircle, FiXCircle, FiMoreVertical,
  FiUserPlus, FiEye, FiEyeOff, FiCheck, FiX, FiSearch,
  FiDownload, FiPrinter, FiFilter
} from "react-icons/fi";

// ─── Sample data ────────────────────────────────────────────────
const initialOfficers = [
  { id: 1, fullName: "K R Perera",   email: "perera.kr@police.lk",   policeId: "PC 107272", rank: "Constable",     role: "City Patrol",    gender: "Male",   dob: "1995-05-15", nic: "199512345678", contactNo: "077 123 4567", address: "123, Police Quarters, Negombo, Sri Lanka", status: "Active",   password: "Pass@1234" },
  { id: 2, fullName: "D Silva",      email: "silva.d@police.lk",     policeId: "PS 52312",  rank: "Sergeant",      role: "Traffic Admin",  gender: "Male",   dob: "1990-03-22", nic: "199034567890", contactNo: "077 234 5678", address: "45, Main Street, Negombo, Sri Lanka",        status: "Deactive", password: "Pass@5678" },
  { id: 3, fullName: "A Mendis",     email: "mendis.a@police.lk",    policeId: "PC 99283",  rank: "Constable",     role: "Field Patrol",   gender: "Female", dob: "1998-07-10", nic: "199867890123", contactNo: "077 345 6789", address: "67, Beach Road, Negombo, Sri Lanka",         status: "Active",   password: "Pass@9012" },
  { id: 4, fullName: "R Wickramasinghe", email: "r.wick@police.lk", policeId: "PC 44521",  rank: "Constable",     role: "Evidence Support",gender:"Male",   dob: "1993-11-05", nic: "199345678901", contactNo: "077 456 7890", address: "12, Temple Lane, Negombo, Sri Lanka",        status: "Active",   password: "Pass@3456" },
  { id: 5, fullName: "D Silva (Insp)", email: "d.silva@police.lk",  policeId: "INS 99201", rank: "Inspector",     role: "Logistics",      gender: "Male",   dob: "1985-06-18", nic: "198567123456", contactNo: "077 567 8901", address: "89, Harbour View, Negombo, Sri Lanka",       status: "Active",   password: "Pass@7890" },
];

const pendingApprovals = [
  { id: 101, fullName: "Kamal Gunaratne", email: "k.guna@slp.gov.lk", policeId: "PC-10293",  rank: "Constable",      requestedRole: "City Patrol",   avatar: "KG" },
  { id: 102, fullName: "Sunimali Devi",   email: "s.devi@slp.gov.lk",  policeId: "SI-88214",  rank: "Sub-Inspector",  requestedRole: "Traffic Admin", avatar: "SD" },
];

const PAGE_SIZE = 5;

const rankColors = {
  "Constable":    { bg: "#dbeafe", color: "#1d4ed8" },
  "Sergeant":     { bg: "#dcfce7", color: "#16a34a" },
  "Inspector":    { bg: "#fef3c7", color: "#b45309" },
  "Sub-Inspector":{ bg: "#ede9fe", color: "#7c3aed" },
};

// ─── Main Component ─────────────────────────────────────────────
function UserManagement() {
  const userRole = localStorage.getItem("userRole") || "IT Officer";
  let LayoutComponent;
  if (userRole === "OIC") {
    LayoutComponent = require("../layouts/OICLayout").default;
  } else {
    LayoutComponent = require("../layouts/ITLayout").default;
  }

  const [officers, setOfficers]           = useState(initialOfficers);
  const [approvals, setApprovals]         = useState(pendingApprovals);
  const [search, setSearch]               = useState("");
  const [page, setPage]                   = useState(1);

  // Modals
  const [showRegister, setShowRegister]   = useState(false);
  const [detailsOfficer, setDetailsOfficer] = useState(null);
  const [resetTarget, setResetTarget]     = useState(null);
  const [editTarget, setEditTarget]       = useState(null);

  // Stats
  const total    = officers.length;
  const active   = officers.filter(o => o.status === "Active").length;
  const deactive = officers.filter(o => o.status === "Deactive").length;

  // Filter + paginate
  const filtered = officers.filter(o =>
    o.fullName.toLowerCase().includes(search.toLowerCase()) ||
    o.policeId.toLowerCase().includes(search.toLowerCase()) ||
    o.rank.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleApprove = (id) => setApprovals(approvals.filter(a => a.id !== id));
  const handleReject  = (id) => setApprovals(approvals.filter(a => a.id !== id));

  
 const handleToggleStatus = (officerId) => {
  // Your logic to toggle status
  // Example:
  setOfficers(prev => 
    prev.map(o => 
      o.id === officerId 
        ? { ...o, status: o.status === "Active" ? "Deactive" : "Active" }
        : o
    )
  );
};

  return (
    <LayoutComponent>
      <div className="um-page">

        {/* ── Header ── */}
        <div className="um-header">
          <div>
            <h1 className="um-title">Officer Management</h1>
            <p className="um-subtitle">
              {userRole === "OIC"
                ? "Manage officer approvals and view personnel records."
                : "Manage personnel records and system access levels."}
            </p>
          </div>
          {userRole === "IT Officer" && (
            <button className="um-register-btn" onClick={() => setShowRegister(true)}>
              <FiUserPlus size={15} style={{ marginRight: 6 }} /> Register Officer
            </button>
          )}
        </div>

        {/* ── Stat Cards ── */}
        <div className="um-stats">
          <div className="um-stat-card">
            <div>
              <p className="um-stat-label">TOTAL {userRole === "OIC" ? "PERSONNEL" : "OFFICERS"}</p>
              <p className="um-stat-value">{total}</p>
            </div>
            <div className="um-stat-icon" style={{ background: "#dbeafe", color: "#2563eb" }}>
              <FiUsers size={22} />
            </div>
          </div>
          <div className="um-stat-card">
            <div>
              <p className="um-stat-label">{userRole === "OIC" ? "ON DUTY ACTIVE" : "ACTIVE"}</p>
              <p className="um-stat-value" style={{ color: "#16a34a" }}>{active}</p>
            </div>
            <div className="um-stat-icon" style={{ background: "#dcfce7", color: "#16a34a" }}>
              <FiCheckCircle size={22} />
            </div>
          </div>
          {userRole === "OIC" ? (
            <>
              <div className="um-stat-card">
                <div>
                  <p className="um-stat-label">LEAVE / REST</p>
                  <p className="um-stat-value" style={{ color: "#f59e0b" }}>2</p>
                </div>
                <div className="um-stat-icon" style={{ background: "#fef3c7", color: "#b45309" }}>
                  <FiUsers size={22} />
                </div>
              </div>
              <div className="um-stat-card">
                <div>
                  <p className="um-stat-label">PENDING APPROVAL</p>
                  <p className="um-stat-value" style={{ color: "#ef4444" }}>{approvals.length}</p>
                </div>
                <div className="um-stat-icon" style={{ background: "#fee2e2", color: "#ef4444" }}>
                  <FiUsers size={22} />
                </div>
              </div>
            </>
          ) : (
            <div className="um-stat-card">
              <div>
                <p className="um-stat-label">DEACTIVE</p>
                <p className="um-stat-value" style={{ color: "#ef4444" }}>{deactive}</p>
              </div>
              <div className="um-stat-icon" style={{ background: "#fee2e2", color: "#ef4444" }}>
                <FiXCircle size={22} />
              </div>
            </div>
          )}
        </div>

        {/* ── OIC: New Officer Approvals ── */}
        {userRole === "OIC" && approvals.length > 0 && (
          <div className="um-section-card">
            <div className="um-section-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <FiUserPlus size={18} color="#1e3a5f" />
                <h3 className="um-section-title">New Officer Approvals</h3>
              </div>
              
            </div>
            <table className="um-table">
              <thead>
                <tr>
                  <th>OFFICER NAME</th>
                  <th>RANK & NO</th>
                  <th>REQUESTED ROLE</th>
                  <th>APPROVE / REJECT</th>
                </tr>
              </thead>
              <tbody>
                {approvals.map(a => (
                  <tr key={a.id} className="um-tr">
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="um-avatar">{a.avatar}</div>
                        <div>
                          <p className="um-officer-name">{a.fullName}</p>
                           
                        </div>
                      </div>
                    </td>
                    <td>
                      <p style={{ fontWeight: 600, fontSize: 13 }}>{a.rank}</p>
                      <p style={{ fontSize: 12, color: "#64748b" }}>#{a.policeId}</p>
                    </td>
                    <td><span className="um-role-badge">{a.requestedRole}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="um-approve-btn" onClick={() => handleApprove(a.id)} title="Approve">
                          <FiCheck size={14} />
                        </button>
                        <button className="um-reject-btn" onClick={() => handleReject(a.id)} title="Reject">
                          <FiX size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="um-view-all">View all {approvals.length} pending requests</p>
          </div>
        )}

        {/* ── Officer Registry / List ── */}
        <div className="um-section-card">
          <div className="um-section-header">
            <h3 className="um-section-title">
              {userRole === "OIC" ? "Officer Registry" : "Officer Directory"}
            </h3>
            <div style={{ display: "flex", gap: 8 }}>
              {userRole === "OIC" && (
                <>
                  <button className="um-icon-btn" title="Download"><FiDownload size={15} /></button>
                  <button className="um-icon-btn" title="Print"><FiPrinter size={15} /></button>
                </>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="um-search-row">
            <div className="um-search-wrap">
              <FiSearch size={15} color="#94a3b8" />
              <input
                className="um-search-input"
                placeholder="Search by name, rank no..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <button className="um-filter-btn"><FiFilter size={14} style={{ marginRight: 6 }} />Filters</button>
          </div>

          {/* Table */}
          <table className="um-table">
            <thead>
              <tr>
                <th>OFFICER NAME</th>
                <th>RANK & ID</th>
                {userRole === "OIC" && <th>ROLE</th>}
                <th>STATUS</th>
                 
              </tr>
            </thead>
            <tbody>
              {paginated.map(o => {
                const rc = rankColors[o.rank] || { bg: "#f1f5f9", color: "#374151" };
                return (
                  <tr key={o.id} className="um-tr">
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div className="um-avatar">{o.fullName.charAt(0)}</div>
                        <div>
                          <p className="um-officer-name">{o.fullName}</p>
                           
                        </div>
                      </div>
                    </td>
                    <td>
                      <p style={{ fontWeight: 700, fontSize: 13 }}>{o.policeId}</p>
                      <p style={{ fontSize: 12, color: "#64748b", fontStyle: "italic" }}>{o.rank}</p>
                    </td>
                    {userRole === "OIC" && (
                      <td><span className="um-role-badge">{o.role}</span></td>
                    )}
                   <td>
  <span 
    className={`um-status-badge ${o.status === "Active" ? "um-active" : "um-deactive"}`}
    onClick={() => handleToggleStatus(o.id)}
    style={{ cursor: "pointer" }}
  >
    {o.status}
  </span>
</td>
                     
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr><td colSpan={userRole === "OIC" ? 4 : 3} className="no-data">No officers found.</td></tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="um-pagination">
            <p className="um-pagination-info">
              Showing {Math.min((page-1)*PAGE_SIZE+1, filtered.length)} to {Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length} officers
            </p>
            <div className="um-page-btns">
              <button className="um-page-btn" disabled={page===1} onClick={() => setPage(p=>p-1)}>‹</button>
              {Array.from({length: totalPages}, (_,i) => (
                <button
                  key={i+1}
                  className={`um-page-btn ${page===i+1 ? "um-page-active" : ""}`}
                  onClick={() => setPage(i+1)}
                >
                  {i+1}
                </button>
              ))}
              <button className="um-page-btn" disabled={page===totalPages} onClick={() => setPage(p=>p+1)}>›</button>
            </div>
          </div>
        </div>
      </div>

      {/* ══ REGISTER MODAL (IT Officer only) ══ */}
      {showRegister && (
        <RegisterModal
          onClose={() => setShowRegister(false)}
          onSave={(officer) => {
            setOfficers([...officers, { id: Date.now(), ...officer, status: "Active" }]);
            setShowRegister(false);
          }}
        />
      )}

      {/* ══ OFFICER DETAILS MODAL (3 dots) ══ */}
      {detailsOfficer && (
        <DetailsModal
          officer={detailsOfficer}
          onClose={() => setDetailsOfficer(null)}
          onEdit={(o) => { setEditTarget(o); setDetailsOfficer(null); }}
        />
      )}

      {/* ══ EDIT MODAL ══ */}
      {editTarget && (
        <EditModal
          officer={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={(updated) => {
            setOfficers(officers.map(o => o.id === updated.id ? updated : o));
            setEditTarget(null);
          }}
        />
      )}

      {/* ══ RESET PASSWORD MODAL (IT Officer) ══ */}
      {resetTarget && (
        <ResetPwModal
          officer={resetTarget}
          onClose={() => setResetTarget(null)}
        />
      )}
    </LayoutComponent>
  );
}

// ─── Register Modal ─────────────────────────────────────────────
function RegisterModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    fullName: "", policeId: "", role: "", nic: "", contactNo: "",
    gender: "", dob: "", address: "", password: "", rank: "",
    email: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [error, setError]   = useState("");

  const roles = ["OIC","Traffic Officer","IT Officer","Inspector","Constable","Sergeant","Sub-Inspector"];
  const ranks = ["OIC","Inspector","Sub-Inspector","Sergeant","Constable"];

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = () => {
    if (!form.fullName || !form.policeId || !form.role || !form.nic || !form.contactNo || !form.gender || !form.dob || !form.password || !form.email) {
      setError("Please fill in all required fields."); return;
    }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setError("");
    onSave(form);
  };

  return (
    <div className="um-modal-overlay">
      <div className="um-modal">
        <div className="um-modal-header">
          <div>
            <h2 className="um-modal-title">Register New Officer</h2>
            <p className="um-modal-sub">Enter the details to create a new personnel account.</p>
          </div>
          <button className="um-modal-close" onClick={onClose}><FiX size={18} /></button>
        </div>

        <div className="um-modal-body">
          {/* Full Name */}
          <div className="um-field-full">
            <label className="um-field-label">FULL NAME *</label>
            <input className="um-field-input" name="fullName" placeholder="e.g. Kamal Rajapakshe" value={form.fullName} onChange={handleChange} />
          </div>

          <div className="um-field-row">
            <div className="um-field">
              <label className="um-field-label">RANK & OFFICER ID *</label>
              <input className="um-field-input" name="policeId" placeholder="e.g. PC 107272" value={form.policeId} onChange={handleChange} />
              <p className="um-field-hint">This will be the username for login.</p>
            </div>
            <div className="um-field">
              <label className="um-field-label">ROLE *</label>
              <select className="um-field-input" name="role" value={form.role} onChange={handleChange}>
                <option value="">Select Role...</option>
                {roles.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div className="um-field-row">
            <div className="um-field">
              <label className="um-field-label">NIC NUMBER *</label>
              <input className="um-field-input" name="nic" placeholder="e.g. 199012345678" value={form.nic} onChange={handleChange} />
            </div>
            <div className="um-field">
              <label className="um-field-label">CONTACT NO *</label>
              <input className="um-field-input" name="contactNo" placeholder="e.g. 077 123 4567" value={form.contactNo} onChange={handleChange} />
            </div>
          </div>

          <div className="um-field-row">
            <div className="um-field">
              <label className="um-field-label">EMAIL *</label>
              <input className="um-field-input" name="email" placeholder="officer@police.lk" type="email" value={form.email} onChange={handleChange} />
            </div>
            <div className="um-field">
              <label className="um-field-label">RANK</label>
              <select className="um-field-input" name="rank" value={form.rank} onChange={handleChange}>
                <option value="">Select Rank...</option>
                {ranks.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div className="um-field-row">
            <div className="um-field">
              <label className="um-field-label">GENDER *</label>
              <select className="um-field-input" name="gender" value={form.gender} onChange={handleChange}>
                <option value="">Select Gender...</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div className="um-field">
              <label className="um-field-label">DATE OF BIRTH *</label>
              <input className="um-field-input" name="dob" type="date" value={form.dob} onChange={handleChange} />
            </div>
          </div>

          {/* Address */}
          <div className="um-field-full">
            <label className="um-field-label">RESIDENTIAL ADDRESS</label>
            <textarea className="um-field-input um-textarea" name="address" placeholder="Enter full address..." value={form.address} onChange={handleChange} rows={2} />
          </div>

          {/* Password */}
          <div className="um-field-full">
            <label className="um-field-label">SET PASSWORD *</label>
            <div className="um-pw-wrap">
              <input
                className="um-field-input"
                name="password"
                type={showPw ? "text" : "password"}
                placeholder="Minimum 6 characters"
                value={form.password}
                onChange={handleChange}
                style={{ paddingRight: 40 }}
              />
              <button type="button" className="um-pw-eye" onClick={() => setShowPw(!showPw)}>
                {showPw ? <FiEyeOff size={15} /> : <FiEye size={15} />}
              </button>
            </div>
          </div>

          {error && <p className="um-error">{error}</p>}
        </div>

        <div className="um-modal-footer">
          <button className="um-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="um-submit-btn" onClick={handleSubmit}>Register Officer</button>
        </div>
      </div>
    </div>
  );
}

// ─── Officer Details Modal ───────────────────────────────────────
function DetailsModal({ officer, onClose, onEdit }) {
  return (
    <div className="um-modal-overlay">
      <div className="um-modal um-details-modal">
        <div className="um-details-header">
          <div>
            <h2 className="um-modal-title" style={{ color: "white" }}>Officer Details</h2>
            <p style={{ color: "#94a3b8", fontSize: 12 }}>Personnel Record ID: PMS-2023-{officer.policeId.replace(/\s/g,"")}</p>
          </div>
          <button className="um-modal-close" style={{ color: "white" }} onClick={onClose}><FiX size={18} /></button>
        </div>

        <div className="um-details-body">
          <div className="um-details-grid">
            <div>
              <p className="um-details-label">FULL NAME</p>
              <p className="um-details-value">{officer.fullName}</p>
            </div>
            <div className="um-details-rank-box">
              <p className="um-details-label">RANK & OFFICER ID</p>
              <p className="um-details-value" style={{ fontSize: 16 }}>{officer.policeId}</p>
              <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{officer.rank} ({officer.role})</p>
            </div>
            <div>
              <p className="um-details-label">NIC NUMBER</p>
              <p className="um-details-value">{officer.nic}</p>
            </div>
            <div>
              <p className="um-details-label">CONTACT NO</p>
              <p className="um-details-value">📞 {officer.contactNo}</p>
            </div>
            <div>
              <p className="um-details-label">DATE OF BIRTH</p>
              <p className="um-details-value">{officer.dob}</p>
            </div>
            <div>
              <p className="um-details-label">GENDER</p>
              <p className="um-details-value">{officer.gender}</p>
            </div>
          </div>
          {officer.address && (
            <div style={{ marginTop: 16 }}>
              <p className="um-details-label">RESIDENTIAL ADDRESS</p>
              <p className="um-details-value">📍 {officer.address}</p>
            </div>
          )}
        </div>

        <div className="um-modal-footer">
          <button className="um-cancel-btn" onClick={onClose}>Close</button>
          <button className="um-submit-btn" onClick={() => onEdit(officer)}>✏ Edit Details</button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Modal ──────────────────────────────────────────────────
function EditModal({ officer, onClose, onSave }) {
  const [form, setForm] = useState({ ...officer });
  const [error, setError] = useState("");

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = () => {
    if (!form.fullName || !form.policeId || !form.email) { setError("Please fill required fields."); return; }
    onSave(form);
  };

  return (
    <div className="um-modal-overlay">
      <div className="um-modal">
        <div className="um-modal-header">
          <div>
            <h2 className="um-modal-title">Edit Officer Details</h2>
            <p className="um-modal-sub">Update personnel record for {officer.fullName}</p>
          </div>
          <button className="um-modal-close" onClick={onClose}><FiX size={18} /></button>
        </div>
        <div className="um-modal-body">
          <div className="um-field-full">
            <label className="um-field-label">FULL NAME *</label>
            <input className="um-field-input" name="fullName" value={form.fullName} onChange={handleChange} />
          </div>
          <div className="um-field-row">
            <div className="um-field">
              <label className="um-field-label">RANK & OFFICER ID *</label>
              <input className="um-field-input" name="policeId" value={form.policeId} onChange={handleChange} />
            </div>
            <div className="um-field">
              <label className="um-field-label">ROLE</label>
              <input className="um-field-input" name="role" value={form.role} onChange={handleChange} />
            </div>
          </div>
          <div className="um-field-row">
            <div className="um-field">
              <label className="um-field-label">EMAIL *</label>
              <input className="um-field-input" name="email" type="email" value={form.email} onChange={handleChange} />
            </div>
            <div className="um-field">
              <label className="um-field-label">CONTACT NO</label>
              <input className="um-field-input" name="contactNo" value={form.contactNo} onChange={handleChange} />
            </div>
          </div>
          <div className="um-field-row">
            <div className="um-field">
              <label className="um-field-label">NIC</label>
              <input className="um-field-input" name="nic" value={form.nic} onChange={handleChange} />
            </div>
            <div className="um-field">
              <label className="um-field-label">STATUS</label>
              <select className="um-field-input" name="status" value={form.status} onChange={handleChange}>
                <option>Active</option>
                <option>Deactive</option>
              </select>
            </div>
          </div>
          <div className="um-field-full">
            <label className="um-field-label">RESIDENTIAL ADDRESS</label>
            <textarea className="um-field-input um-textarea" name="address" value={form.address} onChange={handleChange} rows={2} />
          </div>
          {error && <p className="um-error">{error}</p>}
        </div>
        <div className="um-modal-footer">
          <button className="um-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="um-submit-btn" onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

// ─── Reset Password Modal ────────────────────────────────────────
function ResetPwModal({ officer, onClose }) {
  const [newPw, setNewPw]   = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError]   = useState("");
  const [done, setDone]     = useState(false);

  const handleSet = () => {
    if (!newPw) { setError("Please enter a temporary password."); return; }
    if (newPw.length < 6) { setError("Password must be at least 6 characters."); return; }
    setError("");
    setDone(true);
    setTimeout(() => { onClose(); }, 1200);
  };

  return (
    <div className="um-modal-overlay">
      <div className="um-modal" style={{ maxWidth: 420 }}>
        <div className="um-modal-header">
          <h2 className="um-modal-title">Reset Password for {officer.policeId}</h2>
          <button className="um-modal-close" onClick={onClose}><FiX size={18} /></button>
        </div>
        <div className="um-modal-body">
          {done ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#16a34a" }}>
              <FiCheckCircle size={40} />
              <p style={{ marginTop: 10, fontWeight: 600 }}>Password reset successfully!</p>
            </div>
          ) : (
            <>
              <div className="um-field-full">
                <label className="um-field-label">NEW PASSWORD</label>
                <div className="um-pw-wrap">
                  <input
                    className="um-field-input"
                    type={showPw ? "text" : "password"}
                    placeholder="Enter temporary password"
                    value={newPw}
                    onChange={e => { setNewPw(e.target.value); setError(""); }}
                    style={{ paddingRight: 40 }}
                  />
                  <button type="button" className="um-pw-eye" onClick={() => setShowPw(!showPw)}>
                    {showPw ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                  </button>
                </div>
                <p className="um-field-hint">Password must be at least 6 characters with a mix of alphanumeric symbols.</p>
              </div>
              {error && <p className="um-error">{error}</p>}
            </>
          )}
        </div>
        {!done && (
          <div className="um-modal-footer">
            <button className="um-cancel-btn" onClick={onClose}>Cancel</button>
            <button className="um-submit-btn" onClick={handleSet}>Set New Password</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserManagement;