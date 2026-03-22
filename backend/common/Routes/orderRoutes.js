import express from "express";
import { createOrder } from "../controllers/orderController.js";
import { authenticate } from "../middleware/authenticate.js";

const router = express.Router();

router.post("/", authenticate, createOrder);

export default router;
