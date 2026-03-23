import Order from "../models/Order.js";

export const getPeakTimeData = async (req, res) => {
  const canteenId = req.params.canteenId || req.params.canteenID;
  if (!canteenId) return res.status(400).json({ message: "canteenId is required" });

  try {
    const orders = await Order.find({ canteen: canteenId });
    const hourCounts = Array(24).fill(0);
    orders.forEach((order) => {
      const hour = new Date(order.createdAt).getHours();
      hourCounts[hour]++;
    });

    const peakStatus = hourCounts.map((count) => {
      if (count >= 40) return "High";
      if (count >= 20) return "Medium";
      return "Low";
    });

    const currentHour = new Date().getHours();
    const currentStatus = peakStatus[currentHour];
    const minCount = Math.min(...hourCounts);
    const suggestedHourIndex = hourCounts.indexOf(minCount);

    res.json({
      hourCounts, peakStatus, currentStatus, currentHour,
      suggestedHour: `${suggestedHourIndex}:00`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
