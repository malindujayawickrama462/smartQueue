import React, { useEffect, useState } from "react";
import { submitComplaint, getMyComplaints } from "../services/api";

const statusColor = {
  Pending: "#e67e22",
  "In Review": "#3498db",
  Resolved: "#27ae60",
};

export default function StudentComplaintPage({ studentId }) {
  const [form, setForm] = useState({
    canteenId: "Canteen A",
    category: "Food Quality",
    description: "",
    imageUrl: "",
  });
  const [complaints, setComplaints] = useState([]);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("success");

  const loadComplaints = async () => {
    if (!studentId) return;
    const res = await getMyComplaints(studentId);
    setComplaints(res.data);
  };

  useEffect(() => {
    setMessage("");
    setMessageTone("success");
    loadComplaints().catch(() => setComplaints([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await submitComplaint({ ...form, studentId });
      setMessageTone("success");
      setMessage("Complaint submitted successfully!");
      setForm((prev) => ({ ...prev, description: "" }));
      await loadComplaints();
    } catch (err) {
      setMessageTone("error");
      setMessage(err?.response?.data?.message || "Error submitting complaint.");
    }
  };

  return (
    <div style={{ maxWidth: "700px", margin: "30px auto", fontFamily: "sans-serif" }}>
      <h2>Submit a Complaint</h2>

      <form
        onSubmit={handleSubmit}
        style={{
          background: "#f8f8f8",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "30px",
        }}
      >
        <div style={{ marginBottom: "12px" }}>
          <label>Canteen</label>
          <br />
          <select
            value={form.canteenId}
            onChange={(e) => setForm({ ...form, canteenId: e.target.value })}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          >
            {["Canteen A", "Canteen B", "Canteen C", "Canteen D"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label>Category</label>
          <br />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          >
            {["Food Quality", "Delay", "Hygiene", "Staff Behavior", "Other"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label>Description</label>
          <br />
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        <button
          type="submit"
          style={{
            background: "#3498db",
            color: "#fff",
            padding: "10px 24px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Submit Complaint
        </button>
        {message && (
          <p style={{ marginTop: "10px", color: messageTone === "error" ? "#c0392b" : "#27ae60" }}>{message}</p>
        )}
      </form>

      <h2>My Complaints</h2>
      {complaints.map((c) => (
        <div
          key={c._id}
          style={{
            background: "#fff",
            border: "1px solid #eee",
            borderRadius: "10px",
            padding: "16px",
            marginBottom: "12px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>{c.category}</strong>
            <span
              style={{
                background: statusColor[c.status] + "22",
                color: statusColor[c.status],
                padding: "3px 10px",
                borderRadius: "20px",
                fontWeight: 600,
                fontSize: "13px",
              }}
            >
              {c.status}
            </span>
          </div>
          <p style={{ margin: "6px 0", color: "#555" }}>{c.description}</p>
          <p style={{ fontSize: "12px", color: "#999" }}>
            {c.canteenID} — {new Date(c.createdAt).toLocaleDateString()}
          </p>

          {c.adminResponse && (
            <div
              style={{
                background: "#eaf4ff",
                padding: "8px 12px",
                borderRadius: "6px",
                marginTop: "8px",
                fontSize: "13px",
                color: "#2980b9",
              }}
            >
              Admin reply: {c.adminResponse}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

