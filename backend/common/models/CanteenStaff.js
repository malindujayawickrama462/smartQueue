import mongoose from "mongoose";

const canteenStaffSchema = new mongoose.Schema({
    canteen: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "canteen",
        required: true
    },
    staff: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    role: {
        type: String,
        enum: ["staff", "supervisor"],
        default: "staff"
    }
},
{
    timestamps: true
});

// Prevent duplicate staff in same canteen
canteenStaffSchema.index({ canteen: 1, staff: 1 }, { unique: true });

const CanteenStaff = mongoose.model("canteenstaff", canteenStaffSchema);
export default CanteenStaff;
