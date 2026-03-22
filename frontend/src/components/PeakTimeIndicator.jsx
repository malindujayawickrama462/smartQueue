import React from "react";

const statusColor = {
  Low: "#27ae60",
  Medium: "#f39c12",
  High: "#e74c3c",
};

export default function PeakTimeIndicator({ currentStatus, suggestedHour }) {
  if (!currentStatus) return null;

  const c = statusColor[currentStatus] || "#27ae60";

  return (
    <div style={{ marginBottom: "16px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
      <div
        style={{
          padding: "12px 20px",
          borderRadius: "10px",
          background: c + "22",
          border: `2px solid ${c}`,
          fontWeight: 600,
          color: c,
        }}
      >
        Current Status: {currentStatus}
      </div>
      <div
        style={{
          padding: "12px 20px",
          borderRadius: "10px",
          background: "#eaf4ff",
          border: "2px solid #3498db",
          color: "#2980b9",
          fontWeight: 500,
        }}
      >
        Suggested pickup: {suggestedHour}
      </div>
    </div>
  );
}

