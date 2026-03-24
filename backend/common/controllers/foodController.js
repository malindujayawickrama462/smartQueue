import FoodItem from "../models/FoodItem.js";

// Add new food item
export const addFoodItem = async (req, res) => {
    try {
        const { name, price, category, description, image, imageData, imageType, availability, canteen } = req.body;

        const newItem = new FoodItem({
            name,
            price,
            category,
            description,
            image,
            imageData: imageData ? Buffer.from(imageData, 'base64') : undefined,
            imageType,
            imageSize: imageData ? Buffer.from(imageData, 'base64').length : 0,
            availability: availability !== undefined ? availability : true,
            canteen
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
        const { name, price, category, description, image, imageData, imageType, availability } = req.body;

        const updates = {
            name,
            price,
            category,
            description,
            image,
            availability
        };

        // Handle image data update
        if (imageData) {
            updates.imageData = Buffer.from(imageData, 'base64');
            updates.imageType = imageType;
            updates.imageSize = updates.imageData.length;
        }

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

// Get food item image by ID
export const getFoodItemImage = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await FoodItem.findById(id).select('imageData imageType imageSize');

        if (!item || !item.imageData) {
            return res.status(404).json({ message: "Image not found" });
        }

        // Set response headers for image
        res.set('Content-Type', item.imageType || 'image/jpeg');
        res.set('Content-Length', item.imageSize);
        res.send(item.imageData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all food items for a canteen with images as base64
export const getAllFoodItemsWithImages = async (req, res) => {
    try {
        const { canteenId } = req.params;
        const items = await FoodItem.find({ canteen: canteenId }).select('-imageData');
        
        // Add image URLs
        const itemsWithImageUrls = items.map(item => ({
            ...item.toObject(),
            imageUrl: item.imageData ? `/api/food/${item._id}/image` : null
        }));

        res.status(200).json({ items: itemsWithImageUrls });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
