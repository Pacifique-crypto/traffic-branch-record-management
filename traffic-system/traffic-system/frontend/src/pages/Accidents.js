import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { getAccidents } from "../api";

const PAGE_SIZE = 5;

function Accidents() {
  const navigate = useNavigate();

  const [accidents, setAccidents] = useState([]);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadAccidents();
  }, []);

  const loadAccidents = async () => {
    try {
      const data = await getAccidents();
      setAccidents(data);
    } catch (err) {
      console.error("Failed to load accidents:", err);
    }
  };

  const filtered = accidents.filter((a) => {
    const matchSearch =
      (a.driver || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.location || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.vehicle || "").toLowerCase().includes(search.toLowerCase());

    const matchSeverity =
      severityFilter === "All" || a.severity === severityFilter;

    return matchSearch && matchSeverity;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const paginated = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const severityColor = (severity) => {
    switch (severity) {
      case "Fatal":
        return "#dc2626";
      case "Serious":
        return "#ea580c";
      case "Minor":
        return "#16a34a";
      case "Property":
        return "#2563eb";
      default:
        return "#6b7280";
    }
  };

  return (
    <Layout>
      <div className="page-box">

        <h2 className="page-heading">
          Accident Information Register
        </h2>

        {/* Toolbar */}

        <div className="air-toolbar">

          <div className="search-wrap">

            <span className="search-icon">🔍</span>

            <input
              className="search-input"
              placeholder="Search Driver, Location or Vehicle"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />

          </div>

          <select
            className="filter-select"
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="All">All Severity</option>
            <option value="Fatal">Fatal</option>
            <option value="Serious">Serious</option>
            <option value="Minor">Minor</option>
            <option value="Property">Property</option>
          </select>

        </div>

        {/* Accident Table */}

        <table className="data-table">

          <thead>

            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Driver</th>
              <th>Location</th>
              <th>Vehicle</th>
              <th>Severity</th>
              <th>Status</th>
              <th></th>
            </tr>

          </thead>

          <tbody>

            {paginated.length > 0 ? (

              paginated.map((a) => (

                <tr
                  key={a._id}
                  className="table-row"
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/accidents/${a._id}`)}
                >

                  <td>{a._id.slice(-6).toUpperCase()}</td>

                  <td>{a.accidentDate}</td>

                  <td>{a.driver}</td>

                  <td>{a.location}</td>

                  <td>{a.vehicle}</td>

                  <td>

                    <span
                      className="severity-badge"
                      style={{
                        background: severityColor(a.severity),
                        color: "#fff",
                        padding: "5px 10px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      {a.severity}
                    </span>

                  </td>

                  <td>{a.status}</td>

                  <td className="action-dots">⋮</td>

                </tr>

              ))

            ) : (

              <tr>
                <td
                  colSpan="8"
                  style={{
                    textAlign: "center",
                    padding: "20px",
                  }}
                >
                  No accidents found
                </td>
              </tr>

            )}

          </tbody>

        </table>

        {/* Pagination */}

        <div className="pagination">

          <button
            className="page-btn"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>

          <span className="page-info">
            {page} / {totalPages || 1}
          </span>

          <button
            className="page-btn"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>

        </div>

      </div>
    </Layout>
  );
}

export default Accidents;