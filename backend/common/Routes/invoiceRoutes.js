import express from "express";
import { generateInvoice, getInvoice, getUserInvoices } from "../controllers/invoiceController.js";
import { authenticate } from "../middleware/authenticate.js";

const invoiceRouter = express.Router();

invoiceRouter.post("/generate/:orderId", authenticate, generateInvoice);
invoiceRouter.get("/user/all", authenticate, getUserInvoices);
invoiceRouter.get("/:invoiceId", authenticate, getInvoice);

export default invoiceRouter;
