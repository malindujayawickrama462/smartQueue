import mongoose from "mongoose"

 export async function connection() {
    const dbUrl = process.env.MONGO_URI
    try {
        mongoose.set("strictQuery",true,"useNewUrlParser",true);
        await mongoose.connect(dbUrl);
        console.log("MongoDB Connected");
    } catch (err) {
        console.error("MongoDB connection failed",err.message);
        process.exit();
    }
 };