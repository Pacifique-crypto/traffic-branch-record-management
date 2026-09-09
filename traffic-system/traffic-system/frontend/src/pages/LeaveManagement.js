import React, { useState, useEffect } from "react";
import OICLayout from "../layouts/OICLayout";
import {
  FiClock, FiSearch, FiCheck, FiX, FiPaperclip,
  FiCheckCircle, FiXCircle, FiCalendar, FiFileText,
  FiUsers, FiBarChart2, FiUser, FiChevronDown, FiChevronUp,
  FiPhone, FiMapPin, FiAlertTriangle
} from "react-icons/fi";
import { getOfficerLeaves, updateOfficerLeave } from "../api";

const INITIAL_LEAVES_DATA = [
  {
    id: "leave-1",
    leaveCode: "LV-1042",
    officerName: "Nadeesha Fernando",
    initials: "NF",
    policeId: "PC 0067",
    rank: "Constable",
    leaveType: "Medical Leave",
    dateRange: "Sep 10 – Sep 12",
    durationMeta: "3 days · 3 hours ago",
    reason: "Diagnosed with viral fever, doctor has advised 3 days of rest before returning to field duty.",
    actingOfficer: "PC 0071 - S. Kumara",
    hasCertificate: true,
    dutyStrength: "6 of 8 officers on duty that day (from roster)",
    leaveBalance: "Medical balance: 10 of 14 days left",
    overlapWarning: "Overlaps with Priyanka Wickramasinghe (also pending)",
    appliedDate: "Sep 7, 2026",
    lastLeaveDate: "Jul 12, 2026",
    contactNo: "071 234 5678",
    duringLeaveAddress: "No. 24, Kandy Road, Negombo",
    status: "Pending"
  },
  {
    id: "leave-2",
    leaveCode: "LV-1043",
    officerName: "Ruwan Jayasuriya",
    initials: "RJ",
    policeId: "PS 0042",
    rank: "Sergeant",
    leaveType: "Casual Leave",
    dateRange: "Sep 09 – Sep 09",
    durationMeta: "1 day · 5 hours ago",
    reason: "Attending a family function in Kurunegala.",
    actingOfficer: "PC 0084 - W. Perera",
    hasCertificate: false,
    dutyStrength: "7 of 8 officers on duty that day (from roster)",
    leaveBalance: "Casual balance: 2 of 7 days left",
    overlapWarning: null,
    appliedDate: "Sep 8, 2026",
    lastLeaveDate: "Aug 03, 2026",
    contactNo: "077 891 2345",
    duringLeaveAddress: "No. 15, Main Street, Kurunegala",
    status: "Pending"
  },
  {
    id: "leave-3",
    officerName: "Chamara Bandara",
    initials: "CB",
    policeId: "PC 0098",
    rank: "Constable",
    leaveType: "Personal Leave",
    dateRange: "Sep 14 – Sep 16",
    durationMeta: "3 days · 1 day ago",
    reason: "Relocating to a new residence, need time to arrange logistics.",
    actingOfficer: "PC 0055 - M. Bandara",
    hasCertificate: false,
    dutyStrength: "5 of 8 officers on duty that day (from roster)",
    lowStrength: true,
    leaveBalance: "Personal balance: 8 of 10 days left",
    overlapWarning: "Overlaps with Dilshan Rathnayake (also pending)",
    appliedDate: "Sep 6, 2026",
    lastLeaveDate: "Jun 20, 2026",
    contactNo: "076 432 1098",
    duringLeaveAddress: "No. 88, Galle Road, Negombo",
    status: "Pending"
  },
  {
    id: "leave-4",
    officerName: "Priyanka Wickramasinghe",
    initials: "PW",
    policeId: "WPC 0089",
    rank: "Woman Constable",
    leaveType: "Casual Leave",
    dateRange: "Sep 11 – Sep 11",
    durationMeta: "1 day · 1 day ago",
    reason: "Personal errand, needs to visit the divisional secretariat office.",
    actingOfficer: "WPC 0092 - K. Jayawardena",
    hasCertificate: false,
    dutyStrength: "7 of 8 officers on duty that day (from roster)",
    leaveBalance: "Casual balance: 4 of 7 days left",
    overlapWarning: "Overlaps with Nadeesha Fernando (also pending)",
    appliedDate: "Sep 7, 2026",
    lastLeaveDate: "May 14, 2026",
    contactNo: "072 987 6543",
    duringLeaveAddress: "No. 102, Beach Road, Negombo",
    status: "Pending"
  },
  {
    id: "leave-5",
    officerName: "Dilshan Rathnayake",
    initials: "DR",
    policeId: "PC 0033",
    rank: "Constable",
    leaveType: "Medical Leave",
    dateRange: "Sep 08 – Sep 09",
    durationMeta: "2 days · 2 days ago",
    reason: "Recovering from a minor road accident sustained while off duty.",
    actingOfficer: "PC 0041 - A. Fernando",
    hasCertificate: true,
    dutyStrength: "6 of 8 officers on duty that day (from roster)",
    leaveBalance: "Medical balance: 12 of 14 days left",
    overlapWarning: null,
    appliedDate: "Sep 5, 2026",
    lastLeaveDate: "Apr 10, 2026",
    contactNo: "070 123 9876",
    duringLeaveAddress: "No. 45, Station Road, Negombo",
    status: "Pending"
  },
  {
    id: "leave-6",
    officerName: "Kavinda Silva",
    initials: "KS",
    policeId: "SI 0012",
    rank: "Sub-Inspector",
    leaveType: "Annual Leave",
    dateRange: "Sep 01 – Sep 05",
    durationMeta: "5 days · 1 week ago",
    reason: "Annual family vacation to Nuwara Eliya.",
    actingOfficer: "SI 0019 - N. Jayasinghe",
    hasCertificate: false,
    dutyStrength: "7 of 8 officers on duty that day (from roster)",
    leaveBalance: "Annual balance: 5 of 14 days left",
    overlapWarning: null,
    appliedDate: "Aug 25, 2026",
    lastLeaveDate: "Jan 10, 2026",
    contactNo: "071 555 4433",
    duringLeaveAddress: "No. 12, Grand Hotel Road, Nuwara Eliya",
    status: "Approved"
  },
  {
    id: "leave-7",
    officerName: "Kamal Gunaratne",
    initials: "KG",
    policeId: "PS 0054",
    rank: "Sergeant",
    leaveType: "Casual Leave",
    dateRange: "Sep 07 – Sep 07",
    durationMeta: "1 day · 3 days ago",
    reason: "Attending a private event without prior roster notification.",
    actingOfficer: "PC 0022 - H. De Silva",
    hasCertificate: false,
    dutyStrength: "5 of 8 officers on duty that day (from roster)",
    lowStrength: true,
    leaveBalance: "Casual balance: 6 of 7 days left",
    overlapWarning: null,
    appliedDate: "Sep 6, 2026",
    lastLeaveDate: "Jul 01, 2026",
    contactNo: "077 333 2211",
    duringLeaveAddress: "No. 7, Temple Road, Gampaha",
    status: "Rejected"
  }
];

function LeaveManagement() {
  const [leaves, setLeaves]               = useState(INITIAL_LEAVES_DATA);
  const [activeTab, setActiveTab]         = useState("Pending");
  const [searchQuery, setSearchQuery]     = useState("");
  const [selectedCert, setSelectedCert]   = useState(null);
  const [rejectingItem, setRejectingItem] = useState(null);
  const [selectedReason, setSelectedReason]   = useState("Insufficient staff strength");
  const [additionalRemarks, setAdditionalRemarks] = useState("");
  const [expandedCardIds, setExpandedCardIds] = useState({});

  useEffect(() => {
    const fetchDBLeaves = async () => {
      try {
        const res = await getOfficerLeaves();
        if (Array.isArray(res) && res.length > 0) {
          const dbMapped = res.map((l, index) => {
            const officerName = l.officer?.fullName || l.officerName || "Traffic Officer";
            const init = officerName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "OF";
            const start = l.startDate ? new Date(l.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "Sep 10";
            const end = l.endDate ? new Date(l.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : start;

            let lType = l.leaveType || "Casual Leave";
            if (!lType.toLowerCase().includes("leave")) lType += " Leave";

            const actingOfficerText = l.actingOfficer
              ? `${l.actingOfficer.policeId || ''} ${l.actingOfficer.fullName ? '- ' + l.actingOfficer.fullName : ''}`.trim()
              : "Roster Assigned Officer";

            const docs = Array.isArray(l.supportingDocuments) ? l.supportingDocuments : [];
            const certUrl = l.medicalCertificateUrl || (docs.length > 0 ? docs[0].fileUrl : null);
            const hasCert = !!certUrl || docs.length > 0 || lType.toLowerCase().includes("medical");

            const durDays = l.duration || 1;

            return {
              id: l._id || l.id,
              leaveCode: `LV-${1040 + index}`,
              isFromDB: true,
              officerName: officerName,
              initials: init,
              policeId: l.officer?.policeId || l.officer?.username || "PC 0088",
              rank: l.officer?.rank || "Constable",
              leaveType: lType,
              dateRange: `${start} – ${end}`,
              durationMeta: `${durDays} day${durDays > 1 ? 's' : ''} · Requested via app`,
              reason: l.remarks || "Officer leave request submitted via system.",
              actingOfficer: actingOfficerText,
              hasCertificate: hasCert,
              certUrl: certUrl,
              documents: docs,
              dutyStrength: "6 of 8 officers on duty that day (from roster)",
              leaveBalance: "Balance: Available",
              overlapWarning: null,
              appliedDate: new Date(l.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              lastLeaveDate: "Previous month",
              contactNo: l.contactNo || l.officer?.contactNo || "071 234 5678",
              duringLeaveAddress: l.address || l.officer?.address || "Registered Address",
              status: l.status || "Pending"
            };
          });

          // Merge DB leaves with initial mock list
          const combined = [...dbMapped, ...INITIAL_LEAVES_DATA.filter(m => !dbMapped.some(d => d.id === m.id))];
          setLeaves(combined);
        }
      } catch (err) {
        console.error("Failed to load leaves from API:", err);
      }
    };

    fetchDBLeaves();
  }, []);

  const toggleExpand = (id) => {
    setExpandedCardIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleApprove = async (item) => {
    try {
      if (item.isFromDB) {
        await updateOfficerLeave(item.id, { status: "Approved" });
      }
      setLeaves(prev => prev.map(l => l.id === item.id ? { ...l, status: "Approved" } : l));
      alert(`Leave request approved for ${item.officerName}.`);
    } catch (err) {
      console.error(err);
      alert("Error approving leave request.");
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingItem) return;
    const finalReason = additionalRemarks
      ? `${selectedReason}: ${additionalRemarks}`
      : selectedReason;

    try {
      if (rejectingItem.isFromDB) {
        await updateOfficerLeave(rejectingItem.id, { status: "Rejected", rejectionRemarks: finalReason });
      }
      setLeaves(prev => prev.map(l => l.id === rejectingItem.id ? { ...l, status: "Rejected", rejectionRemarks: finalReason } : l));
      alert(`Leave request rejected for ${rejectingItem.officerName}.`);
      setRejectingItem(null);
      setSelectedReason("Insufficient staff strength");
      setAdditionalRemarks("");
    } catch (err) {
      console.error(err);
      alert("Error rejecting leave request.");
    }
  };

  // Counts
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
          {filteredLeaves.map(item => {
            const isExpanded = !!expandedCardIds[item.id];
            const isMedical = item.leaveType.toLowerCase().includes("medical");
            const isPersonal = item.leaveType.toLowerCase().includes("personal");
            const isAnnual = item.leaveType.toLowerCase().includes("annual");

            let typeBg = "#e0f2fe";
            let typeColor = "#0369a1";
            if (isMedical) { typeBg = "#fce7f3"; typeColor = "#be185d"; }
            else if (isPersonal) { typeBg = "#f3e8ff"; typeColor = "#6b21a8"; }
            else if (isAnnual) { typeBg = "#dcfce7"; typeColor = "#15803d"; }

            return (
              <div key={item.id} className="lm-card">

                {/* CARD TOP ROW */}
                <div className="lm-card-top">
                  <div className="lm-officer-info">
                    <div className="lm-avatar">{item.initials}</div>
                    <div>
                      <div className="lm-name-badge-row">
                        <h3 className="lm-officer-name">{item.officerName}</h3>
                        <span className="lm-police-id-badge">{item.policeId}</span>
                      </div>
                      <span className="lm-type-badge" style={{ backgroundColor: typeBg, color: typeColor }}>
                        {item.leaveType}
                      </span>
                      <div className="lm-rank-text">{item.rank}</div>
                    </div>
                  </div>

                  {/* Top Right Date & Meta */}
                  <div className="lm-top-right">
                    <div className="lm-date-range">{item.dateRange}</div>
                    <div className="lm-duration-meta">{item.durationMeta}</div>
                  </div>
                </div>

                {/* REASON TEXT */}
                <p className="lm-reason-text">{item.reason}</p>

                {/* ACTING OFFICER */}
                {item.actingOfficer && (
                  <div className="lm-acting-officer-row">
                    <FiUser size={14} color="#64748b" />
                    <span>Acting officer: <strong>{item.actingOfficer}</strong></span>
                  </div>
                )}

                {/* VIEW MEDICAL CERTIFICATE BUTTON */}
                {item.hasCertificate && (
                  <div>
                    <button className="lm-cert-btn" onClick={() => setSelectedCert(item)}>
                      <FiPaperclip size={14} style={{ marginRight: 6 }} /> View medical certificate
                    </button>
                  </div>
                )}

                <hr className="lm-divider" />

                {/* METRICS & OVERLAPS */}
                <div className="lm-metrics-list">
                  <div className="lm-metric-item">
                    <FiUsers size={15} color="#64748b" />
                    <span>{item.dutyStrength}</span>
                  </div>
                  <div className="lm-metric-item">
                    <FiBarChart2 size={15} color="#64748b" />
                    <span>{item.leaveBalance}</span>
                  </div>
                  {item.overlapWarning && (
                    <div className="lm-warning-item">
                      <FiAlertTriangle size={15} color="#dc2626" />
                      <span>{item.overlapWarning}</span>
                    </div>
                  )}
                </div>

                {/* EXPAND TOGGLE LINK */}
                <div className="lm-toggle-row">
                  <button className="lm-toggle-btn" onClick={() => toggleExpand(item.id)}>
                    {isExpanded ? (
                      <>
                        <FiChevronUp size={16} style={{ marginRight: 4 }} /> Hide details
                      </>
                    ) : (
                      <>
                        <FiChevronDown size={16} style={{ marginRight: 4 }} /> Show details
                      </>
                    )}
                  </button>
                </div>

                {/* EXPANDED DETAILS BOX (Exact Picture 3 Match) */}
                {isExpanded && (
                  <div className="lm-expanded-box">
                    <div className="lm-expanded-grid">
                      <div className="lm-expanded-item">
                        <FiCalendar size={15} color="#64748b" />
                        <span>Applied: <strong>{item.appliedDate}</strong></span>
                      </div>
                      <div className="lm-expanded-item">
                        <FiClock size={15} color="#64748b" />
                        <span>Last leave: <strong>{item.lastLeaveDate}</strong></span>
                      </div>
                      <div className="lm-expanded-item">
                        <FiPhone size={15} color="#64748b" />
                        <span>Contact: <strong>{item.contactNo}</strong></span>
                      </div>
                      <div className="lm-expanded-item">
                        <FiMapPin size={15} color="#64748b" />
                        <span>During leave: <strong>{item.duringLeaveAddress}</strong></span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ACTION BUTTONS / STATUS */}
                <div className="lm-actions-row">
                  {item.status === "Pending" ? (
                    <>
                      <button className="lm-approve-btn" onClick={() => handleApprove(item)}>
                        <FiCheck size={16} style={{ marginRight: 6 }} /> Approve
                      </button>
                      <button
                        className="lm-reject-btn"
                        onClick={() => {
                          setRejectingItem(item);
                          setSelectedReason("Insufficient staff strength");
                          setAdditionalRemarks("");
                        }}
                      >
                        <FiX size={16} style={{ marginRight: 6 }} /> Reject
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
            );
          })}

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
              <h3>Supporting Document / Certificate - {selectedCert.officerName}</h3>
              <button className="lm-modal-close" onClick={() => setSelectedCert(null)}>
                <FiX size={18} />
              </button>
            </div>
            <div className="lm-modal-body">
              {selectedCert.certUrl && selectedCert.certUrl.startsWith("data:image") ? (
                <div style={{ textAlign: "center" }}>
                  <img
                    src={selectedCert.certUrl}
                    alt="Uploaded Supporting Document"
                    style={{ maxWidth: "100%", maxHeight: "350px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                  <p style={{ fontSize: "12px", color: "#64748b", marginTop: "8px" }}>Uploaded Document Preview</p>
                </div>
              ) : selectedCert.certUrl && selectedCert.certUrl.startsWith("data:") ? (
                <div style={{ textAlign: "center", padding: "20px", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                  <FiPaperclip size={36} color="#0284c7" />
                  <p style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", marginTop: "10px" }}>Supporting Document Attached</p>
                  <a
                    href={selectedCert.certUrl}
                    download={`document_${selectedCert.officerName.replace(/\s+/g, "_")}`}
                    style={{ display: "inline-block", marginTop: "10px", padding: "8px 16px", background: "#0284c7", color: "#ffffff", borderRadius: "8px", textDecoration: "none", fontWeight: "700", fontSize: "13px" }}
                  >
                    Download / Open Document
                  </a>
                </div>
              ) : (
                <div className="lm-cert-preview-card">
                  <div className="lm-cert-badge">OFFICIAL MEDICAL CERTIFICATE</div>
                  <h4 style={{ margin: "10px 0 4px", fontSize: 16, color: "#0f172a" }}>Government Hospital - Negombo</h4>
                  <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Medical Officer: Dr. S. Wickramasinghe (MBBS)</p>
                  <hr style={{ margin: "14px 0", border: "none", borderTop: "1px solid #e2e8f0" }} />
                  <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.6 }}>
                    This is to certify that Traffic Officer <strong>{selectedCert.officerName}</strong> ({selectedCert.policeId}) has been examined on {selectedCert.appliedDate} and recommended for medical leave for a period of {selectedCert.dateRange} due to acute illness.
                  </p>
                  <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>Date Issued: {selectedCert.appliedDate}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#16a34a" }}>✓ Verified Medical Stamp</span>
                  </div>
                </div>
              )}
            </div>
            <div className="lm-modal-footer">
              <button className="lm-btn-close" onClick={() => setSelectedCert(null)}>Close Preview</button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT CONFIRMATION MODAL (EXACT USER SCREENSHOT MATCH) */}
      {rejectingItem && (
        <div className="lm-modal-overlay" onClick={() => setRejectingItem(null)}>
          <div className="lm-reject-modal-card" onClick={e => e.stopPropagation()}>
            
            {/* HEADER */}
            <div className="lm-reject-modal-header">
              <div className="lm-reject-title-row">
                <FiXCircle size={22} color="#dc2626" style={{ flexShrink: 0 }} />
                <span className="lm-reject-title">Reject Leave Request</span>
              </div>
              <span className="lm-reject-code">{rejectingItem.leaveCode || "LV-1042"}</span>
            </div>

            {/* OFFICER INFO CARD */}
            <div className="lm-reject-officer-summary">
              <div className="lm-reject-officer-details">
                <div className="lm-reject-name">{rejectingItem.officerName}</div>
                <div className="lm-reject-meta">
                  {rejectingItem.policeId} · {rejectingItem.leaveType} ({rejectingItem.durationMeta ? rejectingItem.durationMeta.split("·")[0].trim() : "3 days"})
                </div>
              </div>
              <div className="lm-reject-date-badge">
                {rejectingItem.dateRange ? rejectingItem.dateRange.replace("–", "-") : "Sep 10 - 12"}
              </div>
            </div>

            {/* REASON SELECTION */}
            <div className="lm-reject-section-title">SELECT REASON FOR REJECTION</div>

            <div className="lm-reject-options-container">
              {[
                "Insufficient staff strength",
                "Special duty assigned",
                "Overlaps with another officer's leave",
                "Requested with insufficient notice",
                "Other"
              ].map((reasonText) => {
                const isSelected = selectedReason === reasonText;
                return (
                  <div
                    key={reasonText}
                    className={`lm-reject-option-item ${isSelected ? "lm-reject-option-selected" : ""}`}
                    onClick={() => setSelectedReason(reasonText)}
                  >
                    <span>{reasonText}</span>
                    {isSelected && <FiCheckCircle size={17} color="#4f46e5" />}
                  </div>
                );
              })}
            </div>

            {/* ADDITIONAL REMARKS */}
            <div className="lm-reject-remarks-field">
              <label className="lm-reject-remarks-label">Additional Remarks (Optional)</label>
              <textarea
                className="lm-reject-textarea"
                placeholder="State operational justification..."
                value={additionalRemarks}
                onChange={e => setAdditionalRemarks(e.target.value)}
              />
            </div>

            {/* ACTION BUTTONS */}
            <div className="lm-reject-modal-actions">
              <button className="lm-reject-btn-cancel" onClick={() => setRejectingItem(null)}>
                Cancel
              </button>
              <button className="lm-reject-btn-confirm" onClick={handleConfirmReject}>
                Confirm Reject
              </button>
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

        /* GRID LAYOUT */
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
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
          display: flex;
          flex-direction: column;
          gap: 12px;
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
          align-items: flex-start;
          gap: 14px;
        }

        .lm-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background-color: #0f172a;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 14px;
          letter-spacing: 0.5px;
          flex-shrink: 0;
        }

        .lm-name-badge-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .lm-officer-name {
          margin: 0;
          font-size: 17px;
          font-weight: 700;
          color: #0f172a;
        }

        .lm-police-id-badge {
          background-color: #f1f5f9;
          color: #475569;
          font-size: 12px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 12px;
        }

        .lm-type-badge {
          display: inline-block;
          margin-top: 4px;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
        }

        .lm-rank-text {
          font-size: 13px;
          color: #64748b;
          margin-top: 2px;
        }

        .lm-top-right {
          text-align: right;
        }

        .lm-date-range {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
        }

        .lm-duration-meta {
          font-size: 12px;
          color: #64748b;
          margin-top: 2px;
        }

        .lm-reason-text {
          margin: 4px 0 0 0;
          font-size: 14px;
          line-height: 1.55;
          color: #334155;
        }

        .lm-acting-officer-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #64748b;
          margin-top: 2px;
        }

        .lm-acting-officer-row strong {
          color: #1e293b;
        }

        .lm-cert-btn {
          border: none;
          background-color: #eff6ff;
          color: #2563eb;
          padding: 7px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          margin-top: 4px;
          transition: background-color 0.15s ease;
        }

        .lm-cert-btn:hover {
          background-color: #dbeafe;
        }

        .lm-divider {
          border: none;
          border-top: 1px solid #f1f5f9;
          margin: 4px 0;
        }

        .lm-metrics-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .lm-metric-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #475569;
        }

        .lm-warning-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #dc2626;
        }

        /* TOGGLE EXPAND BUTTON */
        .lm-toggle-row {
          margin-top: 2px;
        }

        .lm-toggle-btn {
          border: none;
          background: transparent;
          color: #475569;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          padding: 0;
        }

        .lm-toggle-btn:hover {
          color: #0f172a;
        }

        /* EXPANDED DETAILS BOX (Picture 3 match) */
        .lm-expanded-box {
          background-color: #f8fafc;
          border: 1px solid #f1f5f9;
          border-radius: 12px;
          padding: 14px 18px;
          margin-top: 4px;
        }

        .lm-expanded-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px 20px;
        }

        .lm-expanded-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #64748b;
        }

        .lm-expanded-item strong {
          color: #1e293b;
        }

        /* ACTION BUTTONS */
        .lm-actions-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 8px;
        }

        .lm-approve-btn {
          flex: 1;
          background-color: #059669;
          border: none;
          color: #ffffff;
          padding: 10px 0;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.15s ease;
          box-shadow: 0 1px 3px rgba(5, 150, 105, 0.2);
        }

        .lm-approve-btn:hover {
          background-color: #047857;
        }

        .lm-reject-btn {
          flex: 1;
          background-color: #ffffff;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 10px 0;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.15s ease;
        }

        .lm-reject-btn:hover {
          background-color: #fee2e2;
        }

        .lm-status-approved {
          color: #059669;
          font-weight: 700;
          font-size: 13px;
          display: flex;
          align-items: center;
          background-color: #dcfce7;
          padding: 8px 16px;
          border-radius: 8px;
        }

        .lm-status-rejected {
          color: #dc2626;
          font-weight: 700;
          font-size: 13px;
          display: flex;
          align-items: center;
          background-color: #fee2e2;
          padding: 8px 16px;
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

        /* EXACT REJECT MODAL STYLING MATCHING USER SCREENSHOT */
        .lm-reject-modal-card {
          background: #ffffff;
          border-radius: 20px;
          width: 100%;
          max-width: 410px;
          padding: 24px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
          box-sizing: border-box;
          animation: modalFadeIn 0.2s ease;
        }

        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }

        .lm-reject-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .lm-reject-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .lm-reject-title {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.3px;
        }

        .lm-reject-code {
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
        }

        .lm-reject-officer-summary {
          background: linear-gradient(135deg, #f5f3ff 0%, #faf5ff 100%);
          border: 1px solid #ede9fe;
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .lm-reject-officer-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .lm-reject-name {
          font-size: 15px;
          font-weight: 800;
          color: #1e1b4b;
        }

        .lm-reject-meta {
          font-size: 12px;
          color: #6b7280;
        }

        .lm-reject-date-badge {
          background-color: #fee2e2;
          color: #b91c1c;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 8px;
          white-space: nowrap;
          max-width: 70px;
          text-align: center;
          line-height: 1.3;
        }

        .lm-reject-section-title {
          font-size: 11px;
          font-weight: 800;
          color: #6b7280;
          letter-spacing: 0.6px;
          margin-bottom: 10px;
          text-transform: uppercase;
        }

        .lm-reject-options-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 18px;
        }

        .lm-reject-option-item {
          background-color: #ffffff;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          padding: 12px 16px;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .lm-reject-option-item:hover {
          border-color: #cbd5e1;
        }

        .lm-reject-option-selected {
          border: 1.5px solid #4f46e5 !important;
          background-color: #ffffff !important;
          color: #1e1b4b;
          font-weight: 700;
          box-shadow: 0 1px 3px rgba(79, 70, 229, 0.08);
        }

        .lm-reject-remarks-field {
          margin-bottom: 22px;
        }

        .lm-reject-remarks-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 6px;
        }

        .lm-reject-textarea {
          width: 100%;
          min-height: 70px;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1.5px solid #e5e7eb;
          background-color: #f9fafb;
          font-size: 13px;
          color: #1f2937;
          outline: none;
          resize: vertical;
          box-sizing: border-box;
          font-family: inherit;
          transition: border-color 0.15s ease;
        }

        .lm-reject-textarea:focus {
          border-color: #4f46e5;
          background-color: #ffffff;
        }

        .lm-reject-modal-actions {
          display: flex;
          gap: 12px;
        }

        .lm-reject-btn-cancel {
          flex: 1;
          background-color: #ffffff;
          border: 1.5px solid #e5e7eb;
          color: #374151;
          padding: 11px 0;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        .lm-reject-btn-cancel:hover {
          background-color: #f9fafb;
        }

        .lm-reject-btn-confirm {
          flex: 1;
          background-color: #b91c1c;
          border: none;
          color: #ffffff;
          padding: 11px 0;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: background-color 0.15s ease;
          box-shadow: 0 2px 4px rgba(185, 28, 28, 0.2);
        }

        .lm-reject-btn-confirm:hover {
          background-color: #991b1b;
        }
      `}</style>

    </OICLayout>
  );
}

export default LeaveManagement;
