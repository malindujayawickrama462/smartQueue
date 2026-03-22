import mongoose from "mongoose";

const foodItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    image: {
        type: String // URL or Path to image
    },
    availability: {
        type: Boolean,
        default: true
    },
    canteen: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "canteen",
        required: true
    }
}, {
    timestamps: true
});

const FoodItem = mongoose.model("fooditem", foodItemSchema);
export default FoodItem;
