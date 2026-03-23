import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Processing', 'Solved'], default: 'Pending' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    role: { type: String, enum: ['student', 'staff'], required: true },
    adminReply: { type: String, required: false }
}, { timestamps: true });

export default mongoose.model("complaint", complaintSchema);
