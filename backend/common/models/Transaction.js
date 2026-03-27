import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String, // 'CREDIT' or 'DEBIT'
        enum: ['CREDIT', 'DEBIT'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "order" // Optional, if this was a purchase
    }
}, {
    timestamps: true
});

const Transaction = mongoose.model("transaction", transactionSchema);
export default Transaction;
