import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { getViolations } from "../api";

const PAGE_SIZE = 5;

const statusColor = (status) => {
  if (status === "Pending") return "#f59e0b";
  if (status === "Paid") return "#22c55e";
  return "#94a3b8";
};

function Violations() {

  const navigate = useNavigate();

  const [violations, setViolations] = useState([]);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");

  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);

  useEffect(() => {

    loadViolations();

  }, []);

  const loadViolations = async () => {

    try {

      const data = await getViolations();

      setViolations(data);

    } catch (err) {

      console.log(err);

    } finally {

      setLoading(false);

    }

  };

  const filtered = violations.filter((v) => {

    const id =
      v._id?.toLowerCase() || "";

    const location =
      v.location?.toLowerCase() || "";

    const matchSearch =
      id.includes(search.toLowerCase()) ||
      location.includes(search.toLowerCase());

    const matchStatus =
      statusFilter === "All" ||
      v.status === statusFilter;

    return matchSearch && matchStatus;

  });

  const totalPages = Math.ceil(
    filtered.length / PAGE_SIZE
  );

  const paginated = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  if (loading) {

    return (

      <Layout>

        <div className="page-box">

          <h2>
            Loading violations...
          </h2>

        </div>

      </Layout>

    );

  }
  return (
  <Layout>

    <div className="page-box">

      <h2 className="page-heading">
        Traffic Offence Register (TOR)
      </h2>

      {/* Toolbar */}

      <div className="air-toolbar">

        <div className="search-wrap">

          <span className="search-icon">
            🔍
          </span>

          <input
            className="search-input"
            placeholder="Search by ID or Location"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />

        </div>

        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >

          <option value="All">
            All Status
          </option>

          <option value="Pending">
            Pending
          </option>

          <option value="Paid">
            Paid
          </option>

        </select>

      </div>

      {/* Table */}

      <table className="data-table">

        <thead>

          <tr>

            <th>Violation ID</th>
            <th>Date</th>
            <th>Location</th>
            <th>Violation</th>
            <th>Status</th>
            <th>Fine (Rs.)</th>
            <th></th>

          </tr>

        </thead>

        <tbody>

          {paginated.map((v) => (

            <tr
              key={v._id}
              className="table-row"
              onClick={() => navigate(`/tor/${v._id}`)}
              style={{ cursor: "pointer" }}
            >

              <td>
                {v._id.slice(-6).toUpperCase()}
              </td>

              <td>
                {v.violationDate}
              </td>

              <td>
                {v.location}
              </td>

              <td>
                {v.violationType}
              </td>

              <td>

                <span
                  className="severity-badge"
                  style={{
                    background: statusColor(v.status),
                  }}
                >
                  {v.status}
                </span>

              </td>

              <td>
                Rs. {v.fineAmount}
              </td>

              <td className="action-dots">
                ⋮
              </td>

            </tr>

          ))}

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

export default Violations;