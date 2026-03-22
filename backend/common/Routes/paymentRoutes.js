import express from "express";

const paymentRouter = express.Router();

// Mock Payment Gateway Endpoint
paymentRouter.post("/process", async (req, res) => {
    try {
        const { amount, cardNumber } = req.body;

        if (!amount || !cardNumber) {
            return res.status(400).json({ success: false, message: "Invalid payment details" });
        }

        // Simulate a 2.5-second processing delay to mock bank connection
        await new Promise(resolve => setTimeout(resolve, 2500));

        // Simulate 5% chance of card failure if the string ends in 'FAIL', otherwise success
        if (cardNumber.endsWith("FAIL")) {
            return res.status(402).json({
                success: false,
                message: "Your card was declined by the bank.",
                transactionId: null
            });
        }

        const mockTransactionId = `txn_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;

        res.status(200).json({
            success: true,
            message: "Payment processed successfully",
            transactionId: mockTransactionId,
            receiptUrl: "mock_url"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default paymentRouter;
