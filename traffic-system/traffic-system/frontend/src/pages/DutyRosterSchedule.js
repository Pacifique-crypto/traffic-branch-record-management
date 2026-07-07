import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

const initialSections = [
  {
    id: 1,
    title: "01. Daytime Accident Investigation Duties",
    time: "06.00–18.00",
    officers: ["", ""],
  },
  {
    id: 2,
    title: "02. Daytime Motorcycle Patrol",
    time: "06.00–18.00",
    officers: ["", ""],
  },
];

const initialOtherDuties = [
  {
    id: 1,
    title: "Court Duties",
    officers: ["PS 38222 Udayakumar"],
  },
  {
    id: 2,
    title: "Traffic Branch Duties (Additional Staff)",
    officers: ["", ""],
  },
];

function DutyRosterSchedule() {
  const navigate = useNavigate();
  const [sections, setSections] = useState(initialSections);
  const [otherDuties, setOtherDuties] = useState(initialOtherDuties);

  /* ── Main sections ── */
  const addOfficer = (sectionId) => {
    setSections(sections.map((s) =>
      s.id === sectionId ? { ...s, officers: [...s.officers, ""] } : s
    ));
  };

  const updateOfficer = (sectionId, idx, val) => {
    setSections(sections.map((s) =>
      s.id === sectionId
        ? { ...s, officers: s.officers.map((o, i) => (i === idx ? val : o)) }
        : s
    ));
  };

  const deleteSection = (sectionId) => {
    setSections(sections.filter((s) => s.id !== sectionId));
  };

  const addSection = () => {
    const newId = Date.now();
    setSections([...sections, {
      id: newId,
      title: `${String(sections.length + 1).padStart(2, "0")}. New Duty Section`,
      time: "06.00–18.00",
      officers: [""],
    }]);
  };

  /* ── Other duties ── */
  const addOtherOfficer = (dutyId) => {
    setOtherDuties(otherDuties.map((d) =>
      d.id === dutyId ? { ...d, officers: [...d.officers, ""] } : d
    ));
  };

  const updateOtherOfficer = (dutyId, idx, val) => {
    setOtherDuties(otherDuties.map((d) =>
      d.id === dutyId
        ? { ...d, officers: d.officers.map((o, i) => (i === idx ? val : o)) }
        : d
    ));
  };

  const deleteOtherDuty = (dutyId) => {
    setOtherDuties(otherDuties.filter((d) => d.id !== dutyId));
  };

  return (
    
    <Layout>
      <div className="page-box">
        {/* Header */}
        <div className="dr-header-row">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button className="back-btn" onClick={() => navigate("/duty-roster")}>
              ‹ Duty Roster
            </button>
          </div>
          <span className="dr-week-label">&lt;Oct 23 – Oct 29, 2026&gt;</span>
        </div>

        {/* Weekly strip */}
        <div className="dr-week-strip" style={{ marginBottom: "24px" }}>
          {[
            { day: "Mon", date: "23 Oct" }, { day: "Tue", date: "24 Oct" },
            { day: "Wed", date: "25 Oct" }, { day: "Thu", date: "26 Oct" },
            { day: "Fri", date: "27 Oct" }, { day: "Sat", date: "28 Oct" },
            { day: "Sun", date: "29 Oct" },
          ].map((d, i) => (
            <div key={i} className={`dr-day-cell ${i === 3 ? "dr-day-active" : ""}`}>
              <span className="dr-day-name">{d.day}</span>
              <span className="dr-day-date">{d.date}</span>
            </div>
          ))}
        </div>

        {/* Schedule title */}
        <div className="schedule-title-row">
          <h2 className="schedule-main-title">Traffic Duty Schedule</h2>
        </div>

        {/* Main duty sections */}
        {sections.map((sec) => (
          <div className="schedule-section" key={sec.id}>
            <div className="schedule-section-header">
              <span className="schedule-section-title">{sec.title}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="schedule-time">{sec.time}</span>
                <button className="btn-icon-del" onClick={() => deleteSection(sec.id)} title="Delete section">🗑</button>
              </div>
            </div>
            <div className="schedule-officers">
              {sec.officers.map((o, idx) => (
                <div key={idx} className="schedule-officer-row">
                  <span className="officer-num">{idx + 1}.</span>
                  <input
                    className="officer-input"
                    placeholder="Enter officer name / ID"
                    value={o}
                    onChange={(e) => updateOfficer(sec.id, idx, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <button className="btn-add-officer" onClick={() => addOfficer(sec.id)}>
              👤 Add Officer
            </button>
          </div>
        ))}

        {/* Add new section button */}
        <button className="btn-add-section" onClick={addSection}>
          + Add New Duty Section
        </button>

        {/* Other Duties */}
        <div className="schedule-other-title">Other Duties</div>

        {otherDuties.map((duty) => (
          <div className="schedule-other-card" key={duty.id}>
            <div className="schedule-other-header">
              <span className="schedule-other-name">{duty.title}</span>
              <button className="btn-icon-del" onClick={() => deleteOtherDuty(duty.id)} title="Delete">🗑</button>
            </div>
            {duty.officers.map((o, idx) => (
              <div key={idx} className="other-officer-row">
                <span className="other-bullet">○</span>
                <input
                  className="officer-input"
                  placeholder="Enter officer name / ID"
                  value={o}
                  onChange={(e) => updateOtherOfficer(duty.id, idx, e.target.value)}
                />
              </div>
            ))}
            <button className="btn-add-officer" onClick={() => addOtherOfficer(duty.id)}>
              👤 Add Officer
            </button>
          </div>
        ))}

        {/* Add other duty */}
        <button className="btn-add-section" onClick={() => {
          setOtherDuties([...otherDuties, { id: Date.now(), title: "New Duty", officers: [""] }]);
        }}>
          + Add Other Duties
        </button>

        {/* Save button */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
          <button className="btn-assign" onClick={() => alert("Schedule saved!")}>
            💾 Save Schedule
          </button>
        </div>
      </div>
    </Layout>
  );
}

export default DutyRosterSchedule;