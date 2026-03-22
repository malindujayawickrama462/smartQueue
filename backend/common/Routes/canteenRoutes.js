import express from "express";
import {
    createCanteen,
    viewCanteens,
    getCanteenDetails,
    getAllCanteens,
    updateCanteen,
    deleteCanteen,
    assignManagerToCanteen,
    addStaffToCanteen,
    getCanteenStaff,
    removeStaffFromCanteen,
    getStaffAssignedCanteen
} from "../controllers/canteenController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

const canteenRouter = express.Router();

// Student routes
canteenRouter.get("/view-all", authenticate, viewCanteens);
canteenRouter.get("/:canteenID", authenticate, getCanteenDetails);

// Admin routes
canteenRouter.post("/create", authenticate, authorize("admin"), createCanteen);
canteenRouter.get("/admin/all", authenticate, authorize("admin"), getAllCanteens);
canteenRouter.put("/:canteenID", authenticate, authorize("admin"), updateCanteen);
canteenRouter.delete("/:canteenID", authenticate, authorize("admin"), deleteCanteen);

// Manager & Staff assignment routes (Admin only)
canteenRouter.post("/:canteenID/assign-manager", authenticate, authorize("admin"), assignManagerToCanteen);
canteenRouter.post("/:canteenID/add-staff", authenticate, authorize("admin"), addStaffToCanteen);
canteenRouter.get("/:canteenID/staff", authenticate, authorize("admin"), getCanteenStaff);
canteenRouter.delete("/:canteenID/staff/:staffId", authenticate, authorize("admin"), removeStaffFromCanteen);

// Staff routes
canteenRouter.get("/staff/my-canteen", authenticate, getStaffAssignedCanteen);

export default canteenRouter;
