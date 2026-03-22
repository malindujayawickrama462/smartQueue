import mongoose from "mongoose";
import Counter from "./Counter.js";

const invoiceSchema = new mongoose.Schema({
    invoiceID: {
        type: String,
        unique: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "order",
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    canteen: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "canteen",
        required: true
    },
    items: [{
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        amount: { type: Number, required: true }
    }],
    subTotal: {
        type: Number,
        required: true
    },
    tax: {
        type: Number,
        default: 0
    },
    serviceCharge: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Failed'],
        default: 'Pending'
    },
    paymentMethod: {
        type: String,
        enum: ['Card', 'Cash'],
        default: 'Cash'
    }
}, {
    timestamps: true
});

// Auto-increment invoice ID logic
invoiceSchema.pre("save", async function () {
    if (!this.isNew) {
        return;
    }
    const counter = await Counter.findOneAndUpdate(
        { id: "invoice_id" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    this.invoiceID = `INV-${new Date().getFullYear()}${counter.seq.toString().padStart(4, '0')}`;
});

const Invoice = mongoose.model("invoice", invoiceSchema);
export default Invoice;
