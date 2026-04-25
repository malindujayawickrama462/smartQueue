import express from "express";
import dotenv from "dotenv";
import { createServer } from "http";
import cors from "cors";
import { connection } from "./config/db.js";
import userRouter from "./common/Routes/userRoutes.js";
import canteenRouter from "./common/Routes/canteenRoutes.js";
import orderRouter from "./common/Routes/orderRoutes.js";
import foodRouter from "./common/Routes/foodRoutes.js";
import invoiceRouter from "./common/Routes/invoiceRoutes.js";
import paymentRouter from "./common/Routes/paymentRoutes.js";
import peakTimeRouter from "./common/Routes/peakTime.js";
import complaintRouter from "./common/Routes/complaintRoutes.js";
import notificationRouter from "./common/Routes/notificationRoutes.js";
import walletRouter from "./common/Routes/walletRoutes.js";
import cartRouter from "./common/Routes/cartRoutes.js";
import { initSocket } from "./common/services/socketService.js";
import { initCronJobs } from "./common/services/cronService.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

connection();

app.use("/api/user", userRouter);
app.use("/api/canteen", canteenRouter);
app.use("/api/order", orderRouter);
app.use("/api/food", foodRouter);
app.use("/api/invoice", invoiceRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/peaktime", peakTimeRouter);
app.use("/api/complaint", complaintRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/wallet", walletRouter);
app.use("/api/cart", cartRouter);

const httpServer = createServer(app);
initSocket(httpServer);
initCronJobs();

const port = process.env.PORT || 5000;
httpServer.listen(port, () => {
    console.log(`Server is running on port ${port} with Notification Stream Live`)
});