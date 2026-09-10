import React, { useContext, useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { LanguageContext } from '../context/LanguageContext';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { BASE_URL } from '../config';

export default function OfficerDashboard({ navigation }) {

  const { language } = useContext(LanguageContext);

  // Logged in officer profile state
  const [officer, setOfficer] = useState(global.loggedOfficer || {});
  const [submitting, setSubmitting] = useState(false);

  // Leave Request Modal state
  const [leaveModalVisible, setLeaveModalVisible] = useState(false);
  const [myRequestsModalVisible, setMyRequestsModalVisible] = useState(false);
  const [myRequestsFilter, setMyRequestsFilter] = useState('All');

  // Form fields
  const [leaveType, setLeaveType] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [showLeaveRules, setShowLeaveRules] = useState(false);

  // Acting officer autocomplete state
  const [actingOfficerQuery, setActingOfficerQuery] = useState('');
  const [actingOfficerResults, setActingOfficerResults] = useState([]);
  const [selectedActingOfficer, setSelectedActingOfficer] = useState(null);
  const [showActingDropdown, setShowActingDropdown] = useState(false);

  // Supporting documents state
  const [supportingDocuments, setSupportingDocuments] = useState([]);

  // Leave Type Dropdown & Date Picker Modal states
  const [leaveTypeModalVisible, setLeaveTypeModalVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState('start'); // 'start' | 'end'
  const [tempYear, setTempYear] = useState(new Date().getFullYear());
  const [tempMonth, setTempMonth] = useState(new Date().getMonth() + 1);
  const [tempDay, setTempDay] = useState(new Date().getDate());

  // My Requests list from DB
  const [myRequestsList, setMyRequestsList] = useState([]);
  const [loadingMyRequests, setLoadingMyRequests] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Current formatted application date
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  // Fetch logged-in officer notifications count
  const fetchNotificationsCount = async () => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (global.userToken) {
        headers['Authorization'] = `Bearer ${global.userToken}`;
      }
      const response = await fetch(`${BASE_URL}/notifications/me`, { headers });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          const unread = data.filter(n => !n.isRead).length;
          setUnreadNotifCount(unread);
        }
      }
    } catch (err) {
      console.log('Error fetching notifications count:', err);
    }
  };

  // Fetch logged-in officer profile
  const fetchOfficerProfile = async () => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (global.userToken) {
        headers['Authorization'] = `Bearer ${global.userToken}`;
      }
      const response = await fetch(`${BASE_URL}/officers/me`, { headers });
      if (response.ok) {
        const data = await response.json();
        setOfficer(data);
        if (data.fullName) global.loggedOfficerName = data.fullName;
        if (data.policeId) global.loggedOfficerId = data.policeId;
        if (data.rank) global.loggedOfficerRank = data.rank;
      }
    } catch (err) {
      console.log('Error fetching officer profile:', err);
    }
  };

  // Fetch real leave history from backend
  const fetchMyLeaves = async () => {
    try {
      setLoadingMyRequests(true);
      const headers = { 'Content-Type': 'application/json' };
      if (global.userToken) {
        headers['Authorization'] = `Bearer ${global.userToken}`;
      }
      const response = await fetch(`${BASE_URL}/leaves/me`, { headers });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          const mapped = data.map((leaf, index) => {
            const leafTypeStr = leaf.leaveType ? (leaf.leaveType.toLowerCase().includes("leave") ? leaf.leaveType : `${leaf.leaveType} Leave`) : "Casual Leave";
            const startStr = leaf.startDate ? new Date(leaf.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : "";
            const endStr = leaf.endDate ? new Date(leaf.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "";
            const datesStr = startStr && endStr ? `${startStr} – ${endStr}` : "Period set";
            const refNumber = `#LR-${new Date(leaf.createdAt || Date.now()).getFullYear()}-${(leaf._id || index.toString()).slice(-5).toUpperCase()}`;

            let sType = (leaf.status || "Pending").toLowerCase();
            let sText = leaf.status === "Pending" ? "Pending OIC Approval" : leaf.status;

            return {
              id: leaf._id || index.toString(),
              refNo: refNumber,
              leaveType: leafTypeStr,
              subText: leaf.status === 'Pending' 
                ? `Submitted: ${new Date(leaf.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
                : `Reviewed: ${new Date(leaf.updatedAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`,
              status: sText,
              statusType: sType,
              dates: datesStr,
              duration: `${leaf.duration || 1} Day${(leaf.duration || 1) > 1 ? 's' : ''}`,
              stationRelieverLabel: 'STATION / RELIEVER',
              stationRelieverVal: leaf.officer?.station || 'Negombo PS',
              relieverDetail: leaf.actingOfficer ? `${leaf.actingOfficer.fullName} (${leaf.actingOfficer.policeId || leaf.actingOfficer.rank || 'Officer'})` : 'Unassigned',
              authorizedBy: leaf.status === 'Approved' ? 'OIC Traffic Branch' : undefined,
              authorizedRole: leaf.status === 'Approved' ? 'Officer-In-Charge (OIC)' : undefined,
                  : `Rejected: ${leaf.rejectionRemarks || 'Check officer feedback'}`
            };
          });
          setMyRequestsList(mapped);
        }
      }
    } catch (err) {
      console.log('Error fetching my leave requests:', err);
    } finally {
      setLoadingMyRequests(false);
    }
  };

  useEffect(() => {
    fetchOfficerProfile();
    fetchMyLeaves();
  }, []);

  // Autocomplete search for acting officer
  const handleSearchActingOfficer = async (text) => {
    setActingOfficerQuery(text);
    if (!text || text.trim().length < 1) {
      setActingOfficerResults([]);
      setShowActingDropdown(false);
      return;
    }

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (global.userToken) {
        headers['Authorization'] = `Bearer ${global.userToken}`;
      }
      const response = await fetch(`${BASE_URL}/officers/search?query=${encodeURIComponent(text.trim())}`, { headers });
      if (response.ok) {
        const results = await response.json();
        setActingOfficerResults(Array.isArray(results) ? results : []);
        setShowActingDropdown(true);
      }
    } catch (err) {
      console.log('Error searching acting officers:', err);
    }
  };

  const handleSelectActingOfficer = (off) => {
    setSelectedActingOfficer(off);
    setActingOfficerQuery(off.fullName);
    setShowActingDropdown(false);
  };

  const handleClearActingOfficer = () => {
    setSelectedActingOfficer(null);
    setActingOfficerQuery('');
    setActingOfficerResults([]);
    setShowActingDropdown(false);
  };

  // Multiple document picker
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const newAssets = result.assets || [];
      setSupportingDocuments(prev => [...prev, ...newAssets]);
    } catch (err) {
      console.log("Error picking document:", err);
      Alert.alert("Document Picker Error", "Failed to select document.");
    }
  };

  const handleRemoveDocument = (indexToRemove) => {
    setSupportingDocuments(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const convertFileToBase64 = async (uri, mimeType) => {
    if (!uri) return "";
    if (uri.startsWith('data:')) return uri;
    try {
      const decodedUri = decodeURIComponent(uri);
      const base64Data = await FileSystem.readAsStringAsync(decodedUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return `data:${mimeType || 'application/octet-stream'};base64,${base64Data}`;
    } catch (err) {
      console.log("Error converting file to Base64 (decoded uri):", err);
      try {
        const base64Data = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return `data:${mimeType || 'application/octet-stream'};base64,${base64Data}`;
      } catch (err2) {
        console.log("Error converting file to Base64 (raw uri):", err2);
        return "";
      }
    }
  };

  const translations = {
    EN: {
      dashboard: "Dashboard",
      logout: "Logout",
      welcome: "Welcome!",
      date: "Thursday 26th of March",
      today: "Today's Overview",
      duty: "Assigned Duty",
      location: "Negombo Junction",
      time: "8AM - 4PM",
      accidents: "Accident Count",
      violations: "Violation Count",
      pending: "Pending Cases",
      recent: "Recent Activity",
      fatal: "Fatal",
      speeding: "Speeding",

      // Leave Balance
      leaveBalanceTitle: "Leave Balance (2026)",
      officialQuota: "OFFICIAL QUOTA",
      personal: "Personal",
      vacationLabel: "(Vacation)",
      casual: "Casual",
      annualLabel: "(Annual)",
      medical: "Medical",
      sickHospitalLabel: "(Sick/Hospital)",
      daysLeft: "Days Left",
      tot28: "Tot: 28",
      tot21: "Tot: 21",
      quota14: "Quota: 14",
      requestLeave: "REQUEST LEAVE",
      myRequests: "My Requests",

      // Full Leave Request Form
      requestLeaveHeader: "Request Leave",
      leaveRules: "Leave Rules",
      officerDetails: "Officer Details",
      nameLabel: "NAME",
      policeIdLabel: "POLICE ID",
      rankLabel: "RANK",
      stationLabel: "STATION",
      appDateLabel: "APPLICATION DATE",
      serviceRecord: "Service Record",
      dateOfApptLabel: "DATE OF APPT",
      lastLeaveLabel: "LAST LEAVE",
      takenThisYearLabel: "TAKEN THIS YEAR",
      leaveConfig: "Leave Configuration",
      leaveTypeLabel: "LEAVE TYPE",
      contactNoLabel: "CONTACT NUMBER DURING LEAVE",
      addressLabel: "ADDRESS DURING LEAVE",
      durationTitle: "Duration",
      startDateLabelShort: "START DATE",
      endDateLabelShort: "END DATE",
      totalDurationLabel: "TOTAL DURATION",
      justificationHandover: "Justification & Handover",
      reasonForLeaveLabel: "REASON FOR LEAVE",
      actingOfficerLabel: "ACTING OFFICER (DUTY HANDOVER)",
      handoverNotesLabel: "HANDOVER NOTES",
      proceedReview: "Proceed to Review",
      cancelBtn: "Cancel",
      successMsg: "Leave request submitted successfully for approval.",

      // My Requests Modal
      myRequestsTitle: "My Leave Submissions",
      closeBtn: "Close",
      noRequests: "No leave requests submitted yet."
    },
    SI: {
      dashboard: "ඩෑෂ්බෝඩ්",
      logout: "ඉවත් වන්න",
      welcome: "සාදරයෙන් පිළිගනිමු!",
      date: "මාර්තු 26 බ්‍රහස්පතින්දා",
      today: "අද සාරාංශය",
      duty: "කාර්ය භාරය",
      location: "නෙගොම්බෝ හන්දිය",
      time: "පෙ.ව 8 - ප.ව 4",
      accidents: "අනතුරු ගණන",
      violations: "වැරදි ගණන",
      pending: "පවතින නඩු",
      recent: "අලුත් ක්‍රියාකාරකම්",
      fatal: "මාරාන්තික",
      speeding: "වේගයෙන් ධාවනය",

      // Leave Balance
      leaveBalanceTitle: "නිවාඩු ශේෂය (2026)",
      officialQuota: "නිල කෝටාව",
      personal: "පුද්ගලික",
      vacationLabel: "(විවේක)",
      casual: "අනියම්",
      annualLabel: "(වාර්ෂික)",
      medical: "වෛද්‍ය",
      sickHospitalLabel: "(ගිලන්/රෝහල්)",
      daysLeft: "ඉතිරි දින",
      tot28: "එකතුව: 28",
      tot21: "එකතුව: 21",
      quota14: "කෝටාව: 14",
      requestLeave: "නිවාඩු ඉල්ලන්න",
      myRequests: "මාගේ ඉල්ලීම්",

      // Full Leave Request Form
      requestLeaveHeader: "නිවාඩු ඉල්ලුම් කිරීම",
      leaveRules: "නිවාඩු රෙගුලාසි",
      officerDetails: "නිලධාරි විස්තර",
      nameLabel: "නම",
      policeIdLabel: "පොලිස් අංකය",
      rankLabel: "තනතුර",
      stationLabel: "පොලිස් ස්ථානය",
      appDateLabel: "ඉල්ලුම් කළ දිනය",
      serviceRecord: "සේවා වාර්තාව",
      dateOfApptLabel: "පත්කළ දිනය",
      lastLeaveLabel: "අවසාන නිවාඩුව",
      takenThisYearLabel: "මේ වසරේ ලබාගත් නිවාඩු",
      leaveConfig: "නිවාඩු සැකසුම",
      leaveTypeLabel: "නිවාඩු වර්ගය",
      contactNoLabel: "නිවාඩු කාලයේ දුරකථන අංකය",
      addressLabel: "නිවාඩු කාලයේ ලිපිනය",
      durationTitle: "කාලසීමාව",
      startDateLabelShort: "ආරම්භක දිනය",
      endDateLabelShort: "අවසාන දිනය",
      totalDurationLabel: "මුළු දින ගණන",
      justificationHandover: "සාධාරණීකරණය සහ රාජකාරි පැවරීම",
      reasonForLeaveLabel: "නිවාඩුවට හේතුව",
      actingOfficerLabel: "වැඩබලන නිලධාරියා",
      handoverNotesLabel: "රාජකාරි පැවරීමේ සටහන්",
      proceedReview: "සමලෝචනයට යොමු කරන්න",
      cancelBtn: "අවලංගු කරන්න",
      successMsg: "නිවාඩු ඉල්ලුම්පත සාර්ථකව යොමු කරන ලදී.",

      // My Requests Modal
      myRequestsTitle: "මාගේ නිවාඩු ඉල්ලීම්",
      closeBtn: "වසා දමන්න",
      noRequests: "තවම නිවාඩු ඉල්ලීම් සිදුකර නැත."
    }
  };

  const t = translations[language];

  const handleLogout = () => {
    navigation.replace('Login');
  };

  // Calculate duration automatically: (end - start) + 1
  const calculateDays = () => {
    if (!startDate || !endDate) return '0 Days';
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return '0 Days';
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${diffDays} Day${diffDays > 1 ? 's' : ''}`;
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    if (tempMonth === 1) {
      setTempMonth(12);
      setTempYear(tempYear - 1);
    } else {
      setTempMonth(tempMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (tempMonth === 12) {
      setTempMonth(1);
      setTempYear(tempYear + 1);
    } else {
      setTempMonth(tempMonth + 1);
    }
  };

  const renderCalendarDays = () => {
    const daysInMonth = new Date(tempYear, tempMonth, 0).getDate();
    const firstDayIndex = new Date(tempYear, tempMonth - 1, 1).getDay();

    const cells = [];
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(<View key={`blank-${i}`} style={styles.calendarDayCell} />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const isSelected = tempDay === d;
      cells.push(
        <TouchableOpacity
          key={`day-${d}`}
          style={[styles.calendarDayCell, isSelected && styles.calendarDayCellSelected]}
          onPress={() => setTempDay(d)}
          activeOpacity={0.7}
        >
          <Text style={[styles.calendarDayText, isSelected && styles.calendarDayTextSelected]}>
            {d}
          </Text>
        </TouchableOpacity>
      );
    }
    return cells;
  };

  const openDatePicker = (target) => {
    setDatePickerTarget(target);
    const currentDateStr = target === 'start' ? startDate : endDate;
    if (currentDateStr && currentDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parts = currentDateStr.split('-');
      setTempYear(parseInt(parts[0], 10));
      setTempMonth(parseInt(parts[1], 10));
      setTempDay(parseInt(parts[2], 10));
    } else {
      const now = new Date();
      setTempYear(now.getFullYear());
      setTempMonth(now.getMonth() + 1);
      setTempDay(now.getDate());
    }
    setDatePickerVisible(true);
  };

  const confirmDateSelection = () => {
    const formattedMonth = String(tempMonth).padStart(2, '0');
    const formattedDay = String(tempDay).padStart(2, '0');
    const formattedDate = `${tempYear}-${formattedMonth}-${formattedDay}`;

    if (datePickerTarget === 'start') {
      setStartDate(formattedDate);
      if (!endDate || new Date(endDate) < new Date(formattedDate)) {
        setEndDate(formattedDate);
      }
    } else {
      setEndDate(formattedDate);
    }
    setDatePickerVisible(false);
  };

  const setPresetDate = (daysFromToday) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromToday);
    setTempYear(d.getFullYear());
    setTempMonth(d.getMonth() + 1);
    setTempDay(d.getDate());
  };

  const applyQuickDates = (startOffsetDays, durationDaysOffset) => {
    const start = new Date();
    start.setDate(start.getDate() + startOffsetDays);
    const end = new Date(start);
    end.setDate(end.getDate() + durationDaysOffset);

    const startFmt = start.toISOString().split('T')[0];
    const endFmt = end.toISOString().split('T')[0];

    setStartDate(startFmt);
    setEndDate(endFmt);
  };

  // Submit leave request to backend API
  const handleSubmitLeave = async () => {
    if (!leaveType) {
      Alert.alert("Missing Leave Type", "Please select a leave type (Casual, Medical, or Personal).");
      return;
    }
    if (leaveType === "Medical" && supportingDocuments.length === 0) {
      Alert.alert("Supporting Document Required", "Medical leave applications require at least one supporting document or medical certificate.");
      return;
    }
    if (!startDate || !endDate) {
      Alert.alert("Missing Dates", "Please select or enter both start and end dates.");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      Alert.alert("Invalid Dates", "Please enter valid start and end dates (e.g. YYYY-MM-DD).");
      return;
    }

    if (end < start) {
      Alert.alert("Invalid Date Order", "End date cannot be before start date.");
      return;
    }

    setSubmitting(true);
    try {
      // Process supporting documents into base64
      const processedDocs = await Promise.all(
        supportingDocuments.map(async (doc) => {
          const fileUrl = await convertFileToBase64(doc.uri, doc.mimeType);
          return {
            fileName: doc.name || "Supporting Document",
            fileUrl: fileUrl,
            mimeType: doc.mimeType || "application/octet-stream"
          };
        })
      );

      const payload = {
        leaveType: leaveType.trim(),
        startDate,
        endDate,
        remarks: reason,
        contactNo: contactNumber || officer.contactNo || '',
        address: address || officer.address || '',
        actingOfficer: selectedActingOfficer ? selectedActingOfficer._id : null,
        handoverNotes: handoverNotes || '',
        supportingDocuments: processedDocs
      };

      const headers = { 'Content-Type': 'application/json' };
      if (global.userToken) {
        headers['Authorization'] = `Bearer ${global.userToken}`;
      }

      console.log("Submitting leave request to:", `${BASE_URL}/leaves`);
      const response = await fetch(`${BASE_URL}/leaves`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      console.log("Server Leave Submission Status:", response.status);
      console.log("Server Leave Submission Response:", responseText);

      let resData = {};
      try {
        resData = JSON.parse(responseText);
      } catch (jsonErr) {
        console.log("Response text is not JSON:", responseText);
      }

      if (response.ok) {
        Alert.alert("Success", t.successMsg || "Leave request submitted successfully for approval.");
        setLeaveModalVisible(false);

        // Reset form
        setLeaveType('');
        setStartDate('');
        setEndDate('');
        setReason('');
        setContactNumber('');
        setAddress('');
        setSelectedActingOfficer(null);
        setActingOfficerQuery('');
        setHandoverNotes('');
        setSupportingDocuments([]);

        // Refresh my requests list
        fetchMyLeaves();
      } else {
        const errorMsg = resData.message || resData.error || (response.status === 404 ? "Leave service endpoint not found (404). Please ensure server is running latest update." : `Unable to submit leave request (Status ${response.status}).`);
        Alert.alert("Submission Failed", errorMsg);
      }
    } catch (err) {
      console.log("Error submitting leave request:", err);
      Alert.alert(
        "Connection Error",
        `Unable to connect to backend server (${err.message || "Network request failed"}). Please verify backend server status and network connection.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={styles.container}>

        {/* HEADER */}
        <View style={styles.header}>

          {/* LEFT - LOGOUT */}
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.logout}>{t.logout}</Text>
          </TouchableOpacity>

          {/* CENTER - TITLE */}
          <Text style={styles.headerText}>{t.dashboard}</Text>

          {/* RIGHT - ICONS */}
          <View style={styles.topIcons}>
            <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={{ marginRight: 15, position: 'relative' }}>
              <Ionicons
                name="notifications-outline"
                size={22}
                color="#fff"
              />
              {unreadNotifCount > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -2,
                  right: -3,
                  backgroundColor: '#ef4444',
                  borderRadius: 6,
                  width: 10,
                  height: 10,
                  borderWidth: 1.5,
                  borderColor: '#1e3a8a'
                }} />
              )}
            </TouchableOpacity>

            <Ionicons
              name="person-circle-outline"
              size={24}
              color="#fff"
              onPress={() => navigation.navigate('Profile')}
            />
          </View>

        </View>

        {/* Welcome */}
        <View style={styles.welcomeBox}>
          <Text style={styles.welcomeText}>{t.welcome} {officer.fullName || global.loggedOfficerName || ''}</Text>
          <Text style={{ color: '#fff' }}>{t.date}</Text>
        </View>

        {/* Overview */}
        <Text style={styles.section}>{t.today}</Text>

        <View style={styles.grid}>

          <View style={styles.card}>
            <Text>{t.duty}</Text>
            <Text>{t.location}</Text>
            <Text style={styles.big}>{t.time}</Text>
          </View>

          <View style={styles.card}>
            <Text>{t.accidents}</Text>
            <Text style={styles.big}>2</Text>
          </View>

          <View style={styles.card}>
            <Text>{t.violations}</Text>
            <Text style={styles.big}>4</Text>
          </View>

          <View style={styles.card}>
            <Text>{t.pending}</Text>
            <Text style={styles.big}>3</Text>
          </View>

        </View>

        {/* LEAVE BALANCE CARD */}
        <View style={styles.leaveCard}>
          {/* LEAVE BALANCE HEADER */}
          <View style={styles.leaveHeaderRow}>
            <View style={styles.leaveTitleGroup}>
              <Ionicons name="calendar-outline" size={18} color="#1e3a8a" style={{ marginRight: 6 }} />
              <Text style={styles.leaveCardTitle}>{t.leaveBalanceTitle}</Text>
            </View>
          </View>

          {/* 3 LEAVE SUB-CARDS */}
          <View style={styles.leaveSubCardsRow}>
            {/* PERSONAL */}
            <View style={styles.leaveSubCard}>
              <Text style={styles.leaveTypeTitle}>{t.personal}</Text>
              <Text style={styles.leaveDaysNumber}>18</Text>
              <Text style={styles.daysLeftLabel}>{t.daysLeft}</Text>
              <Text style={styles.leaveFootnote}>{t.tot28}</Text>
            </View>

            {/* MEDICAL */}
            <View style={styles.leaveSubCard}>
              <Text style={styles.leaveTypeTitle}>{t.medical}</Text>
              <Text style={styles.leaveDaysNumber}>14</Text>
              <Text style={styles.daysLeftLabel}>{t.daysLeft}</Text>
              <Text style={styles.leaveFootnote}>{t.tot28 || "Tot: 28"}</Text>
            </View>
          </View>

          {/* REQUEST LEAVE BUTTON */}
          <TouchableOpacity
            style={styles.requestLeaveButton}
            onPress={() => setLeaveModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.requestLeaveBtnText}>{t.requestLeave}</Text>
          </TouchableOpacity>

          {/* MY REQUESTS BUTTON */}
          <TouchableOpacity
            style={styles.myRequestsButton}
            onPress={() => {
              fetchMyLeaves();
              setMyRequestsModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.myRequestsLeft}>
              <Ionicons name="time-outline" size={18} color="#1e3a8a" style={{ marginRight: 8 }} />
              <Text style={styles.myRequestsText}>{t.myRequests}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Recent */}
        <Text style={styles.section}>{t.recent}</Text>

        <View style={styles.activity}>
          <Text>Galle Road, Colombo - {t.fatal}</Text>
        </View>

        <View style={styles.activity}>
          <Text>Kochchikade, Negombo - {t.speeding}</Text>
        </View>

      </ScrollView>

      {/* FULL SCROLLABLE REQUEST LEAVE MODAL */}
      <Modal
        visible={leaveModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setLeaveModalVisible(false)}
      >
        <SafeAreaView style={styles.fullModalSafeArea}>
          {/* HEADER BAR */}
          <View style={styles.fullModalHeader}>
            <TouchableOpacity onPress={() => setLeaveModalVisible(false)} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#0f172a" />
            </TouchableOpacity>
            <Text style={styles.fullModalTitle}>{t.requestLeaveHeader}</Text>
            <View style={{ width: 32 }} />
          </View>

          {/* SCROLLABLE FORM CONTAINER */}
          <ScrollView
            style={styles.fullModalScrollView}
            contentContainerStyle={styles.fullModalScrollContent}
            showsVerticalScrollIndicator={true}
          >
            {/* 1. LEAVE RULES ACCORDION */}
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => setShowLeaveRules(!showLeaveRules)}
              activeOpacity={0.8}
            >
              <View style={styles.accordionLeft}>
                <Ionicons name="clipboard-outline" size={20} color="#1e3a8a" style={{ marginRight: 10 }} />
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.accordionTitle}>{t.viewLeaveRules || "Submission Rules"}</Text>
                  </View>
                  <Text style={styles.accordionSubTitle}>
                    {t.viewLeaveRulesSub || "View rules before submitting your application.."}
                  </Text>
                </View>
              </View>
              <Ionicons
                name={showLeaveRules ? "chevron-up" : "chevron-down"}
                size={20}
                color="#64748b"
              />
            </TouchableOpacity>

            {showLeaveRules && (
              <View style={styles.rulesCardsContainer}>
                <View style={styles.ruleCard}>
                  <Text style={styles.ruleCardTitle}>Personal Leave</Text>
                  <Text style={styles.ruleCardBody}>Advance Notice: Personal leave applications must be submitted at least 7 days before the requested leave start date.</Text>
                </View>

                <View style={styles.ruleCard}>
                  <Text style={styles.ruleCardTitle}>Casual Leave</Text>
                  <Text style={styles.ruleCardBody}>Advance Notice: Casual leave applications must be submitted at least 3 days before the requested leave start date.</Text>
                </View>

                <View style={styles.ruleCard}>
                  <Text style={styles.ruleCardTitle}>Medical Leave</Text>
                  <Text style={styles.ruleCardBody}>Medical Evidence: Medical leave applications must include the required Government Medical Officer (GMO) medical certificate/document according to the applicable medical leave provisions.</Text>
                </View>

                <View style={styles.ruleCard}>
                  <Text style={styles.ruleCardTitle}>Duty Handover</Text>
                  <Text style={styles.ruleCardBody}>Acting Officer: Applicants must identify an Acting Officer who has confirmed availability for the requested leave period.</Text>
                </View>

                <View style={styles.ruleCard}>
                  <Text style={styles.ruleCardTitle}>Blackout Dates</Text>
                  <Text style={styles.ruleCardBody}>Restricted Periods: Leave may be restricted during high-security alerts or national holidays according to Department instructions.</Text>
                </View>
              </View>
            )}

            {/* 2. OFFICER DETAILS CARD (AUTO-POPULATED FROM LOGGED IN PROFILE) */}
            <View style={styles.formCard}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="id-card-outline" size={18} color="#0f172a" style={{ marginRight: 6 }} />
                <Text style={styles.cardHeaderTitle}>{t.officerDetails}</Text>
              </View>

              <View style={styles.gridTwoCol}>
                <View style={styles.colHalf}>
                  <Text style={styles.fieldMetaLabel}>{t.nameLabel}</Text>
                  <Text style={styles.fieldMetaValue}>
                    {officer.fullName || global.loggedOfficerName || "Traffic Officer"}
                  </Text>
                </View>
                <View style={styles.colHalf}>
                  <Text style={styles.fieldMetaLabel}>{t.policeIdLabel}</Text>
                  <Text style={[styles.fieldMetaValue, { fontWeight: 'bold' }]}>
                    {officer.policeId || global.loggedOfficerPoliceId || officer.username || "PC-09023"}
                  </Text>
                </View>
              </View>

              <View style={[styles.gridTwoCol, { marginTop: 10 }]}>
                <View style={styles.colHalf}>
                  <Text style={styles.fieldMetaLabel}>{t.rankLabel || "RANK"}</Text>
                  <Text style={styles.fieldMetaValue}>{officer.rank || "Constable"}</Text>
                </View>
                <View style={styles.colHalf}>
                  <Text style={styles.fieldMetaLabel}>{t.appDateLabel}</Text>
                  <Text style={styles.fieldMetaValue}>{todayFormatted}</Text>
                </View>
              </View>
            </View>

            {/* 3. LEAVE CONFIGURATION CARD */}
            <View style={styles.formCard}>
              <Text style={styles.cardHeaderTitle}>{t.leaveConfig}</Text>

              <Text style={styles.formInputLabel}>{t.leaveTypeLabel} *</Text>
              <View style={styles.leaveTypeCardsContainer}>
                {[
                  { label: "Casual Leave", value: "Casual", icon: "briefcase", color: "#2563eb" },
                  { label: "Medical Leave", value: "Medical", icon: "medkit", color: "#059669" },
                  { label: "Personal Leave", value: "Personal", icon: "person", color: "#7c3aed" }
                ].map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.leaveTypeCardItem,
                      leaveType === item.value && { borderColor: item.color, backgroundColor: item.color + '15' }
                    ]}
                    onPress={() => setLeaveType(item.value)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={leaveType === item.value ? item.color : "#64748b"}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={[
                      styles.leaveTypeCardText,
                      leaveType === item.value && { color: item.color, fontWeight: 'bold' }
                    ]}>
                      {item.label}
                    </Text>
                    {leaveType === item.value && (
                      <Ionicons name="checkmark-circle" size={18} color={item.color} style={{ marginLeft: 'auto' }} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.formInputLabel, { marginTop: 12 }]}>{t.contactNoLabel}</Text>
              <View style={styles.inputWithIconRow}>
                <Ionicons name="call-outline" size={18} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.iconTextInput}
                  placeholder={officer.contactNo || "+94 7X XXX XXXX"}
                  value={contactNumber}
                  onChangeText={setContactNumber}
                  keyboardType="phone-pad"
                />
              </View>

              <Text style={styles.formInputLabel}>{t.addressLabel}</Text>
              <View style={styles.inputWithIconRow}>
                <Ionicons name="location-outline" size={18} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.iconTextInput}
                  placeholder={officer.address || "Enter full address during leave"}
                  value={address}
                  onChangeText={setAddress}
                />
              </View>
            </View>

            {/* 4. DURATION CARD */}
            <View style={styles.formCard}>
              <Text style={styles.cardHeaderTitle}>{t.durationTitle}</Text>

              <View style={styles.gridTwoCol}>
                <View style={styles.colHalf}>
                  <Text style={styles.formInputLabel}>{t.startDateLabelShort} *</Text>
                  <View style={styles.inputWithIconRow}>
                    <TextInput
                      style={[styles.iconTextInput, { flex: 1 }]}
                      placeholder="YYYY-MM-DD"
                      value={startDate}
                      onChangeText={setStartDate}
                    />
                    <TouchableOpacity
                      onPress={() => openDatePicker('start')}
                      style={{ padding: 6, backgroundColor: '#eff6ff', borderRadius: 8, marginLeft: 4 }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="calendar" size={20} color="#1e3a8a" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.colHalf}>
                  <Text style={styles.formInputLabel}>{t.endDateLabelShort} *</Text>
                  <View style={styles.inputWithIconRow}>
                    <TextInput
                      style={[styles.iconTextInput, { flex: 1 }]}
                      placeholder="YYYY-MM-DD"
                      value={endDate}
                      onChangeText={setEndDate}
                    />
                    <TouchableOpacity
                      onPress={() => openDatePicker('end')}
                      style={{ padding: 6, backgroundColor: '#eff6ff', borderRadius: 8, marginLeft: 4 }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="calendar" size={20} color="#1e3a8a" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>


              {/* TOTAL DURATION BANNER (READ ONLY - AUTO CALCULATED) */}
              <View style={styles.totalDurationBar}>
                <Text style={styles.totalDurationText}>{t.totalDurationLabel}</Text>
                <Text style={styles.totalDurationVal}>{calculateDays()}</Text>
              </View>
            </View>

            {/* 5. JUSTIFICATION & HANDOVER CARD WITH ACTING OFFICER AUTOCOMPLETE */}
            <View style={styles.formCard}>
              <Text style={styles.cardHeaderTitle}>{t.justificationHandover}</Text>

              <Text style={styles.formInputLabel}>{t.reasonForLeaveLabel}</Text>
              <TextInput
                style={[styles.textAreaInput]}
                placeholder="Provide a detailed justification for the leave request..."
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.formInputLabel}>{t.actingOfficerLabel}</Text>
              <View style={{ position: 'relative', zIndex: 10 }}>
                {selectedActingOfficer ? (
                  <View style={styles.selectedOfficerChip}>
                    <Ionicons name="person-circle" size={24} color="#1e3a8a" />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.selectedOfficerName}>{selectedActingOfficer.fullName}</Text>
                      <Text style={styles.selectedOfficerId}>
                        {selectedActingOfficer.rank || 'Officer'} • ID: {selectedActingOfficer.policeId || selectedActingOfficer.username}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={handleClearActingOfficer}>
                      <Ionicons name="close-circle" size={22} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.inputWithIconRow}>
                    <Ionicons name="search-outline" size={18} color="#64748b" style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.iconTextInput}
                      placeholder="Type name or Police ID (e.g. NU)..."
                      value={actingOfficerQuery}
                      onChangeText={handleSearchActingOfficer}
                    />
                  </View>
                )}

                {/* Autocomplete Dropdown List */}
                {showActingDropdown && actingOfficerResults.length > 0 && !selectedActingOfficer && (
                  <View style={styles.actingDropdownList}>
                    {actingOfficerResults.map((off) => (
                      <TouchableOpacity
                        key={off._id}
                        style={styles.actingDropdownItem}
                        onPress={() => handleSelectActingOfficer(off)}
                      >
                        <Text style={styles.actingItemName}>{off.fullName}</Text>
                        <Text style={styles.actingItemId}>
                          {off.rank || 'Constable'} ({off.policeId || off.username})
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <Text style={[styles.formInputLabel, { marginTop: 12 }]}>{t.handoverNotesLabel}</Text>
              <TextInput
                style={styles.textAreaInput}
                placeholder="Specific instructions or notes for duty handover..."
                value={handoverNotes}
                onChangeText={setHandoverNotes}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* 6. SUPPORTING DOCUMENTS CARD (ALWAYS VISIBLE) */}
            <View style={styles.formCard}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="attach-outline" size={18} color="#0f172a" style={{ marginRight: 6 }} />
                <Text style={styles.cardHeaderTitle}>
                  Supporting Documents {leaveType === "Medical" ? "(Required for Medical Leave) *" : "(Optional)"}
                </Text>
              </View>

              <TouchableOpacity style={styles.uploadArea} onPress={handlePickDocument} activeOpacity={0.8}>
                <Ionicons name="cloud-upload-outline" size={24} color="#0284c7" />
                <Text style={styles.uploadTextPrimary}>+ Select Supporting Documents</Text>
                <Text style={styles.uploadTextSecondary}>Accepted: Medical Certificate, Memo, Hospital Letter (PDF, JPG, PNG, DOC)</Text>
              </TouchableOpacity>

              {supportingDocuments.length > 0 && (
                <View style={{ marginTop: 14 }}>
                  <Text style={styles.formInputLabel}>SELECTED ATTACHMENTS ({supportingDocuments.length})</Text>
                  {supportingDocuments.map((doc, idx) => (
                    <View key={idx} style={styles.filePreviewItem}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <Ionicons
                          name={doc.name?.endsWith('.pdf') ? "document-text" : "image"}
                          size={22}
                          color="#0284c7"
                        />
                        <View style={{ marginLeft: 10, flex: 1 }}>
                          <Text style={styles.fileName} numberOfLines={1}>{doc.name}</Text>
                          <Text style={styles.fileSize}>
                            {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : 'Ready to upload'}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity onPress={() => handleRemoveDocument(idx)}>
                        <Text style={styles.removeLink}><Ionicons name="close" size={14} /> Remove</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* BOTTOM ACTION BUTTONS */}
            <TouchableOpacity
              style={[styles.proceedReviewBtn, submitting && { opacity: 0.6 }]}
              onPress={handleSubmitLeave}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Text style={styles.proceedReviewBtnText}>{t.submitLeaveRequest || "Submit Leave Request"}</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelFullBtn}
              onPress={() => setLeaveModalVisible(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close-outline" size={18} color="#64748b" style={{ marginRight: 4 }} />
              <Text style={styles.cancelFullBtnText}>{t.cancelBtn}</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* INTERACTIVE CALENDAR POPUP OVERLAY */}
          {datePickerVisible && (
            <View style={styles.calendarOverlayBackdrop}>
              <View style={styles.calendarModalCard}>
                {/* HEADER */}
                <View style={styles.calendarModalHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="calendar" size={20} color="#1e3a8a" style={{ marginRight: 8 }} />
                    <Text style={styles.calendarModalTitle}>
                      {datePickerTarget === 'start' ? "Select Start Date" : "Select End Date"}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setDatePickerVisible(false)} style={{ padding: 4 }}>
                    <Ionicons name="close" size={22} color="#64748b" />
                  </TouchableOpacity>
                </View>

                {/* MONTH NAVIGATION ROW */}
                <View style={styles.calendarMonthRow}>
                  <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavBtn}>
                    <Ionicons name="chevron-back" size={20} color="#1e3a8a" />
                  </TouchableOpacity>
                  <Text style={styles.calendarMonthText}>
                    {monthNames[tempMonth - 1]} {tempYear}
                  </Text>
                  <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavBtn}>
                    <Ionicons name="chevron-forward" size={20} color="#1e3a8a" />
                  </TouchableOpacity>
                </View>

                {/* WEEKDAY HEADERS */}
                <View style={styles.calendarWeekdayRow}>
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <Text key={day} style={styles.calendarWeekdayText}>{day}</Text>
                  ))}
                </View>

                {/* DAYS GRID */}
                <View style={styles.calendarDaysGrid}>
                  {renderCalendarDays()}
                </View>

                {/* PRESETS */}
                <View style={styles.calendarPresetRow}>
                  <TouchableOpacity style={styles.calendarPresetChip} onPress={() => setPresetDate(0)}>
                    <Text style={styles.calendarPresetText}>Today</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.calendarPresetChip} onPress={() => setPresetDate(1)}>
                    <Text style={styles.calendarPresetText}>Tomorrow</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.calendarPresetChip} onPress={() => setPresetDate(3)}>
                    <Text style={styles.calendarPresetText}>+3 Days</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.calendarPresetChip} onPress={() => setPresetDate(7)}>
                    <Text style={styles.calendarPresetText}>+7 Days</Text>
                  </TouchableOpacity>
                </View>

                {/* CONFIRM BUTTON */}
                <TouchableOpacity style={styles.calendarConfirmBtn} onPress={confirmDateSelection} activeOpacity={0.8}>
                  <Text style={styles.calendarConfirmBtnText}>
                    Confirm Date ({tempYear}-{String(tempMonth).padStart(2, '0')}-{String(tempDay).padStart(2, '0')})
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>



      {/* MY LEAVE REQUESTS FULL MODAL */}
      <Modal
        visible={myRequestsModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setMyRequestsModalVisible(false)}
      >
        <SafeAreaView style={styles.myReqSafeArea}>
          {/* DARK NAVY HEADER BANNER */}
          <View style={styles.myReqHeaderBanner}>
            <View style={styles.myReqHeaderTopRow}>
              <Text style={styles.myReqHeaderTitle}>My Leave Requests</Text>
              <TouchableOpacity onPress={() => setMyRequestsModalVisible(false)} style={styles.myReqCloseBtn}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.myReqHeaderSubTitle}>Track status, history, and official endorsements.</Text>

            <View style={styles.myReqLocationPill}>
              <View style={styles.blueDot} />
              <Text style={styles.myReqLocationText}>Traffic HQ • {officer.station || "Negombo PS"}</Text>
            </View>
          </View>

          {/* FILTER TABS ROW */}
          <View style={styles.filterTabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
              {[
                { label: 'All', count: myRequestsList.length },
                { label: 'Pending', count: myRequestsList.filter(i => i.statusType === 'pending').length },
                { label: 'Approved', count: myRequestsList.filter(i => i.statusType === 'approved').length },
                { label: 'Rejected', count: myRequestsList.filter(i => i.statusType === 'rejected').length }
              ].map(tab => (
                <TouchableOpacity
                  key={tab.label}
                  style={[
                    styles.filterTab,
                    myRequestsFilter === tab.label && styles.filterTabActive
                  ]}
                  onPress={() => setMyRequestsFilter(tab.label)}
                >
                  <Text style={[
                    styles.filterTabText,
                    myRequestsFilter === tab.label && styles.filterTabTextActive
                  ]}>
                    {tab.label} ({tab.count})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* SCROLLABLE CARDS LIST */}
          <ScrollView
            style={{ flex: 1, backgroundColor: '#f8fafc' }}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          >
            {loadingMyRequests ? (
              <ActivityIndicator size="large" color="#1e3a8a" style={{ marginTop: 40 }} />
            ) : myRequestsList.length === 0 ? (
              <View style={{ padding: 30, alignItems: 'center' }}>
                <Ionicons name="document-text-outline" size={40} color="#94a3b8" />
                <Text style={{ marginTop: 10, color: '#64748b', fontSize: 14 }}>{t.noRequests || "No leave requests submitted yet."}</Text>
              </View>
            ) : (
              myRequestsList
                .filter(item => {
                  if (myRequestsFilter === 'Pending') return item.statusType === 'pending';
                  if (myRequestsFilter === 'Approved') return item.statusType === 'approved';
                  if (myRequestsFilter === 'Rejected') return item.statusType === 'rejected';
                  return true;
                })
                .map(item => (
                  <View key={item.id} style={styles.reqCardFull}>
                    {/* TOP TITLE ROW */}
                    <View style={styles.reqCardHeaderRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
                        <Text style={styles.reqCardTitle}>{item.leaveType}</Text>
                        <View style={styles.refPill}>
                          <Text style={styles.refPillText}>{item.refNo}</Text>
                        </View>
                      </View>

                      {/* STATUS BADGE */}
                      <View style={[
                        styles.reqStatusBadge,
                        item.statusType === 'pending' && styles.statusBadgePending,
                        item.statusType === 'approved' && styles.statusBadgeApproved,
                        item.statusType === 'rejected' && styles.statusBadgeRejected
                      ]}>
                        <Text style={[
                          styles.reqStatusBadgeText,
                          item.statusType === 'pending' && styles.statusTextPending,
                          item.statusType === 'approved' && styles.statusTextApproved,
                          item.statusType === 'rejected' && styles.statusTextRejected
                        ]}>
                          • {item.status}
                        </Text>
                      </View>
                    </View>

                    {/* SUBTEXT */}
                    <Text style={styles.reqCardSubText}>{item.subText}</Text>

                    {/* GRAY DETAILS BOX */}
                    <View style={styles.reqCardGrayBox}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.grayBoxLabel}>
                          {item.statusType === 'pending' ? 'DURATION & DATES' : item.statusType === 'approved' ? 'PERIOD' : 'PERIOD REQUESTED'}
                        </Text>
                        <Text style={styles.grayBoxValMain}>{item.dates}</Text>
                        <Text style={[
                          styles.grayBoxValSub,
                          item.statusType === 'pending' && { color: '#0284c7', fontWeight: 'bold' }
                        ]}>
                          {item.duration}
                        </Text>
                      </View>

                      <View style={{ flex: 1, paddingLeft: 10 }}>
                        <Text style={styles.grayBoxLabel}>
                          {item.statusType === 'pending' ? 'STATION / RELIEVER' : item.statusType === 'approved' ? 'AUTHORIZED BY' : 'DECISION DESK'}
                        </Text>
                        <Text style={styles.grayBoxValMain}>
                          {item.stationRelieverVal || item.authorizedBy || 'OIC Desk'}
                        </Text>
                        <Text style={styles.grayBoxValSub}>
                          {item.relieverDetail || item.authorizedRole || 'Traffic Division'}
                        </Text>
                      </View>
                    </View>

                    {/* BOTTOM FOOTER / ACTION ROW */}
                    {item.statusType === 'pending' && (
                      <View style={styles.footerRowPending}>
                        <Ionicons name="time-outline" size={15} color="#0284c7" style={{ marginRight: 6 }} />
                        <Text style={styles.footerTextPending}>{item.footerText}</Text>
                      </View>
                    )}

                    {item.statusType === 'approved' && (
                      <View style={styles.footerRowApproved}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                          <Ionicons name="checkmark-circle-outline" size={15} color="#16a34a" style={{ marginRight: 6 }} />
                          <Text style={styles.footerTextApproved}>{item.footerText}</Text>
                        </View>
                      </View>
                    )}

                    {item.statusType === 'rejected' && (
                      <View style={styles.rejectionCalloutBox}>
                        <View style={styles.rejectionHeaderRow}>
                          <Ionicons name="alert-circle-outline" size={15} color="#b91c1c" style={{ marginRight: 6 }} />
                          <Text style={styles.rejectionHeaderText}>REJECTION REASON</Text>
                        </View>
                        <Text style={styles.rejectionBodyText}>"{item.rejectionReason}"</Text>
                        <TouchableOpacity
                          onPress={() => {
                            setMyRequestsModalVisible(false);
                            setLeaveModalVisible(true);
                          }}
                          style={{ alignSelf: 'flex-end', marginTop: 6 }}
                        >
                          <Text style={styles.reapplyLinkText}>{item.reapplyText}</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },

  header: {
    backgroundColor: '#0f172a',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  logout: { color: '#ef4444', fontWeight: 'bold' },
  headerText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  topIcons: { flexDirection: 'row', alignItems: 'center' },

  welcomeBox: {
    backgroundColor: '#1e3a8a',
    padding: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16
  },
  welcomeText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  section: {
    marginHorizontal: 16,
    marginTop: 16,
    fontWeight: 'bold',
    fontSize: 14,
    color: '#334155'
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8
  },

  card: {
    width: '46%',
    backgroundColor: '#fff',
    margin: '2%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },

  big: { fontSize: 18, fontWeight: 'bold', marginTop: 4, color: '#0f172a' },

  activity: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },

  /* LEAVE BALANCE STYLES */
  leaveCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2
  },

  leaveHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },

  leaveTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  leaveCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a'
  },

  leaveSubCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14
  },

  leaveSubCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    marginHorizontal: 4
  },

  leaveTypeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3b82f6',
    marginBottom: 2
  },

  leaveDaysNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a'
  },

  daysLeftLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b'
  },

  leaveFootnote: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 2
  },

  requestLeaveButton: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10
  },

  requestLeaveBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 0.5
  },

  myRequestsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },

  myRequestsLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  myRequestsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e3a8a'
  },

  /* FULL REQUEST LEAVE MODAL STYLES */
  fullModalSafeArea: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },

  fullModalHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },

  backBtn: {
    padding: 4
  },

  fullModalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0f172a'
  },

  fullModalScrollView: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },

  fullModalScrollContent: {
    padding: 16,
    paddingBottom: 40
  },

  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12
  },

  accordionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },

  accordionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a'
  },

  accordionSubTitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1
  },

  rulesCardsContainer: {
    marginBottom: 14,
    gap: 8
  },

  ruleCard: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe'
  },

  ruleCardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 2
  },

  ruleCardBody: {
    fontSize: 11,
    color: '#1e40af',
    lineHeight: 16
  },

  formCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1
  },

  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },

  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 10
  },

  gridTwoCol: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },

  colHalf: {
    width: '48%'
  },

  fieldMetaLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 2
  },

  fieldMetaValue: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600'
  },

  formInputLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 4
  },

  inputWithIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44
  },

  iconTextInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a'
  },

  textAreaInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: '#0f172a',
    minHeight: 70,
    textAlignVertical: 'top'
  },

  totalDurationBar: {
    marginTop: 14,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  totalDurationText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0369a1'
  },

  totalDurationVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0284c7'
  },

  /* ACTING OFFICER AUTOCOMPLETE STYLES */
  selectedOfficerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#93c5fd',
    borderRadius: 10,
    padding: 10,
  },
  selectedOfficerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e3a8a',
  },
  selectedOfficerId: {
    fontSize: 11,
    color: '#3b82f6',
  },
  actingDropdownList: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    maxHeight: 180,
    zIndex: 99,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  actingDropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actingItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  actingItemId: {
    fontSize: 11,
    color: '#64748b',
  },

  /* UPLOAD AREA STYLES */
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#bae6fd',
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },

  uploadTextPrimary: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0284c7',
    marginTop: 6
  },

  uploadTextSecondary: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2
  },

  filePreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 10,
    marginTop: 6
  },

  fileName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a'
  },

  fileSize: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2
  },

  removeLink: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '600'
  },

  /* INLINE LEAVE TYPE SELECTION CARDS */
  leaveTypeCardsContainer: {
    marginVertical: 4
  },
  leaveTypeCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    marginBottom: 8
  },
  leaveTypeCardText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500'
  },

  /* QUICK DATE CHIP STYLES */
  quickDateChip: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#93c5fd'
  },
  quickDateChipText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1d4ed8'
  },

  /* CUSTOM MODAL & PICKER STYLES */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  pickerModalContent: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12
  },
  pickerModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a'
  },
  leaveTypeOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
    backgroundColor: '#f8fafc'
  },
  leaveTypeOptionSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff'
  },
  leaveTypeOptionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  leaveTypeOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a'
  },
  leaveTypeOptionDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },

  /* DATE PICKER MODAL STYLES */
  presetLabelText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 8
  },
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  presetBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  presetBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1e3a8a'
  },
  dateControlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  dateControlCol: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4
  },
  dateColLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 6
  },
  dateSpinRow: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingVertical: 6,
    width: '100%'
  },
  spinBtn: {
    padding: 6
  },
  spinValText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    marginVertical: 4
  },
  dateSummaryBox: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16
  },
  dateSummaryLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0369a1'
  },
  dateSummaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0284c7',
    marginTop: 2
  },
  confirmDateBtn: {
    backgroundColor: '#1e3a8a',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center'
  },
  confirmDateBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14
  },

  proceedReviewBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },

  proceedReviewBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold'
  },

  cancelFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10
  },

  cancelFullBtnText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600'
  },

  /* MY REQUESTS MODAL STYLES */
  myReqSafeArea: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },

  myReqHeaderBanner: {
    backgroundColor: '#0f172a',
    padding: 16,
    paddingBottom: 20
  },

  myReqHeaderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  myReqHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff'
  },

  myReqCloseBtn: {
    padding: 4
  },

  myReqHeaderSubTitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2
  },

  myReqLocationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10
  },

  blueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38bdf8',
    marginRight: 6
  },

  myReqLocationText: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '600'
  },

  filterTabsContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 10
  },

  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    marginRight: 8
  },

  filterTabActive: {
    backgroundColor: '#0f172a'
  },

  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b'
  },

  filterTabTextActive: {
    color: '#ffffff'
  },

  reqCardFull: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1
  },

  reqCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },

  reqCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    marginRight: 8
  },

  refPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },

  refPillText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569'
  },

  reqStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12
  },

  statusBadgePending: { backgroundColor: '#fef3c7' },
  statusBadgeApproved: { backgroundColor: '#dcfce7' },
  statusBadgeRejected: { backgroundColor: '#fee2e2' },

  reqStatusBadgeText: { fontSize: 10, fontWeight: 'bold' },
  statusTextPending: { color: '#d97706' },
  statusTextApproved: { color: '#15803d' },
  statusTextRejected: { color: '#b91c1c' },

  reqCardSubText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 10
  },

  reqCardGrayBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },

  grayBoxLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 0.5
  },

  grayBoxValMain: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 2
  },

  grayBoxValSub: {
    fontSize: 10,
    color: '#64748b'
  },

  footerRowPending: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  footerTextPending: {
    fontSize: 11,
    color: '#0284c7',
    fontWeight: '600'
  },

  footerRowApproved: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },

  footerTextApproved: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: '600'
  },

  rejectionCalloutBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 10,
    padding: 10
  },

  rejectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  rejectionHeaderText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#b91c1c'
  },

  rejectionBodyText: {
    fontSize: 11,
    color: '#991b1b',
    marginTop: 4,
    fontStyle: 'italic'
  },

  reapplyLinkText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#dc2626'
  },

  // CALENDAR POPUP OVERLAY STYLES
  calendarOverlayBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: 20
  },
  calendarModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10
  },
  calendarModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  calendarModalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  calendarMonthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12
  },
  monthNavBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9'
  },
  calendarMonthText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e3a8a'
  },
  calendarWeekdayRow: {
    flexDirection: 'row',
    marginBottom: 6
  },
  calendarWeekdayText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase'
  },
  calendarDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12
  },
  calendarDayCell: {
    width: '14.28%',
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2
  },
  calendarDayCellSelected: {
    backgroundColor: '#1e3a8a',
    borderRadius: 19
  },
  calendarDayText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500'
  },
  calendarDayTextSelected: {
    color: '#ffffff',
    fontWeight: 'bold'
  },
  calendarPresetRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  calendarPresetChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#eff6ff'
  },
  calendarPresetText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563eb'
  },
  calendarConfirmBtn: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8
  },
  calendarConfirmBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold'
  }
});
