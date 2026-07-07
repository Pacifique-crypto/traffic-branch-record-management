import React, { useState } from "react";
import Layout from "../components/Layout";

const allRecords = [
  {
    sn: "001", driverName: "Kasun Perera",  vehNo: "WP CAB 1234",
    offence: "Speeding",      offenceDate: "26/04/01", dlNo: "B1234567",
    fineNo: "SF1001",         issuedDate: "26/04/01",  g172RecNo: "G172-5551",
    paymentDate: "26/04/03",  torNo: "TOR01",          expiryDate: "26/04/15",
    caseNo: "C1023",          result: "Fine Paid",      remarks: "Closed",
  },
  {
    sn: "002", driverName: "Nadeesha Fernando", vehNo: "WP KA 5678",
    offence: "Signal Jump",   offenceDate: "26/04/02", dlNo: "B7654321",
    fineNo: "SF1002",         issuedDate: "26/04/02",  g172RecNo: "G172-5552",
    paymentDate: "—",         torNo: "TOR02",          expiryDate: "26/04/16",
    caseNo: "C1024",          result: "Pending",        remarks: "Open",
  },
  {
    sn: "003", driverName: "Chamara Silva",  vehNo: "SB CD 9012",
    offence: "No Seat Belt",  offenceDate: "26/04/03", dlNo: "B1122334",
    fineNo: "SF1003",         issuedDate: "26/04/03",  g172RecNo: "G172-5553",
    paymentDate: "26/04/05",  torNo: "TOR03",          expiryDate: "26/04/17",
    caseNo: "C1025",          result: "Fine Paid",      remarks: "Closed",
  },
  {
    sn: "004", driverName: "Amara Peris",   vehNo: "NB EF 3456",
    offence: "Drunk Driving", offenceDate: "26/04/04", dlNo: "C2233445",
    fineNo: "SF1004",         issuedDate: "26/04/04",  g172RecNo: "G172-5554",
    paymentDate: "—",         torNo: "AR04",           expiryDate: "26/04/18",
    caseNo: "C1026",          result: "Court",          remarks: "Pending",
  },
  {
    sn: "005", driverName: "Ruwan Bandara", vehNo: "CP GH 7890",
    offence: "Overloading",   offenceDate: "26/04/05", dlNo: "C3344556",
    fineNo: "SF1005",         issuedDate: "26/04/05",  g172RecNo: "G172-5555",
    paymentDate: "26/04/07",  torNo: "TOR05",          expiryDate: "26/04/19",
    caseNo: "C1027",          result: "Fine Paid",      remarks: "Closed",
  },
  {
    sn: "006", driverName: "Nimal Jayantha", vehNo: "WP IJ 2345",
    offence: "Speeding",      offenceDate: "26/04/06", dlNo: "D4455667",
    fineNo: "SF1006",         issuedDate: "26/04/06",  g172RecNo: "G172-5556",
    paymentDate: "—",         torNo: "TOR06",          expiryDate: "26/04/20",
    caseNo: "C1028",          result: "Pending",        remarks: "Open",
  },
];

const PAGE_SIZE = 5;

const resultColor = (r) => {
  if (r === "Fine Paid") return "badge-green";
  if (r === "Court")     return "badge-orange";
  return "badge-yellow";
};

function SFR() {
  const [search, setSearch] = useState("");
  const [page, setPage]     = useState(1);

  const filtered = allRecords.filter((r) =>
    r.driverName.toLowerCase().includes(search.toLowerCase()) ||
    r.vehNo.toLowerCase().includes(search.toLowerCase()) ||
    r.offence.toLowerCase().includes(search.toLowerCase()) ||
    r.fineNo.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Layout>
      <div className="page-box">
        <h2 className="page-heading">Spot Fine Register</h2>

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
          <table className="data-table sfr-table">
            <thead>
              <tr>
                <th>S/N</th>
                <th>Driver Name</th>
                <th>Veh. No</th>
                <th>Offence</th>
                <th>Offence Date</th>
                <th>DL No</th>
                <th>Fine No</th>
                <th>Issued Date</th>
                <th>G172 Rec. No</th>
                <th>Payment Date</th>
                <th>TOR No</th>
                <th>Expiry Date</th>
                <th>Case No</th>
                <th>Result</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((r) => (
                <tr key={r.sn} className="table-row">
                  <td>{r.sn}</td>
                  <td>{r.driverName}</td>
                  <td>{r.vehNo}</td>
                  <td>{r.offence}</td>
                  <td>{r.offenceDate}</td>
                  <td>{r.dlNo}</td>
                  <td>{r.fineNo}</td>
                  <td>{r.issuedDate}</td>
                  <td>{r.g172RecNo}</td>
                  <td>{r.paymentDate}</td>
                  <td>{r.torNo}</td>
                  <td>{r.expiryDate}</td>
                  <td>{r.caseNo}</td>
                  <td>
                    <span className={`remarks-badge ${resultColor(r.result)}`}>
                      {r.result}
                    </span>
                  </td>
                  <td>
                    <span className={`remarks-badge ${r.remarks === "Closed" ? "badge-green" : "badge-yellow"}`}>
                      {r.remarks}
                    </span>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={15} className="no-data">No records found.</td></tr>
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

export default SFR;