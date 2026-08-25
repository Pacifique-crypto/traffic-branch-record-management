import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OICLayout from "../layouts/OICLayout";
import ITLayout from "../layouts/ITLayout";
import {
  Container, Typography, Box, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Grid, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem, InputLabel,
  FormControl, Chip, CircularProgress, IconButton, Alert, Snackbar, Tooltip,
  Avatar, Drawer, Divider, Card, CardContent
} from "@mui/material";
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Check as CheckIcon, Close as CloseIcon, Publish as PublishIcon,
  Refresh as RefreshIcon, Search as SearchIcon, ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon, CalendarToday as CalendarIcon,
  Print as PrintIcon, FilterList as FilterIcon, Save as SaveIcon,
  Send as SendIcon, CheckCircle as CheckCircleIcon, Cancel as CancelIcon,
  InfoOutlined as InfoIcon, AssignmentTurnedIn as AssignmentIcon,
  Group as GroupIcon, EventBusy as EventBusyIcon, AssignmentLate as AssignmentLateIcon,
  EditNote as EditNoteIcon, DeleteOutlined as DeleteOutlineIcon
} from "@mui/icons-material";
import {
  getDutyRosters, getDutyRosterById, createDutyRoster,
  updateDutyRosterStatus, deleteDutyRoster, getOfficers,
  getDutyShifts, getOfficerLeaves, getVehicles
} from "../api";

// Helpers
const formatDateStr = (date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatReadableDate = (date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const formatDayName = (date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { weekday: "long" });
};

const getMonday = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const getWeekDates = (monday) => {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const next = new Date(monday);
    next.setDate(monday.getDate() + i);
    days.push(next);
  }
  return days;
};

const formatWeekHeading = (monday, sunday) => {
  const options = { day: "numeric", month: "long" };
  const startStr = monday.toLocaleDateString("en-GB", options);
  const endStr = sunday.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  return `${startStr} – ${endStr}`;
};

// Visually distinct duty card color styles matching reference design
const DUTY_CARD_STYLES = {
  "Traffic Patrol":           { bg: "#fff7ed", border: "#f97316", text: "#c2410c", title: "Traffic Patrol" },
  "Crime Investigation":      { bg: "#fef2f2", border: "#ef4444", text: "#b91c1c", title: "Crime Investigation" },
  "Accident Investigation":   { bg: "#fff1f2", border: "#f43f5e", text: "#be123c", title: "Accident Investigation" },
  "Station Duty":             { bg: "#eff6ff", border: "#3b82f6", text: "#1d4ed8", title: "Station Duty" },
  "Motorcycle Patrol":        { bg: "#f0fdf4", border: "#22c55e", text: "#15803d", title: "Motorcycle Patrol" },
  "Night Patrol":             { bg: "#faf5ff", border: "#a855f7", text: "#6b21a8", title: "Night Patrol" },
  "Leave":                    { bg: "#f1f5f9", border: "#94a3b8", text: "#475569", title: "On Leave" },
  "OFF":                      { bg: "#ffffff", border: "#cbd5e1", text: "#64748b", title: "Day Off" },
  "Unassigned":               { bg: "#fff1f2", border: "#f87171", text: "#dc2626", title: "Unassigned" }
};

export default function DutyRoster() {
  const navigate = useNavigate();
  const userRole = localStorage.getItem("userRole") || "IT Officer";
  const isOIC = userRole === "OIC";
  const Layout = isOIC ? OICLayout : ITLayout;

  // Loading & Notification Feedback
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const showMsg = (msg, sev = "success") => {
    setSnackbar({ open: true, message: msg, severity: sev });
  };

  // Master Records
  const [officers, setOfficers] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [rosters, setRosters] = useState([]);

  // Current Selected Week & Roster
  const [currentMonday, setCurrentMonday] = useState(() => getMonday(new Date()));
  const weekDays = getWeekDates(currentMonday);
  const weekStartStr = formatDateStr(weekDays[0]);
  const weekEndStr = formatDateStr(weekDays[6]);

  const [currentRosterId, setCurrentRosterId] = useState(null);
  const [activeRosterDoc, setActiveRosterDoc] = useState(null);

  // Map format: `${officerId}_${formatDateStr(date)}` => Assignment Object
  const [assignmentsMap, setAssignmentsMap] = useState({});

  // Filter States
  const [searchOfficer, setSearchOfficer] = useState("");
  const [filterRank, setFilterRank] = useState("All");
  const [filterDutyType, setFilterDutyType] = useState("All");
  const [filterShift, setFilterShift] = useState("All");
  const [filterLocation, setFilterLocation] = useState("All");
  const [filterConflicts, setFilterConflicts] = useState("All");

  // Add / Edit Duty Assignment Side Drawer State (IT Officer ONLY)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedOfficerId, setSelectedOfficerId] = useState("");
  const [selectedDateStr, setSelectedDateStr] = useState(weekStartStr);
  const [selectedDutyType, setSelectedDutyType] = useState("Traffic Patrol");
  const [selectedShift, setSelectedShift] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("Police Station");
  const [remarksText, setRemarksText] = useState("");

  // Rejection Dialog State (OIC ONLY)
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionRemarks, setRejectionRemarks] = useState("");

  // Load Data from Backend
  const loadMasterData = async () => {
    try {
      setLoading(true);
      const [allOffs, allShifts, allLeaves, allVehs, allRosters] = await Promise.all([
        getOfficers().catch(() => []),
        getDutyShifts().catch(() => []),
        getOfficerLeaves().catch(() => []),
        getVehicles().catch(() => []),
        getDutyRosters().catch(() => [])
      ]);

      const activeOffs = (allOffs || []).filter(o => o.status !== "Pending");
      setOfficers(activeOffs);
      setShifts(allShifts || []);
      setLeaves(allLeaves || []);
      setVehicles(allVehs || []);
      setRosters(allRosters || []);

      if (allShifts && allShifts.length > 0 && !selectedShift) {
        setSelectedShift(allShifts[0].name);
      }

      syncRosterForWeek(allRosters || []);
    } catch (err) {
      showMsg("Failed to load records from database", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, [currentMonday]);

  // Sync grid with selected week
  const syncRosterForWeek = (rosterList = rosters) => {
    const matching = (rosterList || []).find(r => {
      if (r.rosterType !== "Weekly") return false;
      return formatDateStr(r.weekStart) === weekStartStr;
    });

    if (matching) {
      setCurrentRosterId(matching._id);
      setActiveRosterDoc(matching);
      const map = {};
      (matching.assignments || []).forEach(asg => {
        if (asg && asg.officer) {
          const offId = (asg.officer._id || asg.officer).toString();
          const dStr = formatDateStr(asg.date);
          map[`${offId}_${dStr}`] = asg;
        }
      });
      setAssignmentsMap(map);
    } else {
      setCurrentRosterId(null);
      setActiveRosterDoc(null);
      setAssignmentsMap({});
    }
  };

  // Week Pagination Controls
  const handlePrevWeek = () => {
    const prev = new Date(currentMonday);
    prev.setDate(prev.getDate() - 7);
    setCurrentMonday(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentMonday);
    next.setDate(next.getDate() + 7);
    setCurrentMonday(next);
  };

  const handleCurrentWeek = () => {
    setCurrentMonday(getMonday(new Date()));
  };

  // Helper: Check if officer is on leave on a date
  const getOfficerLeaveForDate = (officerId, date) => {
    const offIdStr = officerId.toString();
    const dStr = formatDateStr(date);
    return leaves.find(l => {
      if (!l || !l.officer) return false;
      const lOffId = (l.officer._id || l.officer).toString();
      if (lOffId !== offIdStr) return false;
      const startStr = formatDateStr(l.startDate);
      const endStr = formatDateStr(l.endDate);
      return dStr >= startStr && dStr <= endStr;
    });
  };

  // IT OFFICER: Open Drawer to Add (new) or View/Edit (existing) Assignment
  const handleOpenAddOrEditDrawer = (officerObj = null, dateObj = null) => {
    if (isOIC) return; // OIC Read-Only Protection

    if (officerObj) {
      setSelectedOfficerId(officerObj._id);
    } else if (officers.length > 0) {
      setSelectedOfficerId(officers[0]._id);
    }

    const targetDateStr = dateObj ? formatDateStr(dateObj) : weekStartStr;
    setSelectedDateStr(targetDateStr);

    const targetOffId = officerObj ? officerObj._id.toString() : (officers[0] ? officers[0]._id.toString() : "");
    const key = `${targetOffId}_${targetDateStr}`;
    const existing = assignmentsMap[key];

    if (existing) {
      // EDIT MODE
      setIsEditMode(true);
      setSelectedDutyType(existing.dutyType || "Traffic Patrol");
      setSelectedShift(existing.shift || (shifts[0] ? shifts[0].name : "06:00–18:00"));
      setSelectedLocation(existing.location || "Police Station");
      setRemarksText(existing.remarks || "");
    } else {
      // ADD MODE
      setIsEditMode(false);
      setSelectedDutyType("Traffic Patrol");
      setSelectedShift(shifts[0] ? shifts[0].name : "06:00–18:00");
      setSelectedLocation("Police Station");
      setRemarksText("");
    }

    setDrawerOpen(true);
  };

  // IT OFFICER: Save Assignment (Add or Edit)
  const handleSaveAssignmentFromDrawer = () => {
    if (isOIC) return;
    if (!selectedOfficerId || !selectedDateStr || !selectedDutyType) {
      showMsg("Please complete all required fields.", "warning");
      return;
    }

    const officerObj = officers.find(o => o._id.toString() === selectedOfficerId.toString());
    if (!officerObj) return;

    const key = `${officerObj._id.toString()}_${selectedDateStr}`;

    const newAssignment = {
      officer: officerObj._id,
      officerName: officerObj.fullName,
      officerRank: officerObj.rank,
      officerPoliceId: officerObj.policeId,
      location: selectedLocation,
      dutyType: selectedDutyType,
      date: new Date(selectedDateStr),
      shift: selectedShift,
      remarks: remarksText
    };

    setAssignmentsMap(prev => ({ ...prev, [key]: newAssignment }));
    setDrawerOpen(false);

    if (isEditMode) {
      showMsg("Assignment updated successfully!", "success");
    } else {
      showMsg("Assignment added successfully!", "success");
    }
  };

  // IT OFFICER: Delete Single Assignment from Drawer
  const handleDeleteAssignmentFromDrawer = () => {
    if (isOIC) return;
    if (!selectedOfficerId || !selectedDateStr) return;
    const key = `${selectedOfficerId.toString()}_${selectedDateStr}`;
    setAssignmentsMap(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setDrawerOpen(false);
    showMsg("Assignment deleted successfully!", "info");
  };

  // IT OFFICER: Save Roster Draft
  const handleSaveDraft = async () => {
    if (isOIC) return;
    try {
      setLoading(true);
      const assignmentsList = Object.values(assignmentsMap);

      if (currentRosterId) {
        await updateDutyRosterStatus(currentRosterId, {
          status: "Draft",
          assignments: assignmentsList
        });
        showMsg("Weekly roster draft updated successfully!");
      } else {
        const res = await createDutyRoster({
          rosterType: "Weekly",
          status: "Draft",
          weekStart: weekStartStr,
          weekEnd: weekEndStr,
          assignments: assignmentsList
        });
        if (res && res._id) {
          setCurrentRosterId(res._id);
          showMsg("New weekly roster created successfully!");
        }
      }
      loadMasterData();
    } catch (err) {
      showMsg("Failed to save roster draft", "error");
    } finally {
      setLoading(false);
    }
  };

  // IT OFFICER: Submit to OIC for Approval
  const handleSubmitToOIC = async () => {
    if (isOIC) return;
    try {
      setLoading(true);
      const assignmentsList = Object.values(assignmentsMap);
      let targetId = currentRosterId;

      if (!targetId) {
        const res = await createDutyRoster({
          rosterType: "Weekly",
          status: "Draft",
          weekStart: weekStartStr,
          weekEnd: weekEndStr,
          assignments: assignmentsList
        });
        targetId = res._id;
      }

      await updateDutyRosterStatus(targetId, {
        status: "Pending Approval",
        assignments: assignmentsList
      });

      showMsg("Roster submitted to OIC for approval successfully!");
      loadMasterData();
    } catch (err) {
      showMsg("Error submitting roster to OIC", "error");
    } finally {
      setLoading(false);
    }
  };

  // OIC ONLY: Approve Roster
  const handleApproveRoster = async () => {
    if (!isOIC || !currentRosterId) return;
    try {
      setLoading(true);
      await updateDutyRosterStatus(currentRosterId, { status: "Approved" });
      showMsg("Roster approved successfully!");
      loadMasterData();
    } catch (err) {
      showMsg("Error approving roster", "error");
    } finally {
      setLoading(false);
    }
  };

  // OIC ONLY: Reject Roster
  const handleRejectRoster = async () => {
    if (!isOIC || !currentRosterId) return;
    try {
      setLoading(true);
      await updateDutyRosterStatus(currentRosterId, {
        status: "Rejected",
        rejectionRemarks: rejectionRemarks.trim()
      });
      showMsg("Roster rejected with remarks.");
      setRejectModalOpen(false);
      loadMasterData();
    } catch (err) {
      showMsg("Error rejecting roster", "error");
    } finally {
      setLoading(false);
    }
  };

  // IT OFFICER & OIC: Publish Roster
  const handlePublishRoster = async () => {
    if (!currentRosterId) return;
    try {
      setLoading(true);
      await updateDutyRosterStatus(currentRosterId, { status: "Published" });
      showMsg("Roster published successfully! Visible on officer mobile app.");
      loadMasterData();
    } catch (err) {
      showMsg("Error publishing roster", "error");
    } finally {
      setLoading(false);
    }
  };

  // Export / Print Control
  const handlePrint = () => {
    window.print();
  };

  // Filter Officer Rows
  const filteredOfficers = officers.filter(o => {
    if (searchOfficer.trim()) {
      const term = searchOfficer.toLowerCase();
      const matchName = (o.fullName || "").toLowerCase().includes(term);
      const matchId = (o.policeId || "").toLowerCase().includes(term);
      if (!matchName && !matchId) return false;
    }
    if (filterRank !== "All" && o.rank !== filterRank) return false;

    let matchesWeekFilters = true;
    if (filterDutyType !== "All" || filterShift !== "All" || filterLocation !== "All" || filterConflicts !== "All") {
      let hasMatch = false;
      weekDays.forEach(day => {
        const dateStr = formatDateStr(day);
        const key = `${o._id.toString()}_${dateStr}`;
        const asg = assignmentsMap[key];
        const leaveRec = getOfficerLeaveForDate(o._id, day);

        if (filterDutyType !== "All") {
          if (filterDutyType === "Leave" && leaveRec) hasMatch = true;
          if (asg && asg.dutyType === filterDutyType) hasMatch = true;
        }

        if (filterShift !== "All" && asg && asg.shift === filterShift) hasMatch = true;
        if (filterLocation !== "All" && asg && asg.location === filterLocation) hasMatch = true;
        if (filterConflicts === "Has Conflicts" && leaveRec && asg) hasMatch = true;
        if (filterConflicts === "On Leave" && leaveRec) hasMatch = true;
      });

      if (!hasMatch) {
        matchesWeekFilters = false;
      }
    }

    return matchesWeekFilters;
  });

  // Calculate Statistics
  const totalOfficersCount = officers.length;
  const totalAssignedSlotsCount = Object.keys(assignmentsMap).length;
  const officersWithAssignment = new Set(Object.keys(assignmentsMap).map(k => k.split("_")[0]));
  const unassignedOfficersCount = officers.filter(o => !officersWithAssignment.has(o._id.toString())).length;
  const officersOnLeaveCount = officers.filter(o => weekDays.some(d => getOfficerLeaveForDate(o._id, d))).length;

  const currentOfficerObj = officers.find(o => o._id.toString() === selectedOfficerId.toString());
  const currentStatus = activeRosterDoc ? activeRosterDoc.status : "Draft";

  return (
    <Layout>
      <Box sx={{ pb: 6, pt: 1, px: 1 }}>

        {/* 1. PAGE HEADER */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 3,
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)"
          }}
        >
          <Grid container spacing={2} alignItems="center" justifyContent="space-between">
            {/* Left: Title & Date Range & Status Badge */}
            <Grid item xs={12} md={7}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
                  Create Weekly Duty Roster
                </Typography>

                <Chip
                  label={currentStatus}
                  color={
                    currentStatus === "Published" ? "success" :
                    currentStatus === "Approved" ? "info" :
                    currentStatus === "Pending Approval" ? "warning" :
                    currentStatus === "Rejected" ? "error" : "default"
                  }
                  sx={{ fontWeight: 700, fontSize: "0.8rem", px: 1 }}
                />
              </Box>

              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#475569", mt: 0.5 }}>
                📅 {formatWeekHeading(weekDays[0], weekDays[6])}
              </Typography>
            </Grid>

            {/* Right: Date Navigation Controls & Action Area */}
            <Grid item xs={12} md={5}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, justifyContent: { xs: "flex-start", md: "flex-end" }, flexWrap: "wrap" }}>
                {/* Date Controls */}
                <IconButton onClick={handlePrevWeek} size="small" sx={{ border: "1px solid #cbd5e1", borderRadius: 2 }}>
                  <ChevronLeftIcon />
                </IconButton>
                <Button variant="outlined" size="small" onClick={handleCurrentWeek} sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}>
                  Today
                </Button>
                <IconButton onClick={handleNextWeek} size="small" sx={{ border: "1px solid #cbd5e1", borderRadius: 2 }}>
                  <ChevronRightIcon />
                </IconButton>

                {/* Export / Print Button */}
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PrintIcon />}
                  onClick={handlePrint}
                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, borderColor: "#cbd5e1", color: "#334155" }}
                >
                  Export / Print
                </Button>

                {/* 2. ACTION AREA: IT OFFICER ONLY "+ Add Assignment" */}
                {!isOIC && (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenAddOrEditDrawer()}
                    sx={{
                      textTransform: "none",
                      fontWeight: 800,
                      borderRadius: 2,
                      background: "#2563eb",
                      "&:hover": { background: "#1d4ed8" },
                      px: 2.5
                    }}
                  >
                    + Add Assignment
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>

          {/* Workflow Action Bar */}
          <Box sx={{ mt: 2.5, pt: 2, borderTop: "1px solid #f1f5f9", display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end" }}>
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              {!isOIC && (
                <>
                  <Button variant="outlined" size="small" startIcon={<SaveIcon />} onClick={handleSaveDraft} sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}>
                    Save Draft
                  </Button>
                  <Button variant="contained" color="warning" size="small" startIcon={<SendIcon />} onClick={handleSubmitToOIC} sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}>
                    Submit to OIC
                  </Button>
                </>
              )}

              {isOIC && currentStatus === "Pending Approval" && (
                <>
                  <Button variant="contained" color="success" size="small" startIcon={<CheckCircleIcon />} onClick={handleApproveRoster} sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}>
                    Approve Roster
                  </Button>
                  <Button variant="contained" color="error" size="small" startIcon={<CancelIcon />} onClick={() => setRejectModalOpen(true)} sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}>
                    Reject Roster
                  </Button>
                </>
              )}

              <Button variant="contained" color="success" size="small" startIcon={<PublishIcon />} onClick={handlePublishRoster} sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}>
                Publish Roster
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* SUMMARY STATS CARDS */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e2e8f0", background: "#ffffff" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                    Total Officers
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a", mt: 0.5 }}>
                    {totalOfficersCount}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600 }}>
                    Available officers
                  </Typography>
                </Box>
                <Avatar sx={{ background: "#eff6ff", color: "#2563eb", width: 44, height: 44 }}>
                  <GroupIcon />
                </Avatar>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e2e8f0", background: "#ffffff" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                    Assigned Slots
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a", mt: 0.5 }}>
                    {totalAssignedSlotsCount}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600 }}>
                    For current week
                  </Typography>
                </Box>
                <Avatar sx={{ background: "#f0fdf4", color: "#16a34a", width: 44, height: 44 }}>
                  <AssignmentIcon />
                </Avatar>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e2e8f0", background: "#ffffff" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                    Unassigned
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a", mt: 0.5 }}>
                    {unassignedOfficersCount}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600 }}>
                    Officers unassigned
                  </Typography>
                </Box>
                <Avatar sx={{ background: "#fff1f2", color: "#e11d48", width: 44, height: 44 }}>
                  <AssignmentLateIcon />
                </Avatar>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e2e8f0", background: "#ffffff" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                    On Leave
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a", mt: 0.5 }}>
                    {officersOnLeaveCount}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600 }}>
                    Approved leave
                  </Typography>
                </Box>
                <Avatar sx={{ background: "#faf5ff", color: "#9333ea", width: 44, height: 44 }}>
                  <EventBusyIcon />
                </Avatar>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* 3. FILTERS ROW */}
        <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 3, border: "1px solid #e2e8f0", background: "#ffffff" }}>
          <Grid container spacing={2} alignItems="center">
            {/* Search Officer */}
            <Grid item xs={12} sm={6} md={2.5}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search officer..."
                value={searchOfficer}
                onChange={(e) => setSearchOfficer(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: "#94a3b8", mr: 1, fontSize: 20 }} />
                }}
              />
            </Grid>

            {/* Rank Filter */}
            <Grid item xs={12} sm={6} md={1.9}>
              <FormControl fullWidth size="small">
                <InputLabel>Rank</InputLabel>
                <Select value={filterRank} label="Rank" onChange={(e) => setFilterRank(e.target.value)}>
                  <MenuItem value="All">All Ranks</MenuItem>
                  <MenuItem value="Constable">Constable</MenuItem>
                  <MenuItem value="Sergeant">Sergeant</MenuItem>
                  <MenuItem value="Sub-Inspector">Sub-Inspector</MenuItem>
                  <MenuItem value="Inspector">Inspector</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Duty Type Filter */}
            <Grid item xs={12} sm={6} md={1.9}>
              <FormControl fullWidth size="small">
                <InputLabel>Duty Type</InputLabel>
                <Select value={filterDutyType} label="Duty Type" onChange={(e) => setFilterDutyType(e.target.value)}>
                  <MenuItem value="All">All Duty Types</MenuItem>
                  <MenuItem value="Traffic Patrol">Traffic Patrol</MenuItem>
                  <MenuItem value="Crime Investigation">Crime Investigation</MenuItem>
                  <MenuItem value="Station Duty">Station Duty</MenuItem>
                  <MenuItem value="Motorcycle Patrol">Motorcycle Patrol</MenuItem>
                  <MenuItem value="Accident Investigation">Accident Investigation</MenuItem>
                  <MenuItem value="Night Patrol">Night Patrol</MenuItem>
                  <MenuItem value="Leave">On Leave</MenuItem>
                  <MenuItem value="OFF">Day Off</MenuItem>
                  <MenuItem value="Unassigned">Unassigned</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Shift Filter */}
            <Grid item xs={12} sm={6} md={1.9}>
              <FormControl fullWidth size="small">
                <InputLabel>Shift</InputLabel>
                <Select value={filterShift} label="Shift" onChange={(e) => setFilterShift(e.target.value)}>
                  <MenuItem value="All">All Shifts</MenuItem>
                  {shifts.map((s) => (
                    <MenuItem key={s._id} value={s.name}>{s.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Location Filter */}
            <Grid item xs={12} sm={6} md={1.9}>
              <FormControl fullWidth size="small">
                <InputLabel>Location</InputLabel>
                <Select value={filterLocation} label="Location" onChange={(e) => setFilterLocation(e.target.value)}>
                  <MenuItem value="All">All Locations</MenuItem>
                  <MenuItem value="Police Station">Police Station</MenuItem>
                  <MenuItem value="Negombo Clock Tower Junction">Negombo Clock Tower Junction</MenuItem>
                  <MenuItem value="Beach Road Tourism Zone">Beach Road Tourism Zone</MenuItem>
                  <MenuItem value="Colombo-Chilaw Highway (A3)">Colombo-Chilaw Highway (A3)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Conflicts Filter */}
            <Grid item xs={12} sm={6} md={1.9}>
              <FormControl fullWidth size="small">
                <InputLabel>Conflicts</InputLabel>
                <Select value={filterConflicts} label="Conflicts" onChange={(e) => setFilterConflicts(e.target.value)}>
                  <MenuItem value="All">All Assignments</MenuItem>
                  <MenuItem value="Has Conflicts">Has Leave Conflicts</MenuItem>
                  <MenuItem value="On Leave">On Leave</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={36} />
          </Box>
        )}

        {/* 4. MAIN ROSTER MATRIX GRID TABLE */}
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0", background: "#ffffff" }}>
          <Table size="small">
            <TableHead sx={{ background: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, width: 220, color: "#1e293b", py: 1.8 }}>
                  Officer Details
                </TableCell>
                {weekDays.map((day, idx) => {
                  const dStr = formatDateStr(day);
                  const isToday = dStr === formatDateStr(new Date());
                  return (
                    <TableCell
                      key={dStr}
                      align="center"
                      sx={{
                        fontWeight: 800,
                        color: isToday ? "#1e40af" : "#334155",
                        background: isToday ? "#eff6ff" : "transparent",
                        py: 1.8
                      }}
                    >
                      {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"][idx]} {day.getDate()} {day.toLocaleDateString("en-GB", { month: "short" }).toUpperCase()}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredOfficers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4, color: "#64748b" }}>
                    No officers found matching active filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOfficers.map((officer) => (
                  <TableRow key={officer._id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                    {/* Officer Row Details Header */}
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar sx={{ width: 36, height: 36, background: "#1e3a8a", fontSize: "0.85rem", fontWeight: 800 }}>
                          {(officer.fullName || "P").charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>
                            {officer.policeId}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, display: "block" }}>
                            {officer.fullName} {officer.rank}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Monday - Sunday Assignment Cells */}
                    {weekDays.map((day) => {
                      const dateStr = formatDateStr(day);
                      const key = `${officer._id.toString()}_${dateStr}`;
                      const assignment = assignmentsMap[key];
                      const leaveRec = getOfficerLeaveForDate(officer._id, day);

                      if (leaveRec) {
                        return (
                          <TableCell key={dateStr} align="center" sx={{ p: 0.8, background: "#f8fafc" }}>
                            <Box
                              sx={{
                                p: 1,
                                borderRadius: 2,
                                background: "#f1f5f9",
                                border: "1px dashed #94a3b8",
                                color: "#475569",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                textAlign: "center"
                              }}
                            >
                              🌴 On Leave
                              <Typography variant="caption" display="block" sx={{ fontSize: "0.68rem", opacity: 0.8 }}>
                                {leaveRec.leaveType}
                              </Typography>
                            </Box>
                          </TableCell>
                        );
                      }

                      if (assignment) {
                        const styleConfig = DUTY_CARD_STYLES[assignment.dutyType] || DUTY_CARD_STYLES["Traffic Patrol"];
                        return (
                          <TableCell
                            key={dateStr}
                            align="center"
                            onClick={() => !isOIC && handleOpenAddOrEditDrawer(officer, day)}
                            sx={{
                              cursor: isOIC ? "default" : "pointer",
                              p: 0.8,
                              "&:hover": { opacity: isOIC ? 1 : 0.85 }
                            }}
                          >
                            <Paper
                              elevation={0}
                              sx={{
                                p: 1,
                                borderRadius: 2,
                                background: styleConfig.bg,
                                border: `1px solid ${styleConfig.border}`,
                                color: styleConfig.text,
                                textAlign: "left"
                              }}
                            >
                              <Typography variant="caption" sx={{ fontWeight: 800, display: "block", fontSize: "0.78rem" }}>
                                {styleConfig.title}
                              </Typography>
                              <Typography variant="caption" sx={{ fontSize: "0.7rem", opacity: 0.9, display: "block", mt: 0.3 }}>
                                ⏱ {assignment.shift}
                              </Typography>
                              <Typography variant="caption" sx={{ fontSize: "0.68rem", opacity: 0.8, display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                                📍 {assignment.location}
                              </Typography>
                            </Paper>
                          </TableCell>
                        );
                      }

                      return (
                        <TableCell
                          key={dateStr}
                          align="center"
                          onClick={() => !isOIC && handleOpenAddOrEditDrawer(officer, day)}
                          sx={{
                            cursor: isOIC ? "default" : "pointer",
                            color: "#cbd5e1",
                            fontSize: "1.2rem",
                            transition: "all 0.2s",
                            "&:hover": { background: isOIC ? "transparent" : "#f1f5f9", color: isOIC ? "#cbd5e1" : "#64748b" }
                          }}
                        >
                          {!isOIC ? "+" : "—"}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 5. ADD / EDIT DUTY ASSIGNMENT SIDEBAR DRAWER (MATCHING REFERENCE UI) */}
        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          PaperProps={{
            sx: {
              width: { xs: "100%", sm: 450 },
              background: "#f8fafc",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            }
          }}
        >
          {/* DRAWER HEADER BANNER (DARK NAVY) */}
          <Box
            sx={{
              p: 2.5,
              background: "#0b192c",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              {isEditMode ? (
                <EditNoteIcon sx={{ color: "#f59e0b", fontSize: 24 }} />
              ) : (
                <AssignmentIcon sx={{ color: "#f59e0b", fontSize: 24 }} />
              )}
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1.1rem" }}>
                {isEditMode ? "View / Edit Duty Assignment" : "Add Duty Assignment"}
              </Typography>
            </Box>

            <IconButton size="small" onClick={() => setDrawerOpen(false)} sx={{ color: "#94a3b8", "&:hover": { color: "#fff" } }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* DRAWER FORM BODY */}
          <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2.2, flexGrow: 1, overflowY: "auto" }}>
            
            {/* DATE */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                DATE
              </Typography>
              <Paper elevation={0} sx={{ p: 1.5, mt: 0.6, background: "#edf2f7", border: "1px solid #e2e8f0", borderRadius: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <CalendarIcon sx={{ color: "#64748b", fontSize: 18 }} />
                <Typography variant="body2" sx={{ fontWeight: 700, color: "#1e293b" }}>
                  {formatReadableDate(selectedDateStr)}
                </Typography>
              </Paper>
            </Box>

            {/* DAY */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                DAY
              </Typography>
              <Paper elevation={0} sx={{ p: 1.5, mt: 0.6, background: "#edf2f7", border: "1px solid #e2e8f0", borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "#1e293b" }}>
                  {formatDayName(selectedDateStr)}
                </Typography>
              </Paper>
            </Box>

            {/* OFFICER SELECTION */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                OFFICER
              </Typography>
              <FormControl fullWidth size="small" sx={{ mt: 0.6 }}>
                <Select
                  value={selectedOfficerId}
                  onChange={(e) => setSelectedOfficerId(e.target.value)}
                  sx={{ background: "#f1f5f9", borderRadius: 2 }}
                >
                  {officers.map((o) => (
                    <MenuItem key={o._id} value={o._id}>
                      {o.policeId} | {o.fullName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* RANK (AUTO DISPLAYED) */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                RANK
              </Typography>
              <Paper elevation={0} sx={{ p: 1.5, mt: 0.6, background: "#edf2f7", border: "1px solid #e2e8f0", borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "#1e293b" }}>
                  {currentOfficerObj ? currentOfficerObj.rank : "PC"}
                </Typography>
              </Paper>
            </Box>

            {/* DUTY TYPE */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                DUTY TYPE
              </Typography>
              <FormControl fullWidth size="small" sx={{ mt: 0.6 }}>
                <Select
                  value={selectedDutyType}
                  onChange={(e) => setSelectedDutyType(e.target.value)}
                  sx={{ background: "#f1f5f9", borderRadius: 2 }}
                >
                  <MenuItem value="Traffic Patrol">Traffic Patrol</MenuItem>
                  <MenuItem value="Crime Investigation">Crime Investigation</MenuItem>
                  <MenuItem value="Station Duty">Station Duty</MenuItem>
                  <MenuItem value="Motorcycle Patrol">Motorcycle Patrol</MenuItem>
                  <MenuItem value="Accident Investigation">Accident Investigation</MenuItem>
                  <MenuItem value="Night Patrol">Night Patrol</MenuItem>
                  <MenuItem value="Leave">On Leave</MenuItem>
                  <MenuItem value="OFF">Day Off</MenuItem>
                  <MenuItem value="Unassigned">Unassigned</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* LOCATION */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                LOCATION
              </Typography>
              <FormControl fullWidth size="small" sx={{ mt: 0.6 }}>
                <Select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  sx={{ background: "#f1f5f9", borderRadius: 2 }}
                >
                  <MenuItem value="Police Station">Police Station</MenuItem>
                  <MenuItem value="Negombo Clock Tower Junction">Negombo Clock Tower Junction</MenuItem>
                  <MenuItem value="Beach Road Tourism Zone">Beach Road Tourism Zone</MenuItem>
                  <MenuItem value="Colombo-Chilaw Highway (A3)">Colombo-Chilaw Highway (A3)</MenuItem>
                  <MenuItem value="Kochchikade Bridge Checkpoint">Kochchikade Bridge Checkpoint</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* SHIFT */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                SHIFT
              </Typography>
              <FormControl fullWidth size="small" sx={{ mt: 0.6 }}>
                <Select
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                  sx={{ background: "#f1f5f9", borderRadius: 2 }}
                >
                  {shifts.map((s) => (
                    <MenuItem key={s._id} value={s.name}>
                      {s.startTime}–{s.endTime} ({s.name})
                    </MenuItem>
                  ))}
                  {shifts.length === 0 && (
                    <MenuItem value="06:00–18:00">06:00–18:00</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Box>

            {/* REMARKS */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                REMARKS
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Additional notes..."
                value={remarksText}
                onChange={(e) => setRemarksText(e.target.value)}
                sx={{ mt: 0.6, "& .MuiOutlinedInput-root": { background: "#f1f5f9", borderRadius: 2 } }}
              />
            </Box>
          </Box>

          {/* DRAWER FOOTER BUTTONS (MATCHING EDIT REFERENCE IMAGE EXACTLY) */}
          <Divider />
          <Box sx={{ p: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#ffffff" }}>
            {/* Left: Delete Button (Edit Mode Only) */}
            {isEditMode ? (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteOutlineIcon />}
                onClick={handleDeleteAssignmentFromDrawer}
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, borderColor: "#fca5a5" }}
              >
                Delete
              </Button>
            ) : (
              <Box />
            )}

            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
              <Button
                onClick={() => setDrawerOpen(false)}
                sx={{ textTransform: "none", fontWeight: 700, color: "#64748b" }}
              >
                Cancel
              </Button>

              <Button
                variant="contained"
                onClick={handleSaveAssignmentFromDrawer}
                sx={{
                  textTransform: "none",
                  fontWeight: 800,
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  background: "#f59e0b",
                  color: "#ffffff",
                  "&:hover": { background: "#d97706" }
                }}
              >
                {isEditMode ? "Save Changes" : "Add Assignment"}
              </Button>
            </Box>
          </Box>
        </Drawer>

        {/* 6. REJECTION DIALOG (OIC ONLY) */}
        <Dialog open={rejectModalOpen} onClose={() => setRejectModalOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 800 }}>Reject Weekly Roster</DialogTitle>
          <DialogContent divider>
            <TextField
              label="Rejection Remarks / Reason"
              multiline
              rows={3}
              fullWidth
              sx={{ mt: 1 }}
              value={rejectionRemarks}
              onChange={(e) => setRejectionRemarks(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRejectModalOpen(false)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={handleRejectRoster} sx={{ textTransform: "none", fontWeight: 700 }}>
              Reject Roster
            </Button>
          </DialogActions>
        </Dialog>

        {/* FEEDBACK SNACKBAR */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} sx={{ fontWeight: 700 }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
}