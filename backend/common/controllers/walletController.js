import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

// Get wallet balance and transaction history
export const getWalletInfo = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId).select("walletBalance loyaltyPoints");
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const transactions = await Transaction.find({ user: userId }).sort({ createdAt: -1 });

        res.status(200).json({
            walletBalance: user.walletBalance,
            loyaltyPoints: user.loyaltyPoints,
            transactions
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Top up wallet (Mock payment gateway)
export const topUpWallet = async (req, res) => {
    try {
        const userId = req.userId;
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: "Invalid amount" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Mock payment logic here...
        
        user.walletBalance += amount;
        await user.save();

        const transaction = new Transaction({
            user: userId,
            amount,
            type: "CREDIT",
            description: "Wallet Top Up"
        });
        await transaction.save();

        res.status(200).json({
            message: "Wallet topped up successfully",
            walletBalance: user.walletBalance,
            transaction
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
