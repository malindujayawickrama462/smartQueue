import mongoose from "mongoose";

// Captures student ordering activity to drive peak-time analytics.
const orderSchema = new mongoose.Schema({
  canteenID: { type: String, required: true },
  studentId: { type: String, required: true },
  orderTime: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["Pending", "Preparing", "Ready", "Completed"],
    default: "Pending",
  },
});

export default mongoose.model("Order", orderSchema);

