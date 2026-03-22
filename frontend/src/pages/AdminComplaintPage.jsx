import React, { useEffect, useState } from "react";
import { getAllComplaints, updateComplaintStatus } from "../services/api";

const statusColor = {
  Pending: "#e67e22",
  "In Review": "#3498db",
  Resolved: "#27ae60",
};

export default function AdminComplaintPage() {
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState("All");
  const [responses, setResponses] = useState({});

  const load = async () => {
    const res = await getAllComplaints();
    setComplaints(res.data);
  };

  useEffect(() => {
    load().catch(() => setComplaints([]));
  }, []);

  const handleUpdate = async (id, status) => {
    await updateComplaintStatus(id, { status, adminResponse: responses[id] || "" });
    load().catch(() => {});
  };

  const filtered = filter === "All" ? complaints : complaints.filter((c) => c.status === filter);

  return (
    <div style={{ maxWidth: "800px", margin: "30px auto", fontFamily: "sans-serif" }}>
      <h2>All Complaints</h2>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        {["All", "Pending", "In Review", "Resolved"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: "6px 16px",
              borderRadius: "20px",
              border: "none",
              cursor: "pointer",
              background: filter === s ? "#3498db" : "#eee",
              color: filter === s ? "#fff" : "#333",
              fontWeight: filter === s ? 600 : 400,
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.map((c) => (
        <div
          key={c._id}
          style={{
            background: "#fff",
            border: "1px solid #eee",
            borderRadius: "12px",
            padding: "18px",
            marginBottom: "14px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", gap: "12px" }}>
            <div>
              <strong>{c.category}</strong>
              <span style={{ marginLeft: "10px", fontSize: "12px", color: "#999" }}>{c.canteenID}</span>
            </div>
            <span
              style={{
                background: statusColor[c.status] + "22",
                color: statusColor[c.status],
                padding: "3px 10px",
                borderRadius: "20px",
                fontWeight: 600,
                fontSize: "13px",
                whiteSpace: "nowrap",
              }}
            >
              {c.status}
            </span>
          </div>

          <p style={{ color: "#555", margin: "6px 0" }}>{c.description}</p>
          <p style={{ fontSize: "12px", color: "#aaa" }}>
            Student: {c.studentId} — {new Date(c.createdAt).toLocaleDateString()}
          </p>

          <div style={{ marginTop: "12px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <input
              placeholder="Write response..."
              value={responses[c._id] || ""}
              onChange={(e) => setResponses({ ...responses, [c._id]: e.target.value })}
              style={{
                flex: 1,
                padding: "7px 12px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                minWidth: "200px",
              }}
            />

            <select
              onChange={(e) => handleUpdate(c._id, e.target.value)}
              defaultValue=""
              style={{
                padding: "7px 12px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                cursor: "pointer",
                background: "#fff",
              }}
            >
              <option value="" disabled>
                Update status
              </option>
              <option value="Pending">Pending</option>
              <option value="In Review">In Review</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}

