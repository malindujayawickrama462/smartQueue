import express from "express";
import {
    addFoodItem,
    updateFoodItem,
    deleteFoodItem,
    getAllFoodItems,
    getFoodItemsByCategory,
    setItemAvailability,
    getFoodItemImage,
    getAllFoodItemsWithImages,
    addReview
} from "../controllers/foodController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

const foodRouter = express.Router();

// Publicly accessible for authenticated users (Students & Staff)
foodRouter.get("/all/:canteenId", authenticate, getAllFoodItems);
foodRouter.get("/with-images/:canteenId", authenticate, getAllFoodItemsWithImages);
foodRouter.get("/:id/image", getFoodItemImage); // No auth - allow direct image access
foodRouter.get("/category/:canteenId/:category", authenticate, getFoodItemsByCategory);

// Staff and Admin routes for Menu Management
foodRouter.post("/add", authenticate, authorize("admin", "staff"), addFoodItem);
foodRouter.put("/update/:id", authenticate, authorize("admin", "staff"), updateFoodItem);
foodRouter.delete("/delete/:id", authenticate, authorize("admin", "staff"), deleteFoodItem);
foodRouter.patch("/availability/:id", authenticate, authorize("admin", "staff"), setItemAvailability);

// Review route for students
foodRouter.post("/:id/reviews", authenticate, addReview);

export default foodRouter;
