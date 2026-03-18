import express from "express";
import dotenv from "dotenv";
import { connection } from "./config/db.js";
import userRouter from "./common/Routes/userRoutes.js";

dotenv.config();
const app = express();

connection();
app.use(express.json());

app.use("/api/user",userRouter)

const port = process.env.PORT;
app.listen(port,()=>{
    console.log(`Server is running on port ${port}`)
}); 