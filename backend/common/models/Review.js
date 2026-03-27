import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    foodItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "fooditem",
        required: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        maxLength: 500
    }
}, {
    timestamps: true
});

// Calculate average rating for a food item
reviewSchema.statics.calculateAverageRating = async function(foodItemId) {
    const stats = await this.aggregate([
        {
            $match: { foodItem: foodItemId }
        },
        {
            $group: {
                _id: "$foodItem",
                averageRating: { $avg: "$rating" },
                totalRatings: { $sum: 1 }
            }
        }
    ]);

    if (stats.length > 0) {
        await mongoose.model('fooditem').findByIdAndUpdate(foodItemId, {
            averageRating: Math.round(stats[0].averageRating * 10) / 10,
            totalRatings: stats[0].totalRatings
        });
    } else {
        await mongoose.model('fooditem').findByIdAndUpdate(foodItemId, {
            averageRating: 0,
            totalRatings: 0
        });
    }
};

// Call calculateAverageRating after save
reviewSchema.post('save', async function() {
    await this.constructor.calculateAverageRating(this.foodItem);
});

// Call calculateAverageRating before remove
reviewSchema.post('remove', async function() {
    await this.constructor.calculateAverageRating(this.foodItem);
});

const Review = mongoose.model("review", reviewSchema);
export default Review;
