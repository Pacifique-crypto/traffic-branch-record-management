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

export const initialArchiveRecords = [
  {
    id: "RPT-2026-0891",
    title: "Monthly Accident Matrix Report",
    category: "Accidents",
    categoryColor: "#ef4444",
    type: "AUTO",
    period: "08/01/2026 — 08/31/2026",
    generated: "01 Sep 2026, 00:00 AM",
    by: "System (Auto)",
    status: "Completed",
    size: "284 KB",
    filterData: { 
      category: "accidents", 
      vehicles: ["Motor Car", "Van", "Bus", "Lorry", "Three-Wheeler", "Motorcycle", "Bicycle"],
      severities: ["Deaths", "Major Injuries", "Minor Injuries", "Property Damage"],
      actions: []
    }
  },
  {
    id: "RPT-2026-0890",
    title: "Monthly Violation Density Report",
    category: "Violations",
    categoryColor: "#3b82f6",
    type: "AUTO",
    period: "08/01/2026 — 08/31/2026",
    generated: "01 Sep 2026, 00:00 AM",
    by: "System (Auto)",
    status: "Completed",
    size: "312 KB",
    filterData: { 
      category: "violations", 
      vehicles: ["Motor Car", "Van", "Bus", "Lorry", "Three-Wheeler", "Motorcycle", "Bicycle"],
      severities: [],
      actions: ["Judicial Cases (Court)", "Fine-based Offences", "Warnings"]
    }
  },
  {
    id: "RPT-NB-726306",
    title: "Executive Summary Division Report",
    category: "Both",
    categoryColor: "#8b5cf6",
    type: "MANUAL",
    period: "06/30/2026 — 07/12/2026",
    generated: "02 Sep 2026, 09:14 AM",
    by: "PS Perera",
    status: "Completed",
    size: "410 KB",
    filterData: { 
      category: "both", 
      vehicles: ["Motor Car", "Van", "Bus", "Lorry", "Three-Wheeler", "Motorcycle", "Bicycle"],
      severities: ["Deaths", "Major Injuries", "Minor Injuries", "Property Damage"],
      actions: ["Judicial Cases (Court)", "Fine-based Offences", "Warnings"]
    }
  },
  {
    id: "RPT-2026-0842",
    title: "Custom High Speed Corridor Audit",
    category: "Violations",
    categoryColor: "#3b82f6",
    type: "MANUAL",
    period: "07/01/2026 — 07/15/2026",
    generated: "16 Jul 2026, 14:30 PM",
    by: "PS Perera",
    status: "Completed",
    size: "195 KB",
    filterData: { 
      category: "violations", 
      vehicles: ["Motor Car", "Motorcycle", "Three-Wheeler"],
      severities: [],
      actions: ["Fine-based Offences"]
    }
  },
  {
    id: "RPT-2026-0799",
    title: "Night Duty Incident Summary",
    category: "Accidents",
    categoryColor: "#ef4444",
    type: "MANUAL",
    period: "06/01/2026 — 06/30/2026",
    generated: "01 Jul 2026, 08:22 AM",
    by: "PS Perera",
    status: "Failed",
    size: "0 KB",
    filterData: { 
      category: "accidents", 
      vehicles: ["Motor Car", "Van", "Lorry"],
      severities: ["Deaths", "Major Injuries"],
      actions: []
    }
  }
];

// More records to test pagination
export const olderArchiveRecords = [
  {
    id: "RPT-2026-0701",
    title: "Mid-Year Accident Summary",
    category: "Accidents",
    categoryColor: "#ef4444",
    type: "AUTO",
    period: "01/01/2026 — 06/30/2026",
    generated: "01 Jul 2026, 00:00 AM",
    by: "System (Auto)",
    status: "Completed",
    size: "820 KB",
    filterData: { 
      category: "accidents", 
      vehicles: ["Motor Car", "Van", "Bus", "Lorry", "Three-Wheeler", "Motorcycle", "Bicycle"],
      severities: ["Deaths", "Major Injuries", "Minor Injuries", "Property Damage"],
      actions: []
    }
  },
  {
    id: "RPT-2026-0690",
    title: "June Violation Report",
    category: "Violations",
    categoryColor: "#3b82f6",
    type: "AUTO",
    period: "06/01/2026 — 06/30/2026",
    generated: "01 Jul 2026, 00:00 AM",
    by: "System (Auto)",
    status: "Completed",
    size: "305 KB",
    filterData: { 
      category: "violations", 
      vehicles: ["Motor Car", "Van", "Bus", "Lorry", "Three-Wheeler", "Motorcycle", "Bicycle"],
      severities: [],
      actions: ["Judicial Cases (Court)", "Fine-based Offences", "Warnings"]
    }
  },
  {
    id: "RPT-NB-720112",
    title: "Special Holiday Operation",
    category: "Both",
    categoryColor: "#8b5cf6",
    type: "MANUAL",
    period: "04/10/2026 — 04/20/2026",
    generated: "22 Apr 2026, 11:30 AM",
    by: "PS Perera",
    status: "Completed",
    size: "450 KB",
    filterData: { 
      category: "both", 
      vehicles: ["Motor Car", "Van", "Bus", "Motorcycle", "Three-Wheeler"],
      severities: ["Deaths", "Major Injuries"],
      actions: ["Fine-based Offences", "Warnings"]
    }
  }
];

export const mockAccidentMatrix = [
  { type: "Deaths", color: "#ef4444", "Motor Car": 4, "Van": 1, "Bus": 0, "Lorry": 1, "Three-Wheeler": 2, "Motorcycle": 3, "Bicycle": 0 },
  { type: "Major Injuries", color: "#f97316", "Motor Car": 9, "Van": 4, "Bus": 1, "Lorry": 2, "Three-Wheeler": 5, "Motorcycle": 8, "Bicycle": 1 },
  { type: "Minor Injuries", color: "#f59e0b", "Motor Car": 17, "Van": 6, "Bus": 2, "Lorry": 3, "Three-Wheeler": 8, "Motorcycle": 14, "Bicycle": 2 },
  { type: "Property Damage", color: "#64748b", "Motor Car": 31, "Van": 8, "Bus": 3, "Lorry": 6, "Three-Wheeler": 12, "Motorcycle": 18, "Bicycle": 3 },
];

export const mockViolationMatrix = [
  { type: "Judicial Cases (Court)", color: "#8b5cf6", "Motor Car": 142, "Van": 58, "Bus": 24, "Lorry": 38, "Three-Wheeler": 112, "Motorcycle": 195, "Bicycle": 12 },
  { type: "Fine-based Offences", color: "#f59e0b", "Motor Car": 310, "Van": 145, "Bus": 62, "Lorry": 88, "Three-Wheeler": 245, "Motorcycle": 410, "Bicycle": 35 },
  { type: "Warnings", color: "#06b6d4", "Motor Car": 85, "Van": 32, "Bus": 12, "Lorry": 18, "Three-Wheeler": 64, "Motorcycle": 98, "Bicycle": 15 }, // changed "Warnings Issued" to "Warnings" to match the state `violationActions`
];
