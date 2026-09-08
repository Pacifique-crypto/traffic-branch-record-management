import React, { useState, useEffect } from "react";
import OICLayout from "../layouts/OICLayout";
import {
  FiClock, FiSearch, FiCheck, FiX, FiPaperclip,
  FiAlertCircle, FiCheckCircle, FiXCircle, FiCalendar, FiFileText
} from "react-icons/fi";
import { getOfficerLeaves, updateOfficerLeave } from "../api";

const INITIAL_MOCK_LEAVES = [
  {
    id: "mock-1",
    officerName: "Nadeesha Fernando",
    initials: "NF",
    avatarBg: "#fee2e2",
    avatarColor: "#dc2626",
    rank: "Constable",
    policeId: "OFF-nfernando",
    leaveType: "Medical Leave",
    badgeBg: "#fee2e2",
    badgeColor: "#dc2626",
    startDate: "2026-09-10",
    endDate: "2026-09-12",
    duration: "3 days",
    requestedAgo: "3 hours ago",
    reason: "Diagnosed with viral fever, doctor has advised 3 days of rest before returning to field duty.",
    hasCertificate: true,
    strength: "6 of 8 officers on duty",
    lowStrength: false,
    balance: "Medical balance: 10 of 14 days left",
    status: "Pending"
  },
  {
    id: "mock-2",
    officerName: "Ruwan Jayasuriya",
    initials: "RJ",
    avatarBg: "#e0f2fe",
    avatarColor: "#0284c7",
    rank: "Sergeant",
    policeId: "OFF-rjayasuriya",
    leaveType: "Casual Leave",
    badgeBg: "#e0f2fe",
    badgeColor: "#0284c7",
    startDate: "2026-09-09",
    endDate: "2026-09-09",
    duration: "1 day",
    requestedAgo: "5 hours ago",
    reason: "Attending a family function in Kurunegala.",
    hasCertificate: false,
    strength: "7 of 8 officers on duty",
    lowStrength: false,
    balance: "Casual balance: 2 of 7 days left",
    status: "Pending"
  },
  {
    id: "mock-3",
    officerName: "Chamara Bandara",
    initials: "CB",
    avatarBg: "#f3e8ff",
    avatarColor: "#7c3aed",
    rank: "Constable",
    policeId: "OFF-cbandara",
    leaveType: "Personal Leave",
    badgeBg: "#f3e8ff",
    badgeColor: "#7c3aed",
    startDate: "2026-09-14",
    endDate: "2026-09-16",
    duration: "3 days",
    requestedAgo: "1 day ago",
    reason: "Relocating to a new residence, need time to arrange logistics.",
    hasCertificate: false,
    strength: "5 of 8 officers on duty",
    lowStrength: true,
    balance: "Personal balance: 8 of 10 days left",
    status: "Pending"
  },
  {
    id: "mock-4",
    officerName: "Priyanka Wickramasinghe",
    initials: "PW",
    avatarBg: "#f3e8ff",
    avatarColor: "#7c3aed",
    rank: "Woman Constable",
    policeId: "OFF-pwickramasinghe",
    leaveType: "Casual Leave",
    badgeBg: "#e0f2fe",
    badgeColor: "#0284c7",
    startDate: "2026-09-11",
    endDate: "2026-09-11",
    duration: "1 day",
    requestedAgo: "1 day ago",
    reason: "Personal errand, needs to visit the divisional secretariat office.",
    hasCertificate: false,
    strength: "7 of 8 officers on duty",
    lowStrength: false,
    balance: "Casual balance: 4 of 7 days left",
    status: "Pending"
  },
  {
    id: "mock-5",
    officerName: "Dilshan Rathnayake",
    initials: "DR",
    avatarBg: "#fee2e2",
    avatarColor: "#dc2626",
    rank: "Constable",
    policeId: "OFF-drathnayake",
    leaveType: "Medical Leave",
    badgeBg: "#fee2e2",
    badgeColor: "#dc2626",
    startDate: "2026-09-08",
    endDate: "2026-09-09",
    duration: "2 days",
    requestedAgo: "2 days ago",
    reason: "Recovering from a minor road accident sustained while off duty.",
    hasCertificate: true,
    strength: "6 of 8 officers on duty",
    lowStrength: false,
    balance: "Medical balance: 12 of 14 days left",
    status: "Pending"
  },
  {
    id: "mock-6",
    officerName: "Kavinda Silva",
    initials: "KS",
    avatarBg: "#dcfce7",
    avatarColor: "#16a34a",
    rank: "Sub-Inspector",
    policeId: "OFF-ksilva",
    leaveType: "Annual Leave",
    badgeBg: "#dcfce7",
    badgeColor: "#16a34a",
    startDate: "2026-09-01",
    endDate: "2026-09-05",
    duration: "5 days",
    requestedAgo: "1 week ago",
    reason: "Annual family vacation to Nuwara Eliya.",
    hasCertificate: false,
    strength: "7 of 8 officers on duty",
    lowStrength: false,
    balance: "Annual balance: 5 of 14 days left",
    status: "Approved"
  },
  {
    id: "mock-7",
    officerName: "Kamal Gunaratne",
    initials: "KG",
    avatarBg: "#fee2e2",
    avatarColor: "#dc2626",
    rank: "Sergeant",
    policeId: "OFF-kgunaratne",
    leaveType: "Casual Leave",
    badgeBg: "#e0f2fe",
    badgeColor: "#0284c7",
    startDate: "2026-09-07",
    endDate: "2026-09-07",
    duration: "1 day",
    requestedAgo: "3 days ago",
    reason: "Attending a private event without prior roster notification.",
    hasCertificate: false,
    strength: "5 of 8 officers on duty",
    lowStrength: true,
    balance: "Casual balance: 6 of 7 days left",
    status: "Rejected"
  }
];

function LeaveManagement() {
  const [leaves, setLeaves]               = useState(INITIAL_MOCK_LEAVES);
  const [activeTab, setActiveTab]         = useState("Pending");
  const [searchQuery, setSearchQuery]     = useState("");
  const [selectedCert, setSelectedCert]   = useState(null);
  const [rejectingItem, setRejectingItem] = useState(null);
  const [rejectReason, setRejectReason]   = useState("");
  const [loading, setLoading]             = useState(false);

  useEffect(() => {
    const fetchDBLeaves = async () => {
      try {
        setLoading(true);
        const res = await getOfficerLeaves();
        if (Array.isArray(res) && res.length > 0) {
          const dbMapped = res.map(l => {
            const officerName = l.officer?.fullName || l.officerName || "Traffic Officer";
            const init = officerName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "OF";
            const start = l.startDate ? new Date(l.startDate).toISOString().split("T")[0] : "2026-09-10";
            const end = l.endDate ? new Date(l.endDate).toISOString().split("T")[0] : start;
            
            let lType = l.leaveType || "Casual Leave";
            if (!lType.toLowerCase().includes("leave")) lType += " Leave";

            let bBg = "#e0f2fe";
            let bColor = "#0284c7";
            if (lType.toLowerCase().includes("medical")) { bBg = "#fee2e2"; bColor = "#dc2626"; }
            else if (lType.toLowerCase().includes("personal")) { bBg = "#f3e8ff"; bColor = "#7c3aed"; }
            else if (lType.toLowerCase().includes("annual")) { bBg = "#dcfce7"; bColor = "#16a34a"; }

            return {
              id: l._id || l.id,
              isFromDB: true,
              officerName: officerName,
              initials: init,
              avatarBg: bBg,
              avatarColor: bColor,
              rank: l.officer?.rank || "Constable",
              policeId: l.officer?.policeId || l.officer?.username || "OFF-001",
              leaveType: lType,
              badgeBg: bBg,
              badgeColor: bColor,
              startDate: start,
              endDate: end,
              duration: start === end ? "1 day" : "Multiple days",
              requestedAgo: "Recently",
              reason: l.remarks || "Officer leave request submitted.",
              hasCertificate: lType.toLowerCase().includes("medical"),
              strength: "6 of 8 officers on duty",
              lowStrength: false,
              balance: "Balance: Available",
              status: l.status || "Pending"
            };
          });

          // Merge DB leaves with mock leaves ensuring no duplicates
          const combined = [...dbMapped, ...INITIAL_MOCK_LEAVES.filter(m => !dbMapped.some(d => d.id === m.id))];
          setLeaves(combined);
        }
      } catch (err) {
        console.error("Failed to load leaves from API:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDBLeaves();
  }, []);

  const handleApprove = async (leaveItem) => {
    try {
      if (leaveItem.isFromDB) {
        await updateOfficerLeave(leaveItem.id, { status: "Approved" });
      }
      setLeaves(prev => prev.map(l => l.id === leaveItem.id ? { ...l, status: "Approved" } : l));
      alert(`Leave request approved for ${leaveItem.officerName}.`);
    } catch (err) {
      console.error(err);
      alert("Error approving leave request.");
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingItem) return;
    try {
      if (rejectingItem.isFromDB) {
        await updateOfficerLeave(rejectingItem.id, { status: "Rejected", rejectionRemarks: rejectReason });
      }
      setLeaves(prev => prev.map(l => l.id === rejectingItem.id ? { ...l, status: "Rejected" } : l));
      alert(`Leave request rejected for ${rejectingItem.officerName}.`);
      setRejectingItem(null);
      setRejectReason("");
    } catch (err) {
      console.error(err);
      alert("Error rejecting leave request.");
    }
  };

  // Filtered lists
  const pendingCount  = leaves.filter(l => l.status === "Pending").length;
  const approvedCount = leaves.filter(l => l.status === "Approved").length;
  const rejectedCount = leaves.filter(l => l.status === "Rejected").length;
  const allCount      = leaves.length;

  const filteredLeaves = leaves.filter(l => {
    const matchesTab = activeTab === "All" || l.status === activeTab;
    const matchesSearch =
      l.officerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.policeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.rank.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.leaveType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.reason.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <OICLayout>
      <div className="lm-container">
        
        {/* HEADER ROW */}
        <div className="lm-header-row">
          <div>
            <h1 className="lm-title">Leave Management</h1>
            <p className="lm-subtitle">Review and approve officer leave requests</p>
          </div>

          {/* Pending Review Badge */}
          <div className="lm-review-badge">
            <FiClock size={16} color="#d97706" />
            <span>{pendingCount} pending your review</span>
          </div>
        </div>

        {/* CONTROLS ROW: TABS + SEARCH */}
        <div className="lm-controls-row">
          
          {/* Filter Tabs */}
          <div className="lm-tabs-wrap">
            <button
              className={`lm-tab-btn ${activeTab === "Pending" ? "lm-tab-active" : ""}`}
              onClick={() => setActiveTab("Pending")}
            >
              Pending ({pendingCount})
            </button>
            <button
              className={`lm-tab-btn ${activeTab === "Approved" ? "lm-tab-active" : ""}`}
              onClick={() => setActiveTab("Approved")}
            >
              Approved ({approvedCount})
            </button>
            <button
              className={`lm-tab-btn ${activeTab === "Rejected" ? "lm-tab-active" : ""}`}
              onClick={() => setActiveTab("Rejected")}
            >
              Rejected ({rejectedCount})
            </button>
            <button
              className={`lm-tab-btn ${activeTab === "All" ? "lm-tab-active" : ""}`}
              onClick={() => setActiveTab("All")}
            >
              All ({allCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="lm-search-wrap">
            <FiSearch size={15} color="#94a3b8" className="lm-search-icon" />
            <input
              className="lm-search-input"
              type="text"
              placeholder="Search officer..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

        </div>

        {/* CARDS GRID */}
        <div className="lm-grid">
          {filteredLeaves.map(item => (
            <div key={item.id} className="lm-card">
              
              {/* CARD TOP HEADER */}
              <div className="lm-card-top">
                <div className="lm-officer-info">
                  <div
                    className="lm-avatar"
                    style={{ backgroundColor: item.avatarBg, color: item.avatarColor }}
                  >
                    {item.initials}
                  </div>
                  <div>
                    <h3 className="lm-officer-name">{item.officerName}</h3>
                    <p className="lm-officer-sub">
                      {item.rank} · <span className="lm-police-id">{item.policeId}</span>
                    </p>
                  </div>
                </div>

                {/* Leave Type Badge */}
                <span
                  className="lm-type-badge"
                  style={{ backgroundColor: item.badgeBg, color: item.badgeColor }}
                >
                  {item.leaveType}
                </span>
              </div>

              {/* DATE & META ROW */}
              <div className="lm-date-row">
                <FiCalendar size={14} color="#64748b" />
                <span className="lm-date-text">
                  {item.startDate === item.endDate ? item.startDate : `${item.startDate} to ${item.endDate}`}
                </span>
                <span className="lm-dot">•</span>
                <span className="lm-meta-text">{item.duration}</span>
                <span className="lm-dot">•</span>
                <span className="lm-meta-text">{item.requestedAgo}</span>
              </div>

              {/* REASON BOX */}
              <div className="lm-reason-box">
                <p className="lm-reason-text">{item.reason}</p>
                {item.hasCertificate && (
                  <button
                    className="lm-cert-btn"
                    onClick={() => setSelectedCert(item)}
                  >
                    <FiPaperclip size={13} style={{ marginRight: 5 }} />
                    View medical certificate
                  </button>
                )}
              </div>

              {/* CARD FOOTER / ACTIONS */}
              <div className="lm-card-footer">
                
                {/* Left Metadata */}
                <div className="lm-footer-left">
                  <div className="lm-strength-row">
                    <span className="lm-footer-label">Strength: </span>
                    <span className="lm-strength-val">{item.strength}</span>
                    {item.lowStrength && (
                      <span className="lm-low-strength-badge">Low strength</span>
                    )}
                  </div>
                  <div className="lm-balance-text">{item.balance}</div>
                </div>

                {/* Right Actions / Status */}
                <div className="lm-footer-right">
                  {item.status === "Pending" ? (
                    <>
                      <button
                        className="lm-reject-btn"
                        onClick={() => {
                          setRejectingItem(item);
                          setRejectReason("");
                        }}
                      >
                        <FiX size={14} style={{ marginRight: 4 }} /> Reject
                      </button>
                      <button
                        className="lm-approve-btn"
                        onClick={() => handleApprove(item)}
                      >
                        <FiCheck size={14} style={{ marginRight: 4 }} /> Approve
                      </button>
                    </>
                  ) : item.status === "Approved" ? (
                    <span className="lm-status-approved">
                      <FiCheckCircle size={15} style={{ marginRight: 4 }} /> Approved
                    </span>
                  ) : (
                    <span className="lm-status-rejected">
                      <FiXCircle size={15} style={{ marginRight: 4 }} /> Rejected
                    </span>
                  )}
                </div>

              </div>

            </div>
          ))}

          {filteredLeaves.length === 0 && (
            <div className="lm-empty-box">
              <FiFileText size={36} color="#94a3b8" />
              <p className="lm-empty-title">No leave requests found</p>
              <p className="lm-empty-sub">There are no leave requests matching your search or filter criteria.</p>
            </div>
          )}
        </div>

      </div>

      {/* MEDICAL CERTIFICATE PREVIEW MODAL */}
      {selectedCert && (
        <div className="lm-modal-overlay" onClick={() => setSelectedCert(null)}>
          <div className="lm-modal" onClick={e => e.stopPropagation()}>
            <div className="lm-modal-header">
              <h3>Medical Certificate - {selectedCert.officerName}</h3>
              <button className="lm-modal-close" onClick={() => setSelectedCert(null)}>
                <FiX size={18} />
              </button>
            </div>
            <div className="lm-modal-body">
              <div className="lm-cert-preview-card">
                <div className="lm-cert-badge">OFFICIAL MEDICAL CERTIFICATE</div>
                <h4 style={{ margin: "10px 0 4px", fontSize: 16, color: "#0f172a" }}>Government Hospital - Negombo</h4>
                <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Medical Officer: Dr. S. Wickramasinghe (MBBS)</p>
                <hr style={{ margin: "14px 0", border: "none", borderTop: "1px solid #e2e8f0" }} />
                <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.6 }}>
                  This is to certify that Traffic Officer <strong>{selectedCert.officerName}</strong> ({selectedCert.policeId}) has been examined on {selectedCert.startDate} and recommended for medical leave for a period of {selectedCert.duration} due to acute illness.
                </p>
                <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#64748b" }}>Date Issued: {selectedCert.startDate}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#16a34a" }}>✓ Verified Medical Stamp</span>
                </div>
              </div>
            </div>
            <div className="lm-modal-footer">
              <button className="lm-btn-close" onClick={() => setSelectedCert(null)}>Close Preview</button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT CONFIRMATION MODAL */}
      {rejectingItem && (
        <div className="lm-modal-overlay" onClick={() => setRejectingItem(null)}>
          <div className="lm-modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="lm-modal-header">
              <h3>Reject Leave Request</h3>
              <button className="lm-modal-close" onClick={() => setRejectingItem(null)}>
                <FiX size={18} />
              </button>
            </div>
            <div className="lm-modal-body">
              <p style={{ fontSize: 14, color: "#334155", margin: "0 0 12px 0" }}>
                Reject leave request for <strong>{rejectingItem.officerName}</strong> ({rejectingItem.leaveType})?
              </p>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>
                REJECTION REMARKS (OPTIONAL)
              </label>
              <textarea
                style={{
                  width: "100%",
                  height: 80,
                  padding: "10px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                  outline: "none"
                }}
                placeholder="Reason for rejecting leave request..."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
              />
            </div>
            <div className="lm-modal-footer">
              <button className="lm-btn-cancel" onClick={() => setRejectingItem(null)}>Cancel</button>
              <button className="lm-btn-confirm-reject" onClick={handleConfirmReject}>Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}

      {/* INLINE CSS STYLES FOR EXACT UI MATCH */}
      <style>{`
        .lm-container {
          padding: 28px 32px;
          max-width: 1320px;
          margin: 0 auto;
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background-color: #f8fafc;
          min-height: 100vh;
        }

        .lm-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .lm-title {
          margin: 0;
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.5px;
        }

        .lm-subtitle {
          margin: 4px 0 0 0;
          font-size: 14px;
          color: #64748b;
        }

        .lm-review-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: #fffbeb;
          border: 1px solid #fde68a;
          color: #b45309;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 700;
          box-shadow: 0 1px 2px rgba(0,0,0,0.03);
        }

        .lm-controls-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          gap: 16px;
        }

        .lm-tabs-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
          background-color: #f1f5f9;
          padding: 4px;
          border-radius: 12px;
        }

        .lm-tab-btn {
          border: none;
          background: transparent;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .lm-tab-active {
          background-color: #ffffff;
          color: #0f172a;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          font-weight: 700;
        }

        .lm-search-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .lm-search-icon {
          position: absolute;
          left: 14px;
        }

        .lm-search-input {
          width: 260px;
          padding: 9px 16px 9px 38px;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          background-color: #ffffff;
          font-size: 13px;
          color: #1e293b;
          outline: none;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
          transition: border-color 0.15s ease;
        }

        .lm-search-input:focus {
          border-color: #2563eb;
        }

        /* GRID */
        .lm-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 22px;
        }

        @media (max-width: 1024px) {
          .lm-grid {
            grid-template-columns: 1fr;
          }
        }

        /* CARD STYLING */
        .lm-card {
          background-color: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          padding: 22px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
          display: flex;
          flex-direction: column;
          gap: 14px;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .lm-card:hover {
          box-shadow: 0 6px 16px rgba(0,0,0,0.06);
        }

        .lm-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .lm-officer-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .lm-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 14px;
          letter-spacing: 0.5px;
        }

        .lm-officer-name {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
        }

        .lm-officer-sub {
          margin: 2px 0 0 0;
          font-size: 12px;
          color: #64748b;
        }

        .lm-police-id {
          font-weight: 600;
          color: #94a3b8;
        }

        .lm-type-badge {
          padding: 5px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.2px;
        }

        .lm-date-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #64748b;
        }

        .lm-date-text {
          font-weight: 600;
          color: #334155;
        }

        .lm-dot {
          color: #cbd5e1;
        }

        .lm-meta-text {
          font-size: 12px;
          color: #64748b;
        }

        .lm-reason-box {
          background-color: #f8fafc;
          border: 1px solid #f1f5f9;
          border-radius: 10px;
          padding: 12px 16px;
        }

        .lm-reason-text {
          margin: 0;
          font-size: 13px;
          line-height: 1.5;
          color: #334155;
        }

        .lm-cert-btn {
          margin-top: 8px;
          border: none;
          background: transparent;
          color: #2563eb;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          padding: 0;
        }

        .lm-cert-btn:hover {
          text-decoration: underline;
        }

        .lm-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 4px;
          padding-top: 10px;
        }

        .lm-footer-left {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .lm-strength-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
        }

        .lm-footer-label {
          color: #64748b;
        }

        .lm-strength-val {
          font-weight: 700;
          color: #1e293b;
        }

        .lm-low-strength-badge {
          background-color: #fef3c7;
          color: #b45309;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 6px;
        }

        .lm-balance-text {
          font-size: 12px;
          color: #64748b;
        }

        .lm-footer-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .lm-reject-btn {
          background-color: #ffffff;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: background-color 0.15s ease;
        }

        .lm-reject-btn:hover {
          background-color: #fee2e2;
        }

        .lm-approve-btn {
          background-color: #059669;
          border: none;
          color: #ffffff;
          padding: 8px 20px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: background-color 0.15s ease;
          box-shadow: 0 1px 2px rgba(5, 150, 105, 0.2);
        }

        .lm-approve-btn:hover {
          background-color: #047857;
        }

        .lm-status-approved {
          color: #059669;
          font-weight: 700;
          font-size: 13px;
          display: flex;
          align-items: center;
          background-color: #dcfce7;
          padding: 6px 14px;
          border-radius: 8px;
        }

        .lm-status-rejected {
          color: #dc2626;
          font-weight: 700;
          font-size: 13px;
          display: flex;
          align-items: center;
          background-color: #fee2e2;
          padding: 6px 14px;
          border-radius: 8px;
        }

        .lm-empty-box {
          grid-column: span 2;
          background: #ffffff;
          border-radius: 16px;
          padding: 48px;
          text-align: center;
          border: 1px solid #e2e8f0;
        }

        .lm-empty-title {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin: 12px 0 4px 0;
        }

        .lm-empty-sub {
          font-size: 13px;
          color: #64748b;
          margin: 0;
        }

        /* MODAL STYLES */
        .lm-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: rgba(15, 23, 42, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999;
          padding: 20px;
        }

        .lm-modal {
          background: #ffffff;
          border-radius: 16px;
          width: 100%;
          max-width: 520px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .lm-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 24px;
          border-bottom: 1px solid #e2e8f0;
        }

        .lm-modal-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
        }

        .lm-modal-close {
          border: none;
          background: transparent;
          color: #64748b;
          cursor: pointer;
        }

        .lm-modal-body {
          padding: 20px 24px;
        }

        .lm-modal-footer {
          padding: 16px 24px;
          background-color: #f8fafc;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .lm-cert-preview-card {
          background-color: #f8fafc;
          border: 2px dashed #cbd5e1;
          padding: 20px;
          border-radius: 12px;
        }

        .lm-cert-badge {
          display: inline-block;
          background-color: #dbeafe;
          color: #1d4ed8;
          font-size: 11px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 6px;
          letter-spacing: 0.5px;
        }

        .lm-btn-close {
          background: #334155;
          color: #fff;
          border: none;
          padding: 8px 18px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
        }

        .lm-btn-cancel {
          background: #fff;
          border: 1px solid #cbd5e1;
          color: #475569;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
        }

        .lm-btn-confirm-reject {
          background: #dc2626;
          border: none;
          color: #fff;
          padding: 8px 18px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
        }
      `}</style>

    </OICLayout>
  );
}

export default LeaveManagement;
