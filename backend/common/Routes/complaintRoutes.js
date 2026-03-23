import express from "express";
import { createComplaint, getMyComplaints, getAllComplaints, updateComplaintStatus } from "../controllers/complaintController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();
router.post("/", authenticate, createComplaint);
router.get("/my", authenticate, getMyComplaints);
router.get("/", authenticate, authorize("admin"), getAllComplaints);
router.put("/:id/status", authenticate, authorize("admin"), updateComplaintStatus);

export default router;
