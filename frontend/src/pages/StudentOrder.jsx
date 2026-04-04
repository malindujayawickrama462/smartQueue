import Order from "../models/Order.js";
import Canteen from "../models/Canteen.js";
import Counter from "../models/Counter.js";
import Queue from "../models/Queue.js";
import mongoose from "mongoose";
import { getIO } from "../services/socketService.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

// Helper to calculate next available time slot
const calculateNextSlot = async (canteenID) => {
    const canteen = await Canteen.findById(canteenID);
    if (!canteen) throw new Error("Canteen not found");

    const slotDuration = canteen.slotDurationMinutes || 5;
    const maxOrders = canteen.maxOrdersPerSlot || 10;

    let now = new Date();
    let startMinutes = Math.ceil(now.getMinutes() / slotDuration) * slotDuration;
    let slotStart = new Date(now.setMinutes(startMinutes, 0, 0));

    let foundSlot = false;
    let assignedSlot = null;

    while (!foundSlot) {
        const startTimeStr = slotStart.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
        const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);
        const endTimeStr = slotEnd.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
        const dateStr = slotStart.toISOString().split('T')[0];

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

        // Generate the next 144 slots (12 hours ahead) to allow orders throughout the day
        for (let i = 0; i < 144; i++) {
            const startTimeStr = currentSlotStart.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
            const slotEnd = new Date(currentSlotStart.getTime() + slotDuration * 60000);
            const endTimeStr = slotEnd.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

            // Stop generating slots after 11 PM (23:00)
            if (currentSlotStart.getHours() >= 23) break;

            const orderCount = await Order.countDocuments({
                canteen: canteenID,
                "timeSlot.startTime": startTimeStr,
                "timeSlot.date": todayStr,
                status: { $ne: 'Cancelled' }
            });

            if (orderCount < maxOrders) {
                availableSlots.push({
                    _id: `${startTimeStr}-${todayStr}`,
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
        const { canteenID, items, totalPrice, paymentMethod, timeSlot, redeemPoints } = req.body;
        const today = new Date().toISOString().split('T')[0];

        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        let finalPrice = totalPrice;

        // Apply point redemption
        if (redeemPoints && redeemPoints > 0) {
            if (user.loyaltyPoints < redeemPoints) {
                return res.status(400).json({ message: "Insufficient loyalty points" });
            }
            const maxRedeemable = Math.min(finalPrice, user.loyaltyPoints);
            const actuallyRedeemed = Math.min(redeemPoints, maxRedeemable);

            finalPrice -= actuallyRedeemed;
            user.loyaltyPoints -= actuallyRedeemed;

            const pointsTx = new Transaction({
                user: req.userId,
                amount: actuallyRedeemed,
                type: 'DEBIT',
                description: `Redeemed ${actuallyRedeemed} Points`
            });
            await pointsTx.save();
        }

        // Handle Wallet Payment
        if (paymentMethod === 'Wallet') {
            if (user.walletBalance < finalPrice) {
                return res.status(400).json({ message: "Insufficient wallet balance" });
            }
            user.walletBalance -= finalPrice;
        }

        const newOrder = new Order({
            student: req.userId,
            canteen: canteenID,
            items,
            totalPrice: finalPrice,
            timeSlot: timeSlot || undefined,
            date: today,
            paymentMethod: ['Card', 'Wallet'].includes(paymentMethod) ? paymentMethod : 'Cash',
            paymentStatus: ['Card', 'Wallet'].includes(paymentMethod) ? 'Paid' : 'Pending',
            status: "Pending"
        });

        await newOrder.save();

        if (paymentMethod === 'Wallet') {
            const walletTx = new Transaction({
                user: req.userId,
                amount: finalPrice,
                type: 'DEBIT',
                description: `Paid for Order via Wallet`,
                order: newOrder._id
            });
            await walletTx.save();
        }

        // Award points (1 point per 100 LKR spent based on original price)
        const earnedPoints = Math.floor(totalPrice / 100);
        user.loyaltyPoints += earnedPoints;

        await user.save();

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

        const timeSlot = {
            startTime: "Walk-in",
            endTime: "Walk-in",
            date: today
        };

        const dailyCounterId = `token_count_${today}`;
        const tokenCounter = await Counter.findOneAndUpdate(
            { id: dailyCounterId },
            { $inc: { seq: 1 } },
            { returnDocument: 'after', upsert: true }
        );
        const orderToken = `POS-${tokenCounter.seq.toString().padStart(3, '0')}`;

        const newOrder = new Order({
            student: req.userId,
            canteen: canteenID,
            items,
            totalPrice,
            timeSlot,
            date: today,
            orderToken,
            paymentMethod: paymentMethod || 'Cash',
            paymentStatus: 'Paid',
            status: "Completed"
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
            .populate('canteen', 'name location slotDurationMinutes maxOrdersPerSlot')
            .sort({ createdAt: -1 });

        const enrichedOrders = await Promise.all(orders.map(async (o) => {
            const orderObj = o.toObject();
            if (['Pending', 'Verified', 'Preparing'].includes(o.status)) {
                const queueAhead = await Order.countDocuments({
                    canteen: o.canteen._id,
                    status: { $in: ['Verified', 'Preparing'] },
                    createdAt: { $lt: o.createdAt }
                });

                orderObj.queuePosition = queueAhead + 1;
                orderObj.estimatedWaitTime = (queueAhead * 2) + 5;
            } else if (o.status === 'Ready') {
                orderObj.estimatedWaitTime = 0;
                orderObj.queuePosition = 0;
            }
            return orderObj;
        }));

        res.status(200).json({ orders: enrichedOrders });
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

        if (['Requested', 'Pending'].includes(existingOrder.status) && status === 'Verified') {
            if (!existingOrder.timeSlot || !existingOrder.timeSlot.startTime) {
                const nextSlot = await calculateNextSlot(existingOrder.canteen);
                updateData.timeSlot = nextSlot;
            } else {
                updateData.timeSlot = existingOrder.timeSlot;
            }

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

        if (updateData.orderToken) {
            try {
                const message = `Order Accepted! Your Token Number is ${updateData.orderToken}.`;

                await Notification.create({
                    recipient: existingOrder.student,
                    message,
                    type: "TokenGenerated",
                    orderId: existingOrder.orderID
                });

                const io = getIO();
                io.to(existingOrder.student.toString()).emit("new-notification", {
                    orderID: existingOrder.orderID,
                    message
                });
            } catch (err) {
                console.error("Failed to emit token generation event", err);
            }
        }

        if (status === 'Ready' && existingOrder.status !== 'Ready') {
            try {
                const message = "Your order is ready to collect at the counter!";

                await Notification.create({
                    recipient: existingOrder.student,
                    message,
                    type: "OrderReady",
                    orderId: existingOrder.orderID
                });

                const io = getIO();
                io.to(existingOrder.student.toString()).emit("order-ready", {
                    orderID: existingOrder.orderID,
                    message
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
            .limit(100);

        res.status(200).json({ orders });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getCanteenAnalytics = async (req, res) => {
    try {
        const { canteenID } = req.params;

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
            if (startDate) matchStage.createdAt.$gte = new Date(startDate);
            if (endDate) matchStage.createdAt.$lte = new Date(`${endDate}T23:59:59.999Z`);
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
                    {
                        $group: {
                            _id: "$items.name",
                            totalSold: { $sum: "$items.quantity" },
                            revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
                        }
                    },
                    { $sort: { totalSold: -1 } }
                ]);
                break;
            case 'sales':
                const sales = await Order.aggregate([
                    { $match: matchStage },
                    {
                        $group: {
                            _id: "$paymentMethod",
                            revenue: { $sum: "$totalPrice" },
                            orders: { $sum: 1 }
                        }
                    }
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

// ===== QUEUE & STATUS TRACKING ENDPOINTS =====

const updateQueueEntry = async (orderId, canteenId, status) => {
    try {
        const queueEntry = await Queue.findOneAndUpdate(
            { order: orderId },
            {
                status,
                actualStartTime: status === 'Cooking' ? new Date() : undefined,
                actualEndTime: status === 'Ready' ? new Date() : undefined
            },
            { new: true }
        );
        return queueEntry;
    } catch (error) {
        console.error("Error updating queue entry:", error);
    }
};

const calculateQueuePosition = async (canteenId, status) => {
    const count = await Queue.countDocuments({ canteen: canteenId, status });
    return count + 1;
};

export const getQueueFCFS = async (req, res) => {
    try {
        const { canteenID } = req.params;

        const queue = await Order.find({ canteen: canteenID, status: 'Verified' })
            .populate('student', 'name userID')
            .sort({ createdAt: 1 })
            .select('orderID orderToken items totalPrice timeSlot student createdAt');

        const queueWithPositions = queue.map((order, index) => ({
            ...order.toObject(),
            queuePosition: index + 1,
            estimatedWaitTime: `${(index + 1) * 5} minutes`
        }));

        res.status(200).json({
            canteenID,
            totalInQueue: queue.length,
            queue: queueWithPositions
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getCookingOrders = async (req, res) => {
    try {
        const { canteenID } = req.params;

        const cookingOrders = await Order.find({ canteen: canteenID, status: 'Preparing' })
            .populate('student', 'name userID')
            .sort({ updatedAt: 1 })
            .select('orderID orderToken items totalPrice student updatedAt');

        res.status(200).json({
            canteenID,
            totalCooking: cookingOrders.length,
            orders: cookingOrders
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getReadyOrders = async (req, res) => {
    try {
        const { canteenID } = req.params;

        const readyOrders = await Order.find({ canteen: canteenID, status: 'Ready' })
            .populate('student', 'name userID')
            .sort({ updatedAt: 1 })
            .select('orderID orderToken items student updatedAt');

        res.status(200).json({
            canteenID,
            totalReady: readyOrders.length,
            orders: readyOrders
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getDeliveredOrders = async (req, res) => {
    try {
        const { canteenID } = req.params;
        const today = new Date().toISOString().split('T')[0];

        const deliveredOrders = await Order.find({
            canteen: canteenID,
            status: 'Completed',
            "timeSlot.date": today
        })
            .populate('student', 'name userID')
            .sort({ updatedAt: -1 })
            .select('orderID orderToken items totalPrice student updatedAt');

        res.status(200).json({
            canteenID,
            totalDelivered: deliveredOrders.length,
            orders: deliveredOrders
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getOrderStatusSummary = async (req, res) => {
    try {
        const { canteenID } = req.params;

        const [verified, cooking, ready, completed] = await Promise.all([
            Order.countDocuments({ canteen: canteenID, status: 'Verified' }),
            Order.countDocuments({ canteen: canteenID, status: 'Preparing' }),
            Order.countDocuments({ canteen: canteenID, status: 'Ready' }),
            Order.countDocuments({ canteen: canteenID, status: 'Completed' })
        ]);

        res.status(200).json({
            canteenID,
            summary: {
                inQueue: verified,
                cooking: cooking,
                ready: ready,
                delivered: completed
            },
            totalOrders: verified + cooking + ready + completed
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const startCooking = async (req, res) => {
    try {
        const { orderID } = req.params;

        const order = await Order.findByIdAndUpdate(
            orderID,
            { status: 'Preparing' },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        try {
            const io = getIO();
            io.emit("order-cooking", {
                orderID: order.orderID,
                orderToken: order.orderToken,
                message: "Order started cooking"
            });
        } catch (err) {
            console.error("Socket error:", err);
        }

        res.status(200).json({ message: "Order cooking started", order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllOrdersByStatus = async (req, res) => {
    try {
        const { canteenID } = req.params;

        const result = await Order.aggregate([
            { $match: { canteen: new mongoose.Types.ObjectId(canteenID) } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    orders: { $push: "$$ROOT" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        const summary = {};
        result.forEach(item => {
            summary[item._id] = {
                count: item.count,
                orders: item.orders
            };
        });

        res.status(200).json({
            canteenID,
            statusBreakdown: summary
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};