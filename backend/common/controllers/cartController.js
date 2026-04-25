import Cart from "../models/Cart.js";
import FoodItem from "../models/FoodItem.js";

// Get user's cart for a specific canteen
export const getCart = async (req, res) => {
    try {
        const { canteenId } = req.params;
        const userId = req.userId;

        const cart = await Cart.findOne({ user: userId, canteen: canteenId })
            .populate("items.foodItem", "name price availability image imageData imageType");

        if (!cart) {
            return res.status(200).json({
                cart: null,
                message: "Cart is empty"
            });
        }

        res.status(200).json({ cart });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add item to cart
export const addToCart = async (req, res) => {
    try {
        const { canteenId, foodItemId, quantity } = req.body;
        const userId = req.userId;

        const qty = parseInt(quantity) || 1;
        if (qty < 1) {
            return res.status(400).json({ message: "Invalid quantity" });
        }

        // Get food item details
        const foodItem = await FoodItem.findById(foodItemId);
        if (!foodItem) {
            return res.status(404).json({ message: "Food item not found" });
        }

        if (!foodItem.availability) {
            return res.status(400).json({ message: "Food item is out of stock" });
        }

        // Find or create cart
        let cart = await Cart.findOne({ user: userId, canteen: canteenId });

        if (!cart) {
            cart = new Cart({
                user: userId,
                canteen: canteenId,
                items: [],
                totalPrice: 0
            });
        }

        // Check if item already in cart
        const existingItem = cart.items.find(item => item.foodItem.toString() === foodItemId);

        if (existingItem) {
            existingItem.quantity += qty;
        } else {
            cart.items.push({
                foodItem: foodItemId,
                name: foodItem.name,
                price: foodItem.price,
                quantity: qty
            });
        }

        // Recalculate total price
        cart.totalPrice = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        await cart.save();
        await cart.populate("items.foodItem", "name price availability image imageData imageType");

        res.status(200).json({
            message: "Item added to cart",
            cart
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update cart item quantity
export const updateCartItem = async (req, res) => {
    try {
        const { canteenId, foodItemId } = req.params;
        const { quantity } = req.body;
        const userId = req.userId;

        const qty = parseInt(quantity);
        if (!qty || qty < 1) {
            return res.status(400).json({ message: "Invalid quantity" });
        }

        const cart = await Cart.findOne({ user: userId, canteen: canteenId });

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        const cartItem = cart.items.find(item => item.foodItem.toString() === foodItemId);

        if (!cartItem) {
            return res.status(404).json({ message: "Item not found in cart" });
        }

        cartItem.quantity = qty;

        // Recalculate total price
        cart.totalPrice = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        await cart.save();
        await cart.populate("items.foodItem", "name price availability image imageData imageType");

        res.status(200).json({
            message: "Cart item updated",
            cart
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
    try {
        const { canteenId, foodItemId } = req.params;
        const userId = req.userId;

        const cart = await Cart.findOne({ user: userId, canteen: canteenId });

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        cart.items = cart.items.filter(item => item.foodItem.toString() !== foodItemId);

        // Recalculate total price
        cart.totalPrice = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        if (cart.items.length === 0) {
            await Cart.deleteOne({ _id: cart._id });
            return res.status(200).json({
                message: "Item removed from cart",
                cart: null
            });
        }

        await cart.save();
        await cart.populate("items.foodItem", "name price availability image imageData imageType");

        res.status(200).json({
            message: "Item removed from cart",
            cart
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Clear entire cart
export const clearCart = async (req, res) => {
    try {
        const { canteenId } = req.params;
        const userId = req.userId;

        await Cart.deleteOne({ user: userId, canteen: canteenId });

        res.status(200).json({ message: "Cart cleared successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all carts for a user
export const getUserCarts = async (req, res) => {
    try {
        const userId = req.userId;

        const carts = await Cart.find({ user: userId })
            .populate("canteen", "name location")
            .populate("items.foodItem", "name price availability image imageData imageType");

        res.status(200).json({ carts });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
