import Order from "../models/Order.js";

// Get order count grouped by hour for a canteen.
export const getPeakTimeData = async (req, res) => {
  const canteenId = req.params.canteenId || req.params.canteenID;

  if (!canteenId) {
    return res.status(400).json({ message: "canteenId is required" });
  }

  try {
    const orders = await Order.find({ canteenID: canteenId });

    // Count orders per hour (0–23)
    const hourCounts = Array(24).fill(0);
    orders.forEach((order) => {
      const hour = new Date(order.orderTime).getHours();
      hourCounts[hour]++;
    });

    // Label each hour: Low / Medium / High
    const peakStatus = hourCounts.map((count) => {
      if (count >= 40) return "High";
      if (count >= 20) return "Medium";
      return "Low";
    });

    // Find current hour's status
    const currentHour = new Date().getHours();
    const currentStatus = peakStatus[currentHour];

    // Suggest less busy hour
    const minCount = Math.min(...hourCounts);
    const suggestedHourIndex = hourCounts.indexOf(minCount);

    res.json({
      hourCounts,
      peakStatus,
      currentStatus,
      currentHour,
      suggestedHour: `${suggestedHourIndex}:00`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

