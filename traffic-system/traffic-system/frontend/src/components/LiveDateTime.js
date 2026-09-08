import React, { useState, useEffect } from "react";
import { FiClock } from "react-icons/fi";
import { useFormat } from "../context/FormatContext";

export default function LiveDateTime() {
  const [now, setNow] = useState(new Date());
  const { formatDate, formatTime } = useFormat();

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = formatTime(now);
  const dateString = formatDate(now);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 18px",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)"
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          background: "#eff6ff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#2563eb",
          flexShrink: 0
        }}
      >
        <FiClock size={20} />
      </div>
      <div>
        <div
          style={{
            fontSize: "15px",
            fontWeight: "800",
            letterSpacing: "0.3px",
            lineHeight: 1.2
          }}
        >
          {timeString}
        </div>
        <div
          style={{
            fontSize: "12px",
            fontWeight: "600",
            color: "#64748b",
            marginTop: "3px"
          }}
        >
          {dateString}
        </div>
      </div>
    </div>
  );
}
