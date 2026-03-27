import mongoose from "mongoose";
import Counter from "./Counter.js";

const userSchema = new mongoose.Schema({
    userID:{
        type:String,
        unique:true
    },
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    role:{
        type:String,
        enum:["admin","student","staff"],
        default:"admin"
    },
    walletBalance: {
        type: Number,
        default: 0
    },
    loyaltyPoints: {
        type: Number,
        default: 0
    }
},
{
    timestamps:true
});
userSchema.pre("save", async function () {
    if (!this.isNew) return;
    try {
        const counter = await Counter.findOneAndUpdate(
            { id: "user_id" }, 
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        this.userID = `User-${counter.seq.toString().padStart(4, '0')}`;
        
    } catch (error) {
        throw error;
    }
})

const User = mongoose.model("user",userSchema);
export default User;