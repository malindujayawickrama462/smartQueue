import express from "express";
import {
    placeOrder,
    getStudentOrders,
    getCanteenOrders,
    updateOrderStatus,
    getCanteenHistory,
    getCanteenAnalytics,
    createPOSOrder,
    getOrderById
} from "../controllers/orderController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

const orderRouter = express.Router();

orderRouter.post("/place", authenticate, placeOrder);
orderRouter.get("/student", authenticate, getStudentOrders);
orderRouter.get("/:orderID", authenticate, getOrderById);

// Staff routes
orderRouter.get("/canteen/:canteenID", authenticate, authorize("admin", "staff"), getCanteenOrders);
orderRouter.get("/canteen/:canteenID/history", authenticate, authorize("admin", "staff"), getCanteenHistory);
orderRouter.get("/canteen/:canteenID/analytics", authenticate, authorize("admin", "staff"), getCanteenAnalytics);
orderRouter.patch("/status", authenticate, authorize("admin", "staff"), updateOrderStatus);
orderRouter.post("/canteen/:canteenID/pos", authenticate, authorize("admin", "staff"), createPOSOrder);

export default orderRouter;
