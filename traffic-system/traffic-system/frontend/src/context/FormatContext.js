import React, { createContext, useContext, useState } from "react";
import { formatDate as formatDateUtil } from "../utils/dateFormatter";
import { formatTime as formatTimeUtil } from "../utils/timeFormatter";

const FormatContext = createContext();

export const FormatProvider = ({ children }) => {
  const [dateFormat, setDateFormatState] = useState(() => {
    return localStorage.getItem("app_date_format") || "YYYY-MM-DD";
  });

  const [timeFormat, setTimeFormatState] = useState(() => {
    return localStorage.getItem("app_time_format") || "24-Hour";
  });

  const setDateFormat = (fmt) => {
    setDateFormatState(fmt);
    localStorage.setItem("app_date_format", fmt);
  };

  const setTimeFormat = (fmt) => {
    setTimeFormatState(fmt);
    localStorage.setItem("app_time_format", fmt);
  };

  const formatDate = (dateInput) => {
    return formatDateUtil(dateInput, dateFormat);
  };

  const formatTime = (timeInput) => {
    return formatTimeUtil(timeInput, timeFormat);
  };

  const formatDateTime = (dateInput) => {
    if (!dateInput) return "-";
    const d = formatDate(dateInput);
    const t = formatTime(dateInput);
    if (d === "-" && t === "-") return "-";
    if (d === "-") return t;
    if (t === "-") return d;
    return `${d} ${t}`;
  };

  return (
    <FormatContext.Provider
      value={{
        dateFormat,
        setDateFormat,
        timeFormat,
        setTimeFormat,
        formatDate,
        formatTime,
        formatDateTime,
      }}
    >
      {children}
    </FormatContext.Provider>
  );
};

export const useFormat = () => {
  const context = useContext(FormatContext);
  if (!context) {
    throw new Error("useFormat must be used within a FormatProvider");
  }
  return context;
};

export default FormatContext;
