import Order from "../models/Order.js";

export const getPeakTimeData = async (req, res) => {
  const canteenId = req.params.canteenId || req.params.canteenID;
  if (!canteenId) return res.status(400).json({ message: "canteenId is required" });

  try {
    const today = new Date().toISOString().split('T')[0];
    const orders = await Order.find({ 
        canteen: canteenId,
        "timeSlot.date": today, // Only count orders scheduled for today
        status: { $in: ['Pending', 'Verified', 'Preparing', 'Ready', 'Late', 'Completed'] } // Count active and completed traffic
    });

    const hourCounts = Array(24).fill(0);
    orders.forEach((order) => {
      // Use pickup time (timeSlot.startTime) if available, fallback to createdAt hour
      let hour;
      if (order.timeSlot && order.timeSlot.startTime && order.timeSlot.startTime !== 'Walk-in') {
        hour = parseInt(order.timeSlot.startTime.split(':')[0]);
      } else {
        hour = new Date(order.createdAt).getHours();
      }
      hourCounts[hour]++;
    });

    const peakStatus = hourCounts.map((count) => {
      if (count >= 3) return "High";
      if (count >= 2) return "Medium";
      return "Low";
    });

    const currentHour = new Date().getHours();
    const currentStatus = peakStatus[currentHour];

    let startSearchHour = currentStatus === "High" ? currentHour + 1 : currentHour;
    if (startSearchHour >= 24) startSearchHour = 23;

    let suggestedHourIndex = startSearchHour;
    let minFutureCount = Infinity;
    
    for (let i = startSearchHour; i < 24; i++) {
      if (peakStatus[i] === "Low") {
        suggestedHourIndex = i;
        break;
      }
      if (hourCounts[i] < minFutureCount) {
        minFutureCount = hourCounts[i];
        suggestedHourIndex = i;
      }
    }

    res.json({
      hourCounts, peakStatus, currentStatus, currentHour,
      suggestedHour: `${suggestedHourIndex.toString().padStart(2, '0')}:00`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
