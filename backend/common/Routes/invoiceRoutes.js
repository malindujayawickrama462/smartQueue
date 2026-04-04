import express from "express";
import { generateInvoice, getInvoice, getUserInvoices, downloadInvoiceFile, getOrGenerateInvoiceByOrder } from "../controllers/invoiceController.js";
import { authenticate } from "../middleware/authenticate.js";

const invoiceRouter = express.Router();

invoiceRouter.post("/generate/:orderId", authenticate, generateInvoice);
invoiceRouter.get("/by-order/:orderId", authenticate, getOrGenerateInvoiceByOrder);
invoiceRouter.get("/user/all", authenticate, getUserInvoices);
invoiceRouter.get("/:invoiceId", authenticate, getInvoice);
invoiceRouter.get("/download/:invoiceId", authenticate, downloadInvoiceFile);

export default invoiceRouter;
