import cron from "node-cron";
import Order from "../models/Order.js";
import { getIO } from "./socketService.js";

// Helper to extract minutes distance between target time and now
const getMinutesDifference = (timeStr, now) => {
    if (!timeStr || timeStr === 'Walk-in' || timeStr === 'TBD') return null;
    const [hours, mins] = timeStr.split(':').map(Number);
    const target = new Date(now);
    target.setHours(hours, mins, 0, 0);
    return Math.round((target - now) / 60000);
};

export const initCronJobs = () => {
    // Run exactly at the 0th second of every single minute
    cron.schedule("* * * * *", async () => {
        try {
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];

            // Only track orders that are active and scheduled for today
            const activeOrders = await Order.find({
                "timeSlot.date": todayStr,
                status: { $in: ['Verified', 'Preparing'] }
            });

            const io = getIO();

            for (let order of activeOrders) {
                const diff = getMinutesDifference(order.timeSlot?.startTime, now);
                
                if (diff === 5) {
                    console.log(`[Cron] Triggered: Emitting 5-min-reminder to Student ${order.student}`);
                    io.to(order.student.toString()).emit("order-reminder", {
                        orderID: order.orderID,
                        message: "Your pickup slot starts in exactly 5 minutes! Please head towards the canteen."
                    });
                } else if (diff === 0) {
                    console.log(`[Cron] Triggered: Emitting slot-active alert to Student ${order.student}`);
                    io.to(order.student.toString()).emit("slot-active", {
                        orderID: order.orderID,
                        message: "Your time slot is now active! Please approach the counter."
                    });
                }
            }
        } catch (err) {
            console.error("[Cron] Error processing minute interval:", err);
        }
    });
    
    console.log("Cron Notification Service initialized.");
};
