import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import OICLayout from "../layouts/OICLayout";
 
import { getAccidents } from "../api";

const allAccidents = [
  { id: "ACD-1020", date: "2023-04-02", location: "Main Street",  type: "Collision", severity: "High",   office: "Negombo" },
  { id: "ACD-1023", date: "2023-04-02", location: "Main Street",  type: "Side",      severity: "Medium", office: "Negombo" },
  { id: "ACD-1051", date: "2023-04-02", location: "Main Street",  type: "Collision", severity: "High",   office: "Negombo" },
  { id: "ACD-1024", date: "2023-04-03", location: "Colombo Road", type: "Collision", severity: "High",   office: "Negombo" },
  { id: "ACD-1141", date: "2023-04-02", location: "Main Street",  type: "Collision", severity: "High",   office: "Negombo" },
  { id: "ACD-1123", date: "2023-04-02", location: "Main Street",  type: "Hit & Run", severity: "Low",    office: "Negombo" },
];

const PAGE_SIZE = 5;

const severityColor = (s) => {
  if (s === "High")   return "#ef4444";
  if (s === "Medium") return "#f59e0b";
  return "#22c55e";
};

function Accidents() {
  const navigate = useNavigate();
  const [search, setSearch]             = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [page, setPage]                 = useState(1);

  const filtered = allAccidents.filter((a) => {
    const matchSearch =
      a.id.toLowerCase().includes(search.toLowerCase()) ||
      a.location.toLowerCase().includes(search.toLowerCase());
    const matchSeverity = severityFilter === "All" || a.severity === severityFilter;
    return matchSearch && matchSeverity;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <OICLayout>
      <div className="page-box">
        <h2 className="page-heading">Accident Information Register</h2>

        <div className="air-toolbar">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              placeholder="Search by ID, Location"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="filter-select"
            value={severityFilter}
            onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
          >
            <option value="All">All Severity</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Accident ID</th>
              <th>Date</th>
              <th>Location</th>
              <th>Type</th>
              <th>Severity</th>
              <th>Reporting Office</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((a) => (
              <tr
                key={a.id}
                className="table-row"
                onClick={() => navigate(`/accidents/${a.id}`)}
                style={{ cursor: "pointer" }}
              >
                <td>{a.id}</td>
                <td>{a.date}</td>
                <td>{a.location}</td>
                <td>{a.type}</td>
                <td>
                  <span className="severity-badge"
                    style={{ background: severityColor(a.severity) }}>
                    {a.severity}
                  </span>
                </td>
                <td>{a.office}</td>
                <td className="action-dots">⋮</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination">
          <button className="page-btn" disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span className="page-info">{page} / {totalPages || 1}</span>
          <button className="page-btn" disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </div>
    </OICLayout>
  );
}

export default Accidents;