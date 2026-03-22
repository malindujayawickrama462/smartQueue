import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connection } from "./config/db.js";
import userRouter from "./common/Routes/userRoutes.js";
import canteenRouter from "./common/Routes/canteenRoutes.js";
import peakTimeRouter from "./common/Routes/peakTime.js";
import complaintRouter from "./common/Routes/complaint.js";
import orderRouter from "./common/Routes/orderRoutes.js";

dotenv.config();
const app = express();

connection();
app.use(express.json());
app.use(cors());

app.use("/api/user", userRouter);
app.use("/api/canteen", canteenRouter);
app.use("/api/peaktime", peakTimeRouter);
app.use("/api/complaints", complaintRouter);
app.use("/api/orders", orderRouter);

const port = process.env.PORT;
app.listen(port,()=>{
    console.log(`Server is running on port ${port}`)
}); 