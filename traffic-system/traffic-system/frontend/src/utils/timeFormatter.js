/**
 * Time Formatting Utility for Traffic Branch Web System
 * Supports: 24-Hour (e.g. 18:30), 12-Hour (e.g. 6:30 PM)
 */

export const formatTime = (timeInput, formatOverride, includeSeconds = false) => {
  if (!timeInput) return "-";

  const targetFormat =
    formatOverride || localStorage.getItem("app_time_format") || "24-Hour";

  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  if (timeInput instanceof Date) {
    hours = timeInput.getHours();
    minutes = timeInput.getMinutes();
    seconds = timeInput.getSeconds();
  } else if (typeof timeInput === "number") {
    const dateObj = new Date(timeInput);
    if (isNaN(dateObj.getTime())) return "-";
    hours = dateObj.getHours();
    minutes = dateObj.getMinutes();
    seconds = dateObj.getSeconds();
  } else if (typeof timeInput === "string") {
    const str = timeInput.trim();

    // Check if string is ISO format or full date string
    if (str.includes("T") || str.includes("-") || str.includes("GMT")) {
      const dateObj = new Date(str);
      if (!isNaN(dateObj.getTime())) {
        hours = dateObj.getHours();
        minutes = dateObj.getMinutes();
        seconds = dateObj.getSeconds();
      } else {
        return timeInput;
      }
    } else {
      // Check time format "HH:MM" or "HH:MM:SS" or "HH:MM AM/PM"
      const match12 = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
      const match24 = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);

      if (match12) {
        let h = parseInt(match12[1], 10);
        const m = parseInt(match12[2], 10);
        const s = match12[3] ? parseInt(match12[3], 10) : 0;
        const period = match12[4].toUpperCase();
        if (period === "PM" && h < 12) h += 12;
        if (period === "AM" && h === 12) h = 0;
        hours = h;
        minutes = m;
        seconds = s;
      } else if (match24) {
        hours = parseInt(match24[1], 10);
        minutes = parseInt(match24[2], 10);
        seconds = match24[3] ? parseInt(match24[3], 10) : 0;
      } else {
        return timeInput;
      }
    }
  } else {
    return "-";
  }

  const minsStr = String(minutes).padStart(2, "0");
  const secsStr = String(seconds).padStart(2, "0");
  const secondsSuffix = includeSeconds ? `:${secsStr}` : "";

  if (targetFormat === "12-Hour") {
    const period = hours >= 12 ? "PM" : "AM";
    let h12 = hours % 12;
    if (h12 === 0) h12 = 12;
    return `${h12}:${minsStr}${secondsSuffix} ${period}`;
  }

  // 24-Hour format
  const hoursStr = String(hours).padStart(2, "0");
  return `${hoursStr}:${minsStr}${secondsSuffix}`;
};

export default formatTime;
