import express from "express";
import { getPeakTimeData } from "../controllers/peakTimeController.js";
const router = express.Router();
router.get("/:canteenId", getPeakTimeData);
export default router;
