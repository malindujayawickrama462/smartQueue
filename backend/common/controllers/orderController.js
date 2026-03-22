import Order from "../models/Order.js";
import User from "../models/User.js";

// Student places an order (joins queue) - creates Order for peak-time analytics.
export const createOrder = async (req, res) => {
  try {
    const { canteenID } = req.body;
    if (!canteenID) {
      return res.status(400).json({ msg: "canteenID is required" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const order = await Order.create({
      canteenID,
      studentId: user.userID,
    });

    res.status(201).json({
      msg: "Order placed. You are in the queue.",
      order: { _id: order._id, canteenID: order.canteenID, orderTime: order.orderTime, status: order.status },
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
