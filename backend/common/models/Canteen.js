import mongoose from "mongoose";
import Counter from "./Counter.js";

const canteenSchema = new mongoose.Schema({
    canteenID: {
        type: String,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    capacity: {
        type: Number,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    isActive: {
        type: Boolean,
        default: true
    }
},
{
    timestamps: true
});

canteenSchema.pre("save", async function () {
    if (!this.isNew) return;
    try {
        const counter = await Counter.findOneAndUpdate(
            { id: "canteen_id" },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        this.canteenID = `Canteen-${counter.seq.toString().padStart(4, '0')}`;
    } catch (error) {
        throw error;
    }
});

const Canteen = mongoose.model("canteen", canteenSchema);
export default Canteen;
