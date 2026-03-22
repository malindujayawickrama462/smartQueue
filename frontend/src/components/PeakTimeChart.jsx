import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { getPeakTimeData } from "../services/api";
import PeakTimeIndicator from "./PeakTimeIndicator";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function PeakTimeChart({ canteenId }) {
  const [chartData, setChartData] = useState(null);
  const [info, setInfo] = useState(null);

  useEffect(() => {
    let mounted = true;

    getPeakTimeData(canteenId).then((res) => {
      if (!mounted) return;

      const { hourCounts, peakStatus, currentStatus, suggestedHour } = res.data;
      setInfo({ currentStatus, suggestedHour });

      const colors = hourCounts.map((_, i) => {
        const s = peakStatus[i];
        if (s === "High") return "rgba(220, 80, 80, 0.8)";
        if (s === "Medium") return "rgba(255, 180, 50, 0.8)";
        return "rgba(50, 180, 100, 0.8)";
      });

      setChartData({
        labels: hourCounts.map((_, i) => `${i}:00`),
        datasets: [
          {
            label: "Orders per Hour",
            data: hourCounts,
            backgroundColor: colors,
            borderRadius: 6,
          },
        ],
      });
    });

    return () => {
      mounted = false;
    };
  }, [canteenId]);

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>Peak Time Analysis</h2>

      <PeakTimeIndicator currentStatus={info?.currentStatus} suggestedHour={info?.suggestedHour} />

      {chartData && (
        <Bar
          data={chartData}
          options={{
            responsive: true,
            plugins: {
              legend: { display: false },
              title: { display: true, text: "Orders by Hour of Day" },
            },
            scales: {
              y: { beginAtZero: true, title: { display: true, text: "Order Count" } },
              x: { title: { display: true, text: "Hour" } },
            },
          }}
        />
      )}
    </div>
  );
}

