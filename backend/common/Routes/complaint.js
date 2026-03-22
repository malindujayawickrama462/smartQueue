import express from "express";
import {
  submitComplaint,
  getMyComplaints,
  getAllComplaints,
  updateComplaintStatus,
} from "../controllers/complaintController.js";

const router = express.Router();

router.post("/", submitComplaint);
router.get("/student/:studentId", getMyComplaints);
router.get("/admin/all", getAllComplaints);
router.put("/:id", updateComplaintStatus);

export default router;

