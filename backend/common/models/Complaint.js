import mongoose from "mongoose";

// Captures student complaints and any admin response.
const complaintSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  canteenID: { type: String, required: true },
  category: {
    type: String,
    enum: ["Food Quality", "Delay", "Hygiene", "Staff Behavior", "Other"],
    required: true,
  },
  description: { type: String, required: true },
  imageUrl: { type: String, default: "" },
  status: {
    type: String,
    enum: ["Pending", "In Review", "Resolved"],
    default: "Pending",
  },
  adminResponse: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date },
});

export default mongoose.model("Complaint", complaintSchema);

