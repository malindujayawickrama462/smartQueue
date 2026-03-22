/**
 * Seed sample orders for peak-time analysis.
 * Run: node scripts/seedOrders.js (from backend folder, with .env loaded)
 * Or: npx dotenv -e .env -- node scripts/seedOrders.js
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "../common/models/Order.js";
import Canteen from "../common/models/Canteen.js";
import User from "../common/models/User.js";

dotenv.config();

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    const canteens = await Canteen.find({}).limit(5);
    const users = await User.find({}).select("userID").limit(20);

    if (canteens.length === 0) {
      console.log("No canteens found. Create canteens first in the admin panel.");
      process.exit(1);
    }

    if (users.length === 0) {
      console.log("No users found. Register at least one user first.");
      process.exit(1);
    }

    const canteenIds = canteens.map((c) => c.canteenID);
    const studentIds = users.map((u) => u.userID);

    // Create orders spread across hours - more during lunch (11-14) and dinner (17-19)
    const orders = [];
    const now = new Date();

    for (let dayOffset = -7; dayOffset <= 0; dayOffset++) {
      const baseDate = new Date(now);
      baseDate.setDate(baseDate.getDate() + dayOffset);

      for (const canteenID of canteenIds) {
        // Lunch peak: hours 11-14 (more orders)
        for (let h = 11; h <= 14; h++) {
          const count = 8 + Math.floor(Math.random() * 15);
          for (let i = 0; i < count; i++) {
            const orderDate = new Date(baseDate);
            orderDate.setHours(h, Math.floor(Math.random() * 60), 0, 0);
            orders.push({
              canteenID,
              studentId: studentIds[Math.floor(Math.random() * studentIds.length)],
              orderTime: orderDate,
              status: "Completed",
            });
          }
        }
        // Dinner peak: hours 17-19
        for (let h = 17; h <= 19; h++) {
          const count = 6 + Math.floor(Math.random() * 12);
          for (let i = 0; i < count; i++) {
            const orderDate = new Date(baseDate);
            orderDate.setHours(h, Math.floor(Math.random() * 60), 0, 0);
            orders.push({
              canteenID,
              studentId: studentIds[Math.floor(Math.random() * studentIds.length)],
              orderTime: orderDate,
              status: "Completed",
            });
          }
        }
        // Other hours: fewer orders
        for (let h = 0; h < 24; h++) {
          if (h >= 11 && h <= 14) continue;
          if (h >= 17 && h <= 19) continue;
          const count = Math.floor(Math.random() * 5);
          for (let i = 0; i < count; i++) {
            const orderDate = new Date(baseDate);
            orderDate.setHours(h, Math.floor(Math.random() * 60), 0, 0);
            orders.push({
              canteenID,
              studentId: studentIds[Math.floor(Math.random() * studentIds.length)],
              orderTime: orderDate,
              status: "Completed",
            });
          }
        }
      }
    }

    await Order.insertMany(orders);
    console.log(`Seeded ${orders.length} orders for peak-time analysis.`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
