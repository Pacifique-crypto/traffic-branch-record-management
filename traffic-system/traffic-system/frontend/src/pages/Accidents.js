import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiFilter, FiPlus, FiMoreVertical, FiCheckCircle } from "react-icons/fi";
import { getAccidents, createAccident, updateAccident } from "../api";

const severityColors = {
  FATAL:    { bg: "#fee2e2", color: "#dc2626" },
  SERIOUS:  { bg: "#fef3c7", color: "#b45309" },
  MINOR:    { bg: "#dbeafe", color: "#2563eb" },
  PROPERTY: { bg: "#f3e8ff", color: "#7c3aed" },
};


const PAGE_SIZE = 5;

function Accidents() {
  const navigate   = useNavigate();
  const userRole   = localStorage.getItem("userRole") || "IT Officer";
  const isOIC      = userRole === "OIC";

  let Layout;
  if (isOIC) Layout = require("../layouts/OICLayout").default;
  else        Layout = require("../layouts/ITLayout").default;

  const [accidents, setAccidents] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [severity, setSeverity]   = useState("All");
  const [dateRange] = useState("Last 7 Days");
  const [station, setStation]     = useState("All Stations");
  const [page, setPage]           = useState(1);
  const [showNew, setShowNew]     = useState(false);

  useEffect(() => {
    fetchAccidents();
  }, []);

  const fetchAccidents = async () => {
    try {
      const data = await getAccidents();
      if (Array.isArray(data)) {
        setAccidents(data);
      } else {
        console.error("Expected array from getAccidents but got:", data);
        setAccidents([]);
      }
    } catch (err) {
      console.error("Failed to load accidents:", err);
      setAccidents([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = Array.isArray(accidents) ? accidents.filter(a => {
    const matchSearch = (a.id || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.location || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.officer || "").toLowerCase().includes(search.toLowerCase());
    const matchSev = severity === "All" || a.severity === severity;
    return matchSearch && matchSev;
  }) : [];

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const handleVerify = async (id) => {
    try {
      const accident = accidents.find(a => a.id === id);
      if (!accident) return;
      const newVerified = !accident.verified;
      
      const res = await updateAccident(id, { status: newVerified ? "Completed" : "Pending" });
      if (res && !res.error) {
        setAccidents(accidents.map(a => a.id === id ? { ...a, verified: newVerified, status: newVerified ? "Completed" : "Pending" } : a));
      } else {
        alert(res.error || "Failed to update verification status.");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to server.");
    }
  };

  return (
    <Layout>
      <div className="ar-page">
        {/* Header */}
        <div className="ar-header">
          <div>
            <h1 className="ar-title">Accident Register</h1>
            <p className="ar-sub">Real-time log of traffic incidents across the Negombo Division.</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {!isOIC && (
              <button className="ar-new-btn" onClick={() => setShowNew(true)}>
                <FiPlus size={15} style={{ marginRight: 6 }} /> New Entry
              </button>
            )}
            <button className="ar-filter-btn">
              <FiFilter size={14} style={{ marginRight: 6 }} /> Filter
            </button>
          </div>
        </div>

        {/* Filters row */}
        <div className="ar-filters">
          <div className="ar-search-wrap">
            <FiSearch size={14} color="#94a3b8" />
            <input
              className="ar-search-input"
              placeholder="Search by Ref No, Location, or Officer"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select className="ar-select" value={station} onChange={e => setStation(e.target.value)}>
            <option>All Stations</option>
            <option>Negombo HQ</option>
            <option>Katunayake</option>
            <option>Kochchikade</option>
          </select>
          <select className="ar-select" value={severity} onChange={e => { setSeverity(e.target.value); setPage(1); }}>
            <option value="All">All Severity</option>
            <option>FATAL</option>
            <option>SERIOUS</option>
            <option>MINOR</option>
            <option>PROPERTY</option>
          </select>
          <button className="ar-date-btn">📅 Date Range: {dateRange}</button>
        </div>

        {/* Table */}
        <div className="ar-table-wrap">
          <table className="ar-table">
            <thead>
              <tr>
                <th>REF. NO</th>
                <th>DATE & TIME</th>
                <th>STATION</th>
                <th>LOCATION</th>
                <th>INQUIRING OFFICER</th>
                <th>SEVERITY</th>
                <th>TYPE</th>
                <th>ACTIONS</th>
                {isOIC && <th>VERIFY</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isOIC ? 9 : 8} className="no-data" style={{ textAlign: "center", padding: "20px" }}>
                    Loading accidents...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={isOIC ? 9 : 8} className="no-data" style={{ textAlign: "center", padding: "20px" }}>
                    No accidents found.
                  </td>
                </tr>
              ) : (
                paginated.map(a => {
                  const sc = severityColors[a.severity] || { bg: "#f1f5f9", color: "#374151" };
                  const dateStr = a.accidentDate || "";
                  const [datePart, timePart] = dateStr.includes("T") ? dateStr.split("T") : dateStr.split(" ");
                  return (
                    <tr key={a.id} className="ar-tr" onClick={() => navigate(`/accidents/${a.id}`)}>
                      <td className="ar-ref">{a.id.startsWith("ACD-") ? a.id : a.id.slice(-6).toUpperCase()}</td>
                      <td className="ar-datetime">
                        <span>{datePart}</span><br/>
                        <span style={{ color: "#94a3b8", fontSize: 12 }}>{timePart ? timePart.slice(0, 5) : ""}</span>
                      </td>
                      <td>{a.station}</td>
                      <td>{a.location}</td>
                      <td>{a.assistantOfficer || a.officer || "Unknown"}</td>
                      <td>
                        <span className="ar-severity-badge" style={{ background: sc.bg, color: sc.color }}>
                          {a.severity}
                        </span>
                      </td>
                      <td>{a.description ? a.description.replace("Type: ", "") : a.type || "Collision"}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <button className="ar-dots-btn"><FiMoreVertical size={16} /></button>
                      </td>
                      {isOIC && (
                        <td onClick={e => e.stopPropagation()}>
                          <button
                            className={`ar-verify-btn ${a.verified || a.status === "Completed" ? "ar-verified" : ""}`}
                            onClick={() => handleVerify(a.id)}
                            title={a.verified || a.status === "Completed" ? "Verified" : "Click to verify"}
                          >
                            <FiCheckCircle size={18} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="ar-pagination">
          <p className="ar-page-info">
            Showing {Math.min((page-1)*PAGE_SIZE+1, filtered.length)}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length} incidents
          </p>
          <div className="ar-page-btns">
            <button className="ar-page-btn" disabled={page===1} onClick={() => setPage(p=>p-1)}>‹</button>
            {Array.from({length: Math.min(totalPages,3)}, (_,i) => (
              <button key={i+1} className={`ar-page-btn ${page===i+1?"ar-page-active":""}`} onClick={() => setPage(i+1)}>{i+1}</button>
            ))}
            {totalPages > 3 && <span className="ar-page-ellipsis">...</span>}
            {totalPages > 3 && (
              <button className={`ar-page-btn ${page===totalPages?"ar-page-active":""}`} onClick={() => setPage(totalPages)}>{totalPages}</button>
            )}
            <button className="ar-page-btn" disabled={page===totalPages} onClick={() => setPage(p=>p+1)}>›</button>
          </div>
        </div>
      </div>

      {/* New Entry Modal */}
      {showNew && (
        <NewAccidentModal
          onClose={() => setShowNew(false)}
          onSave={async (a) => {
            try {
              const res = await createAccident({
                accidentDate: `${a.date} ${a.time || "00:00"}`,
                station: a.station,
                location: a.location,
                severity: a.severity,
                assistantOfficer: a.officer || "",
                description: `Type: ${a.type}`,
              });
              if (res && !res.error) {
                fetchAccidents();
                setShowNew(false);
              } else {
                alert(res.error || "Failed to create accident");
              }
            } catch (err) {
              console.error(err);
              alert("Error connecting to server.");
            }
          }}
        />
      )}
    </Layout>
  );
}

// New Accident Modal (IT Officer)
function NewAccidentModal({ onClose, onSave }) {
  const [form, setForm] = useState({ station: "", location: "", officer: "", severity: "", type: "", date: "", time: "" });
  const [error, setError] = useState("");
  const { FiX } = require("react-icons/fi");

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = () => {
    if (!form.station || !form.location || !form.severity || !form.type || !form.date) {
      setError("Please fill all required fields."); return;
    }
    const newId = `ACD-${1025 + Math.floor(Math.random() * 100)}`;
    onSave({ id: newId, ...form, verified: false });
  };

  return (
    <div className="um-modal-overlay">
      <div className="um-modal">
        <div className="um-modal-header">
          <div><h2 className="um-modal-title">New Accident Entry</h2><p className="um-modal-sub">Create a new accident record</p></div>
          <button className="um-modal-close" onClick={onClose}><FiX size={18} /></button>
        </div>
        <div className="um-modal-body">
          <div className="um-field-row">
            <div className="um-field"><label className="um-field-label">DATE *</label><input className="um-field-input" name="date" type="date" value={form.date} onChange={handle} /></div>
            <div className="um-field"><label className="um-field-label">TIME *</label><input className="um-field-input" name="time" type="time" value={form.time} onChange={handle} /></div>
          </div>
          <div className="um-field-row">
            <div className="um-field"><label className="um-field-label">STATION *</label><input className="um-field-input" name="station" placeholder="e.g. Negombo HQ" value={form.station} onChange={handle} /></div>
            <div className="um-field"><label className="um-field-label">LOCATION *</label><input className="um-field-input" name="location" placeholder="e.g. Colombo Road" value={form.location} onChange={handle} /></div>
          </div>
          <div className="um-field-row">
            <div className="um-field"><label className="um-field-label">SEVERITY *</label>
              <select className="um-field-input" name="severity" value={form.severity} onChange={handle}>
                <option value="">Select...</option>
                <option>FATAL</option><option>SERIOUS</option><option>MINOR</option><option>PROPERTY</option>
              </select>
            </div>
            <div className="um-field"><label className="um-field-label">TYPE *</label><input className="um-field-input" name="type" placeholder="e.g. Head-on Collision" value={form.type} onChange={handle} /></div>
          </div>
          <div className="um-field-full"><label className="um-field-label">INQUIRING OFFICER</label><input className="um-field-input" name="officer" placeholder="Officer name & ID" value={form.officer} onChange={handle} /></div>
          {error && <p className="um-error">{error}</p>}
        </div>
        <div className="um-modal-footer">
          <button className="um-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="um-submit-btn" onClick={submit}>Save Entry</button>
        </div>
      </div>
    </div>
  );
}

export default Accidents;