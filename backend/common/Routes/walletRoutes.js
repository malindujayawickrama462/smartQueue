import express from "express";
import { getWalletInfo, topUpWallet } from "../controllers/walletController.js";
import { authenticate } from "../middleware/authenticate.js";

const walletRouter = express.Router();

// Get wallet details
walletRouter.get("/info", authenticate, getWalletInfo);

// Mock top up
walletRouter.post("/topup", authenticate, topUpWallet);

export default walletRouter;
