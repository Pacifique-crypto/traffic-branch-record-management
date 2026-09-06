import React, { useContext, useState } from 'react';
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
  Alert
} from 'react-native';
import { LanguageContext } from '../context/LanguageContext';

export default function OfficerDashboard({ navigation }) {

  const { language } = useContext(LanguageContext);

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
  const [actingOfficer, setActingOfficer] = useState('');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [showLeaveRules, setShowLeaveRules] = useState(false);

  // Sample requested leaves list matching screenshot
  const [myRequestsList, setMyRequestsList] = useState([
    {
      id: '1',
      refNo: '#LR-2026-00425',
      leaveType: 'Personal Leave',
      subText: 'Submitted: 05 Sep 2026',
      status: 'Pending OIC Approval',
      statusType: 'pending',
      dates: '10 Sep – 15 Sep 2026',
      duration: '6 Days',
      stationRelieverLabel: 'STATION / RELIEVER',
      stationRelieverVal: 'Negombo PS',
      relieverDetail: 'Sgt. K. Silva (ID #45892)',
      footerText: 'Duty coverage accepted Tap to view timeline >'
    },
    {
      id: '2',
      refNo: '#LR-2026-00389',
      leaveType: 'Casual Leave',
      subText: 'Concluded 03 Aug 2026',
      status: 'Approved',
      statusType: 'approved',
      dates: '02 Aug – 03 Aug 2026',
      duration: '2 Days Total',
      authorizedBy: 'CI Bandara',
      authorizedRole: 'Officer-In-Charge (OIC)',
      footerText: 'Endorsed by: Chief Inspector Bandara (OIC)',
      hasPdfLink: true
    },
    {
      id: '3',
      refNo: '#LR-2026-00210',
      leaveType: 'Personal Leave',
      subText: 'Concluded 18 May 2026',
      status: 'Approved',
      statusType: 'approved',
      dates: '14 May – 18 May 2026',
      duration: '4 Days Total',
      authorizedBy: 'CI Bandara',
      authorizedRole: 'Officer-In-Charge (OIC)',
      footerText: 'Endorsed by: CI Bandara (OIC)',
      hasPdfLink: true
    },
    {
      id: '4',
      refNo: '#LR-2026-00315',
      leaveType: 'Medical Leave',
      subText: 'Reviewed 16 Jul 2026',
      status: 'Rejected',
      statusType: 'rejected',
      dates: '15 Jul – 18 Jul 2026',
      duration: '4 Days',
      decisionDesk: 'Traffic Division',
      decisionHQ: 'Divisional HQ',
      rejectionReason: 'Incomplete Government Medical Officer (GMO) certificate.',
      reapplyText: 'Re-apply with proper docs ->'
    }
  ]);

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
      requestLeave: "+ REQUEST LEAVE",
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
      requestLeave: "+ නිවාඩු ඉල්ලන්න",
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

  const calculateDays = () => {
    if (!startDate || !endDate) return '0 Days';
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return '3 Days';
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${diffDays} Days`;
  };

  const handleSubmitLeave = () => {
    if (!leaveType) {
      Alert.alert("Missing Leave Type", "Please select a leave type.");
      return;
    }
    if (!startDate || !endDate) {
      Alert.alert("Missing Dates", "Please enter start and end dates.");
      return;
    }

    const newRequest = {
      id: Date.now().toString(),
      type: `${leaveType} Leave`,
      dates: `${startDate} – ${endDate}`,
      duration: calculateDays(),
      status: 'Pending OIC Approval',
      statusType: 'pending'
    };

    setMyRequestsList([newRequest, ...myRequestsList]);
    Alert.alert("Success", t.successMsg);
    setLeaveModalVisible(false);
    // reset
    setLeaveType('');
    setStartDate('');
    setEndDate('');
    setReason('');
    setContactNumber('');
    setAddress('');
    setActingOfficer('');
    setHandoverNotes('');
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
            <Ionicons 
              name="notifications-outline" 
              size={22} 
              color="#fff" 
              style={{ marginRight: 15 }} 
              onPress={() => navigation.navigate('Notifications')}
            />

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
          <Text style={styles.welcomeText}>{t.welcome}</Text>
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

        {/* LEAVE BALANCE CARD (Positioned between Today's Overview and Recent Activity) */}
        <View style={styles.leaveCard}>
          {/* LEAVE BALANCE HEADER */}
          <View style={styles.leaveHeaderRow}>
            <View style={styles.leaveTitleGroup}>
              <Ionicons name="calendar-outline" size={18} color="#1e3a8a" style={{ marginRight: 6 }} />
              <Text style={styles.leaveCardTitle}>{t.leaveBalanceTitle}</Text>
            </View>
            <View style={styles.officialQuotaBadge}>
              <Text style={styles.officialQuotaText}>{t.officialQuota}</Text>
            </View>
          </View>

          {/* 3 LEAVE SUB-CARDS */}
          <View style={styles.leaveSubCardsRow}>
            {/* PERSONAL */}
            <View style={styles.leaveSubCard}>
              <Text style={styles.leaveTypeTitle}>{t.personal}</Text>
              <Text style={styles.leaveSubtitle}>{t.vacationLabel}</Text>
              <Text style={styles.leaveDaysNumber}>18</Text>
              <Text style={styles.daysLeftLabel}>{t.daysLeft}</Text>
              <Text style={styles.leaveFootnote}>{t.tot28}</Text>
            </View>

            {/* CASUAL */}
            <View style={styles.leaveSubCard}>
              <Text style={styles.leaveTypeTitle}>{t.casual}</Text>
              <Text style={styles.leaveSubtitle}>{t.annualLabel}</Text>
              <Text style={styles.leaveDaysNumber}>9</Text>
              <Text style={styles.daysLeftLabel}>{t.daysLeft}</Text>
              <Text style={styles.leaveFootnote}>{t.tot21}</Text>
            </View>

            {/* MEDICAL */}
            <View style={styles.leaveSubCard}>
              <Text style={styles.leaveTypeTitle}>{t.medical}</Text>
              <Text style={styles.leaveSubtitle}>{t.sickHospitalLabel}</Text>
              <Text style={styles.leaveDaysNumber}>14</Text>
              <Text style={styles.daysLeftLabel}>{t.daysLeft}</Text>
              <Text style={styles.leaveFootnote}>{t.quota14}</Text>
            </View>
          </View>

          {/* REQUEST LEAVE BUTTON */}
          <TouchableOpacity 
            style={styles.requestLeaveButton}
            onPress={() => setLeaveModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.requestLeaveBtnText}>{t.requestLeave}</Text>
          </TouchableOpacity>

          {/* MY REQUESTS BUTTON */}
          <TouchableOpacity
            style={styles.myRequestsButton}
            onPress={() => setMyRequestsModalVisible(true)}
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
                    <Text style={styles.accordionTitle}>{t.viewLeaveRules || "View Leave Rules"}</Text>
                    <Ionicons name="chevron-down" size={14} color="#475569" style={{ marginLeft: 4 }} />
                  </View>
                  <Text style={styles.accordionSubTitle}>
                    {t.viewLeaveRulesSub || "View leave rules before submitting your application."}
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
                {/* PERSONAL LEAVE RULE CARD */}
                <TouchableOpacity 
                  style={[
                    styles.ruleCard,
                    (leaveType === 'Personal' || !leaveType) && styles.ruleCardActive
                  ]}
                  onPress={() => setLeaveType('Personal')}
                  activeOpacity={0.85}
                >
                  <View style={styles.ruleCardHeader}>
                    <Text style={[
                      styles.ruleCardTitle,
                      (leaveType === 'Personal' || !leaveType) && styles.ruleCardTitleActive
                    ]}>
                      {t.personalLeaveRuleTitle || "Personal Leave"} <Text style={styles.ruleSubArrow}>v</Text> {(leaveType === 'Personal' || !leaveType) ? (t.selectedActive || "(Selected Active)") : ""}
                    </Text>
                    {(leaveType === 'Personal' || !leaveType) && (
                      <Ionicons name="checkmark-circle" size={18} color="#0284c7" />
                    )}
                  </View>
                  <Text style={styles.ruleCardBody}>
                    {t.personalLeaveRuleDesc || "Based on Vacation/Recreation Leave. Normal entitlement of 28 days per calendar year with full pay, strictly subject to operational service requirements and station OIC approval."}
                  </Text>
                </TouchableOpacity>

                {/* CASUAL LEAVE RULE CARD */}
                <TouchableOpacity 
                  style={[
                    styles.ruleCard,
                    leaveType === 'Casual' && styles.ruleCardActive
                  ]}
                  onPress={() => setLeaveType('Casual')}
                  activeOpacity={0.85}
                >
                  <View style={styles.ruleCardHeader}>
                    <Text style={[
                      styles.ruleCardTitle,
                      leaveType === 'Casual' && styles.ruleCardTitleActive
                    ]}>
                      {t.casualLeaveRuleTitle || "Casual Leave"} <Text style={styles.ruleSubArrow}>v</Text>
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.ruleBadgeText}>{t.daysYr21 || "21 Days/Yr"}</Text>
                      {leaveType === 'Casual' && (
                        <Ionicons name="checkmark-circle" size={18} color="#0284c7" style={{ marginLeft: 6 }} />
                      )}
                    </View>
                  </View>
                  <Text style={styles.ruleCardBody}>
                    {t.casualLeaveRuleDesc || "Available to eligible officers according to applicable national police rules, subject to station manpower roster."}
                  </Text>
                </TouchableOpacity>

                {/* MEDICAL LEAVE RULE CARD */}
                <TouchableOpacity 
                  style={[
                    styles.ruleCard,
                    leaveType === 'Medical' && styles.ruleCardActive
                  ]}
                  onPress={() => setLeaveType('Medical')}
                  activeOpacity={0.85}
                >
                  <View style={styles.ruleCardHeader}>
                    <Text style={[
                      styles.ruleCardTitle,
                      leaveType === 'Medical' && styles.ruleCardTitleActive
                    ]}>
                      {t.medicalLeaveRuleTitle || "Medical Leave"} <Text style={styles.ruleSubArrow}>v</Text>
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.ruleBadgeText}>{t.certifiedBadge || "Certified"}</Text>
                      {leaveType === 'Medical' && (
                        <Ionicons name="checkmark-circle" size={18} color="#0284c7" style={{ marginLeft: 6 }} />
                      )}
                    </View>
                  </View>
                  <Text style={styles.ruleCardBody}>
                    {t.medicalLeaveRuleDesc || "Based on applicable hospital/medical leave provisions. Government Medical Officer (GMO) certificate required."}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 2. OFFICER DETAILS CARD */}
            <View style={styles.formCard}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="id-card-outline" size={18} color="#0f172a" style={{ marginRight: 6 }} />
                <Text style={styles.cardHeaderTitle}>{t.officerDetails}</Text>
              </View>

              <View style={styles.gridTwoCol}>
                <View style={styles.colHalf}>
                  <Text style={styles.fieldMetaLabel}>{t.nameLabel}</Text>
                  <Text style={styles.fieldMetaValue}>Dinuri Nuhansa</Text>
                </View>
                <View style={styles.colHalf}>
                  <Text style={styles.fieldMetaLabel}>{t.policeIdLabel}</Text>
                  <Text style={[styles.fieldMetaValue, { fontWeight: 'bold' }]}>PC-09023</Text>
                </View>
              </View>

              <View style={[styles.gridTwoCol, { marginTop: 10 }]}>
                <View style={styles.colHalf}>
                  <Text style={styles.fieldMetaLabel}>{t.rankLabel}</Text>
                  <Text style={styles.fieldMetaValue}>Traffic Officer</Text>
                </View>
                <View style={styles.colHalf}>
                  <Text style={styles.fieldMetaLabel}>{t.stationLabel}</Text>
                  <Text style={styles.fieldMetaValue}>Negombo Police Station</Text>
                </View>
              </View>

              <View style={{ marginTop: 10 }}>
                <Text style={styles.fieldMetaLabel}>{t.appDateLabel}</Text>
                <Text style={styles.fieldMetaValue}>23 Aug 2026</Text>
              </View>
            </View>

            {/* 3. SERVICE RECORD CARD */}
            <View style={styles.formCard}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="briefcase-outline" size={18} color="#0f172a" style={{ marginRight: 6 }} />
                <Text style={styles.cardHeaderTitle}>{t.serviceRecord}</Text>
              </View>

              <View style={styles.gridTwoCol}>
                <View style={styles.colHalf}>
                  <Text style={styles.fieldMetaLabel}>{t.dateOfApptLabel}</Text>
                  <Text style={styles.fieldMetaValue}>15 Mar 2022</Text>
                </View>
                <View style={styles.colHalf}>
                  <Text style={styles.fieldMetaLabel}>{t.lastLeaveLabel}</Text>
                  <Text style={styles.fieldMetaValue}>10-12 Aug 2026</Text>
                </View>
              </View>

              <View style={styles.takenThisYearRow}>
                <Text style={styles.takenThisYearLabel}>{t.takenThisYearLabel}</Text>
                <Text style={styles.takenThisYearValue}>12 Days</Text>
              </View>
            </View>

            {/* 4. LEAVE CONFIGURATION CARD */}
            <View style={styles.formCard}>
              <Text style={styles.cardHeaderTitle}>{t.leaveConfig}</Text>

              <Text style={styles.formInputLabel}>{t.leaveTypeLabel}</Text>
              <View style={styles.typeSelectorRow}>
                {['Personal', 'Casual', 'Medical', 'Emergency'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeChip,
                      leaveType === type && styles.typeChipActive
                    ]}
                    onPress={() => setLeaveType(type)}
                  >
                    <Text style={[
                      styles.typeChipText,
                      leaveType === type && styles.typeChipTextActive
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formInputLabel}>{t.contactNoLabel}</Text>
              <View style={styles.inputWithIconRow}>
                <Ionicons name="call-outline" size={18} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.iconTextInput}
                  placeholder="+94 7X XXX XXXX"
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
                  placeholder="Enter full address where you can be reached"
                  value={address}
                  onChangeText={setAddress}
                />
              </View>
            </View>

            {/* 5. DURATION CARD */}
            <View style={styles.formCard}>
              <Text style={styles.cardHeaderTitle}>{t.durationTitle}</Text>

              <View style={styles.gridTwoCol}>
                <View style={styles.colHalf}>
                  <Text style={styles.formInputLabel}>{t.startDateLabelShort}</Text>
                  <View style={styles.inputWithIconRow}>
                    <TextInput
                      style={[styles.iconTextInput, { flex: 1 }]}
                      placeholder="dd/mm/yyyy"
                      value={startDate}
                      onChangeText={setStartDate}
                    />
                    <Ionicons name="calendar-outline" size={18} color="#64748b" />
                  </View>
                </View>

                <View style={styles.colHalf}>
                  <Text style={styles.formInputLabel}>{t.endDateLabelShort}</Text>
                  <View style={styles.inputWithIconRow}>
                    <TextInput
                      style={[styles.iconTextInput, { flex: 1 }]}
                      placeholder="dd/mm/yyyy"
                      value={endDate}
                      onChangeText={setEndDate}
                    />
                    <Ionicons name="calendar-outline" size={18} color="#64748b" />
                  </View>
                </View>
              </View>

              {/* TOTAL DURATION BANNER */}
              <View style={styles.totalDurationBar}>
                <Text style={styles.totalDurationText}>{t.totalDurationLabel}</Text>
                <Text style={styles.totalDurationVal}>{calculateDays()}</Text>
              </View>
            </View>

            {/* 6. JUSTIFICATION & HANDOVER CARD */}
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
              <View style={styles.inputWithIconRow}>
                <Ionicons name="person-outline" size={18} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.iconTextInput}
                  placeholder="Search by Name or ID..."
                  value={actingOfficer}
                  onChangeText={setActingOfficer}
                />
              </View>

              <Text style={styles.formInputLabel}>{t.handoverNotesLabel}</Text>
              <View style={styles.inputWithIconRow}>
                <Ionicons name="list-outline" size={18} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.iconTextInput}
                  placeholder="Key responsibilities handed over..."
                  value={handoverNotes}
                  onChangeText={setHandoverNotes}
                />
              </View>
            </View>

            {/* BOTTOM ACTION BUTTONS */}
            <TouchableOpacity 
              style={styles.proceedReviewBtn}
              onPress={handleSubmitLeave}
              activeOpacity={0.8}
            >
              <Text style={styles.proceedReviewBtnText}>{t.proceedReview}</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
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
              <Text style={styles.myReqLocationText}>Traffic HQ • Negombo PS (Div-02)</Text>
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
            {myRequestsList
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
                        {item.stationRelieverVal || item.authorizedBy || item.decisionDesk}
                      </Text>
                      <Text style={styles.grayBoxValSub}>
                        {item.relieverDetail || item.authorizedRole || item.decisionHQ}
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
                      <TouchableOpacity onPress={() => Alert.alert("Download PDF", "Downloading official leave endorsement PDF...")}>
                        <Text style={styles.pdfLinkText}>View PDF</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {item.statusType === 'rejected' && (
                    <View style={styles.rejectionCalloutBox}>
                      <View style={styles.rejectionHeaderRow}>
                        <Ionicons name="alert-circle-outline" size={15} color="#b91c1c" style={{ marginRight: 6 }} />
                        <Text style={styles.rejectionHeaderText}>REJECTION REASON CALLOUT</Text>
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
              ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f5f5f5'
  },

  header: {
    backgroundColor: '#1e3a8a',
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },

  headerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },

  logout: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  },

  topIcons: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  welcomeBox: {
    backgroundColor: '#1e3a8a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15
  },

  welcomeText: {
    color: '#fff',
    fontWeight: 'bold'
  },

  section: {
    marginBottom: 10,
    fontWeight: 'bold'
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },

  card: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10
  },

  big: {
    fontSize: 18,
    fontWeight: 'bold'
  },

  /* LEAVE BALANCE STYLES */
  leaveCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginTop: 5,
    marginBottom: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },

  leaveHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },

  leaveTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  leaveCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a'
  },

  officialQuotaBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },

  officialQuotaText: {
    color: '#1d4ed8',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.4
  },

  leaveSubCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },

  leaveSubCard: {
    width: '31.5%',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },

  leaveTypeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b'
  },

  leaveSubtitle: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 4
  },

  leaveDaysNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginVertical: 2
  },

  daysLeftLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284c7',
    marginBottom: 2
  },

  leaveFootnote: {
    fontSize: 10,
    color: '#94a3b8'
  },

  requestLeaveButton: {
    backgroundColor: '#0f2942',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },

  requestLeaveBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5
  },

  /* MY REQUESTS BUTTON STYLES */
  myRequestsButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10
  },

  myRequestsLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  myRequestsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b'
  },

  activity: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8
  },

  /* FULL SCROLLABLE LEAVE MODAL STYLES */
  fullModalSafeArea: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },

  fullModalHeader: {
    height: 56,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },

  backBtn: {
    padding: 4
  },

  fullModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a'
  },

  fullModalScrollView: {
    flex: 1
  },

  fullModalScrollContent: {
    padding: 16,
    paddingBottom: 40
  },

  accordionHeader: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },

  accordionLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  accordionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a'
  },

  accordionSubTitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },

  rulesCardsContainer: {
    marginBottom: 14
  },

  ruleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },

  ruleCardActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe'
  },

  ruleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6
  },

  ruleCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b'
  },

  ruleCardTitleActive: {
    color: '#0369a1'
  },

  ruleSubArrow: {
    fontSize: 11,
    color: '#64748b'
  },

  ruleCardBody: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16
  },

  ruleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b'
  },

  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 3
  },

  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },

  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12
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
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 2
  },

  fieldMetaValue: {
    fontSize: 13,
    color: '#1e293b'
  },

  takenThisYearRow: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12
  },

  takenThisYearLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b'
  },

  takenThisYearValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e3a8a'
  },

  formInputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 4
  },

  inputWithIconRow: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center'
  },

  iconTextInput: {
    fontSize: 13,
    color: '#0f172a',
    flex: 1
  },

  textAreaInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
    minHeight: 70,
    textAlignVertical: 'top'
  },

  totalDurationBar: {
    backgroundColor: '#0f2942',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14
  },

  totalDurationText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5
  },

  totalDurationVal: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800'
  },

  proceedReviewBtn: {
    backgroundColor: '#0f2942',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8
  },

  proceedReviewBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700'
  },

  cancelFullBtn: {
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },

  cancelFullBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600'
  },

  /* MY LEAVE REQUESTS SCREEN STYLES */
  myReqSafeArea: {
    flex: 1,
    backgroundColor: '#0f2942'
  },

  myReqHeaderBanner: {
    backgroundColor: '#0f2942',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16
  },

  myReqHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },

  myReqHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff'
  },

  myReqCloseBtn: {
    padding: 4
  },

  myReqHeaderSubTitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 12
  },

  myReqLocationPill: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start'
  },

  blueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3b82f6',
    marginRight: 6
  },

  myReqLocationText: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '600'
  },

  filterTabsContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },

  filterTab: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8
  },

  filterTabActive: {
    backgroundColor: '#0f2942',
    borderColor: '#0f2942'
  },

  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569'
  },

  filterTabTextActive: {
    color: '#ffffff'
  },

  reqCardFull: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4
  },

  reqCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },

  reqCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginRight: 8
  },

  refPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },

  refPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b'
  },

  reqStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },

  statusBadgePending: {
    backgroundColor: '#fff7ed'
  },

  statusTextPending: {
    color: '#c2410c',
    fontSize: 11,
    fontWeight: '700'
  },

  statusBadgeApproved: {
    backgroundColor: '#f0fdf4'
  },

  statusTextApproved: {
    color: '#15803d',
    fontSize: 11,
    fontWeight: '700'
  },

  statusBadgeRejected: {
    backgroundColor: '#fef2f2'
  },

  statusTextRejected: {
    color: '#b91c1c',
    fontSize: 11,
    fontWeight: '700'
  },

  reqCardSubText: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 10
  },

  reqCardGrayBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },

  grayBoxLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 2
  },

  grayBoxValMain: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a'
  },

  grayBoxValSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },

  footerRowPending: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  footerTextPending: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284c7'
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

  pdfLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f2942',
    textDecorationLine: 'underline'
  },

  rejectionCalloutBox: {
    backgroundColor: '#fff5f5',
    borderLeftWidth: 3,
    borderLeftColor: '#991b1b',
    borderRadius: 6,
    padding: 10,
    marginTop: 4
  },

  rejectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },

  rejectionHeaderText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#991b1b',
    letterSpacing: 0.4
  },

  rejectionBodyText: {
    fontSize: 12,
    color: '#7f1d1d',
    fontStyle: 'italic',
    lineHeight: 16
  },

  reapplyLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b91c1c'
  }

});


