import FoodItem from "../models/FoodItem.js";
import Review from "../models/Review.js";

// Add new food item
export const addFoodItem = async (req, res) => {
    try {
        const { name, price, category, description, image, availability, canteen, dietaryTags } = req.body;

        const newItem = new FoodItem({
            name,
            price,
            category,
            description,
            image,
            availability: availability !== undefined ? availability : true,
            canteen,
            dietaryTags: dietaryTags || []
        });

        await newItem.save();
        res.status(201).json({ message: "Food item added successfully", item: newItem });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update an existing food item
export const updateFoodItem = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const updatedItem = await FoodItem.findByIdAndUpdate(id, updates, { new: true });

        if (!updatedItem) return res.status(404).json({ message: "Food item not found" });

        res.status(200).json({ message: "Food item updated successfully", item: updatedItem });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a food item
export const deleteFoodItem = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedItem = await FoodItem.findByIdAndDelete(id);

        if (!deletedItem) return res.status(404).json({ message: "Food item not found" });

        res.status(200).json({ message: "Food item deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all food items for a specific canteen
export const getAllFoodItems = async (req, res) => {
    try {
        const { canteenId } = req.params;
        const items = await FoodItem.find({ canteen: canteenId });
        res.status(200).json({ items });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get food items by category for a specific canteen
export const getFoodItemsByCategory = async (req, res) => {
    try {
        const { canteenId, category } = req.params;
        const items = await FoodItem.find({ canteen: canteenId, category });
        res.status(200).json({ items });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Quick toggle availability status
export const setItemAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        const { availability } = req.body;

        const updatedItem = await FoodItem.findByIdAndUpdate(id, { availability }, { new: true });

        if (!updatedItem) return res.status(404).json({ message: "Food item not found" });

        res.status(200).json({ message: "Availability updated", item: updatedItem });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add a review for a food item
export const addReview = async (req, res) => {
    try {
        const { id } = req.params; // food item id
        const { rating, comment, orderId } = req.body;
        const userId = req.user.id; // From authenticate middleware

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Rating must be between 1 and 5" });
        }

        const review = new Review({
            user: userId,
            foodItem: id,
            order: orderId, // optional, depends on how strictly we link it
            rating,
            comment
        });

        await review.save(); // Model post-save hook will update the average rating on the food item

        res.status(201).json({ message: "Review added successfully", review });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
