/**
 * Time Formatting Utility for Traffic Branch Web System
 * Supports: 24-Hour (e.g. 18:30), 12-Hour (e.g. 6:30 PM)
 */

export const formatTime = (timeInput, formatOverride) => {
  if (!timeInput) return "-";

  const targetFormat =
    formatOverride || localStorage.getItem("app_time_format") || "24-Hour";

  let hours = 0;
  let minutes = 0;

  if (timeInput instanceof Date) {
    hours = timeInput.getHours();
    minutes = timeInput.getMinutes();
  } else if (typeof timeInput === "number") {
    const dateObj = new Date(timeInput);
    if (isNaN(dateObj.getTime())) return "-";
    hours = dateObj.getHours();
    minutes = dateObj.getMinutes();
  } else if (typeof timeInput === "string") {
    const str = timeInput.trim();

    // Check if string is ISO format or full date string
    if (str.includes("T") || str.includes("-") || str.includes("GMT")) {
      const dateObj = new Date(str);
      if (!isNaN(dateObj.getTime())) {
        hours = dateObj.getHours();
        minutes = dateObj.getMinutes();
      } else {
        return timeInput;
      }
    } else {
      // Check time format "HH:MM" or "HH:MM:SS" or "HH:MM AM/PM"
      const match12 = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
      const match24 = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);

      if (match12) {
        let h = parseInt(match12[1], 10);
        const m = parseInt(match12[2], 10);
        const period = match12[3].toUpperCase();
        if (period === "PM" && h < 12) h += 12;
        if (period === "AM" && h === 12) h = 0;
        hours = h;
        minutes = m;
      } else if (match24) {
        hours = parseInt(match24[1], 10);
        minutes = parseInt(match24[2], 10);
      } else {
        return timeInput;
      }
    }
  } else {
    return "-";
  }

  const minsStr = String(minutes).padStart(2, "0");

  if (targetFormat === "12-Hour") {
    const period = hours >= 12 ? "PM" : "AM";
    let h12 = hours % 12;
    if (h12 === 0) h12 = 12;
    return `${h12}:${minsStr} ${period}`;
  }

  // 24-Hour format
  const hoursStr = String(hours).padStart(2, "0");
  return `${hoursStr}:${minsStr}`;
};

export default formatTime;
