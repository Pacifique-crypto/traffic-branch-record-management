import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiMoreVertical, FiCheckCircle, FiFilter } from "react-icons/fi";

const actionColors = {
  "Court Referral":       { bg: "#fee2e2", color: "#dc2626" },
  "Spot Fine Issued":     { bg: "#fef3c7", color: "#b45309" },
  "Vehicle Impounded":    { bg: "#dbeafe", color: "#2563eb" },
  "Warning Issued":       { bg: "#dcfce7", color: "#16a34a" },
};

const initialViolations = [
  { id: "TR-2023-8842", date: "24 Oct", time: "09:15 AM", offence: "Driving Under Influence",  lawSection: "RTA Sec 151(1)", action: "Court Referral",    place: "Galle Road, Colombo 03",    officer: "Sgt. Perera (4429)",      verified: false },
  { id: "TR-2023-8841", date: "24 Oct", time: "08:40 AM", offence: "Exceeding Speed Limit",    lawSection: "RTA Sec 148",    action: "Spot Fine Issued",  place: "Marine Drive, Wellawatte",  officer: "Cpl. Silva (8831)",        verified: false },
  { id: "TR-2023-8840", date: "23 Oct", time: "11:55 PM", offence: "No Valid License",          lawSection: "RTA Sec 123",    action: "Vehicle Impounded", place: "Town Hall, Colombo 07",     officer: "Insp. Fernando (1022)",    verified: true  },
  { id: "TR-2023-8839", date: "23 Oct", time: "18:20 PM", offence: "Dangerous Overtaking",     lawSection: "RTA Sec 148",    action: "Spot Fine Issued",  place: "Baseline Road, Dematagoda", officer: "Sgt. Jayasinghe (5512)",   verified: false },
  { id: "TR-2023-8838", date: "23 Oct", time: "14:10 PM", offence: "Obstructing Traffic",      lawSection: "RTA Sec 155",    action: "Warning Issued",    place: "Liberty Plaza Junct.",      officer: "Cpl. Wickramasuriya (9902)", verified: false },
];

const PAGE_SIZE = 5;

function Violations() {
  const navigate  = useNavigate();
  const userRole  = localStorage.getItem("userRole") || "IT Officer";
  const isOIC     = userRole === "OIC";

  let Layout;
  if (isOIC) Layout = require("../layouts/OICLayout").default;
  else        Layout = require("../layouts/ITLayout").default;

  const [violations, setViolations] = useState(initialViolations);
  const [search, setSearch]         = useState("");
  const [action, setAction]         = useState("All Type");
  const [page, setPage]             = useState(1);

  const filtered = violations.filter(v =>
    v.id.toLowerCase().includes(search.toLowerCase()) ||
    v.offence.toLowerCase().includes(search.toLowerCase()) ||
    v.officer.toLowerCase().includes(search.toLowerCase())
  ).filter(v => action === "All Type" || v.action === action);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const handleVerify = (id) => {
    setViolations(violations.map(v => v.id === id ? { ...v, verified: !v.verified } : v));
  };

  return (
    <Layout>
      <div className="ar-page">
        <div className="ar-header">
          <div>
            <h1 className="ar-title">Traffic Offence Register</h1>
            <p className="ar-sub">Centralized record of all detected violations and regulatory actions taken.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="ar-filters">
          <div className="ar-search-wrap">
            <FiSearch size={14} color="#94a3b8" />
            <input
              className="ar-search-input"
              placeholder="Search by Ref No, Name or Officer"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select className="ar-select" value={action} onChange={e => { setAction(e.target.value); setPage(1); }}>
            <option>All Type</option>
            <option>Court Referral</option>
            <option>Spot Fine Issued</option>
            <option>Vehicle Impounded</option>
            <option>Warning Issued</option>
          </select>
          <button className="ar-date-btn">📅 Oct 01, 2023 – Oct 24, 2023</button>
          <button className="ar-filter-icon-btn"><FiFilter size={15} /></button>
        </div>

        {/* Table */}
        <div className="ar-table-wrap">
          <table className="ar-table">
            <thead>
              <tr>
                <th>REF NO</th>
                <th>DATE & TIME</th>
                <th>NAME OF OFFENCE</th>
                <th>LAW SECTION</th>
                <th>ACTION TAKEN</th>
                <th>PLACE</th>
                <th>OFFICERS DETECTING</th>
                <th>ACTIONS</th>
                {isOIC && <th>VERIFY</th>}
              </tr>
            </thead>
            <tbody>
              {paginated.map(v => {
                const ac = actionColors[v.action] || { bg: "#f1f5f9", color: "#374151" };
                return (
                  <tr key={v.id} className="ar-tr" onClick={() => navigate(`/tor/${v.id}`)}>
                    <td className="ar-ref">{v.id}</td>
                    <td className="ar-datetime">
                      <span>{v.date}</span><br/>
                      <span style={{ color: "#94a3b8", fontSize: 12 }}>{v.time}</span>
                    </td>
                    <td>{v.offence}</td>
                    <td><span className="ar-law-section">{v.lawSection}</span></td>
                    <td>
                      <span className="ar-action-badge" style={{ background: ac.bg, color: ac.color }}>
                        {v.action}
                      </span>
                    </td>
                    <td>{v.place}</td>
                    <td>{v.officer}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <button className="ar-dots-btn"><FiMoreVertical size={16} /></button>
                    </td>
                    {isOIC && (
                      <td onClick={e => e.stopPropagation()}>
                        <button
                          className={`ar-verify-btn ${v.verified ? "ar-verified" : ""}`}
                          onClick={() => handleVerify(v.id)}
                        >
                          <FiCheckCircle size={18} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div> 

        <div className="ar-pagination">
          <p className="ar-page-info">Showing {Math.min((page-1)*PAGE_SIZE+1, filtered.length)}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length} entries</p>
          <div className="ar-page-btns">
            <button className="ar-page-btn" disabled={page===1} onClick={() => setPage(p=>p-1)}>‹</button>
            {[1,2,3].map(n => <button key={n} className={`ar-page-btn ${page===n?"ar-page-active":""}`} onClick={() => setPage(n)}>{n}</button>)}
            <button className="ar-page-btn" disabled={page===totalPages} onClick={() => setPage(p=>p+1)}>›</button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Violations;