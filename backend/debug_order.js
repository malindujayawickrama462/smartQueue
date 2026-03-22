import mongoose from "mongoose";
import Order from "./common/models/Order.js";
import Counter from "./common/models/Counter.js";
import Canteen from "./common/models/Canteen.js";
import 'dotenv/config';

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const canteens = await Canteen.find();
        if (canteens.length === 0) {
            console.log("No canteens found.");
            process.exit(0);
        }
        const canteenID = canteens[0]._id;

        const canteen = await Canteen.findById(canteenID);
        const slotDuration = canteen.slotDurationMinutes || 5;
        const maxOrders = canteen.maxOrdersPerSlot || 10;
        let now = new Date();
        let startMinutes = Math.ceil(now.getMinutes() / slotDuration) * slotDuration;
        let slotStart = new Date(now.setMinutes(startMinutes, 0, 0));

        let foundSlot = false;
        let assignedSlot = null;

        while (!foundSlot) {
            const startTimeStr = slotStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);
            const endTimeStr = slotEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            const dateStr = slotStart.toISOString().split('T')[0];

            const orderCount = await Order.countDocuments({
                canteen: canteenID,
                "timeSlot.startTime": startTimeStr,
                "timeSlot.date": dateStr,
                status: { $ne: 'Cancelled' }
            });

            if (orderCount < maxOrders) {
                assignedSlot = { startTime: startTimeStr, endTime: endTimeStr, date: dateStr };
                foundSlot = true;
            } else {
                slotStart = new Date(slotStart.getTime() + slotDuration * 60000);
            }
        }

        console.log("Assigned Slot:", assignedSlot);

        // Dummy Object IDs just to see schema validation
        const newOrder = new Order({
            student: new mongoose.Types.ObjectId(), // Fake student
            canteen: canteenID,
            items: [{ name: "TestItem", quantity: 1, price: 100 }],
            totalPrice: 100,
            timeSlot: assignedSlot,
            status: 'Pending'
        });

        await newOrder.save();
        console.log("Order saved successfully:", newOrder.orderID);

        // clean up
        await Order.findByIdAndDelete(newOrder._id);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

test();
