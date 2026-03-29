import express from "express";
import { getNotifications, markAsRead, markAllAsRead } from "../controllers/notificationController.js";
import { authenticate } from "../middleware/authenticate.js";

const notificationRouter = express.Router();

notificationRouter.get("/", authenticate, getNotifications);
notificationRouter.patch("/:id/read", authenticate, markAsRead);
notificationRouter.patch("/read-all", authenticate, markAllAsRead);

export default notificationRouter;
