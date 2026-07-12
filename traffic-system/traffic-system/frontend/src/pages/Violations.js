import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import OICLayout from "../layouts/OICLayout";
 

const allViolations = [
  { id: "VID-1020", date: "2023-04-02", location: "Main Street",   type: "Speeding",       status: "Pending",  office: "Negombo" },
  { id: "VID-1021", date: "2023-04-02", location: "Chilaw Road",   type: "Signal Jump",    status: "Paid",     office: "Negombo" },
  { id: "VID-1022", date: "2023-04-02", location: "Galle Road",    type: "Drunk Driving",  status: "Pending",  office: "Negombo" },
  { id: "VID-1023", date: "2023-04-03", location: "Colombo Road",  type: "Speeding",       status: "Paid",     office: "Negombo" },
  { id: "VID-1024", date: "2023-04-03", location: "Negombo Town",  type: "No Seat Belt",   status: "Pending",  office: "Negombo" },
  { id: "VID-1025", date: "2023-04-04", location: "Kandy Road",    type: "Signal Jump",    status: "Pending",  office: "Negombo" },
  { id: "VID-1026", date: "2023-04-04", location: "Main Street",   type: "Overloading",    status: "Paid",     office: "Negombo" },
  { id: "VID-1027", date: "2023-04-05", location: "Puttalam Road", type: "Drunk Driving",  status: "Pending",  office: "Negombo" },
];

const PAGE_SIZE = 5;

const statusColor = (s) => {
  if (s === "Pending") return "#f59e0b";
  if (s === "Paid")    return "#22c55e";
  return "#94a3b8";
};

function Violations() {
  const navigate = useNavigate();
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage]             = useState(1);

  const filtered = allViolations.filter((v) => {
    const matchSearch =
      v.id.toLowerCase().includes(search.toLowerCase()) ||
      v.location.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <OICLayout>
      <div className="page-box">
        <h2 className="page-heading">Traffic Offence Register (TOR)</h2>

        {/* Toolbar */}
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
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
          </select>
        </div>

        {/* Table */}
        <table className="data-table">
          <thead>
            <tr>
              <th>Violation ID</th>
              <th>Date</th>
              <th>Location</th>
              <th>Type</th>
              <th>Status</th>
              <th>Reporting Office</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((v) => (
              <tr
                key={v.id}
                className="table-row"
                onClick={() => navigate(`/tor/${v.id}`)}
                style={{ cursor: "pointer" }}
              >
                <td>{v.id}</td>
                <td>{v.date}</td>
                <td>{v.location}</td>
                <td>{v.type}</td>
                <td>
                  <span className="severity-badge" style={{ background: statusColor(v.status) }}>
                    {v.status}
                  </span>
                </td>
                <td>{v.office}</td>
                <td className="action-dots">⋮</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="pagination">
          <button
            className="page-btn"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span className="page-info">{page} / {totalPages}</span>
          <button
            className="page-btn"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </OICLayout>
  );
}

export default Violations;