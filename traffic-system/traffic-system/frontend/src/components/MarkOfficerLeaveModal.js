import React, { useState, useEffect } from "react";
import { FiX, FiSearch, FiCalendar, FiUser, FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import { createOfficerLeave, getLeavesByOfficer } from "../api";

function MarkOfficerLeaveModal({ initialOfficer, officers = [], onClose, onSaveSuccess }) {
  const [selectedOfficer, setSelectedOfficer] = useState(initialOfficer || null);
  const [searchTerm, setSearchTerm]         = useState("");
  const [showDropdown, setShowDropdown]     = useState(false);
  
  const [startDate, setStartDate]           = useState("");
  const [endDate, setEndDate]               = useState("");
  const [leaveTypeSelect, setLeaveTypeSelect] = useState("Annual");
  const [customLeaveType, setCustomLeaveType] = useState("");
  const [remarks, setRemarks]               = useState("");

  const [error, setError]                   = useState("");
  const [loading, setLoading]               = useState(false);
  const [existingLeaves, setExistingLeaves] = useState([]);

  // Load leave history when an officer is selected
  useEffect(() => {
    if (selectedOfficer && selectedOfficer._id) {
      getLeavesByOfficer(selectedOfficer._id)
        .then(data => {
          if (Array.isArray(data)) setExistingLeaves(data);
        })
        .catch(err => console.error("Failed to load officer leave history:", err));
    } else {
      setExistingLeaves([]);
    }
  }, [selectedOfficer]);

  // Filter officer list based on search term
  const filteredOfficers = officers.filter(o => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (o.fullName || "").toLowerCase().includes(term) ||
      (o.policeId || "").toLowerCase().includes(term) ||
      (o.username || "").toLowerCase().includes(term) ||
      (o.rank || "").toLowerCase().includes(term)
    );
  });

  const handleSelectOfficer = (officer) => {
    setSelectedOfficer(officer);
    setSearchTerm("");
    setShowDropdown(false);
    setError("");
  };

  const handleClearSelectedOfficer = () => {
    setSelectedOfficer(null);
    setSearchTerm("");
    setExistingLeaves([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // 1. Validation: Officer required
    if (!selectedOfficer || !selectedOfficer._id) {
      setError("Please select an officer.");
      return;
    }

    // 2. Validation: Start Date & End Date required
    if (!startDate || !endDate) {
      setError("Both start date and end date are required.");
      return;
    }

    // 3. Validation: Leave Type required & Custom Leave Type if Other
    let finalLeaveType = leaveTypeSelect;
    if (leaveTypeSelect === "Other") {
      if (!customLeaveType.trim()) {
        setError("Please enter the specific leave type.");
        return;
      }
      finalLeaveType = customLeaveType.trim();
    }

    // 4. Validation: Date Order (endDate cannot be before startDate)
    const start = new Date(startDate);
    const end   = new Date(endDate);
    if (end < start) {
      setError("End date cannot be before start date.");
      return;
    }

    setLoading(true);
    try {
      const res = await createOfficerLeave({
        officer: selectedOfficer._id,
        startDate,
        endDate,
        leaveType: finalLeaveType,
        remarks: remarks.trim()
      });

      if (res && res.leave) {
        if (onSaveSuccess) onSaveSuccess(res.leave);
        onClose();
      } else {
        setError(res.message || res.error || "Failed to save officer leave.");
      }
    } catch (err) {
      console.error(err);
      setError("Error connecting to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="um-modal-overlay">
      <div className="um-modal" style={{ width: 540, maxWidth: "95vw" }}>
        
        {/* ── Modal Header ── */}
        <div className="um-modal-header" style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9" }}>
          <div>
            <h2 className="um-modal-title" style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
              Mark Officer Leave
            </h2>
          </div>
          <button className="um-modal-close" onClick={onClose} style={{ cursor: "pointer" }}>
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="um-modal-body" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
            
            {/* Error Alert */}
            {error && (
              <div style={{
                background: "#fef2f2",
                border: "1px solid #fecdd3",
                borderRadius: "8px",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "#991b1b",
                fontSize: "13px",
                fontWeight: "600"
              }}>
                <FiAlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* ── 1. OFFICER SELECTION ── */}
            <div style={{ position: "relative" }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", letterSpacing: "0.5px", marginBottom: "6px" }}>
                OFFICER SELECTION
              </label>

              {selectedOfficer ? (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  padding: "10px 14px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "#1e3a8a",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "700",
                      fontSize: "13px"
                    }}>
                      {selectedOfficer.fullName ? selectedOfficer.fullName.charAt(0) : "O"}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: "700", fontSize: "14px", color: "#0f172a" }}>
                        {selectedOfficer.fullName}
                      </p>
                      <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                        {selectedOfficer.rank || "Constable"} • ID: {selectedOfficer.policeId || selectedOfficer.username || "-"}
                      </p>
                    </div>
                  </div>
                  {!initialOfficer && (
                    <button
                      type="button"
                      onClick={handleClearSelectedOfficer}
                      style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px" }}
                      title="Change officer"
                    >
                      <FiX size={16} />
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    padding: "0 12px"
                  }}>
                    <FiSearch size={16} color="#94a3b8" style={{ marginRight: "8px" }} />
                    <input
                      type="text"
                      placeholder="Search officer name or ID..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      style={{
                        width: "100%",
                        padding: "10px 0",
                        border: "none",
                        background: "transparent",
                        fontSize: "13px",
                        color: "#0f172a",
                        outline: "none"
                      }}
                    />
                  </div>

                  {/* Dropdown list of officers */}
                  {showDropdown && (
                    <div style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      maxHeight: "180px",
                      overflowY: "auto",
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                      zIndex: 50,
                      marginTop: "4px"
                    }}>
                      {filteredOfficers.length > 0 ? (
                        filteredOfficers.map(off => (
                          <div
                            key={off._id || off.id}
                            onClick={() => handleSelectOfficer(off)}
                            style={{
                              padding: "10px 14px",
                              cursor: "pointer",
                              borderBottom: "1px solid #f1f5f9",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center"
                            }}
                            onMouseDown={(e) => e.preventDefault()}
                          >
                            <span style={{ fontWeight: "600", fontSize: "13px", color: "#0f172a" }}>
                              {off.fullName}
                            </span>
                            <span style={{ fontSize: "12px", color: "#64748b" }}>
                              {off.rank || "Constable"} ({off.policeId || off.username})
                            </span>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: "12px", fontSize: "13px", color: "#94a3b8", textAlign: "center" }}>
                          No officers found matching "{searchTerm}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── 2. START DATE & END DATE ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", letterSpacing: "0.5px", marginBottom: "6px" }}>
                  START DATE
                </label>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  padding: "0 12px"
                }}>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 0",
                      border: "none",
                      background: "transparent",
                      fontSize: "13px",
                      color: "#0f172a",
                      outline: "none",
                      fontFamily: "inherit"
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", letterSpacing: "0.5px", marginBottom: "6px" }}>
                  END DATE
                </label>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  padding: "0 12px"
                }}>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 0",
                      border: "none",
                      background: "transparent",
                      fontSize: "13px",
                      color: "#0f172a",
                      outline: "none",
                      fontFamily: "inherit"
                    }}
                  />
                </div>
              </div>
            </div>

            {/* ── 3. LEAVE TYPE ── */}
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", letterSpacing: "0.5px", marginBottom: "6px" }}>
                LEAVE TYPE
              </label>
              <select
                value={leaveTypeSelect}
                onChange={(e) => {
                  setLeaveTypeSelect(e.target.value);
                  if (e.target.value !== "Other") setCustomLeaveType("");
                }}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#0f172a",
                  outline: "none",
                  cursor: "pointer"
                }}
              >
                <option value="Annual">Annual</option>
                <option value="Medical">Medical</option>
                <option value="Emergency">Emergency</option>
                <option value="Other">Other</option>
              </select>

              {leaveTypeSelect === "Other" && (
                <div style={{ marginTop: "10px" }}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", letterSpacing: "0.5px", marginBottom: "6px" }}>
                    SPECIFY LEAVE TYPE *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter leave type (e.g. Casual Leave, Maternity Leave)..."
                    value={customLeaveType}
                    onChange={(e) => setCustomLeaveType(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "13px",
                      color: "#0f172a",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
              )}
            </div>

            {/* ── 4. REMARKS ── */}
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", letterSpacing: "0.5px", marginBottom: "6px" }}>
                REMARKS
              </label>
              <textarea
                rows={3}
                placeholder="Enter any additional notes..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: "#0f172a",
                  outline: "none",
                  resize: "vertical",
                  fontFamily: "inherit",
                  boxSizing: "border-box"
                }}
              />
            </div>

            {/* Existing Leaves Display Widget inside Modal if officer selected */}
            {selectedOfficer && existingLeaves.length > 0 && (
              <div style={{
                background: "#f1f5f9",
                borderRadius: "8px",
                padding: "12px 14px",
                marginTop: "4px"
              }}>
                <p style={{ margin: "0 0 8px 0", fontSize: "11px", fontWeight: "700", color: "#475569", letterSpacing: "0.5px" }}>
                  EXISTING LEAVE RECORDS FOR THIS OFFICER ({existingLeaves.length})
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "100px", overflowY: "auto" }}>
                  {existingLeaves.map((l, i) => (
                    <div key={l._id || i} style={{ background: "#ffffff", padding: "6px 10px", borderRadius: "6px", fontSize: "12px", display: "flex", justifyContent: "space-between" }}>
                      <span>
                        <strong>{new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}</strong> ({l.leaveType})
                      </span>
                      <span style={{ color: "#64748b" }}>{l.remarks || "No remarks"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* ── Modal Footer ── */}
          <div className="um-modal-footer" style={{
            display: "flex",
            justify: "flex-end",
            alignItems: "center",
            gap: "12px",
            padding: "16px 24px 20px",
            borderTop: "1px solid #f1f5f9"
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                fontSize: "13px",
                fontWeight: "600",
                color: "#64748b",
                cursor: "pointer",
                padding: "8px 16px"
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: "#0f172a",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "10px 22px",
                fontSize: "13px",
                fontWeight: "700",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}
            >
              {loading ? "Saving..." : "Save Leave"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default MarkOfficerLeaveModal;
