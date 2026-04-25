import express from "express";
import {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getUserCarts
} from "../controllers/cartController.js";
import { authenticate } from "../middleware/authenticate.js";

const cartRouter = express.Router();

// Get user's cart for a specific canteen
cartRouter.get("/:canteenId", authenticate, getCart);

// Get all carts for the logged-in user (across all canteens)
cartRouter.get("/", authenticate, getUserCarts);

// Add item to cart
cartRouter.post("/add", authenticate, addToCart);

// Update cart item quantity
cartRouter.patch("/:canteenId/item/:foodItemId", authenticate, updateCartItem);

// Remove specific item from cart
cartRouter.delete("/:canteenId/item/:foodItemId", authenticate, removeFromCart);

// Clear entire cart for a canteen
cartRouter.delete("/:canteenId", authenticate, clearCart);

export default cartRouter;
