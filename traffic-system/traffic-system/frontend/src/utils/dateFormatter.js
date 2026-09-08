/**
 * Date Formatting Utility for Traffic Branch Web System
 * Supports: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY
 */

export const formatDate = (dateInput, formatOverride) => {
  if (!dateInput) return "-";

  let dateObj;
  if (dateInput instanceof Date) {
    dateObj = dateInput;
  } else if (typeof dateInput === "number") {
    dateObj = new Date(dateInput);
  } else if (typeof dateInput === "string") {
    // If string is YYYY-MM-DD or ISO string
    const parsed = new Date(dateInput);
    if (!isNaN(parsed.getTime())) {
      dateObj = parsed;
    } else {
      return dateInput; // Return raw string if unparseable
    }
  } else {
    return "-";
  }

  if (isNaN(dateObj.getTime())) return "-";

  const targetFormat =
    formatOverride || localStorage.getItem("app_date_format") || "YYYY-MM-DD";

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");

  switch (targetFormat) {
    case "DD/MM/YYYY":
      return `${day}/${month}/${year}`;
    case "MM/DD/YYYY":
      return `${month}/${day}/${year}`;
    case "YYYY-MM-DD":
    default:
      return `${year}-${month}-${day}`;
  }
};

export default formatDate;
