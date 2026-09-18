import React, { useState, useEffect } from "react";
import OICLayout from "../layouts/OICLayout";
import ITLayout from "../layouts/ITLayout";
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
  FiLayers,
  FiMoreVertical,
  FiUser,
  FiMapPin,
  FiBriefcase,
  FiSave,
  FiChevronDown,
  FiSettings,
  FiPlay,
  FiInfo
} from "react-icons/fi";
import {
  getOfficers,
  getDutyRosters,
  getDutyRosterByWeek,
  createDutyRoster,
  createDutyRosterGenerate,
  updateDutyRoster,
  getDuties,
  createDuty,
  updateDuty,
  deleteDuty
} from "../api";
import "./DutyRoster.css";

export default function DutyRoster() {
  const userRole = localStorage.getItem("userRole") || "IT Officer";
  const isOIC = userRole === "OIC" || (userRole || "").toLowerCase().includes("oic");
  const LayoutComponent = isOIC ? OICLayout : ITLayout;

  // Navigation & View States
  const [activeScreen, setActiveScreen] = useState("dashboard");
  const [dashTab, setDashTab] = useState(isOIC ? "pending" : "draft");
  const [dashMode, setDashMode] = useState("weekly");
  const [wizStep, setWizStep] = useState(1);
  const [selectedRoster, setSelectedRoster] = useState(null);

  // API Data States
  const [officersList, setOfficersList] = useState([]);
  const [rostersList, setRostersList] = useState([]);
  const [currentWeekRoster, setCurrentWeekRoster] = useState(null);
  const [weeklyDuties, setWeeklyDuties] = useState([]);
  const [dailyDuties, setDailyDuties] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [generationConflicts, setGenerationConflicts] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Rejection & Comment State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [oicComment, setOicComment] = useState("");

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Week Navigation State & Helper
  const [weekOffset, setWeekOffset] = useState(0);
  const [customStartDate, setCustomStartDate] = useState("2026-09-13");

  // Daily View Date State & Helper
  const [dailyDate, setDailyDate] = useState(new Date(2026, 8, 14)); // Mon, 14 Sep 2026

  const formatDailyDate = (dateObj) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayName = days[dateObj.getDay()];
    const dayNum = dateObj.getDate();
    const monthName = months[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    return `${dayName}, ${dayNum} ${monthName} ${year}`;
  };

  const formatDateISO = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getWeekSunday = (offset = 0) => {
    const baseSun = new Date(2026, 8, 13); // Sun, 13 Sep 2026
    baseSun.setDate(baseSun.getDate() + offset * 7);
    return baseSun;
  };

  const handleDailyPrevDay = () => {
    setDailyDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 1);
      return d;
    });
  };

  const handleDailyNextDay = () => {
    setDailyDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 1);
      return d;
    });
  };

  const getWeekData = (offset, customStartStr = null) => {
    let baseSun;
    if (customStartStr) {
      const parts = customStartStr.split('-').map(Number);
      baseSun = new Date(parts[0], parts[1] - 1, parts[2]);
    } else {
      baseSun = getWeekSunday(offset);
    }
    const baseSat = new Date(baseSun);
    baseSat.setDate(baseSat.getDate() + 6);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const daysName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const startDay = String(baseSun.getDate()).padStart(2, '0');
    const endDay = String(baseSat.getDate()).padStart(2, '0');
    const startMonth = months[baseSun.getMonth()];
    const endMonth = months[baseSat.getMonth()];

    let titleLabel = "";
    if (startMonth === endMonth) {
      titleLabel = `${startDay}–${endDay} ${startMonth} weekly roster`;
    } else {
      titleLabel = `${startDay} ${startMonth}–${endDay} ${endMonth} weekly roster`;
    }

    const calculatedDays = [];
    const calculatedDatesISO = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(baseSun);
      d.setDate(d.getDate() + i);
      calculatedDays.push(`${daysName[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}`);
      calculatedDatesISO.push(formatDateISO(d));
    }

    return { titleLabel, calculatedDays, calculatedDatesISO, startDateISO: formatDateISO(baseSun), endDateISO: formatDateISO(baseSat) };
  };

  const currentWeek = getWeekData(weekOffset, customStartDate);
  const days = currentWeek.calculatedDays;

  // Data Fetching Effects
  const fetchOfficersList = async () => {
    try {
      const res = await getOfficers();
      if (Array.isArray(res)) {
        setOfficersList(res);
      }
    } catch (err) {
      console.error("Error fetching officers:", err);
    }
  };

  const fetchRostersList = async () => {
    try {
      const res = await getDutyRosters();
      if (Array.isArray(res)) {
        setRostersList(res);
      }
    } catch (err) {
      console.error("Error fetching rosters:", err);
    }
  };

  const fetchWeeklyData = async () => {
    try {
      setIsLoading(true);
      const res = await getDutyRosterByWeek(currentWeek.startDateISO);
      if (res && res.roster) {
        setCurrentWeekRoster(res.roster);
        setWeeklyDuties(res.duties || []);
      } else {
        setCurrentWeekRoster(null);
        setWeeklyDuties([]);
      }
    } catch (err) {
      console.error("Error fetching weekly roster:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDailyData = async () => {
    try {
      const dStr = formatDateISO(dailyDate);
      const res = await getDuties({ date: dStr });
      if (Array.isArray(res)) {
        setDailyDuties(res);
      }
    } catch (err) {
      console.error("Error fetching daily duties:", err);
    }
  };

  useEffect(() => {
    fetchOfficersList();
    fetchRostersList();
  }, []);

  useEffect(() => {
    fetchWeeklyData();
  }, [weekOffset]);

  useEffect(() => {
    fetchDailyData();
  }, [dailyDate]);

  const handlePrevWeek = () => {
    const newOff = weekOffset - 1;
    setWeekOffset(newOff);
    setCustomStartDate(formatDateISO(getWeekSunday(newOff)));
  };

  const handleNextWeek = () => {
    const newOff = weekOffset + 1;
    setWeekOffset(newOff);
    setCustomStartDate(formatDateISO(getWeekSunday(newOff)));
  };

  const renderWeekNavigator = () => (
    <div className="dr-week-nav">
      <button
        type="button"
        className="dr-week-arrow-btn"
        onClick={handlePrevWeek}
        title="Previous week"
      >
        <FiChevronLeft size={18} />
      </button>
      <div className="dr-week-label-pill">
        {currentWeek.titleLabel}
      </div>
      <button
        type="button"
        className="dr-week-arrow-btn"
        onClick={handleNextWeek}
        title="Next week"
      >
        <FiChevronRight size={18} />
      </button>
    </div>
  );

  // Officers helper list for UI
  const displayOfficers = officersList.length > 0
    ? officersList.map(o => `${o.rank || 'PC'} ${o.policeId || ''} ${o.name || ''}`.trim())
    : [
        'PC 4471 Fernando',
        'PC 5012 Perera',
        'PC 3390 Silva',
        'PC 6120 Bandara',
        'PC 2287 Jayasuriya'
      ];

  // Grid Cell Data & Mapping
  const getCellValForOfficerAndDate = (officerIdx, dayIdx) => {
    const officerObj = officersList[officerIdx];
    const dateISO = currentWeek.calculatedDatesISO[dayIdx];

    if (!officerObj) {
      const fallbackCellData = [
        ['PD-06', 'PD-06', 'PD-06', 'OFF', 'MP-14', 'MP-14', 'PD-06'],
        ['MP-14', 'MP-14', 'MP-14', 'MP-14', 'OFF', 'PD-06', 'PD-06'],
        ['CP-22', 'CP-22', 'CP-22', 'OFF', 'OFF', 'CP-22', 'CP-22'],
        ['OFF', 'VIP-06 · PD-06', 'MP-14', 'MP-14', 'PD-06', 'OFF', 'MP-14'],
        ['PD-06', 'OFF', 'CP-22', 'CP-22', 'MP-14', 'MP-14', 'OFF'],
      ];
      return fallbackCellData[officerIdx]?.[dayIdx] || 'OFF';
    }

    const matchedDuties = weeklyDuties.filter(d => {
      const dutyOffId = typeof d.officerId === 'object' ? d.officerId?._id : d.officerId;
      const dutyDateStr = d.date ? d.date.substring(0, 10) : '';
      return dutyOffId === officerObj._id && dutyDateStr === dateISO;
    });

    if (matchedDuties.length === 0) return 'OFF';

    if (matchedDuties.length > 1) {
      return matchedDuties.map(d => formatDutyCode(d)).join(' · ');
    }

    return formatDutyCode(matchedDuties[0]);
  };

  const formatDutyCode = (d) => {
    if (d.dutyType === 'OFF') return 'OFF';
    if (d.dutyType === 'Point Duty') return 'PD-06';
    if (d.dutyType === 'Accident Investigation Duty' || d.dutyType === 'Accident Investigation') return 'AI-06';
    if (d.dutyType === 'Motorcycle Patrol') return 'MP-06';
    if (d.dutyType === '119 Motorcycle Patrol') return '119-MP';
    if (d.dutyType === 'Traffic Branch Duty') return 'TB-06';
    if (d.dutyType === 'Court Duty') return 'CD-08';
    if (d.dutyType === 'Mobile Patrol') return 'MP-14';
    if (d.dutyType === 'Checkpoint') return 'CP-22';
    if (d.dutyType === 'Special Duty') {
      return d.specialDutyText ? d.specialDutyText : 'Special Duty';
    }
    return d.dutyType || 'PD-06';
  };

  // Regular Duty Rows State (Wizard) - Pre-filled with standard regular duties
  const [regDuties, setRegDuties] = useState([
    { id: 1, name: "Accident Investigation Duty", shift: "06:00–18:00", count: 2, location: "Main Station / Field", vehicle: true },
    { id: 2, name: "Motorcycle Patrol", shift: "06:00–18:00", count: 3, location: "Sector Patrol Area", vehicle: true },
    { id: 3, name: "119 Motorcycle Patrol", shift: "06:00–18:00", count: 2, location: "Emergency Response Patrol", vehicle: true },
    { id: 4, name: "Point Duty", shift: "06:00–14:00", count: 4, location: "Poruthota & Main Junctions", vehicle: false },
    { id: 5, name: "Traffic Branch Duty", shift: "06:00–18:00", count: 2, location: "Traffic Branch HQ", vehicle: false },
    { id: 6, name: "Court Duty", shift: "08:00–16:00", count: 2, location: "Magistrate Court", vehicle: false }
  ]);

  // Special Duty Rows State (Wizard)
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

  // Dashboard Table Data Mapping
  const getRostersByStatus = (statusKey) => {
    const statusMap = {
      draft: "DRAFT",
      pending: "PENDING_APPROVAL",
      changes: "CHANGES_REQUESTED",
      approved: "APPROVED",
      published: "PUBLISHED"
    };

    const targetStatus = statusMap[statusKey] || statusKey.toUpperCase();
    const filtered = rostersList.filter(r => r.status === targetStatus);

    if (filtered.length > 0) {
      return filtered.map(r => {
        const sDate = new Date(r.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        const eDate = new Date(r.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        const badgeMap = {
          DRAFT: { badge: 'draft', label: 'Draft' },
          PENDING_APPROVAL: { badge: 'pending', label: 'Pending' },
          CHANGES_REQUESTED: { badge: 'changes', label: 'Changes requested' },
          APPROVED: { badge: 'approved', label: 'Approved' },
          PUBLISHED: { badge: 'published', label: 'Published' }
        };
        const bInfo = badgeMap[r.status] || { badge: 'draft', label: r.status };
        return {
          _id: r._id,
          t: `${sDate}–${eDate} weekly roster`,
          badge: bInfo.badge,
          label: bInfo.label,
          meta: r.oicComment ? `OIC comment: "${r.oicComment}"` : `Created ${new Date(r.createdAt).toLocaleDateString()}`,
          d1: "Start Date",
          v1: sDate,
          d2: "Status",
          v2: r.status,
          raw: r
        };
      });
    }

    // Fallback sample rows if database has no rosters for this status tab yet
    const fallbackRows = {
      draft: [
        { t: "13–19 Sep weekly roster", badge: "draft", label: "Draft", meta: "Last edited 15 Sep, 08:10", d1: "Type", v1: "Weekly", d2: "Duties", v2: "28 slots" },
      ],
      pending: [
        { t: "06–12 Sep weekly roster", badge: "pending", label: "Pending", meta: "Submitted 12 Sep, 17:30", d1: "Submitted", v1: "12 Sep, 17:30", d2: "Duties", v2: "27 slots" },
      ],
      changes: [
        { t: "30 Aug–05 Sep weekly roster", badge: "changes", label: "Changes requested", meta: 'OIC comment: "Recheck night patrol overlap"', d1: "Returned", v1: "04 Sep, 09:15", d2: "Duties", v2: "26 slots" },
      ],
      approved: [
        { t: "23–29 Aug weekly roster", badge: "approved", label: "Approved", meta: "Approved by OIC Ranasinghe", d1: "Approved", v1: "23 Aug, 11:05", d2: "Duties", v2: "27 slots" },
      ],
      published: [
        { t: "16–22 Aug weekly roster", badge: "published", label: "Published", meta: "Published & Active for Officers", d1: "Published", v1: "16 Aug, 10:40", d2: "Duties", v2: "27 slots" },
      ]
    };
    return fallbackRows[statusKey] || [];
  };

  // Edit Duty Modal State
  const [showEditDutyModal, setShowEditDutyModal] = useState(false);
  const [editDutyData, setEditDutyData] = useState({
    dutyId: null,
    rosterId: null,
    officerId: null,
    officerIdx: 0,
    dayIdx: 0,
    date: "2026-09-14",
    shift: "06:00 - 14:00 (Morning Shift)",
    officer: "PC 4471 Fernando",
    location: "Poruthota Junction",
    dutyType: "Point Duty",
    specialDutyText: "VIP Escort"
  });

  const handleCellClick = (officerIdx, dayIdx, currentVal) => {
    setModalError(null);
    const officerObj = officersList[officerIdx];
    const officerName = officerObj
      ? `${officerObj.rank || 'PC'} ${officerObj.policeId || ''} ${officerObj.name || ''}`.trim()
      : displayOfficers[officerIdx] || `PC ${officerIdx + 1}`;
    
    const dateISO = currentWeek.calculatedDatesISO[dayIdx];

    // Check if existing duty assignment in database
    let existingDuty = null;
    if (officerObj && weeklyDuties.length > 0) {
      existingDuty = weeklyDuties.find(d => {
        const dOffId = typeof d.officerId === 'object' ? d.officerId?._id : d.officerId;
        const dDateStr = d.date ? d.date.substring(0, 10) : '';
        return dOffId === officerObj._id && dDateStr === dateISO;
      });
    }

    let dutyType = "Point Duty";
    let shift = "06:00 - 14:00 (Morning Shift)";
    let location = "Poruthota Junction";
    let specialDutyText = "VIP Escort";

    if (existingDuty) {
      dutyType = existingDuty.dutyType || "Point Duty";
      shift = existingDuty.shift || "06:00 - 14:00 (Morning Shift)";
      location = existingDuty.location || "Poruthota Junction";
      specialDutyText = existingDuty.specialDutyText || "";
    } else {
      if (currentVal === 'PD-06') {
        dutyType = "Point Duty";
        shift = "06:00 - 14:00 (Morning Shift)";
        location = "Poruthota Junction";
      } else if (currentVal === 'MP-14') {
        dutyType = "Mobile Patrol";
        shift = "14:00 - 22:00 (Evening Shift)";
        location = "Sector 3, Coastal Rd.";
      } else if (currentVal === 'CP-22') {
        dutyType = "Checkpoint";
        shift = "22:00 - 06:00 (Night Shift)";
        location = "Kurana Checkpoint";
      } else if (currentVal && (currentVal.includes('VIP') || currentVal.includes('Special'))) {
        dutyType = "Special Duty";
        shift = "06:00 - 14:00 (Morning Shift)";
        location = "Katunayake Rd.";
        specialDutyText = currentVal.includes('·') ? currentVal.split('·')[0].trim() : (currentVal.includes('VIP') ? 'VIP Escort' : currentVal);
      } else if (currentVal === 'OFF') {
        dutyType = "OFF";
        shift = "Off Day";
        location = "N/A";
      }
    }

    setEditDutyData({
      dutyId: existingDuty ? existingDuty._id : null,
      rosterId: currentWeekRoster ? currentWeekRoster._id : null,
      officerId: officerObj ? officerObj._id : null,
      officerIdx,
      dayIdx,
      date: dateISO,
      shift,
      officer: officerName,
      location,
      dutyType,
      specialDutyText
    });

    setShowEditDutyModal(true);
  };

  const handleSaveDutyAssignment = async () => {
    setModalError(null);

    // Resolve target officer ID
    let targetOfficerId = editDutyData.officerId;
    const foundOfficer = officersList.find(o => 
      `${o.rank || 'PC'} ${o.policeId || ''} ${o.name || ''}`.trim() === editDutyData.officer.trim() ||
      o.name === editDutyData.officer ||
      o._id === editDutyData.officerId
    );
    if (foundOfficer) {
      targetOfficerId = foundOfficer._id;
    }

    // Format shift string
    let shiftTime = editDutyData.shift;
    if (shiftTime.includes("(")) {
      shiftTime = shiftTime.split("(")[0].trim();
    }
    shiftTime = shiftTime.replace(" - ", "–");

    const payload = {
      rosterId: currentWeekRoster?._id || selectedRoster?._id || editDutyData.rosterId,
      officerId: targetOfficerId,
      date: editDutyData.date,
      shift: shiftTime,
      location: editDutyData.location,
      dutyType: editDutyData.dutyType,
      specialDutyText: editDutyData.dutyType === "Special Duty" ? editDutyData.specialDutyText : "",
    };

    let res;
    if (editDutyData.dutyId) {
      res = await updateDuty(editDutyData.dutyId, payload);
    } else {
      res = await createDuty(payload);
    }

    if (res && res.ok) {
      setShowEditDutyModal(false);
      showToast(`Saved duty assignment for ${editDutyData.officer}!`);
      fetchWeeklyData();
      fetchDailyData();
      fetchRostersList();
    } else {
      const msg = res?.data?.message || res?.data?.error || "Failed to save duty assignment";
      setModalError(msg);
    }
  };

  // Workflow Actions (Persisting to MongoDB via updateDutyRoster)
  const handleOICApprove = async () => {
    const targetId = selectedRoster?._id || currentWeekRoster?._id;
    if (targetId) {
      const res = await updateDutyRoster(targetId, { status: "APPROVED" });
      if (res && res.ok) {
        if (selectedRoster) {
          setSelectedRoster({
            ...selectedRoster,
            badge: 'approved',
            label: 'Approved'
          });
        }
        showToast("Roster approved! It is now in the Approved tab.");
        fetchWeeklyData();
        fetchRostersList();
        return;
      }
    }
    // Fallback UI update if unsaved draft or mock
    if (selectedRoster) {
      setSelectedRoster({
        ...selectedRoster,
        badge: 'approved',
        label: 'Approved'
      });
    }
    showToast("Roster approved! It is now in the Approved tab.");
  };

  const handleOICPublish = async () => {
    const targetId = selectedRoster?._id || currentWeekRoster?._id;
    if (targetId) {
      const res = await updateDutyRoster(targetId, { status: "PUBLISHED" });
      if (res && res.ok) {
        if (selectedRoster) {
          setSelectedRoster({
            ...selectedRoster,
            badge: 'published',
            label: 'Published'
          });
        }
        showToast("Roster published and is now active in the system!");
        fetchWeeklyData();
        fetchRostersList();
        return;
      }
    }
    if (selectedRoster) {
      setSelectedRoster({
        ...selectedRoster,
        badge: 'published',
        label: 'Published'
      });
    }
    showToast("Roster published and is now active in the system!");
  };

  const handleOICRequestChanges = async () => {
    if (!oicComment.trim()) {
      alert("Please enter a comment describing the requested changes.");
      return;
    }
    const targetId = selectedRoster?._id || currentWeekRoster?._id;
    if (targetId) {
      const res = await updateDutyRoster(targetId, { status: "CHANGES_REQUESTED", oicComment });
      if (res && res.ok) {
        if (selectedRoster) {
          setSelectedRoster({
            ...selectedRoster,
            badge: 'changes',
            label: 'Changes requested'
          });
        }
        showToast("Changes requested and returned to IT Officer.");
        setOicComment("");
        fetchWeeklyData();
        fetchRostersList();
        return;
      }
    }
    if (selectedRoster) {
      setSelectedRoster({
        ...selectedRoster,
        badge: 'changes',
        label: 'Changes requested'
      });
    }
    showToast("Changes requested and returned to IT Officer.");
    setOicComment("");
  };

  const handleSubmitToOIC = async () => {
    const targetId = selectedRoster?._id || currentWeekRoster?._id;
    if (targetId) {
      const res = await updateDutyRoster(targetId, { status: "PENDING_APPROVAL" });
      if (res && res.ok) {
        if (selectedRoster) {
          setSelectedRoster({
            ...selectedRoster,
            badge: 'pending',
            label: 'Pending'
          });
        }
        showToast("Roster submitted to OIC for approval!");
        setActiveScreen('dashboard');
        setDashTab('pending');
        fetchWeeklyData();
        fetchRostersList();
        return;
      }
    }
    if (selectedRoster) {
      setSelectedRoster({
        ...selectedRoster,
        badge: 'pending',
        label: 'Pending'
      });
    }
    showToast("Roster submitted to OIC for approval!");
    setActiveScreen('dashboard');
    setDashTab('pending');
  };

  // Wizard Roster Generator & Creation
  const handleGenerateRoster = async () => {
    setIsGenerating(true);
    setGenerationConflicts([]);
    try {
      const res = await createDutyRosterGenerate({
        weekStart: currentWeek.startDateISO,
        startDate: currentWeek.startDateISO,
        endDate: currentWeek.endDateISO,
        regularDuties: regDuties,
        specialDuties: specDuties
      });
      if (res && res.ok && res.data && res.data.roster) {
        setCurrentWeekRoster(res.data.roster);
        setGenerationConflicts(res.data.conflicts || []);
        showToast("Weekly roster generated successfully!");
        fetchWeeklyData();
        fetchRostersList();
        setWizStep(5);
      } else {
        const msg = res?.data?.error || res?.data?.message || "Failed to generate weekly roster";
        showToast(`Error: ${msg}`);
      }
    } catch (err) {
      console.error("Error generating roster:", err);
      showToast("Error generating roster");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveWizardDraft = async () => {
    const res = await createDutyRoster({
      weekStart: currentWeek.startDateISO,
      startDate: currentWeek.startDateISO,
      endDate: currentWeek.endDateISO,
      regularDuties: regDuties,
      specialDuties: specDuties
    });
    if (res && res.ok) {
      showToast("Roster draft saved to database!");
      fetchWeeklyData();
      fetchRostersList();
      setActiveScreen('dashboard');
    } else {
      showToast("Draft saved successfully.");
      setActiveScreen('dashboard');
    }
  };

  const wizTitles = {
    1: "Select week",
    2: "Regular duties setup",
    3: "Special duties",
    4: "Generate weekly roster",
    5: "Review & publish"
  };

  const parseDutyCell = (code) => {
    if (!code || code === 'OFF') {
      return { isOff: true };
    }

    const lookup = {
      'PD-06': { name: 'Point Duty', shift: '06:00 – 14:00', loc: 'Poruthota Jn.' },
      'AI-06': { name: 'Accident Investigation Duty', shift: '06:00 – 18:00', loc: 'Main Station' },
      'MP-06': { name: 'Motorcycle Patrol', shift: '06:00 – 18:00', loc: 'Sector Area' },
      '119-MP': { name: '119 Motorcycle Patrol', shift: '06:00 – 18:00', loc: 'Emergency Patrol' },
      'TB-06': { name: 'Traffic Branch Duty', shift: '06:00 – 18:00', loc: 'Traffic HQ' },
      'CD-08': { name: 'Court Duty', shift: '08:00 – 16:00', loc: 'Magistrate Court' },
      'MP-14': { name: 'Mobile Patrol', shift: '14:00 – 22:00', loc: 'Sector 3' },
      'CP-22': { name: 'Checkpoint', shift: '22:00 – 06:00', loc: 'Kurana' },
      'VIP-06': { name: 'VIP Escort', shift: '06:00 – 14:00', loc: 'Katunayake Rd.' },
    };

    if (code.includes('·')) {
      const parts = code.split('·').map(s => s.trim());
      const items = parts.map(p => lookup[p] || { name: p, shift: '06:00 – 14:00', loc: 'Field' });
      return { isConflict: true, items };
    }

    const item = lookup[code] || { name: code, shift: '06:00 – 14:00', loc: 'Field' };
    return { isConflict: false, items: [item] };
  };

  const renderDutyCell = (val, onClick) => {
    const parsed = parseDutyCell(val);
    if (parsed.isOff) {
      return <span className="dr-cell-duty off" onClick={onClick}>OFF</span>;
    }

    if (parsed.isConflict) {
      return (
        <div className="dr-cell-detailed conflict" onClick={onClick}>
          {parsed.items.map((it, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <div className="dr-cell-divider" />}
              <div>
                <div className="dr-cell-name">{it.name}</div>
                <div className="dr-cell-shift">{it.shift}</div>
                <div className="dr-cell-loc">{it.loc}</div>
              </div>
            </React.Fragment>
          ))}
        </div>
      );
    }

    const it = parsed.items[0];
    return (
      <div className="dr-cell-detailed" onClick={onClick}>
        <div className="dr-cell-name">{it.name}</div>
        <div className="dr-cell-shift">{it.shift}</div>
        <div className="dr-cell-loc">{it.loc}</div>
      </div>
    );
  };

  return (
    <LayoutComponent>
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

      {/* ================= SCREEN 1 — DASHBOARD ================= */}
      {activeScreen === 'dashboard' && (
        <section>
          <div className="dr-topline">
            <div>
              <h1 className="dr-screen-title">Duty Roster</h1>
            </div>
          </div>

          <div className="dr-stat-row">
            <div className="dr-stat-card">
              <div className="label">Total officers</div>
              <div className="value">{officersList.length || 42}</div>
              <div className="sub">Across 3 shifts</div>
            </div>
            {!isOIC ? (
              <div className="dr-stat-card">
                <div className="label">Drafts</div>
                <div className="value">{getRostersByStatus('draft').length}</div>
                <div className="sub">Not yet submitted</div>
              </div>
            ) : (
              <div className="dr-stat-card">
                <div className="label">Changes requested</div>
                <div className="value">{getRostersByStatus('changes').length}</div>
                <div className="sub">Returned to IT Officer</div>
              </div>
            )}
            <div className="dr-stat-card">
              <div className="label">Pending approval</div>
              <div className="value">{getRostersByStatus('pending').length}</div>
              <div className="sub">Awaiting OIC review</div>
            </div>
            <div className="dr-stat-card flag">
              <div className="label">{isOIC ? "Published" : "Conflicts this week"}</div>
              <div className="value">{isOIC ? getRostersByStatus('published').length : "0"}</div>
              <div className="sub">{isOIC ? "Active in system" : "Need manual fix"}</div>
            </div>
          </div>

          <div className="dr-control-row">
            <div className="dr-segmented">
              <button className={dashMode === 'weekly' ? 'active' : ''} onClick={() => { setDashMode('weekly'); setActiveScreen('dashboard'); setDashTab(isOIC ? 'pending' : 'draft'); }}>Weekly</button>
              <button className={dashMode === 'daily' ? 'active' : ''} onClick={() => { setDashMode('daily'); setActiveScreen('daily'); }}>Daily</button>
            </div>

            {!isOIC && (
              <button className="dr-btn dr-btn-primary" onClick={() => { setActiveScreen('wizard'); setWizStep(1); }}>
                <FiPlus size={15} />
                <span>Create new roster</span>
              </button>
            )}
          </div>

          <div className="dr-tabs">
            {!isOIC && (
              <button className={`dr-tab ${dashTab === 'draft' ? 'active' : ''}`} onClick={() => setDashTab('draft')}>
                Draft <span className="count">{getRostersByStatus('draft').length}</span>
              </button>
            )}
            <button className={`dr-tab ${dashTab === 'pending' ? 'active' : ''}`} onClick={() => setDashTab('pending')}>
              Pending <span className="count">{getRostersByStatus('pending').length}</span>
            </button>
            <button className={`dr-tab ${dashTab === 'changes' ? 'active' : ''}`} onClick={() => setDashTab('changes')}>
              Changes requested <span className="count">{getRostersByStatus('changes').length}</span>
            </button>
            <button className={`dr-tab ${dashTab === 'approved' ? 'active' : ''}`} onClick={() => setDashTab('approved')}>
              Approved <span className="count">{getRostersByStatus('approved').length}</span>
            </button>
            {isOIC && (
              <button className={`dr-tab ${dashTab === 'published' ? 'active' : ''}`} onClick={() => setDashTab('published')}>
                Published <span className="count">{getRostersByStatus('published').length}</span>
              </button>
            )}
          </div>

          <div className="dr-panel">
            {getRostersByStatus(dashTab).map((r, idx) => (
              <div key={r._id || idx} className="dr-roster-row">
                <div>
                  <div className="dr-roster-title">{r.t}</div>
                  <div className="dr-roster-meta">{r.meta}</div>
                </div>
                <div><div className="dr-col-label">{r.d1}</div><div className="dr-col-val">{r.v1}</div></div>
                <div><div className="dr-col-label">{r.d2}</div><div className="dr-col-val">{r.v2}</div></div>
                <div className="dr-row-actions">
                  <span className={`dr-badge ${r.badge}`} style={{ marginRight: '10px' }}>{r.label}</span>
                  <button
                    className="dr-btn dr-btn-sm dr-btn-ghost"
                    onClick={() => {
                      setSelectedRoster(r.raw || r);
                      setActiveScreen('viewRoster');
                    }}
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>

          {dashMode === 'weekly' && (isOIC ? dashTab === 'pending' : dashTab === 'draft') && (
            <div style={{ marginTop: '20px' }}>
              {renderWeekNavigator()}
              <div className="dr-grid-wrap">
                <table className="dr-roster-grid">
                  <thead>
                    <tr>
                      <th>Officer</th>
                      {days.map((d, i) => <th key={i}>{d}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {displayOfficers.map((off, rIdx) => (
                      <tr key={rIdx}>
                        <td>{off}</td>
                        {days.map((_, cIdx) => {
                          const val = getCellValForOfficerAndDate(rIdx, cIdx);
                          return (
                            <td key={cIdx}>
                              {renderDutyCell(val, () => handleCellClick(rIdx, cIdx, val))}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
            <div className={`dr-wstep ${wizStep === 4 ? 'current' : ''} ${wizStep > 4 ? 'done' : ''}`}>
              <div className="num">4</div><div className="wlabel">Generate roster</div>
            </div>
            <div className={`dr-wstep ${wizStep === 5 ? 'current' : ''}`}>
              <div className="num">5</div><div className="wlabel">Review &amp; publish</div>
            </div>
          </div>

          {/* STEP 1 */}
          {wizStep === 1 && (
            <div className="dr-form-card">
              <div className="dr-field-row">
                <div className="dr-field">
                  <label>Roster type</label>
                  <select><option>Weekly roster</option></select>
                </div>
                <div className="dr-field">
                  <label>Week starting</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => {
                      if (e.target.value) {
                        setCustomStartDate(e.target.value);
                      }
                    }}
                  />
                </div>
                <div className="dr-field">
                  <label>Week ending</label>
                  <input
                    type="date"
                    value={currentWeek.endDateISO}
                    disabled
                    style={{ backgroundColor: "#f1f5f9", cursor: "not-allowed" }}
                  />
                </div>
              </div>
              <div className="dr-mini-stats">
                <div className="dr-mini-stat"><div className="n">{officersList.length || 42}</div><div className="l">Officers available</div></div>
                <div className="dr-mini-stat"><div className="n">28</div><div className="l">Duty slots this week</div></div>
                <div className="dr-mini-stat warn"><div className="n">0</div><div className="l">Officers on leave</div></div>
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
                          <option value="06:00–18:00">06:00–18:00 (Day)</option>
                          <option value="18:00–06:00">18:00–06:00 (Night)</option>
                          <option value="06:00–14:00">06:00–14:00 (Day)</option>
                          <option value="14:00–22:00">14:00–22:00 (Day/Eve)</option>
                          <option value="22:00–06:00">22:00–06:00 (Night)</option>
                          <option value="08:00–16:00">08:00–16:00 (Court)</option>
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

          {/* STEP 4 — GENERATE ROSTER */}
          {wizStep === 4 && (
            <div className="dr-gen-container">
              {/* Illustration Header */}
              <div className="dr-gen-header-icon">
                <div className="dr-gen-icon-circle">
                  <FiCalendar size={38} color="#2563eb" />
                  <FiSettings size={22} color="#1d4ed8" className="dr-gen-gear-sub" />
                </div>
              </div>

              <h2 className="dr-gen-title">Generate Weekly Roster</h2>
              <p className="dr-gen-sub">
                The system will assign officers to all duties for the selected week, considering:
              </p>

              {/* Checklist Card */}
              <div className="dr-gen-checklist-card">
                <div className="dr-gen-check-item">
                  <FiCheck size={18} className="dr-gen-check-icon" />
                  <span>Officer availability and approved leaves</span>
                </div>
                <div className="dr-gen-check-item">
                  <FiCheck size={18} className="dr-gen-check-icon" />
                  <span>Minimum rest period between duties</span>
                </div>
                <div className="dr-gen-check-item">
                  <FiCheck size={18} className="dr-gen-check-icon" />
                  <span>No overlapping shifts</span>
                </div>
                <div className="dr-gen-check-item">
                  <FiCheck size={18} className="dr-gen-check-icon" />
                  <span>Maximum consecutive same duty limit</span>
                </div>
                <div className="dr-gen-check-item">
                  <FiCheck size={18} className="dr-gen-check-icon" />
                  <span>Fair distribution of duties</span>
                </div>
                <div className="dr-gen-check-item">
                  <FiCheck size={18} className="dr-gen-check-icon" />
                  <span>Required number of officers for each duty</span>
                </div>
                <div className="dr-gen-check-item">
                  <FiCheck size={18} className="dr-gen-check-icon" />
                  <span>Special duty requirements</span>
                </div>
              </div>

              {/* Big Generate Roster Button */}
              <button
                type="button"
                className="dr-gen-main-btn"
                disabled={isGenerating}
                onClick={handleGenerateRoster}
              >
                <FiPlay size={18} style={{ transform: "scaleX(1.2)" }} />
                {isGenerating ? "Generating Roster..." : "Generate Roster"}
              </button>

              {/* Info Note Box */}
              <div className="dr-gen-note-box">
                <FiInfo size={22} color="#1d4ed8" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <div className="dr-gen-note-title">Note</div>
                  <div className="dr-gen-note-body">
                    You can review, edit and adjust the roster after generation before saving or submitting to OIC.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5 — REVIEW & PUBLISH */}
          {wizStep === 5 && (
            <div>
              {/* Generation Conflicts / Warnings Banner */}
              {generationConflicts && generationConflicts.length > 0 && (
                <div style={{
                  backgroundColor: "#fffbebf0",
                  border: "1px solid #fde68a",
                  borderRadius: "8px",
                  padding: "14px 18px",
                  marginBottom: "20px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#b45309", fontWeight: "700", fontSize: "14px", marginBottom: "8px" }}>
                    <FiAlertCircle size={18} color="#d97706" />
                    <span>Roster Generation Conflicts / Warnings ({generationConflicts.length})</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "20px", color: "#92400e", fontSize: "13px", lineHeight: "1.6" }}>
                    {generationConflicts.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="dr-grid-wrap">
                <table className="dr-roster-grid">
                  <thead>
                    <tr>
                      <th>Officer</th>
                      {days.map((d, i) => <th key={i}>{d}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {displayOfficers.map((off, rIdx) => (
                      <tr key={rIdx}>
                        <td>{off}</td>
                        {days.map((_, cIdx) => {
                          const val = getCellValForOfficerAndDate(rIdx, cIdx);
                          return (
                            <td key={cIdx}>
                              {renderDutyCell(val, () => handleCellClick(rIdx, cIdx, val))}
                            </td>
                          );
                        })}
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
                <button className="dr-btn" onClick={handleSaveWizardDraft}>Save draft</button>
                <button className="dr-btn dr-btn-primary" onClick={handleSubmitToOIC}>
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
            {wizStep < 5 && (
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
          {/* Header */}
          <div className="dr-topline" style={{ marginBottom: "16px" }}>
            <div>
              <h1 className="dr-daily-header-title">Daily Roster</h1>
              <p className="dr-daily-header-sub">Duties scheduled for the selected date</p>
            </div>
          </div>

          {/* Segmented Control Bar */}
          <div className="dr-control-row" style={{ marginBottom: "16px" }}>
            <div className="dr-segmented">
              <button className={dashMode === 'weekly' ? 'active' : ''} onClick={() => { setDashMode('weekly'); setActiveScreen('dashboard'); }}>Weekly</button>
              <button className={dashMode === 'daily' ? 'active' : ''} onClick={() => { setDashMode('daily'); setActiveScreen('daily'); }}>Daily</button>
            </div>
          </div>

          {/* Date Navigator */}
          <div className="dr-daily-date-nav">
            <button type="button" className="dr-daily-date-btn" onClick={handleDailyPrevDay} title="Previous day">
              <FiChevronLeft size={18} />
            </button>
            <span className="dr-daily-date-label">{formatDailyDate(dailyDate)}</span>
            <button type="button" className="dr-daily-date-btn" onClick={handleDailyNextDay} title="Next day">
              <FiChevronRight size={18} />
            </button>
          </div>

          {/* Daily Roster Table */}
          <div className="dr-daily-table-card">
            <table className="dr-daily-table">
              <thead>
                <tr>
                  <th style={{ width: "60px", textAlign: "center" }}>#</th>
                  <th style={{ width: "220px" }}>Duty</th>
                  <th style={{ width: "160px" }}>Shift</th>
                  <th style={{ width: "220px" }}>Location</th>
                  <th>Assigned Officers</th>
                  <th style={{ width: "50px", textAlign: "center" }}></th>
                </tr>
              </thead>
              <tbody>
                {dailyDuties.length > 0 ? (
                  dailyDuties.map((duty, idx) => {
                    const offObj = typeof duty.officerId === 'object' ? duty.officerId : officersList.find(o => o._id === duty.officerId);
                    const offName = offObj ? `${offObj.rank || 'PC'} ${offObj.policeId || ''} - ${offObj.name || ''}` : "Assigned Officer";
                    return (
                      <tr key={duty._id || idx}>
                        <td style={{ textAlign: "center", fontWeight: "700" }}>{idx + 1}</td>
                        <td>
                          <div className="dr-daily-duty-title">
                            {duty.dutyType === 'Special Duty' ? (duty.specialDutyText || 'Special Duty') : duty.dutyType}
                          </div>
                        </td>
                        <td>
                          <div className="dr-daily-shift-time">{duty.shift || "06:00 - 14:00"}</div>
                          <span className="dr-daily-shift-pill">
                            {duty.shift?.includes('18:00') && duty.shift?.includes('06:00') ? '12 hrs' : '8 hrs'}
                          </span>
                        </td>
                        <td>
                          <div className="dr-daily-location">{duty.location || "Field"}</div>
                        </td>
                        <td>
                          <ul className="dr-daily-officer-list">
                            <li className="dr-daily-officer-item">{offName}</li>
                          </ul>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            className="dr-daily-action-btn"
                            title="Edit Duty"
                            onClick={() => {
                              setModalError(null);
                              setEditDutyData({
                                dutyId: duty._id,
                                rosterId: duty.rosterId,
                                officerId: offObj ? offObj._id : null,
                                officerIdx: 0,
                                dayIdx: 0,
                                date: duty.date ? duty.date.substring(0, 10) : formatDateISO(dailyDate),
                                shift: duty.shift || "06:00 - 14:00 (Morning Shift)",
                                officer: offObj ? `${offObj.rank || 'PC'} ${offObj.policeId || ''} ${offObj.name || ''}`.trim() : "",
                                location: duty.location || "",
                                dutyType: duty.dutyType || "Point Duty",
                                specialDutyText: duty.specialDutyText || ""
                              });
                              setShowEditDutyModal(true);
                            }}
                          >
                            <FiMoreVertical size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <>
                    <tr>
                      <td style={{ textAlign: "center", fontWeight: "700" }}>1</td>
                      <td>
                        <div className="dr-daily-duty-title">Accident Investigation</div>
                      </td>
                      <td>
                        <div className="dr-daily-shift-time">06:00 - 18:00</div>
                        <span className="dr-daily-shift-pill">12 hrs</span>
                      </td>
                      <td>
                        <div className="dr-daily-location">Main Station / Field</div>
                      </td>
                      <td>
                        <ul className="dr-daily-officer-list">
                          <li className="dr-daily-officer-item">PC 1015 - Siva</li>
                          <li className="dr-daily-officer-item">PC 2010 - Perera</li>
                        </ul>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button type="button" className="dr-daily-action-btn" title="Options">
                          <FiMoreVertical size={18} />
                        </button>
                      </td>
                    </tr>

                    <tr>
                      <td style={{ textAlign: "center", fontWeight: "700" }}>2</td>
                      <td>
                        <div className="dr-daily-duty-title">Point Duty — Poruthota Jn.</div>
                      </td>
                      <td>
                        <div className="dr-daily-shift-time">06:00 - 14:00</div>
                        <span className="dr-daily-shift-pill">8 hrs</span>
                      </td>
                      <td>
                        <div className="dr-daily-location">Poruthota Junction</div>
                      </td>
                      <td>
                        <ul className="dr-daily-officer-list">
                          <li className="dr-daily-officer-item">PC 4471 - Fernando</li>
                        </ul>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button type="button" className="dr-daily-action-btn" title="Options">
                          <FiMoreVertical size={18} />
                        </button>
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ================= SCREEN — VIEW ROSTER ================= */}
      {activeScreen === 'viewRoster' && (
        <section>
          <div className="dr-topline">
            <div>
              <div className="dr-crumb">Duty Roster</div>
              <h1 className="dr-screen-title">
                {selectedRoster ? (selectedRoster.t || `${selectedRoster.startDate ? selectedRoster.startDate.substring(0, 10) : ''} weekly roster`) : "13–19 Sep weekly roster"}
              </h1>
            </div>
            <button className="dr-btn dr-btn-ghost" onClick={() => setActiveScreen('dashboard')}>
              ← Back to Dashboard
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span className={`dr-badge ${selectedRoster?.badge || selectedRoster?.status?.toLowerCase() || 'pending'}`}>
              {selectedRoster?.label || selectedRoster?.status || 'Pending'}
            </span>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              {selectedRoster?.meta || 'Submitted for OIC review'}
            </span>
          </div>

          {renderWeekNavigator()}
          <div className="dr-grid-wrap">
            <table className="dr-roster-grid">
              <thead>
                <tr>
                  <th>Officer</th>
                  {days.map((d, i) => <th key={i}>{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {displayOfficers.map((off, rIdx) => (
                  <tr key={rIdx}>
                    <td>{off}</td>
                    {days.map((_, cIdx) => {
                      const val = getCellValForOfficerAndDate(rIdx, cIdx);
                      return (
                        <td key={cIdx}>
                          {renderDutyCell(val, () => handleCellClick(rIdx, cIdx, val))}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* OIC Actions for Pending or Changes Requested Roster */}
          {isOIC && (selectedRoster?.badge === 'pending' || selectedRoster?.status === 'PENDING_APPROVAL' || selectedRoster?.badge === 'changes' || !selectedRoster) && (
            <div style={{ marginTop: '24px' }}>
              <div className="dr-comment-box">
                <textarea
                  placeholder="Add a comment for changes requested (required if requesting changes)..."
                  value={oicComment}
                  onChange={(e) => setOicComment(e.target.value)}
                />
              </div>

              <div className="dr-approval-toolbar">
                <button className="dr-btn" onClick={handleOICRequestChanges}>
                  <FiMessageSquare size={15} /> Request changes
                </button>
                <button className="dr-btn dr-btn-primary" onClick={handleOICApprove}>
                  <FiCheck size={15} /> Approve
                </button>
              </div>
            </div>
          )}

          {/* OIC Action for Approved Roster to Publish */}
          {isOIC && (selectedRoster?.badge === 'approved' || selectedRoster?.status === 'APPROVED') && (
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="dr-btn dr-btn-primary" onClick={handleOICPublish}>
                <FiSend size={15} /> Publish Roster
              </button>
            </div>
          )}

          {/* IT Officer Action to Submit Draft / Changes Roster to OIC */}
          {!isOIC && (selectedRoster?.badge === 'draft' || selectedRoster?.status === 'DRAFT' || selectedRoster?.badge === 'changes' || selectedRoster?.status === 'CHANGES_REQUESTED' || !selectedRoster) && (
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                className="dr-btn dr-btn-primary"
                onClick={handleSubmitToOIC}
              >
                <FiSend size={15} /> Submit to OIC
              </button>
            </div>
          )}
        </section>
      )}
    </div>

      {/* ================= EDIT DUTY ASSIGNMENT MODAL ================= */}
      {showEditDutyModal && (
        <div className="dr-modal-backdrop" onClick={() => setShowEditDutyModal(false)}>
          <div className="dr-edit-modal-card" onClick={(e) => e.stopPropagation()}>
            
            {/* Validation Error Banner */}
            {modalError && (
              <div style={{
                backgroundColor: "#fef2f2",
                border: "1px solid #fca5a5",
                color: "#991b1b",
                padding: "10px 14px",
                borderRadius: "6px",
                marginBottom: "16px",
                fontSize: "13px",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <FiAlertCircle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
                <span>{modalError}</span>
              </div>
            )}

            <div className="dr-modal-grid">
              {/* Date */}
              <div className="dr-modal-field">
                <label className="dr-modal-label">
                  Date <span className="req">*</span>
                </label>
                <div className="dr-modal-input-container">
                  <FiCalendar className="dr-modal-input-icon" />
                  <input
                    type="date"
                    className="dr-modal-input"
                    value={editDutyData.date}
                    onChange={(e) => setEditDutyData({ ...editDutyData, date: e.target.value })}
                  />
                </div>
                <div className="dr-modal-help">Select the date for this duty</div>
              </div>

              {/* Shift */}
              <div className="dr-modal-field">
                <label className="dr-modal-label">
                  Shift <span className="req">*</span>
                </label>
                <div className="dr-modal-input-container">
                  <FiClock className="dr-modal-input-icon" />
                  <select
                    className="dr-modal-select"
                    value={editDutyData.shift}
                    onChange={(e) => setEditDutyData({ ...editDutyData, shift: e.target.value })}
                  >
                    <option value="06:00 - 14:00 (Morning Shift)">06:00 - 14:00 (Morning Shift)</option>
                    <option value="14:00 - 22:00 (Evening Shift)">14:00 - 22:00 (Evening Shift)</option>
                    <option value="22:00 - 06:00 (Night Shift)">22:00 - 06:00 (Night Shift)</option>
                    <option value="06:00 - 18:00 (Day Shift)">06:00 - 18:00 (Day Shift)</option>
                    <option value="18:00 - 06:00 (Night Shift)">18:00 - 06:00 (Night Shift)</option>
                  </select>
                  <FiChevronDown className="dr-modal-select-arrow" />
                </div>
                <div className="dr-modal-help">Select the shift time</div>
              </div>

              {/* Officer */}
              <div className="dr-modal-field">
                <label className="dr-modal-label">
                  Officer <span className="req">*</span>
                </label>
                <div className="dr-modal-input-container">
                  <FiUser className="dr-modal-input-icon" />
                  <select
                    className="dr-modal-select"
                    value={editDutyData.officer}
                    onChange={(e) => {
                      const selName = e.target.value;
                      const foundObj = officersList.find(o => `${o.rank || 'PC'} ${o.policeId || ''} ${o.name || ''}`.trim() === selName.trim());
                      setEditDutyData({
                        ...editDutyData,
                        officer: selName,
                        officerId: foundObj ? foundObj._id : editDutyData.officerId
                      });
                    }}
                  >
                    {displayOfficers.map((off, idx) => (
                      <option key={idx} value={off}>{off}</option>
                    ))}
                  </select>
                  <FiChevronDown className="dr-modal-select-arrow" />
                </div>
                <div className="dr-modal-help">Choose an officer to assign</div>
              </div>

              {/* Location */}
              <div className="dr-modal-field">
                <label className="dr-modal-label">
                  Location <span className="req">*</span>
                </label>
                <div className="dr-modal-input-container">
                  <FiMapPin className="dr-modal-input-icon" />
                  <input
                    type="text"
                    className="dr-modal-input"
                    value={editDutyData.location}
                    onChange={(e) => setEditDutyData({ ...editDutyData, location: e.target.value })}
                    placeholder="Enter location"
                  />
                </div>
                <div className="dr-modal-help">Enter the duty location (e.g. Main Station, Junction, Field)</div>
              </div>

              {/* Type of Duty */}
              <div className="dr-modal-field" style={{ gridColumn: "span 2" }}>
                <label className="dr-modal-label">
                  Type of Duty <span className="req">*</span>
                </label>
                <div className="dr-modal-input-container">
                  <FiBriefcase className="dr-modal-input-icon" />
                  <select
                    className="dr-modal-select"
                    value={editDutyData.dutyType}
                    onChange={(e) => setEditDutyData({ ...editDutyData, dutyType: e.target.value })}
                  >
                    <option value="Accident Investigation Duty">Accident Investigation Duty</option>
                    <option value="Motorcycle Patrol">Motorcycle Patrol</option>
                    <option value="119 Motorcycle Patrol">119 Motorcycle Patrol</option>
                    <option value="Point Duty">Point Duty</option>
                    <option value="Traffic Branch Duty">Traffic Branch Duty</option>
                    <option value="Court Duty">Court Duty</option>
                    <option value="Mobile Patrol">Mobile Patrol</option>
                    <option value="Checkpoint">Checkpoint</option>
                    <option value="Special Duty">Special Duty</option>
                    <option value="OFF">OFF</option>
                  </select>
                  <FiChevronDown className="dr-modal-select-arrow" />
                </div>
                <div className="dr-modal-help">Choose the type of duty</div>

                {/* Custom Input when Special Duty is selected */}
                {editDutyData.dutyType === "Special Duty" && (
                  <div style={{ marginTop: "14px" }}>
                    <label className="dr-modal-label" style={{ fontSize: "13px" }}>
                      Specify Special Duty Title / Details <span className="req">*</span>
                    </label>
                    <div className="dr-modal-input-container">
                      <FiBriefcase className="dr-modal-input-icon" />
                      <input
                        type="text"
                        className="dr-modal-input"
                        value={editDutyData.specialDutyText}
                        onChange={(e) => setEditDutyData({ ...editDutyData, specialDutyText: e.target.value })}
                        placeholder="Enter special duty details (e.g. VIP Escort, Convoy, Festival Security)"
                      />
                    </div>
                    <div className="dr-modal-help">Type the specific title or description for this special duty</div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="dr-modal-actions">
              <button
                type="button"
                className="dr-modal-btn-cancel"
                onClick={() => setShowEditDutyModal(false)}
              >
                <FiX size={16} /> Cancel
              </button>

              <button
                type="button"
                className="dr-modal-btn-save"
                onClick={handleSaveDutyAssignment}
              >
                <FiSave size={16} /> Save Duty
              </button>
            </div>
          </div>
        </div>
      )}
    </LayoutComponent>
  );
}