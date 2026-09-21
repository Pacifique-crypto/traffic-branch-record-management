export const accidentLocationData = [
  { label: "Negombo Jn", value: 85 },
  { label: "Colombo Fort", value: 72 },
  { label: "Koppara Jn", value: 60 },
  { label: "Kandy Rd", value: 45 },
  { label: "Airport Rd", value: 30 },
];

export const accidentSeverityData = [
  { name: "Property Damage", value: 52, color: "#64748b", pct: "52%" },
  { name: "Minor Injury", value: 28, color: "#f59e0b", pct: "28%" },
  { name: "Major Injury", value: 14, color: "#f97316", pct: "14%" },
  { name: "Fatal", value: 6, color: "#ef4444", pct: "6%" },
];

export const monthlyTrendData = [
  { month: "Jan", val: 820 },
  { month: "Feb", val: 845 },
  { month: "Mar", val: 870 },
  { month: "Apr", val: 920 },
  { month: "May", val: 980 },
  { month: "Jun", val: 1100 },
  { month: "Jul", val: 1245 },
];

export const violationAreaData = [
  { label: "Negombo Town", value: 3280 },
  { label: "Colombo Fort", value: 2740 },
  { label: "Kurunegala Terminal", value: 1980 },
  { label: "Kandy Rd", value: 1420 },
];

export const violationTypeData = [
  { label: "Speeding", value: 3850, pct: 100 },
  { label: "No Helmet", value: 3200, pct: 83 },
  { label: "Signal Jump", value: 2450, pct: 63 },
  { label: "Illegal Parking", value: 1980, pct: 51 },
  { label: "No License", value: 1367, pct: 35 },
];

export const weeklyYearlyTrendData = [
  { year: "2021", val: 7200 },
  { year: "2022", val: 8400 },
  { year: "2023", val: 9100 },
  { year: "2024", val: 10800 },
  { year: "2025", val: 11900 },
  { year: "2026", val: 12847 },
];

export const peakHoursData = [
  { time: "6am", val: 150 },
  { time: "9am", val: 420 },
  { time: "12pm", val: 520 },
  { time: "3pm", val: 680 },
  { time: "6pm", val: 890 },
  { time: "9pm", val: 320 },
];

export const longTermStrategicData = [
  { month: "Jan", accidents: 820, violations: 9800 },
  { month: "Feb", accidents: 845, violations: 10100 },
  { month: "Mar", accidents: 870, violations: 10400 },
  { month: "Apr", accidents: 920, violations: 10900 },
  { month: "May", accidents: 980, violations: 11400 },
  { month: "Jun", accidents: 1100, violations: 12200 },
  { month: "Jul", accidents: 1245, violations: 12847 },
];

export const vehicleList = [
  { name: "Motor Car", emoji: "🚗" },
  { name: "Van", emoji: "🚐" },
  { name: "Bus", emoji: "🚌" },
  { name: "Lorry", emoji: "🚛" },
  { name: "Three-Wheeler", emoji: "🛺" },
  { name: "Motorcycle", emoji: "🏍" },
  { name: "Bicycle", emoji: "🚲" },
];

export const accidentSeverityOptions = ["Deaths", "Major Injuries", "Minor Injuries", "Property Damage"];

export const accidentCauseOptions = [
  "Excessive Speed",
  "Illegal Overtaking",
  "Reckless Driving",
  "Failure to Keep Left",
  "Mechanical Failure",
  "Pedestrian Fault",
  "Other Cause"
];

export const violationActionOptions = [
  "Judicial Cases (Court)",
  "Fine-based Offences",
  "Warnings"
];

export const violationCauseOptions = [
  "Speeding",
  "No Helmet",
  "Signal Jump",
  "Illegal Parking",
  "No License",
  "Drink & Drive",
  "Overloading"
];

export const initialArchiveRecords = [
  {
    id: "RPT-NB-6512",
    title: "Custom Last 30 days — Accidents",
    category: "Accidents",
    categoryColor: "#ef4444",
    type: "MANUAL",
    period: "07/27/2026 — 08/26/2026",
    generated: "Aug 26, 2026 22:45",
    by: "PS Perera",
    status: "Completed",
    size: "2.5 MB",
    filterData: {
      category: "accidents",
      vehicles: ["Bus", "Lorry", "Three-Wheeler", "Bicycle"],
      severities: ["Deaths", "Property Damage"],
      causes: ["Excessive Speed", "Reckless Driving", "Mechanical Failure", "Illegal Overtaking"],
      actions: []
    }
  },
  {
    id: "RPT-NB-5835",
    title: "Custom Last 30 days — Violations",
    category: "Violations",
    categoryColor: "#2563eb",
    type: "MANUAL",
    period: "07/27/2026 — 08/26/2026",
    generated: "Aug 26, 2026 22:46",
    by: "PS Perera",
    status: "Completed",
    size: "4.7 MB",
    filterData: {
      category: "violations",
      vehicles: ["Bus", "Lorry", "Three-Wheeler", "Bicycle"],
      severities: [],
      causes: ["No Helmet", "No License", "Overloading"],
      actions: ["Judicial Cases (Court)", "Warnings"]
    }
  },
  {
    id: "RPT-NB-2496",
    title: "Custom Last 30 days — Accidents",
    category: "Accidents",
    categoryColor: "#ef4444",
    type: "MANUAL",
    period: "07/07/2026 — 08/26/2026",
    generated: "Aug 26, 2026 22:43",
    by: "PS Perera",
    status: "Completed",
    size: "2.2 MB",
    filterData: {
      category: "accidents",
      vehicles: ["Motor Car", "Van", "Bus", "Lorry", "Three-Wheeler", "Motorcycle"],
      severities: ["Deaths", "Major Injuries", "Minor Injuries", "Property Damage"],
      causes: ["Excessive Speed"],
      actions: []
    }
  },
  {
    id: "RPT-NB-4685",
    title: "Custom Last 2 weeks — Violations",
    category: "Violations",
    categoryColor: "#2563eb",
    type: "MANUAL",
    period: "08/12/2026 — 08/26/2026",
    generated: "Aug 26, 2026 22:42",
    by: "PS Perera",
    status: "Completed",
    size: "2.9 MB",
    filterData: {
      category: "violations",
      vehicles: ["Motor Car", "Van", "Bus", "Lorry", "Three-Wheeler", "Motorcycle"],
      severities: [],
      causes: ["Speeding", "No Helmet"],
      actions: ["Judicial Cases (Court)", "Fine-based Offences", "Warnings"]
    }
  },
  {
    id: "RPT-NB-4988",
    title: "Custom Last 2 weeks — Accidents",
    category: "Accidents",
    categoryColor: "#ef4444",
    type: "MANUAL",
    period: "08/12/2026 — 08/26/2026",
    generated: "Aug 26, 2026 22:41",
    by: "PS Perera",
    status: "Completed",
    size: "2.3 MB",
    filterData: {
      category: "accidents",
      vehicles: ["Motor Car", "Van", "Bus", "Lorry"],
      severities: ["Deaths", "Major Injuries", "Property Damage"],
      causes: ["Excessive Speed", "Reckless Driving"],
      actions: []
    }
  },
  {
    id: "RPT-NB-081847",
    title: "Monthly Accident Report",
    category: "Accidents",
    categoryColor: "#ef4444",
    type: "AUTO",
    period: "Aug 1 — Aug 31, 2026",
    generated: "Sep 1, 2026 00:05",
    by: "System (Auto)",
    status: "Completed",
    size: "2.4 MB",
    filterData: {
      category: "accidents",
      vehicles: ["Motor Car", "Van", "Bus", "Lorry", "Three-Wheeler", "Motorcycle", "Bicycle"],
      severities: ["Deaths", "Major Injuries", "Minor Injuries", "Property Damage"],
      causes: ["Excessive Speed", "Illegal Overtaking", "Reckless Driving"],
      actions: []
    }
  },
  {
    id: "RPT-NB-081832",
    title: "Monthly Violation Report",
    category: "Violations",
    categoryColor: "#2563eb",
    type: "AUTO",
    period: "Aug 1 — Aug 31, 2026",
    generated: "Sep 1, 2026 00:06",
    by: "System (Auto)",
    status: "Completed",
    size: "3.3 MB",
    filterData: {
      category: "violations",
      vehicles: ["Motor Car", "Van", "Bus", "Lorry", "Three-Wheeler", "Motorcycle", "Bicycle"],
      severities: [],
      causes: ["Speeding", "No Helmet", "Signal Jump"],
      actions: ["Judicial Cases (Court)", "Fine-based Offences", "Warnings"]
    }
  },
  {
    id: "RPT-NB-081810",
    title: "Custom Biweekly Report",
    category: "Both",
    categoryColor: "#8b5cf6",
    type: "MANUAL",
    period: "Jul 28 — Aug 11, 2026",
    generated: "Aug 11, 2026 14:22",
    by: "PS Perera",
    status: "Completed",
    size: "5.2 MB",
    filterData: {
      category: "both",
      vehicles: ["Motor Car", "Van", "Bus", "Lorry", "Three-Wheeler", "Motorcycle", "Bicycle"],
      severities: ["Deaths", "Major Injuries", "Minor Injuries", "Property Damage"],
      causes: ["Excessive Speed"],
      actions: ["Judicial Cases (Court)", "Fine-based Offences", "Warnings"]
    }
  }
];

export const olderArchiveRecords = [
  {
    id: "RPT-NB-081799",
    title: "Monthly Accident Report",
    category: "Accidents",
    categoryColor: "#ef4444",
    type: "AUTO",
    period: "Jul 1 — Jul 31, 2026",
    generated: "Aug 1, 2026 00:05",
    by: "System (Auto)",
    status: "Completed",
    size: "2.2 MB",
    filterData: {
      category: "accidents",
      vehicles: ["Motor Car", "Van", "Bus", "Lorry", "Three-Wheeler", "Motorcycle", "Bicycle"],
      severities: ["Deaths", "Major Injuries", "Minor Injuries", "Property Damage"],
      causes: [],
      actions: []
    }
  },
  {
    id: "RPT-NB-081798",
    title: "Monthly Violation Report",
    category: "Violations",
    categoryColor: "#2563eb",
    type: "AUTO",
    period: "Jul 1 — Jul 31, 2026",
    generated: "Aug 1, 2026 00:06",
    by: "System (Auto)",
    status: "Completed",
    size: "2.9 MB",
    filterData: {
      category: "violations",
      vehicles: ["Motor Car", "Van", "Bus", "Lorry", "Three-Wheeler", "Motorcycle", "Bicycle"],
      severities: [],
      causes: [],
      actions: ["Judicial Cases (Court)", "Fine-based Offences", "Warnings"]
    }
  },
  {
    id: "RPT-NB-081776",
    title: "Custom 30-Day Report",
    category: "Accidents",
    categoryColor: "#ef4444",
    type: "MANUAL",
    period: "Jun 15 — Jul 14, 2026",
    generated: "Jul 14, 2026 09:11",
    by: "SI Bandara",
    status: "Completed",
    size: "4.8 MB",
    filterData: {
      category: "accidents",
      vehicles: ["Motor Car", "Van", "Bus", "Lorry", "Three-Wheeler"],
      severities: ["Deaths", "Major Injuries"],
      causes: [],
      actions: []
    }
  },
  {
    id: "RPT-NB-081759",
    title: "Monthly Accident Report",
    category: "Accidents",
    categoryColor: "#ef4444",
    type: "AUTO",
    period: "Jun 1 — Jun 30, 2026",
    generated: "Jul 1, 2026 00:05",
    by: "System (Auto)",
    status: "Failed",
    size: "0 KB",
    filterData: { category: "accidents", vehicles: [], severities: [], causes: [], actions: [] }
  },
  {
    id: "RPT-NB-081758",
    title: "Monthly Violation Report",
    category: "Violations",
    categoryColor: "#2563eb",
    type: "AUTO",
    period: "Jun 1 — Jun 30, 2026",
    generated: "Jul 1, 2026 00:06",
    by: "System (Auto)",
    status: "Completed",
    size: "2.7 MB",
    filterData: { category: "violations", vehicles: ["Motor Car", "Van", "Bus"], severities: [], causes: [], actions: ["Judicial Cases (Court)", "Fine-based Offences"] }
  }
];

export const mockAccidentMatrix = [
  { type: "Deaths", color: "#ef4444", "Motor Car": 4, "Van": 1, "Bus": 0, "Lorry": 1, "Three-Wheeler": 2, "Motorcycle": 3, "Bicycle": 0 },
  { type: "Major Injuries", color: "#f97316", "Motor Car": 9, "Van": 4, "Bus": 1, "Lorry": 2, "Three-Wheeler": 5, "Motorcycle": 8, "Bicycle": 1 },
  { type: "Minor Injuries", color: "#f59e0b", "Motor Car": 17, "Van": 6, "Bus": 2, "Lorry": 3, "Three-Wheeler": 8, "Motorcycle": 14, "Bicycle": 2 },
  { type: "Property Damage", color: "#64748b", "Motor Car": 31, "Van": 8, "Bus": 3, "Lorry": 6, "Three-Wheeler": 12, "Motorcycle": 18, "Bicycle": 3 },
];

export const mockViolationMatrix = [
  { type: "Judicial Cases (Court)", color: "#8b5cf6", "Motor Car": 45, "Van": 12, "Bus": 7, "Lorry": 8, "Three-Wheeler": 22, "Motorcycle": 28, "Bicycle": 4 },
  { type: "Fine-based Offences", color: "#f59e0b", "Motor Car": 120, "Van": 35, "Bus": 18, "Lorry": 25, "Three-Wheeler": 80, "Motorcycle": 180, "Bicycle": 12 },
  { type: "Warnings", color: "#06b6d4", "Motor Car": 85, "Van": 20, "Bus": 10, "Lorry": 14, "Three-Wheeler": 45, "Motorcycle": 95, "Bicycle": 8 },
];
