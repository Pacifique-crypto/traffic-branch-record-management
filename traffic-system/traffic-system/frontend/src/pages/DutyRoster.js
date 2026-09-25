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
  FiChevronUp,
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

  const formatDateISO = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getWeekSunday = (offset = 0) => {
    const now = new Date();
    const day = now.getDay(); // 0 is Sunday, 1 is Monday, ... 6 is Saturday
    const baseSun = new Date(now);
    baseSun.setDate(now.getDate() - day + offset * 7);
    baseSun.setHours(0, 0, 0, 0);
    return baseSun;
  };

  // Week Navigation State & Helper
  const [weekOffset, setWeekOffset] = useState(0);
  const [customStartDate, setCustomStartDate] = useState(() => formatDateISO(getWeekSunday(0)));

  // Daily View Date State & Helper
  const [dailyDate, setDailyDate] = useState(() => new Date());

  const formatDailyDate = (dateObj) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayName = days[dateObj.getDay()];
    const dayNum = dateObj.getDate();
    const monthName = months[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    return `${dayName}, ${dayNum} ${monthName} ${year}`;
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
      let list = [];
      if (Array.isArray(res)) {
        list = res;
      } else if (res && Array.isArray(res.officers)) {
        list = res.officers;
      }
      // Only include Active officers on the duty roster
      const activeOfficers = list.filter(o => {
        const st = (o.status || "").trim().toLowerCase();
        return st === "active" || (!o.status && st !== "inactive" && st !== "deactive" && st !== "disabled");
      });
      setOfficersList(activeOfficers);
    } catch (err) {
      console.error("Error fetching officers:", err);
    }
  };

  const fetchRostersList = async () => {
    try {
      const res = await getDutyRosters();
      let list = [];
      if (Array.isArray(res)) {
        list = res;
      } else if (res && Array.isArray(res.rosters)) {
        list = res.rosters;
      }
      if (isOIC) {
        list = list.filter(r => (r.status || "").toUpperCase() !== "DRAFT");
      }
      setRostersList(list);
    } catch (err) {
      console.error("Error fetching rosters:", err);
    }
  };

  const setRosterDateAndOffset = (dateStr) => {
    if (!dateStr) return null;
    let d;
    if (typeof dateStr === 'string' && dateStr.length >= 10 && dateStr.includes('-')) {
      const parts = dateStr.substring(0, 10).split('-').map(Number);
      d = new Date(parts[0], parts[1] - 1, parts[2]);
    } else {
      d = new Date(dateStr);
    }
    if (isNaN(d.getTime())) return null;

    const day = d.getDay();
    const sunObj = new Date(d);
    sunObj.setDate(d.getDate() - day);
    sunObj.setHours(0, 0, 0, 0);

    const sunISO = formatDateISO(sunObj);
    setCustomStartDate(sunISO);

    const nowSun = getWeekSunday(0);
    const diffMs = sunObj.getTime() - nowSun.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const newOff = Math.round(diffDays / 7);
    setWeekOffset(newOff);
    return sunISO;
  };

  const fetchWeeklyData = async (overrideDateISO = null) => {
    try {
      setIsLoading(true);
      const targetQueryDate = overrideDateISO || currentWeek.startDateISO;
      const res = await getDutyRosterByWeek(targetQueryDate);
      if (res && res.roster) {
        if (isOIC && (res.roster.status || "").toUpperCase() === 'DRAFT') {
          setCurrentWeekRoster(null);
          setWeeklyDuties([]);
          return;
        }
        setCurrentWeekRoster(res.roster);
        setWeeklyDuties(res.duties || res.roster.assignments || []);
      } else {
        if (!isOIC && selectedRoster && selectedRoster.assignments && Array.isArray(selectedRoster.assignments)) {
          setCurrentWeekRoster(selectedRoster);
          setWeeklyDuties(selectedRoster.assignments);
        } else {
          setCurrentWeekRoster(null);
          setWeeklyDuties([]);
        }
      }
    } catch (err) {
      console.error("Error fetching weekly roster:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewRoster = (rosterItem) => {
    const rawRoster = rosterItem.raw || rosterItem;
    const startDateVal = rawRoster.weekStart || rawRoster.startDate;
    
    const targetSunISO = setRosterDateAndOffset(startDateVal) || currentWeek.startDateISO;

    setSelectedRoster(rawRoster);
    setCurrentWeekRoster(rawRoster);
    if (rawRoster.assignments && Array.isArray(rawRoster.assignments) && rawRoster.assignments.length > 0) {
      setWeeklyDuties(rawRoster.assignments);
    }

    setActiveScreen('viewRoster');
    fetchWeeklyData(targetSunISO);
  };

  const fetchDailyData = async () => {
    try {
      const dStr = formatDateISO(dailyDate);
      const res = await getDuties({ date: dStr });
      
      let fetchedDuties = [];
      if (Array.isArray(res)) {
        fetchedDuties = res;
      } else if (res && Array.isArray(res.duties)) {
        fetchedDuties = res.duties;
      }

      // Filter out 'OFF' assignments
      const activeDuties = fetchedDuties.filter(d => d.dutyType !== 'OFF');

      // Fallback: If weeklyDuties is loaded for the current week, filter duties matching date
      if (activeDuties.length === 0 && weeklyDuties.length > 0) {
        const localWeekDuties = weeklyDuties.filter(d => {
          const dDateStr = getLocalDateISO(d.date);
          return dDateStr === dStr && d.dutyType !== 'OFF';
        });
        if (localWeekDuties.length > 0) {
          setDailyDuties(localWeekDuties);
          return;
        }
      }

      setDailyDuties(activeDuties);
    } catch (err) {
      console.error("Error fetching daily duties:", err);
    }
  };

  useEffect(() => {
    fetchOfficersList();
    fetchRostersList();
  }, []);

  useEffect(() => {
    fetchWeeklyData(currentWeek.startDateISO);
  }, [weekOffset, customStartDate]);

  useEffect(() => {
    fetchDailyData();
  }, [dailyDate, weeklyDuties]);

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

  // Officers list for UI grid
  const displayOfficers = officersList.map(o => `${o.rank || 'PC'} ${o.policeId || ''} ${o.fullName || o.name || ''}`.trim());

  const getLocalDateISO = (dVal) => {
    if (!dVal) return '';
    if (typeof dVal === 'string' && dVal.length >= 10 && dVal.includes('-')) {
      const parts = dVal.substring(0, 10).split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        return dVal.substring(0, 10);
      }
    }
    const date = new Date(dVal);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Grid Cell Data & Mapping
  const getCellValForOfficerAndDate = (officerIdx, dayIdx) => {
    const officerObj = officersList[officerIdx];
    const dateISO = currentWeek.calculatedDatesISO[dayIdx];

    if (!officerObj) {
      return 'OFF';
    }

    const matchedDuties = weeklyDuties.filter(d => {
      const offVal = d.officer || d.officerId;
      const dutyOffId = typeof offVal === 'object' && offVal !== null ? (offVal._id || offVal.id) : offVal;
      const dutyDateStr = getLocalDateISO(d.date);
      return String(dutyOffId) === String(officerObj._id) && dutyDateStr === dateISO;
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

  // Regular Duty Rows State (Wizard) - Pre-filled with standard regular duties with multi-shift support
  const [regDuties, setRegDuties] = useState([
    {
      id: 1,
      name: "Accident Investigation",
      expanded: true,
      shifts: [
        { id: 101, type: "Day", shift: "06:00–18:00", count: 2, location: "Main Station / Field", frequency: "everyday", selectedDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
        { id: 102, type: "Night", shift: "18:00–06:00", count: 2, location: "Main Station / Field", frequency: "everyday", selectedDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] }
      ]
    },
    {
      id: 2,
      name: "Motorcycle Patrol",
      expanded: false,
      shifts: [
        { id: 201, type: "Day", shift: "06:00–18:00", count: 3, location: "Sector Patrol Area", frequency: "everyday", selectedDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
        { id: 202, type: "Night", shift: "18:00–06:00", count: 3, location: "Sector Patrol Area", frequency: "everyday", selectedDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] }
      ]
    },
    {
      id: 3,
      name: "119 Motorcycle Patrol",
      expanded: false,
      shifts: [
        { id: 301, type: "Day", shift: "06:00–18:00", count: 2, location: "Emergency Response Patrol", frequency: "everyday", selectedDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
        { id: 302, type: "Night", shift: "18:00–06:00", count: 2, location: "Emergency Response Patrol", frequency: "everyday", selectedDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] }
      ]
    },
    {
      id: 4,
      name: "Point Duty",
      expanded: false,
      shifts: [
        { id: 401, type: "Day", shift: "06:00–14:00", count: 4, location: "Poruthota & Main Junctions", frequency: "everyday", selectedDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
        { id: 402, type: "Night", shift: "14:00–22:00", count: 4, location: "Poruthota & Main Junctions", frequency: "everyday", selectedDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] }
      ]
    },
    {
      id: 5,
      name: "Traffic Branch Duty",
      expanded: false,
      shifts: [
        { id: 501, type: "Day", shift: "06:00–18:00", count: 2, location: "Traffic Branch HQ", frequency: "everyday", selectedDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
        { id: 502, type: "Night", shift: "18:00–06:00", count: 2, location: "Traffic Branch HQ", frequency: "everyday", selectedDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] }
      ]
    },
    {
      id: 6,
      name: "Court Duty",
      expanded: false,
      shifts: [
        { id: 601, type: "Day", shift: "08:00–16:00", count: 2, location: "Magistrate Court", frequency: "everyday", selectedDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
        { id: 602, type: "Night", shift: "08:00–16:00", count: 2, location: "Magistrate Court", frequency: "everyday", selectedDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] }
      ]
    }
  ]);

  // Special Duty Rows State (Wizard)
  const [specDuties, setSpecDuties] = useState([
    { id: 1, type: "VIP Escort", date: formatDateISO(new Date()), location: "Negombo–Katunayake road", count: 4, shift: "06:00–14:00", vehicle: true }
  ]);

  const addRegDuty = () => {
    const newId = Date.now();
    setRegDuties([
      ...regDuties,
      {
        id: newId,
        name: "",
        expanded: true,
        shifts: [
          {
            id: newId + 1,
            type: "Day",
            shift: "06:00–18:00",
            count: 1,
            location: "Main Station / Field",
            frequency: "everyday",
            selectedDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
          }
        ]
      }
    ]);
  };

  const removeRegDuty = (dutyId) => {
    setRegDuties(regDuties.filter(r => r.id !== dutyId));
  };

  const toggleDutyExpanded = (dutyId) => {
    setRegDuties(regDuties.map(r => r.id === dutyId ? { ...r, expanded: !r.expanded } : r));
  };

  const addShiftToDuty = (dutyId) => {
    const newShiftId = Date.now();
    setRegDuties(regDuties.map(r => {
      if (r.id === dutyId) {
        const firstLocation = r.shifts?.[0]?.location || "Main Station / Field";
        return {
          ...r,
          expanded: true,
          shifts: [
            ...(r.shifts || []),
            {
              id: newShiftId,
              type: "Night",
              shift: "18:00–06:00",
              count: 1,
              location: firstLocation,
              frequency: "everyday",
              selectedDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
            }
          ]
        };
      }
      return r;
    }));
  };

  const removeShiftFromDuty = (dutyId, shiftId) => {
    setRegDuties(regDuties.map(r => {
      if (r.id === dutyId) {
        const remainingShifts = (r.shifts || []).filter(s => s.id !== shiftId);
        return { ...r, shifts: remainingShifts };
      }
      return r;
    }));
  };

  const updateDutyName = (dutyId, name) => {
    setRegDuties(regDuties.map(r => r.id === dutyId ? { ...r, name } : r));
  };

  const updateShiftField = (dutyId, shiftId, field, value) => {
    setRegDuties(regDuties.map(r => {
      if (r.id === dutyId) {
        const updatedShifts = (r.shifts || []).map(s => {
          if (s.id === shiftId) {
            const updatedShift = { ...s, [field]: value };
            if (field === "frequency") {
              if (value === "everyday") {
                updatedShift.selectedDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
              } else if (!updatedShift.selectedDays || updatedShift.selectedDays.length === 0) {
                updatedShift.selectedDays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
              }
            }
            return updatedShift;
          }
          return s;
        });
        return { ...r, shifts: updatedShifts };
      }
      return r;
    }));
  };

  const getFlattenedRegDuties = () => {
    const flattened = [];
    (regDuties || []).forEach(d => {
      (d.shifts || []).forEach(s => {
        flattened.push({
          name: d.name || "Regular Duty",
          type: s.type || "",
          shift: s.shift || "06:00–14:00",
          count: Number(s.count) || 1,
          location: s.location || "Main Station / Field",
          frequency: s.frequency || "everyday",
          selectedDays: s.selectedDays || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        });
      });
    });
    return flattened;
  };

  const addSpecDuty = () => {
    setSpecDuties([
      ...specDuties,
      { id: Date.now(), type: "", date: formatDateISO(new Date()), location: "", count: 1, shift: "06:00–14:00", vehicle: false }
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
    const filtered = rostersList.filter(r => {
      const rStatus = (r.status || "").toUpperCase();
      if (isOIC && rStatus === "DRAFT") return false;
      return rStatus === targetStatus;
    });

    return filtered.map(r => {
      const sRaw = r.weekStart || r.startDate;
      const eRaw = r.weekEnd || r.endDate;
      const sDateObj = sRaw ? new Date(sRaw) : null;
      const eDateObj = eRaw ? new Date(eRaw) : null;
      const sDate = sDateObj && !isNaN(sDateObj.getTime()) ? sDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : "";
      const eDate = eDateObj && !isNaN(eDateObj.getTime()) ? eDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : "";
      
      const badgeMap = {
        DRAFT: { badge: 'draft', label: 'Draft' },
        PENDING_APPROVAL: { badge: 'pending', label: 'Pending' },
        CHANGES_REQUESTED: { badge: 'changes', label: 'Changes requested' },
        APPROVED: { badge: 'approved', label: 'Approved' },
        PUBLISHED: { badge: 'published', label: 'Published' }
      };
      const bInfo = badgeMap[r.status] || { badge: 'draft', label: r.status };
      const dutyCount = r.assignments?.length || 0;

      return {
        _id: r._id,
        t: r.title || (sDate && eDate ? `${sDate}–${eDate} weekly roster` : `${r.rosterReference || 'Weekly Duty Roster'}`),
        badge: bInfo.badge,
        label: bInfo.label,
        meta: r.oicComment 
          ? `OIC comment: "${r.oicComment}"` 
          : (r.rejectionReason ? `Reason: "${r.rejectionReason}"` : `Created ${new Date(r.createdAt || Date.now()).toLocaleDateString('en-GB')}`),
        d1: "Period",
        v1: sDate && eDate ? `${sDate}–${eDate}` : "Weekly",
        d2: "Duties",
        v2: `${dutyCount} slots`,
        raw: r
      };
    });
  };

  // Edit Duty Modal State
  const [showEditDutyModal, setShowEditDutyModal] = useState(false);
  const [editDutyData, setEditDutyData] = useState({
    dutyId: null,
    rosterId: null,
    officerId: null,
    officerIdx: 0,
    dayIdx: 0,
    date: formatDateISO(new Date()),
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
      ? `${officerObj.rank || 'PC'} ${officerObj.policeId || ''} ${officerObj.fullName || officerObj.name || ''}`.trim()
      : displayOfficers[officerIdx] || `PC ${officerIdx + 1}`;
    
    const dateISO = currentWeek.calculatedDatesISO[dayIdx];

    // Check if existing duty assignment in database
    let existingDuty = null;
    if (officerObj && weeklyDuties.length > 0) {
      existingDuty = weeklyDuties.find(d => {
        const offVal = d.officer || d.officerId;
        const dOffId = typeof offVal === 'object' && offVal !== null ? (offVal._id || offVal.id) : offVal;
        const dDateStr = getLocalDateISO(d.date);
        return String(dOffId) === String(officerObj._id) && dDateStr === dateISO;
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
      `${o.rank || 'PC'} ${o.policeId || ''} ${o.fullName || o.name || ''}`.trim() === editDutyData.officer.trim() ||
      o.fullName === editDutyData.officer ||
      o.name === editDutyData.officer ||
      String(o._id) === String(editDutyData.officerId)
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
    const targetId = currentWeekRoster?._id || selectedRoster?._id;
    if (targetId) {
      const res = await updateDutyRoster(targetId, { status: "PENDING_APPROVAL" });
      if (res && res.ok) {
        showToast("Roster submitted to OIC for approval!");
        await fetchWeeklyData();
        await fetchRostersList();
        setActiveScreen('dashboard');
        setDashTab('pending');
        return;
      } else {
        const msg = res?.data?.message || res?.data?.error || "Failed to submit roster to OIC";
        showToast(`Error: ${msg}`);
        return;
      }
    }

    const res = await createDutyRoster({
      weekStart: currentWeek.startDateISO,
      startDate: currentWeek.startDateISO,
      endDate: currentWeek.endDateISO,
      regularDuties: getFlattenedRegDuties(),
      specialDuties: specDuties,
      status: "PENDING_APPROVAL"
    });
    if (res && res.ok) {
      showToast("Roster submitted to OIC for approval!");
      await fetchWeeklyData();
      await fetchRostersList();
      setActiveScreen('dashboard');
      setDashTab('pending');
    } else {
      const msg = res?.data?.message || res?.data?.error || "Failed to submit roster to OIC";
      showToast(`Error: ${msg}`);
    }
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
        regularDuties: getFlattenedRegDuties(),
        specialDuties: specDuties
      });
      if (res && res.ok && res.data && res.data.roster) {
        setCurrentWeekRoster(res.data.roster);
        setWeeklyDuties(res.data.duties || res.data.roster.assignments || []);
        setGenerationConflicts(res.data.conflicts || res.data.roster.conflicts || []);
        showToast("Weekly roster generated successfully!");
        await fetchRostersList();
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
    const targetId = currentWeekRoster?._id || selectedRoster?._id;
    let res;
    if (targetId) {
      res = await updateDutyRoster(targetId, { status: "DRAFT" });
    } else {
      res = await createDutyRoster({
        weekStart: currentWeek.startDateISO,
        startDate: currentWeek.startDateISO,
        endDate: currentWeek.endDateISO,
        regularDuties: getFlattenedRegDuties(),
        specialDuties: specDuties,
        status: "DRAFT"
      });
    }

    if (res && res.ok) {
      showToast("Roster draft saved to database!");
      await fetchWeeklyData();
      await fetchRostersList();
      setActiveScreen('dashboard');
      setDashTab('draft');
    } else {
      const msg = res?.data?.message || res?.data?.error || "Failed to save roster draft";
      showToast(`Error: ${msg}`);
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
              <div className="value">{officersList.length}</div>
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
              <div className="value">{isOIC ? getRostersByStatus('published').length : (currentWeekRoster?.conflicts?.length || 0)}</div>
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
            {getRostersByStatus(dashTab).length > 0 ? (
              getRostersByStatus(dashTab).map((r, idx) => (
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
                      onClick={() => handleViewRoster(r)}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                No {dashTab.replace('_', ' ')} rosters found in database.
              </div>
            )}
          </div>

          {dashMode === 'weekly' && (isOIC ? dashTab === 'pending' : dashTab === 'draft') && (
            <div style={{ marginTop: '20px' }}>
              {renderWeekNavigator()}
              {isOIC && (!currentWeekRoster || (currentWeekRoster.status || "").toUpperCase() === 'DRAFT') ? (
                <div style={{
                  padding: '32px 24px',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '14px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px dashed #cbd5e1',
                  marginTop: '12px'
                }}>
                  No submitted roster for this week. Rosters will appear here once submitted by the IT Officer.
                </div>
              ) : (
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
              )}
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
                <div className="dr-mini-stat"><div className="n">{officersList.length}</div><div className="l">Officers available</div></div>
                <div className="dr-mini-stat"><div className="n">{getFlattenedRegDuties().reduce((acc, s) => acc + (Number(s.count) || 0), 0) * 7 + specDuties.reduce((acc, s) => acc + (Number(s.count) || 0), 0)}</div><div className="l">Duty slots this week</div></div>
                <div className="dr-mini-stat warn"><div className="n">0</div><div className="l">Officers on leave</div></div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {wizStep === 2 && (
            <div className="dr-form-card">
              <h4 style={{ margin: "0 0 16px 0", color: "#1e293b", fontSize: "15px", fontWeight: "700" }}>
                Regular Duties Setup &amp; Frequency
              </h4>
              <table className="dr-duty-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>#</th>
                    <th>Duty Name</th>
                    <th style={{ width: '150px' }}>Schedule Days</th>
                    <th style={{ width: '130px' }}>Overall Count</th>
                    <th style={{ width: '140px' }}>Shift Count</th>
                    <th style={{ width: '190px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {regDuties.map((row, idx) => {
                    const totalCount = (row.shifts || []).reduce((acc, s) => acc + (Number(s.count) || 0), 0);
                    const shiftTypesLabel = (row.shifts || []).map(s => (s.type || s.shift || "").substring(0, 1).toUpperCase()).filter(Boolean).join("/");
                    const shiftSummary = (row.shifts || []).length === 1 
                      ? "1 Shift" 
                      : `${(row.shifts || []).length} Shifts${shiftTypesLabel ? ` (${shiftTypesLabel})` : ''}`;

                    return (
                      <React.Fragment key={row.id}>
                        <tr>
                          <td className="dr-row-num">{idx + 1}</td>
                          <td>
                            <input
                              type="text"
                              value={row.name}
                              onChange={(e) => updateDutyName(row.id, e.target.value)}
                              placeholder="Duty Name (e.g. Accident Investigation)"
                              style={{ fontWeight: "600", color: "#0f172a" }}
                            />
                          </td>
                          <td style={{ fontSize: "13px", color: "#475569", fontWeight: "500" }}>
                            Mon – Sun
                          </td>
                          <td style={{ fontSize: "13px", color: "#0f172a", fontWeight: "700" }}>
                            Total: {totalCount}
                          </td>
                          <td style={{ fontSize: "13px", color: "#334155", fontWeight: "600" }}>
                            {shiftSummary}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                type="button"
                                className={`dr-manage-shifts-btn ${row.expanded ? 'active' : ''}`}
                                onClick={() => toggleDutyExpanded(row.id)}
                              >
                                <span>Manage Shifts ({(row.shifts || []).length})</span>
                                {row.expanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                              </button>
                              <button
                                type="button"
                                className="dr-icon-btn"
                                onClick={() => removeRegDuty(row.id)}
                                title="Delete duty"
                              >
                                <FiTrash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* EXPANDED DETAILED SHIFTS PANEL */}
                        {row.expanded && (
                          <tr>
                            <td colSpan={6} style={{ padding: '4px 0 16px 0', borderBottom: '1px solid #e2e8f0' }}>
                              <div className="dr-detailed-shifts-box">
                                <div className="dr-detailed-shifts-header">
                                  Detailed Shifts: {row.name || "Duty"}
                                </div>
                                <table className="dr-subduty-table">
                                  <thead>
                                    <tr>
                                      <th style={{ width: '130px' }}>Shift Type</th>
                                      <th style={{ width: '190px' }}>Time Block</th>
                                      <th style={{ width: '90px' }}>Count</th>
                                      <th>Location</th>
                                      <th style={{ width: '160px' }}>Frequency</th>
                                      <th style={{ width: '50px', textAlign: 'center' }}>Delete</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(row.shifts || []).map((s) => (
                                      <tr key={s.id}>
                                        <td>
                                          <input
                                            type="text"
                                            value={s.type || ""}
                                            onChange={(e) => updateShiftField(row.id, s.id, "type", e.target.value)}
                                            placeholder="Day/Night"
                                          />
                                        </td>
                                        <td>
                                          <select
                                            value={s.shift}
                                            onChange={(e) => updateShiftField(row.id, s.id, "shift", e.target.value)}
                                          >
                                            <option value="06:00–18:00">06:00–18:00 (D)</option>
                                            <option value="18:00–06:00">18:00–06:00 (N)</option>
                                            <option value="06:00–14:00">06:00–14:00 (D)</option>
                                            <option value="14:00–22:00">14:00–22:00 (D/Eve)</option>
                                            <option value="22:00–06:00">22:00–06:00 (N)</option>
                                            <option value="08:00–16:00">08:00–16:00 (Court)</option>
                                          </select>
                                        </td>
                                        <td>
                                          <input
                                            type="number"
                                            min="1"
                                            value={s.count}
                                            onChange={(e) => updateShiftField(row.id, s.id, "count", Number(e.target.value))}
                                          />
                                        </td>
                                        <td>
                                          <input
                                            type="text"
                                            value={s.location}
                                            onChange={(e) => updateShiftField(row.id, s.id, "location", e.target.value)}
                                            placeholder="Location"
                                          />
                                        </td>
                                        <td>
                                          <select
                                            value={s.frequency || "everyday"}
                                            onChange={(e) => updateShiftField(row.id, s.id, "frequency", e.target.value)}
                                          >
                                            <option value="everyday">Every Day</option>
                                            <option value="selected">Selected Days</option>
                                          </select>
                                          {s.frequency === "selected" && (
                                            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "6px" }}>
                                              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => {
                                                const isChecked = (s.selectedDays || []).includes(day);
                                                return (
                                                  <label key={day} style={{ fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "2px", cursor: "pointer" }}>
                                                    <input
                                                      type="checkbox"
                                                      checked={isChecked}
                                                      onChange={(e) => {
                                                        const curDays = s.selectedDays || [];
                                                        const newDays = e.target.checked
                                                          ? [...curDays, day]
                                                          : curDays.filter(d => d !== day);
                                                        updateShiftField(row.id, s.id, "selectedDays", newDays);
                                                      }}
                                                    />
                                                    {day}
                                                  </label>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                          <button
                                            type="button"
                                            className="dr-icon-btn"
                                            onClick={() => removeShiftFromDuty(row.id, s.id)}
                                            title="Delete shift"
                                          >
                                            <FiTrash2 size={14} />
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                <button
                                  type="button"
                                  className="dr-add-shift-btn"
                                  onClick={() => addShiftToDuty(row.id)}
                                >
                                  <FiPlus size={14} /> Add Shift for this Duty
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>

              <button
                type="button"
                className="dr-add-row-btn"
                onClick={addRegDuty}
                style={{ marginTop: "16px" }}
              >
                <FiPlus size={14} /> Add Duty
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
                {(() => {
                  const groupedDailyDuties = (() => {
                    const groupsMap = {};
                    (dailyDuties || []).filter(d => d.dutyType !== 'OFF').forEach(duty => {
                      const key = `${duty.dutyType || 'Point Duty'}__${duty.shift || ''}__${duty.location || ''}`;
                      if (!groupsMap[key]) {
                        groupsMap[key] = {
                          key,
                          dutyType: duty.dutyType,
                          specialDutyText: duty.specialDutyText,
                          shift: duty.shift,
                          location: duty.location,
                          officers: [],
                          firstDuty: duty
                        };
                      }
                      
                      const offVal = duty.officer || duty.officerId;
                      const offObj = typeof offVal === 'object' && offVal !== null 
                        ? offVal 
                        : officersList.find(o => String(o._id) === String(offVal));

                      const offName = offObj 
                        ? `${offObj.rank || 'PC'} ${offObj.policeId || ''} ${offObj.fullName || offObj.name || ''}`.trim() 
                        : (typeof offVal === 'string' ? `Officer ID: ${offVal}` : "Assigned Officer");

                      groupsMap[key].officers.push({ offObj, offName, duty });
                    });

                    return Object.values(groupsMap);
                  })();

                  if (groupedDailyDuties.length === 0) {
                    return (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: "28px", color: "#64748b", fontSize: "14px" }}>
                          No duties scheduled for this date in the database.
                        </td>
                      </tr>
                    );
                  }

                  return groupedDailyDuties.map((group, idx) => {
                    const firstDuty = group.firstDuty;
                    const shiftStr = group.shift || "06:00 - 14:00";
                    const is12Hr = shiftStr.includes('18:00') && shiftStr.includes('06:00');

                    return (
                      <tr key={group.key || idx}>
                        <td style={{ textAlign: "center", fontWeight: "700" }}>{idx + 1}</td>
                        <td>
                          <div className="dr-daily-duty-title">
                            {group.dutyType === 'Special Duty' ? (group.specialDutyText || 'Special Duty') : group.dutyType}
                          </div>
                        </td>
                        <td>
                          <div className="dr-daily-shift-time">{shiftStr}</div>
                          <span className="dr-daily-shift-pill">
                            {is12Hr ? '12 hrs' : '8 hrs'}
                          </span>
                        </td>
                        <td>
                          <div className="dr-daily-location">{group.location || "Field"}</div>
                        </td>
                        <td>
                          <ul className="dr-daily-officer-list" style={{ margin: 0, paddingLeft: "18px" }}>
                            {group.officers.map((offItem, oIdx) => (
                              <li key={oIdx} className="dr-daily-officer-item" style={{ fontWeight: "600", color: "#1e293b", margin: "3px 0" }}>
                                {offItem.offName}
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            className="dr-daily-action-btn"
                            title="Edit Duty"
                            onClick={() => {
                              setModalError(null);
                              const targetOff = group.officers[0]?.offObj;
                              setEditDutyData({
                                dutyId: firstDuty._id,
                                rosterId: firstDuty.rosterId || firstDuty.roster,
                                officerId: targetOff ? targetOff._id : null,
                                officerIdx: 0,
                                dayIdx: 0,
                                date: firstDuty.date ? getLocalDateISO(firstDuty.date) : formatDateISO(dailyDate),
                                shift: firstDuty.shift || "06:00 - 14:00 (Morning Shift)",
                                officer: targetOff ? `${targetOff.rank || 'PC'} ${targetOff.policeId || ''} ${targetOff.fullName || targetOff.name || ''}`.trim() : "",
                                location: firstDuty.location || "",
                                dutyType: firstDuty.dutyType || "Point Duty",
                                specialDutyText: firstDuty.specialDutyText || ""
                              });
                              setShowEditDutyModal(true);
                            }}
                          >
                            <FiMoreVertical size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  });
                })()}
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