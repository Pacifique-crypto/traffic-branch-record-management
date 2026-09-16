import React, { useState } from "react";
import {
  FiCalendar,
  FiPlus,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight,
  FiTrash2,
  FiGrid,
  FiCheck,
  FiX,
  FiMessageSquare,
  FiSend,
  FiFileText,
  FiShare2,
  FiUsers,
  FiLayers
} from "react-icons/fi";
import "./DutyRoster.css";

export default function DutyRoster() {
  // Navigation & View States
  const [activeScreen, setActiveScreen] = useState("dashboard");
  const [dashTab, setDashTab] = useState("draft");
  const [dashMode, setDashMode] = useState("weekly");
  const [wizStep, setWizStep] = useState(1);
  const [oicTab, setOicTab] = useState("pending");

  // Rejection Modal State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [oicComment, setOicComment] = useState("");

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sample Days & Officers for Grid
  const days = ['Sun 13', 'Mon 14', 'Tue 15', 'Wed 16', 'Thu 17', 'Fri 18', 'Sat 19'];
  const officers = [
    'PC 4471 Fernando',
    'PC 5012 Perera',
    'PC 3390 Silva',
    'PC 6120 Bandara',
    'PC 2287 Jayasuriya'
  ];

  // Grid Cell Data
  const [cellData, setCellData] = useState([
    ['PD-06', 'PD-06', 'PD-06', 'OFF', 'MP-14', 'MP-14', 'PD-06'],
    ['MP-14', 'MP-14', 'MP-14', 'MP-14', 'OFF', 'PD-06', 'PD-06'],
    ['CP-22', 'CP-22', 'CP-22', 'OFF', 'OFF', 'CP-22', 'CP-22'],
    ['OFF', 'VIP-06 · PD-06', 'MP-14', 'MP-14', 'PD-06', 'OFF', 'MP-14'],
    ['PD-06', 'OFF', 'CP-22', 'CP-22', 'MP-14', 'MP-14', 'OFF'],
  ]);

  // Regular Duty Rows State
  const [regDuties, setRegDuties] = useState([
    { id: 1, name: "Point Duty — Poruthota Jn.", shift: "06:00–14:00", count: 2, location: "Poruthota Junction", vehicle: true },
    { id: 2, name: "Mobile Patrol — Sector 3", shift: "14:00–22:00", count: 3, location: "Sector 3, Coastal Rd.", vehicle: true }
  ]);

  // Special Duty Rows State
  const [specDuties, setSpecDuties] = useState([
    { id: 1, type: "VIP Escort", date: "2026-09-16", location: "Negombo–Katunayake road", count: 4, shift: "06:00–14:00", vehicle: true }
  ]);

  const addRegDuty = () => {
    setRegDuties([
      ...regDuties,
      { id: Date.now(), name: "", shift: "06:00–14:00", count: 1, location: "", vehicle: false }
    ]);
  };

  const removeRegDuty = (id) => {
    setRegDuties(regDuties.filter(r => r.id !== id));
  };

  const addSpecDuty = () => {
    setSpecDuties([
      ...specDuties,
      { id: Date.now(), type: "", date: "2026-09-16", location: "", count: 1, shift: "06:00–14:00", vehicle: false }
    ]);
  };

  const removeSpecDuty = (id) => {
    setSpecDuties(specDuties.filter(s => s.id !== id));
  };

  // Dashboard Table Data
  const dashRows = {
    draft: [
      { t: "13–19 Sep weekly roster", badge: "draft", label: "Draft", meta: "Last edited 15 Sep, 08:10", d1: "Type", v1: "Weekly", d2: "Duties", v2: "28 slots" },
      { t: "Tue 15 Sep daily roster", badge: "draft", label: "Draft", meta: "Last edited 14 Sep, 19:02", d1: "Type", v1: "Daily", d2: "Duties", v2: "6 slots" },
    ],
    pending: [
      { t: "06–12 Sep weekly roster", badge: "pending", label: "Pending", meta: "Submitted 12 Sep, 17:30", d1: "Submitted", v1: "12 Sep, 17:30", d2: "Duties", v2: "27 slots" },
    ],
    changes: [
      { t: "30 Aug–05 Sep weekly roster", badge: "changes", label: "Changes requested", meta: 'OIC comment: "Recheck night patrol overlap"', d1: "Returned", v1: "04 Sep, 09:15", d2: "Duties", v2: "26 slots" },
    ],
    approved: [
      { t: "23–29 Aug weekly roster", badge: "approved", label: "Approved", meta: "Approved by OIC Ranasinghe", d1: "Approved", v1: "23 Aug, 11:05", d2: "Duties", v2: "27 slots" },
      { t: "16–22 Aug weekly roster", badge: "approved", label: "Approved", meta: "Approved by OIC Ranasinghe", d1: "Approved", v1: "16 Aug, 10:40", d2: "Duties", v2: "27 slots" },
    ]
  };

  // OIC Queue Data
  const oicRows = {
    pending: [
      { t: "13–19 Sep weekly roster", badge: "pending", label: "Pending", meta: "Submitted by IT Officer Nuri", d1: "Submitted", v1: "15 Sep, 09:42", d2: "Duties", v2: "28 slots" }
    ],
    changes: [
      { t: "30 Aug–05 Sep weekly roster", badge: "changes", label: "Changes requested", meta: "Awaiting IT Officer revision", d1: "Returned", v1: "04 Sep, 09:15", d2: "Duties", v2: "26 slots" }
    ],
    approved: dashRows.approved
  };

  const handleCellClick = (officerIdx, dayIdx, currentVal) => {
    if (currentVal === 'OFF') return;
    const newVal = prompt(`Reassign duty for ${officers[officerIdx]} on ${days[dayIdx]}:`, currentVal.replace(' · ', ', '));
    if (newVal !== null && newVal.trim() !== '') {
      const updated = [...cellData];
      updated[officerIdx][dayIdx] = newVal.trim();
      setCellData(updated);
      showToast(`Updated duty assignment for ${officers[officerIdx]}`);
    }
  };

  const handleOICApprove = () => {
    showToast("Roster approved successfully!");
  };

  const handleOICRequestChanges = () => {
    if (!oicComment.trim()) {
      alert("Please enter a comment describing the requested changes.");
      return;
    }
    showToast("Changes requested and returned to IT Officer.");
    setOicComment("");
  };

  const handleOICRejectSubmit = () => {
    if (!rejectionReason.trim()) {
      alert("Please enter a mandatory rejection reason.");
      return;
    }
    setShowRejectModal(false);
    showToast("Roster rejected.");
    setRejectionReason("");
  };

  const wizTitles = {
    1: "Select week",
    2: "Regular duties setup",
    3: "Special duties",
    4: "Review & publish"
  };

  return (
    <div className="dr-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          backgroundColor: "#132a47",
          color: "#ffffff",
          padding: "12px 20px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          fontSize: "13.5px",
          fontWeight: "600",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <FiCheckCircle size={18} color="#4ade80" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP NAVIGATION BAR */}
      <div className="dr-top-nav">
        <div className="dr-nav-brand">
          <div className="dr-brand-icon">
            <FiLayers size={20} />
          </div>
          <div className="dr-brand-text">
            <div className="dr-brand-org">Negombo Traffic Branch</div>
            <div className="dr-brand-title">Duty Roster Console</div>
          </div>
        </div>

        <div className="dr-subnav-items">
          <button
            className={`dr-subnav-item ${activeScreen === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveScreen('dashboard')}
          >
            <FiGrid size={15} />
            <span>Dashboard</span>
          </button>

          <button
            className={`dr-subnav-item ${activeScreen === 'wizard' ? 'active' : ''}`}
            onClick={() => { setActiveScreen('wizard'); setWizStep(1); }}
          >
            <FiPlus size={15} />
            <span>Create Roster</span>
          </button>

          <button
            className={`dr-subnav-item ${activeScreen === 'daily' ? 'active' : ''}`}
            onClick={() => setActiveScreen('daily')}
          >
            <FiCalendar size={15} />
            <span>Daily View</span>
          </button>

          <button
            className={`dr-subnav-item ${activeScreen === 'oic' ? 'active' : ''}`}
            onClick={() => setActiveScreen('oic')}
          >
            <FiCheckCircle size={15} />
            <span>OIC Approval</span>
          </button>
        </div>
      </div>

      {/* ================= SCREEN 1 — DASHBOARD ================= */}
      {activeScreen === 'dashboard' && (
        <section>
          <div className="dr-topline">
            <div>
              <div className="dr-crumb">Duty Roster</div>
              <h1 className="dr-screen-title">Dashboard</h1>
            </div>
            <button className="dr-btn dr-btn-primary" onClick={() => { setActiveScreen('wizard'); setWizStep(1); }}>
              <FiPlus size={15} />
              <span>Create new roster</span>
            </button>
          </div>

          <div className="dr-stat-row">
            <div className="dr-stat-card">
              <div className="label">Total officers</div>
              <div className="value">42</div>
              <div className="sub">Across 3 shifts</div>
            </div>
            <div className="dr-stat-card">
              <div className="label">Drafts</div>
              <div className="value">2</div>
              <div className="sub">Not yet submitted</div>
            </div>
            <div className="dr-stat-card">
              <div className="label">Pending approval</div>
              <div className="value">1</div>
              <div className="sub">Awaiting OIC review</div>
            </div>
            <div className="dr-stat-card flag">
              <div className="label">Conflicts this week</div>
              <div className="value">3</div>
              <div className="sub">Need manual fix</div>
            </div>
          </div>

          <div className="dr-control-row">
            <div className="dr-segmented">
              <button className={dashMode === 'weekly' ? 'active' : ''} onClick={() => setDashMode('weekly')}>Weekly</button>
              <button className={dashMode === 'daily' ? 'active' : ''} onClick={() => setDashMode('daily')}>Daily</button>
            </div>
          </div>

          <div className="dr-tabs">
            <button className={`dr-tab ${dashTab === 'draft' ? 'active' : ''}`} onClick={() => setDashTab('draft')}>
              Draft <span className="count">2</span>
            </button>
            <button className={`dr-tab ${dashTab === 'pending' ? 'active' : ''}`} onClick={() => setDashTab('pending')}>
              Pending <span className="count">1</span>
            </button>
            <button className={`dr-tab ${dashTab === 'changes' ? 'active' : ''}`} onClick={() => setDashTab('changes')}>
              Changes requested <span className="count">1</span>
            </button>
            <button className={`dr-tab ${dashTab === 'approved' ? 'active' : ''}`} onClick={() => setDashTab('approved')}>
              Approved <span className="count">6</span>
            </button>
          </div>

          <div className="dr-panel">
            {dashRows[dashTab].map((r, idx) => (
              <div key={idx} className="dr-roster-row">
                <div>
                  <div className="dr-roster-title">{r.t}</div>
                  <div className="dr-roster-meta">{r.meta}</div>
                </div>
                <div><div className="dr-col-label">{r.d1}</div><div className="dr-col-val">{r.v1}</div></div>
                <div><div className="dr-col-label">{r.d2}</div><div className="dr-col-val">{r.v2}</div></div>
                <div className="dr-row-actions">
                  <span className={`dr-badge ${r.badge}`} style={{ marginRight: '10px' }}>{r.label}</span>
                  <button className="dr-btn dr-btn-sm dr-btn-ghost">View</button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '15px', margin: 0, fontWeight: 700, color: '#152238' }}>13–19 Sep weekly roster · working copy</h2>
            <button className="dr-btn dr-btn-ghost dr-btn-sm" onClick={() => { setActiveScreen('wizard'); setWizStep(4); }}>
              Open full editor →
            </button>
          </div>

          <div className="dr-grid-wrap" style={{ marginTop: '12px' }}>
            <table className="dr-roster-grid">
              <thead>
                <tr>
                  <th>Officer</th>
                  {days.map((d, i) => <th key={i}>{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {officers.map((off, rIdx) => (
                  <tr key={rIdx}>
                    <td>{off}</td>
                    {cellData[rIdx].map((val, cIdx) => (
                      <td key={cIdx}>
                        {val === 'OFF' ? (
                          <span className="dr-cell-duty off">OFF</span>
                        ) : val.includes('·') ? (
                          <span className="dr-cell-duty conflict" onClick={() => handleCellClick(rIdx, cIdx, val)}>
                            {val}
                          </span>
                        ) : (
                          <span className="dr-cell-duty" onClick={() => handleCellClick(rIdx, cIdx, val)}>
                            {val}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="dr-legend">
            <span><i className="dr-dot" style={{ background: '#e7eef6', border: '1px solid #c3cedc' }}></i> Assigned duty</span>
            <span><i className="dr-dot" style={{ background: '#fce9e7', border: '1px solid #efc1bc' }}></i> Conflict — click cell to edit</span>
            <span><i className="dr-dot" style={{ background: 'transparent', border: '1px dashed #c3cedc' }}></i> Off duty</span>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '22px' }}>
            <button className="dr-btn" onClick={() => showToast("Draft saved successfully.")}>Save draft</button>
            <button className="dr-btn dr-btn-primary" onClick={() => showToast("Roster submitted to OIC for review.")}>Submit to OIC</button>
          </div>
        </section>
      )}

      {/* ================= SCREEN 2 — CREATE ROSTER WIZARD ================= */}
      {activeScreen === 'wizard' && (
        <section>
          <div className="dr-topline">
            <div>
              <div className="dr-crumb">Duty Roster / Create new</div>
              <h1 className="dr-screen-title">{wizTitles[wizStep]}</h1>
            </div>
            <button className="dr-btn dr-btn-ghost" onClick={() => setActiveScreen('dashboard')}>Cancel</button>
          </div>

          <div className="dr-wizard-steps">
            <div className={`dr-wstep ${wizStep === 1 ? 'current' : ''} ${wizStep > 1 ? 'done' : ''}`}>
              <div className="num">1</div><div className="wlabel">Select week</div>
            </div>
            <div className={`dr-wstep ${wizStep === 2 ? 'current' : ''} ${wizStep > 2 ? 'done' : ''}`}>
              <div className="num">2</div><div className="wlabel">Regular duties</div>
            </div>
            <div className={`dr-wstep ${wizStep === 3 ? 'current' : ''} ${wizStep > 3 ? 'done' : ''}`}>
              <div className="num">3</div><div className="wlabel">Special duties</div>
            </div>
            <div className={`dr-wstep ${wizStep === 4 ? 'current' : ''}`}>
              <div className="num">4</div><div className="wlabel">Review &amp; publish</div>
            </div>
          </div>

          {/* STEP 1 */}
          {wizStep === 1 && (
            <div className="dr-form-card">
              <div className="dr-field-row">
                <div className="dr-field">
                  <label>Roster type</label>
                  <select><option>Weekly roster</option><option>Daily roster</option></select>
                </div>
                <div className="dr-field">
                  <label>Week starting</label>
                  <input type="date" defaultValue="2026-09-13" />
                </div>
                <div className="dr-field">
                  <label>Week ending</label>
                  <input type="date" defaultValue="2026-09-19" disabled />
                </div>
              </div>
              <div className="dr-mini-stats">
                <div className="dr-mini-stat"><div className="n">42</div><div className="l">Officers available</div></div>
                <div className="dr-mini-stat"><div className="n">28</div><div className="l">Duty slots this week</div></div>
                <div className="dr-mini-stat warn"><div className="n">2</div><div className="l">Officers on leave</div></div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {wizStep === 2 && (
            <div className="dr-form-card">
              <table className="dr-duty-table">
                <thead>
                  <tr>
                    <th style={{ width: '30px' }}>#</th>
                    <th>Duty Name</th>
                    <th>Shift</th>
                    <th style={{ width: '110px' }}>Assigned Count</th>
                    <th>Location</th>
                    <th style={{ width: '90px', textAlign: 'center' }}>Vehicle</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {regDuties.map((row, idx) => (
                    <tr key={row.id}>
                      <td className="dr-row-num">{idx + 1}</td>
                      <td>
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => {
                            const updated = [...regDuties];
                            updated[idx].name = e.target.value;
                            setRegDuties(updated);
                          }}
                          placeholder="Duty name"
                        />
                      </td>
                      <td>
                        <select
                          value={row.shift}
                          onChange={(e) => {
                            const updated = [...regDuties];
                            updated[idx].shift = e.target.value;
                            setRegDuties(updated);
                          }}
                        >
                          <option>06:00–14:00</option>
                          <option>14:00–22:00</option>
                          <option>22:00–06:00</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          value={row.count}
                          onChange={(e) => {
                            const updated = [...regDuties];
                            updated[idx].count = Number(e.target.value);
                            setRegDuties(updated);
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={row.location}
                          onChange={(e) => {
                            const updated = [...regDuties];
                            updated[idx].location = e.target.value;
                            setRegDuties(updated);
                          }}
                          placeholder="Location"
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={row.vehicle}
                          onChange={(e) => {
                            const updated = [...regDuties];
                            updated[idx].vehicle = e.target.checked;
                            setRegDuties(updated);
                          }}
                        />
                      </td>
                      <td>
                        <button className="dr-icon-btn" onClick={() => removeRegDuty(row.id)}>
                          <FiTrash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="dr-add-row-btn" onClick={addRegDuty}>
                <FiPlus size={14} /> Add duty
              </button>
            </div>
          )}

          {/* STEP 3 */}
          {wizStep === 3 && (
            <div className="dr-form-card">
              <table className="dr-duty-table">
                <thead>
                  <tr>
                    <th style={{ width: '30px' }}>#</th>
                    <th>Duty Type</th>
                    <th>Date</th>
                    <th>Location</th>
                    <th style={{ width: '110px' }}>Assigned Count</th>
                    <th>Shift</th>
                    <th style={{ width: '90px', textAlign: 'center' }}>Vehicle</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {specDuties.map((row, idx) => (
                    <tr key={row.id}>
                      <td className="dr-row-num">{idx + 1}</td>
                      <td>
                        <input
                          type="text"
                          value={row.type}
                          onChange={(e) => {
                            const updated = [...specDuties];
                            updated[idx].type = e.target.value;
                            setSpecDuties(updated);
                          }}
                          placeholder="Duty type"
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          value={row.date}
                          onChange={(e) => {
                            const updated = [...specDuties];
                            updated[idx].date = e.target.value;
                            setSpecDuties(updated);
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={row.location}
                          onChange={(e) => {
                            const updated = [...specDuties];
                            updated[idx].location = e.target.value;
                            setSpecDuties(updated);
                          }}
                          placeholder="Location"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={row.count}
                          onChange={(e) => {
                            const updated = [...specDuties];
                            updated[idx].count = Number(e.target.value);
                            setSpecDuties(updated);
                          }}
                        />
                      </td>
                      <td>
                        <select
                          value={row.shift}
                          onChange={(e) => {
                            const updated = [...specDuties];
                            updated[idx].shift = e.target.value;
                            setSpecDuties(updated);
                          }}
                        >
                          <option>06:00–14:00</option>
                          <option>14:00–22:00</option>
                          <option>22:00–06:00</option>
                        </select>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={row.vehicle}
                          onChange={(e) => {
                            const updated = [...specDuties];
                            updated[idx].vehicle = e.target.checked;
                            setSpecDuties(updated);
                          }}
                        />
                      </td>
                      <td>
                        <button className="dr-icon-btn" onClick={() => removeSpecDuty(row.id)}>
                          <FiTrash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="dr-add-row-btn" onClick={addSpecDuty}>
                <FiPlus size={14} /> Add special duty
              </button>
            </div>
          )}

          {/* STEP 4 */}
          {wizStep === 4 && (
            <div>
              <div className="dr-note-banner">
                <FiAlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                <div>
                  3 officers are double-booked this week. Click a highlighted cell below to reassign before submitting.
                </div>
              </div>

              <div className="dr-grid-wrap">
                <table className="dr-roster-grid">
                  <thead>
                    <tr>
                      <th>Officer</th>
                      {days.map((d, i) => <th key={i}>{d}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {officers.map((off, rIdx) => (
                      <tr key={rIdx}>
                        <td>{off}</td>
                        {cellData[rIdx].map((val, cIdx) => (
                          <td key={cIdx}>
                            {val === 'OFF' ? (
                              <span className="dr-cell-duty off">OFF</span>
                            ) : val.includes('·') ? (
                              <span className="dr-cell-duty conflict" onClick={() => handleCellClick(rIdx, cIdx, val)}>
                                {val}
                              </span>
                            ) : (
                              <span className="dr-cell-duty" onClick={() => handleCellClick(rIdx, cIdx, val)}>
                                {val}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="dr-legend">
                <span><i className="dr-dot" style={{ background: '#e7eef6', border: '1px solid #c3cedc' }}></i> Assigned duty</span>
                <span><i className="dr-dot" style={{ background: '#fce9e7', border: '1px solid #efc1bc' }}></i> Conflict</span>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button className="dr-btn" onClick={() => showToast("Auto-generated updated roster.")}>Auto-generate again</button>
                <button className="dr-btn" onClick={() => showToast("Draft saved successfully.")}>Save draft</button>
                <button className="dr-btn dr-btn-primary" onClick={() => { showToast("Roster submitted to OIC!"); setActiveScreen('dashboard'); }}>
                  Submit to OIC
                </button>
              </div>
            </div>
          )}

          {/* WIZARD FOOTER */}
          <div className="dr-wizard-footer">
            <button
              className="dr-btn"
              onClick={() => setWizStep(wizStep - 1)}
              style={{ visibility: wizStep === 1 ? 'hidden' : 'visible' }}
            >
              ← Back
            </button>
            {wizStep < 4 && (
              <button className="dr-btn dr-btn-primary" onClick={() => setWizStep(wizStep + 1)}>
                Continue →
              </button>
            )}
          </div>
        </section>
      )}

      {/* ================= SCREEN 3 — DAILY VIEW ================= */}
      {activeScreen === 'daily' && (
        <section>
          <div className="dr-topline">
            <div>
              <div className="dr-crumb">Duty Roster</div>
              <h1 className="dr-screen-title">Daily view</h1>
            </div>
          </div>

          <div className="dr-day-picker">
            <div className="arrow">‹</div>
            <div className="datebox">
              <span>Tuesday</span>
              15 September 2026
            </div>
            <div className="arrow">›</div>
            <span style={{ fontSize: '12.5px', color: '#8b96ac', marginLeft: '6px' }}>
              Pulled automatically from the 13–19 Sep weekly roster
            </span>
          </div>

          <div className="dr-duty-cards">
            <div className="dr-duty-card">
              <div className="top">
                <h4>Point Duty — Poruthota Jn.</h4>
                <span className="dr-badge approved">Confirmed</span>
              </div>
              <div className="shift">06:00 – 14:00</div>
              <div className="meta">
                <div><div className="k">Officer</div><div className="v">PC 4471 Fernando</div></div>
                <div><div className="k">Location</div><div className="v">Poruthota Junction</div></div>
                <div><div className="k">Vehicle</div><div className="v">—</div></div>
              </div>
            </div>

            <div className="dr-duty-card">
              <div className="top">
                <h4>Mobile Patrol — Sector 3</h4>
                <span className="dr-badge approved">Confirmed</span>
              </div>
              <div className="shift">14:00 – 22:00</div>
              <div className="meta">
                <div><div className="k">Officer</div><div className="v">PC 5012 Perera +2</div></div>
                <div><div className="k">Location</div><div className="v">Sector 3, coastal road</div></div>
                <div><div className="k">Vehicle</div><div className="v">WP PD 2214</div></div>
              </div>
            </div>

            <div className="dr-duty-card">
              <div className="top">
                <h4>Checkpoint — Kurana</h4>
                <span className="dr-badge pending">Unconfirmed</span>
              </div>
              <div className="shift">22:00 – 06:00</div>
              <div className="meta">
                <div><div className="k">Officer</div><div className="v">PC 3390 Silva</div></div>
                <div><div className="k">Location</div><div className="v">Kurana checkpoint</div></div>
                <div><div className="k">Vehicle</div><div className="v">WP PD 0087</div></div>
              </div>
            </div>

            <div className="dr-duty-card">
              <div className="top">
                <h4>VIP Escort</h4>
                <span className="dr-badge changes">Reassign</span>
              </div>
              <div className="shift">06:00 – 14:00</div>
              <div className="meta">
                <div><div className="k">Officer</div><div className="v" style={{ color: '#c1443b' }}>Conflict — 2 duties</div></div>
                <div><div className="k">Location</div><div className="v">Negombo–Katunayake rd.</div></div>
                <div><div className="k">Vehicle</div><div className="v">WP PD 1145</div></div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ================= SCREEN 4 — OIC APPROVAL ================= */}
      {activeScreen === 'oic' && (
        <section>
          <div className="dr-topline">
            <div>
              <div className="dr-crumb">Duty Roster</div>
              <h1 className="dr-screen-title">OIC approval queue</h1>
            </div>
          </div>

          <div className="dr-tabs">
            <button className={`dr-tab ${oicTab === 'pending' ? 'active' : ''}`} onClick={() => setOicTab('pending')}>
              Pending <span className="count">1</span>
            </button>
            <button className={`dr-tab ${oicTab === 'changes' ? 'active' : ''}`} onClick={() => setOicTab('changes')}>
              Changes requested <span className="count">1</span>
            </button>
            <button className={`dr-tab ${oicTab === 'approved' ? 'active' : ''}`} onClick={() => setOicTab('approved')}>
              Approved <span className="count">6</span>
            </button>
          </div>

          <div className="dr-panel">
            {oicRows[oicTab].map((r, idx) => (
              <div key={idx} className="dr-roster-row">
                <div>
                  <div className="dr-roster-title">{r.t}</div>
                  <div className="dr-roster-meta">{r.meta}</div>
                </div>
                <div><div className="dr-col-label">{r.d1}</div><div className="dr-col-val">{r.v1}</div></div>
                <div><div className="dr-col-label">{r.d2}</div><div className="dr-col-val">{r.v2}</div></div>
                <div className="dr-row-actions">
                  <span className={`dr-badge ${r.badge}`} style={{ marginRight: '10px' }}>{r.label}</span>
                  <button className="dr-btn dr-btn-sm dr-btn-ghost">Review</button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '24px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px 0' }}>13–19 Sep weekly roster</h2>
            <div style={{ fontSize: '12.5px', color: '#8b96ac', marginBottom: '12px' }}>
              Submitted by IT Officer Nuri · 15 Sep 2026, 09:42
            </div>

            <div className="dr-grid-wrap">
              <table className="dr-roster-grid">
                <thead>
                  <tr>
                    <th>Officer</th>
                    {days.map((d, i) => <th key={i}>{d}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {officers.map((off, rIdx) => (
                    <tr key={rIdx}>
                      <td>{off}</td>
                      {cellData[rIdx].map((val, cIdx) => (
                        <td key={cIdx}>
                          {val === 'OFF' ? (
                            <span className="dr-cell-duty off">OFF</span>
                          ) : val.includes('·') ? (
                            <span className="dr-cell-duty conflict">{val}</span>
                          ) : (
                            <span className="dr-cell-duty">{val}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="dr-comment-box">
              <textarea
                placeholder="Add a comment for changes requested (required if requesting changes)..."
                value={oicComment}
                onChange={(e) => setOicComment(e.target.value)}
              />
            </div>

            <div className="dr-approval-toolbar">
              <button className="dr-btn dr-btn-danger" onClick={() => setShowRejectModal(true)}>
                <FiX size={15} /> Reject
              </button>
              <button className="dr-btn" onClick={handleOICRequestChanges}>
                <FiMessageSquare size={15} /> Request changes
              </button>
              <button className="dr-btn dr-btn-primary" onClick={handleOICApprove}>
                <FiCheck size={15} /> Approve
              </button>
            </div>
          </div>
        </section>
      )}

      {/* REJECT REASON MANDATORY MODAL */}
      {showRejectModal && (
        <div className="dr-modal-overlay">
          <div className="dr-modal">
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#152238', margin: '0 0 8px 0' }}>
              Reject Roster
            </h3>
            <p style={{ fontSize: '13px', color: '#54617a', margin: '0 0 16px 0' }}>
              Please provide a mandatory reason for rejecting this roster:
            </p>
            <textarea
              style={{
                width: '100%',
                minHeight: '80px',
                border: '1px solid #c3cedc',
                borderRadius: '6px',
                padding: '10px',
                fontSize: '13px',
                marginBottom: '18px'
              }}
              placeholder="Reason for rejection (mandatory)..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="dr-btn dr-btn-ghost" onClick={() => setShowRejectModal(false)}>
                Cancel
              </button>
              <button className="dr-btn dr-btn-danger" onClick={handleOICRejectSubmit}>
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}