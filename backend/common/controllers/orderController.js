import Order from "../models/Order.js";
import Canteen from "../models/Canteen.js";
import Counter from "../models/Counter.js";
import mongoose from "mongoose";
import { getIO } from "../services/socketService.js";

// Helper to calculate next available time slot
const calculateNextSlot = async (canteenID) => {
    const canteen = await Canteen.findById(canteenID);
    if (!canteen) throw new Error("Canteen not found");

    const slotDuration = canteen.slotDurationMinutes || 5;
    const maxOrders = canteen.maxOrdersPerSlot || 10;

    let now = new Date();
    // Round to nearest slot duration if needed, or just start from now
    // For simplicity, let's start from the current time rounded up to the next 5-min interval
    let startMinutes = Math.ceil(now.getMinutes() / slotDuration) * slotDuration;
    let slotStart = new Date(now.setMinutes(startMinutes, 0, 0));

    let foundSlot = false;
    let assignedSlot = null;

    while (!foundSlot) {
        const startTimeStr = slotStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);
        const endTimeStr = slotEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        const dateStr = slotStart.toISOString().split('T')[0];

        // Count existing orders in this slot
        const orderCount = await Order.countDocuments({
            canteen: canteenID,
            "timeSlot.startTime": startTimeStr,
            "timeSlot.date": dateStr,
            status: { $ne: 'Cancelled' }
        });

        if (orderCount < maxOrders) {
            assignedSlot = {
                startTime: startTimeStr,
                endTime: endTimeStr,
                date: dateStr
            };
            foundSlot = true;
        } else {
            // Move to next slot
            slotStart = new Date(slotStart.getTime() + slotDuration * 60000);
        }
    }

    return assignedSlot;
};

export const getAvailableSlots = async (req, res) => {
    try {
        const { canteenID } = req.params;
        const canteen = await Canteen.findById(canteenID);
        if (!canteen) {
            return res.status(404).json({ message: "Canteen not found" });
        }

        const slotDuration = canteen.slotDurationMinutes || 5;
        const maxOrders = canteen.maxOrdersPerSlot || 10;
        
        let now = new Date();
        let startMinutes = Math.ceil(now.getMinutes() / slotDuration) * slotDuration;
        let currentSlotStart = new Date(now.setMinutes(startMinutes, 0, 0));
        
        const availableSlots = [];
        const todayStr = currentSlotStart.toISOString().split('T')[0];

        // Generate the next 12 slots (1 hour ahead)
        for (let i = 0; i < 12; i++) {
            const startTimeStr = currentSlotStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            const slotEnd = new Date(currentSlotStart.getTime() + slotDuration * 60000);
            const endTimeStr = slotEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            
            const orderCount = await Order.countDocuments({
                canteen: canteenID,
                "timeSlot.startTime": startTimeStr,
                "timeSlot.date": todayStr,
                status: { $ne: 'Cancelled' }
            });

            if (orderCount < maxOrders) {
                availableSlots.push({
                    startTime: startTimeStr,
                    endTime: endTimeStr,
                    date: todayStr
                });
            }
            
            currentSlotStart = new Date(currentSlotStart.getTime() + slotDuration * 60000);
        }

        res.status(200).json({ slots: availableSlots });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const placeOrder = async (req, res) => {
    try {
        const { canteenID, items, totalPrice, paymentMethod, timeSlot } = req.body;
        const today = new Date().toISOString().split('T')[0]; // From authenticate middleware

        const newOrder = new Order({
            student: req.userId,
            canteen: canteenID,
            items,
            totalPrice,
            timeSlot: timeSlot || undefined,
            date: today,
            paymentMethod: paymentMethod === 'Card' ? 'Card' : 'Cash',
            paymentStatus: paymentMethod === 'Card' ? 'Paid' : 'Pending',
            status: "Pending"
        });

        await newOrder.save();
        res.status(201).json({ message: "Order placed successfully", order: newOrder });
    } catch (error) {
        console.error("placeOrder Error:", error);
        res.status(500).json({ message: error.message, stack: error.stack, errorObj: error });
    }
};

export const createPOSOrder = async (req, res) => {
    try {
        const { canteenID } = req.params;
        const { items, totalPrice, paymentMethod } = req.body;
        const today = new Date().toISOString().split('T')[0];

        // Instead of time slot, it's an immediate Walk-in order
        const timeSlot = {
            startTime: "Walk-in",
            endTime: "Walk-in",
            date: today
        };

        // Generate Daily Walkin POS Token
        const dailyCounterId = `token_count_${today}`;
        const tokenCounter = await Counter.findOneAndUpdate({ id: dailyCounterId }, { $inc: { seq: 1 } }, { returnDocument: 'after', upsert: true });
        const orderToken = `POS-${tokenCounter.seq.toString().padStart(3, '0')}`;

        const newOrder = new Order({
            student: req.userId, // Using the Staff's ID as the purchaser
            canteen: canteenID,
            items,
            totalPrice,
            timeSlot,
            date: today,
            orderToken,
            paymentMethod: paymentMethod || 'Cash',
            paymentStatus: 'Paid',   // Instantly marked Paid since staff took cash
            status: "Completed"      // Instantly marked Complete for walk-in
        });

        await newOrder.save();
        res.status(201).json({ message: "POS Order placed", order: newOrder });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getStudentOrders = async (req, res) => {
    try {
        const studentID = req.userId;
        const orders = await Order.find({ student: studentID })
            .populate('canteen', 'name location')
            .sort({ createdAt: -1 });
        res.status(200).json({ orders });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getCanteenOrders = async (req, res) => {
    try {
        const { canteenID } = req.params;
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

        // Auto-update late orders
        await Order.updateMany(
            {
                canteen: canteenID,
                "timeSlot.date": today,
                "timeSlot.endTime": { $lt: currentTimeStr },
                status: 'Verified'
            },
            { status: 'Late' }
        );

        const orders = await Order.find({
            canteen: canteenID,
            $or: [
                { "timeSlot.date": today },
                { status: 'Pending' }
            ]
        })
            .populate('student', 'name userID')
            .sort({ "timeSlot.startTime": 1, orderID: 1 });

        res.status(200).json({ orders });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const { orderID, status, paymentStatus } = req.body;

        let updateData = { status };
        if (paymentStatus) {
            updateData.paymentStatus = paymentStatus;
        }

        const existingOrder = await Order.findById(orderID);
        if (!existingOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Handle both 'Requested' (legacy) and 'Pending' (new) states
        if (['Requested', 'Pending'].includes(existingOrder.status) && status === 'Verified') {
            if (!existingOrder.timeSlot || !existingOrder.timeSlot.startTime) {
                const nextSlot = await calculateNextSlot(existingOrder.canteen);
                updateData.timeSlot = nextSlot;
            } else {
                updateData.timeSlot = existingOrder.timeSlot;
            }

            // --- SMART TOKEN GENERATION ---
            const todayStr = new Date().toISOString().split('T')[0];
            const tokenCounter = await Counter.findOneAndUpdate(
                { id: `token_count_${todayStr}` },
                { $inc: { seq: 1 } },
                { returnDocument: 'after', upsert: true }
            );
            
            const assignedSlot = updateData.timeSlot?.startTime || existingOrder.timeSlot?.startTime || '00:00';
            const timeCode = assignedSlot.replace(':', '');
            const seqStr = tokenCounter.seq.toString().padStart(3, '0');
            updateData.orderToken = `SQ-${seqStr}-${timeCode}`;
        }
        
        // --- REAL TIME NOTIFICATIONS ---
        if (status === 'Ready' && existingOrder.status !== 'Ready') {
            try {
                const io = getIO();
                io.to(existingOrder.student.toString()).emit("order-ready", {
                    orderID: existingOrder.orderID,
                    message: "Your order is ready to collect at the counter!"
                });
            } catch (err) {
                console.error("Failed to emit order-ready socket event", err);
            }
        }

        const order = await Order.findOneAndUpdate(
            { _id: orderID },
            updateData,
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json({ message: "Order updated successfully", order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getCanteenHistory = async (req, res) => {
    try {
        const { canteenID } = req.params;
        const orders = await Order.find({
            canteen: canteenID,
            status: { $in: ['Completed', 'Failed'] }
        })
            .populate('student', 'name email')
            .sort({ updatedAt: -1 })
            .limit(100); // Last 100 for safety

        res.status(200).json({ orders });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getCanteenAnalytics = async (req, res) => {
    try {
        const { canteenID } = req.params;
        // Basic stats aggregation
        const stats = await Order.aggregate([
            { $match: { canteen: new mongoose.Types.ObjectId(canteenID), status: 'Completed' } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$totalPrice" },
                    totalOrders: { $sum: 1 }
                }
            }
        ]);

        // Top Items aggregation
        const topItems = await Order.aggregate([
            { $match: { canteen: new mongoose.Types.ObjectId(canteenID), status: 'Completed' } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.name",
                    totalSold: { $sum: "$items.quantity" },
                    revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 3 }
        ]);

        res.status(200).json({
            revenue: stats[0]?.totalRevenue || 0,
            orders: stats[0]?.totalOrders || 0,
            topItems: topItems.map(item => ({ name: item._id, sold: item.totalSold, rev: item.revenue }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getOrderById = async (req, res) => {
    try {
        const { orderID } = req.params;
        const order = await Order.findById(orderID);
        if (!order) return res.status(404).json({ message: "Order not found" });

        // Return order, we could add stricter auth checks here if needed
        res.status(200).json({ order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getGlobalAnalytics = async (req, res) => {
    try {
        const { startDate, endDate, canteenID } = req.query;

        let matchStage = { status: 'Completed' };

        if (canteenID && canteenID !== 'all') {
            matchStage.canteen = new mongoose.Types.ObjectId(canteenID);
        }

        if (startDate || endDate) {
            matchStage.createdAt = {};
            if (startDate) {
                matchStage.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                matchStage.createdAt.$lte = new Date(`${endDate}T23:59:59.999Z`);
            }
        }

        const stats = await Order.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$totalPrice" },
                    totalOrders: { $sum: 1 }
                }
            }
        ]);

        const topItems = await Order.aggregate([
            { $match: matchStage },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.name",
                    totalSold: { $sum: "$items.quantity" },
                    revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 }
        ]);

        res.status(200).json({
            revenue: stats[0]?.totalRevenue || 0,
            orders: stats[0]?.totalOrders || 0,
            topItems: topItems.map(item => ({ name: item._id, sold: item.totalSold, rev: item.revenue }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const generateAdminReport = async (req, res) => {
    try {
        const { startDate, endDate, canteenID, reportType } = req.query;

        let matchStage = { status: 'Completed' };
        
        if (reportType === 'late_orders') {
            matchStage.status = 'Late';
        }

        if (canteenID && canteenID !== 'all') {
            matchStage.canteen = new mongoose.Types.ObjectId(canteenID);
        }

        if (startDate || endDate) {
            matchStage.createdAt = {};
            if (startDate) matchStage.createdAt.$gte = new Date(startDate);
            if (endDate) matchStage.createdAt.$lte = new Date(`${endDate}T23:59:59.999Z`);
        }

        let reportData = {};

        switch (reportType) {
            case 'orders':
                reportData = await Order.find(matchStage).populate('student', 'name userID').sort({ createdAt: -1 });
                break;
            case 'time_slots':
                reportData = await Order.aggregate([
                    { $match: matchStage },
                    { $group: { _id: "$timeSlot.startTime", totalOrders: { $sum: 1 } } },
                    { $sort: { "_id": 1 } }
                ]);
                break;
            case 'food_items':
                reportData = await Order.aggregate([
                    { $match: matchStage },
                    { $unwind: "$items" },
                    { $group: { _id: "$items.name", totalSold: { $sum: "$items.quantity" }, revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } } } },
                    { $sort: { totalSold: -1 } }
                ]);
                break;
            case 'sales':
                const sales = await Order.aggregate([
                    { $match: matchStage },
                    { $group: { 
                        _id: "$paymentMethod", 
                        revenue: { $sum: "$totalPrice" }, 
                        orders: { $sum: 1 } 
                    }}
                ]);
                const totalRev = await Order.aggregate([
                    { $match: matchStage },
                    { $group: { _id: null, total: { $sum: "$totalPrice" } } }
                ]);
                reportData = {
                    paymentSplits: sales,
                    totalRevenue: totalRev[0]?.total || 0
                };
                break;
            case 'kitchen':
                let kitchenMatch = { ...matchStage };
                delete kitchenMatch.status; 
                kitchenMatch.status = { $in: ['Completed', 'Late', 'Preparing', 'Ready'] };
                
                reportData = await Order.aggregate([
                    { $match: kitchenMatch },
                    { $group: { _id: "$status", count: { $sum: 1 } } }
                ]);
                break;
            case 'crowd':
                reportData = await Order.aggregate([
                    { $match: matchStage },
                    { $group: { _id: "$timeSlot.startTime", uniqueStudents: { $addToSet: "$student" } } },
                    { $project: { _id: 1, studentCount: { $size: "$uniqueStudents" } } },
                    { $sort: { studentCount: -1 } }
                ]);
                break;
            case 'late_orders':
                reportData = await Order.find(matchStage).populate('student', 'name userID').sort({ createdAt: -1 });
                break;
            default:
                return res.status(400).json({ message: "Invalid report type" });
        }

        res.status(200).json({ reportType, data: reportData });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
