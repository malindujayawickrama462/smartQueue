import express from "express";
import {
    placeOrder,
    getStudentOrders,
    getCanteenOrders,
    updateOrderStatus,
    getCanteenHistory,
    getCanteenAnalytics,
    createPOSOrder,
    getOrderById,
    getAvailableSlots,
    getGlobalAnalytics,
    generateAdminReport
} from "../controllers/orderController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

const orderRouter = express.Router();

orderRouter.post("/place", authenticate, placeOrder);
orderRouter.get("/student", authenticate, getStudentOrders);
orderRouter.get("/canteen/:canteenID/slots", authenticate, getAvailableSlots);
orderRouter.get("/:orderID", authenticate, getOrderById);

// Staff routes
orderRouter.get("/canteen/:canteenID", authenticate, authorize("admin", "staff"), getCanteenOrders);
orderRouter.get("/canteen/:canteenID/history", authenticate, authorize("admin", "staff"), getCanteenHistory);
orderRouter.get("/canteen/:canteenID/analytics", authenticate, authorize("admin", "staff"), getCanteenAnalytics);
orderRouter.patch("/status", authenticate, authorize("admin", "staff"), updateOrderStatus);
orderRouter.post("/canteen/:canteenID/pos", authenticate, authorize("admin", "staff"), createPOSOrder);

// Admin global routes
orderRouter.get("/global/analytics", authenticate, authorize("admin"), getGlobalAnalytics);
orderRouter.get("/global/reports", authenticate, authorize("admin"), generateAdminReport);

export default orderRouter;
