/**
 * Roster Module Configuration & Business Constants
 */

module.exports = {
  // Minimum required rest period between consecutive officer duty shifts (in hours)
  MIN_REST_HOURS: 8,

  // Maximum consecutive days an officer can be assigned the exact same duty type
  MAX_CONSECUTIVE_SAME_DUTY: 3,

  // Roster Status Lifecycle
  ROSTER_STATUSES: {
    DRAFT: "DRAFT",
    PENDING_APPROVAL: "PENDING_APPROVAL",
    CHANGES_REQUESTED: "CHANGES_REQUESTED",
    APPROVED: "APPROVED",
    PUBLISHED: "PUBLISHED"
  },

  // Allowed Duty Types
  DUTY_TYPES: [
    "Point Duty",
    "Mobile Patrol",
    "Checkpoint",
    "Special Duty",
    "Accident Investigation",
    "OFF"
  ],

  // Standard Shift Schedules with Start/End Times
  SHIFT_PRESETS: {
    "06:00 - 14:00 (Morning Shift)": { startTime: "06:00", endTime: "14:00", durationHours: 8 },
    "14:00 - 22:00 (Evening Shift)": { startTime: "14:00", endTime: "22:00", durationHours: 8 },
    "22:00 - 06:00 (Night Shift)":   { startTime: "22:00", endTime: "06:00", durationHours: 8 },
    "06:00 - 18:00 (Day Shift)":     { startTime: "06:00", endTime: "18:00", durationHours: 12 },
    "18:00 - 06:00 (Night Shift)":   { startTime: "18:00", endTime: "06:00", durationHours: 12 },
    "06:00–14:00":                   { startTime: "06:00", endTime: "14:00", durationHours: 8 },
    "14:00–22:00":                   { startTime: "14:00", endTime: "22:00", durationHours: 8 },
    "22:00–06:00":                   { startTime: "22:00", endTime: "06:00", durationHours: 8 }
  }
};
