import React, { useState } from "react";
import Layout from "../components/Layout";

const allRecords = [
  {
    sn: "001", dlNo: "B1234567", dlReceived: "26/04/01",
    ownerName: "Kasun Perera",   offence: "Speeding",
    offenceDate: "26/03/30", detectingOfficer: "P.C. Silva",
    returnDate: "26/04/05", torArCaseNo: "TOR/1023", remarks: "Fine paid",
  },
  {
    sn: "002", dlNo: "B7654321", dlReceived: "26/04/02",
    ownerName: "Nadeesha Fernando", offence: "No Driving License",
    offenceDate: "26/04/10", detectingOfficer: "Sgt. Jayasinghe",
    returnDate: "26/04/06", torArCaseNo: "AR/2045", remarks: "Court pending",
  },
  {
    sn: "003", dlNo: "B1122334", dlReceived: "26/04/03",
    ownerName: "Chamara Silva",  offence: "Signal Violation",
    offenceDate: "26/04/30", detectingOfficer: "P.C. Silva",
    returnDate: "26/04/07", torArCaseNo: "TOR/3056", remarks: "Warning issued",
  },
  {
    sn: "004", dlNo: "C2233445", dlReceived: "26/04/04",
    ownerName: "Amara Peris",    offence: "Speeding",
    offenceDate: "26/04/12", detectingOfficer: "Sgt. Perera",
    returnDate: "26/04/08", torArCaseNo: "TOR/1100", remarks: "Fine paid",
  },
  {
    sn: "005", dlNo: "C3344556", dlReceived: "26/04/05",
    ownerName: "Ruwan Bandara",  offence: "No Seat Belt",
    offenceDate: "26/04/15", detectingOfficer: "P.C. Fernando",
    returnDate: "26/04/09", torArCaseNo: "TOR/1200", remarks: "Fine paid",
  },
  {
    sn: "006", dlNo: "D4455667", dlReceived: "26/04/06",
    ownerName: "Nimal Jayantha", offence: "Drunk Driving",
    offenceDate: "26/04/18", detectingOfficer: "Sgt. Silva",
    returnDate: "26/04/10", torArCaseNo: "AR/3001", remarks: "Court pending",
  },
];

const PAGE_SIZE = 5;

function DLR() {
  const [search, setSearch] = useState("");
  const [page, setPage]     = useState(1);

  const filtered = allRecords.filter((r) =>
    r.dlNo.toLowerCase().includes(search.toLowerCase()) ||
    r.ownerName.toLowerCase().includes(search.toLowerCase()) ||
    r.offence.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Layout>
      <div className="page-box">
        <h2 className="page-heading">Driving License Register</h2>

        {/* Toolbar */}
        <div className="air-toolbar">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              placeholder="Search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select className="filter-select">
            <option>All Severity</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>

        {/* Table */}
        <div className="table-scroll">
          <table className="data-table dlr-table">
            <thead>
              <tr>
                <th>S/N</th>
                <th>DL No</th>
                <th>DL Received</th>
                <th>Owner Name</th>
                <th>Offence</th>
                <th>Offence Date</th>
                <th>Detecting Officer</th>
                <th>Return Date</th>
                <th>TOR/AR Case No.</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((r) => (
                <tr key={r.sn} className="table-row">
                  <td>{r.sn}</td>
                  <td>{r.dlNo}</td>
                  <td>{r.dlReceived}</td>
                  <td>{r.ownerName}</td>
                  <td>{r.offence}</td>
                  <td>{r.offenceDate}</td>
                  <td>{r.detectingOfficer}</td>
                  <td>{r.returnDate}</td>
                  <td>{r.torArCaseNo}</td>
                  <td>
                    <span className={`remarks-badge ${r.remarks === "Fine paid" ? "badge-green" : r.remarks === "Court pending" ? "badge-orange" : "badge-blue"}`}>
                      {r.remarks}
                    </span>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={10} className="no-data">No records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination">
          <button className="page-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span className="page-info">{page} / {totalPages || 1}</span>
          <button className="page-btn" disabled={page === totalPages || totalPages === 0} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      </div>
    </Layout>
  );
}

export default DLR;