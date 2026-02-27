"use client";

import { usePriceHistory } from "@/hooks/usePriceHistory";
import { LineChart, Line, YAxis, ResponsiveContainer } from "recharts";

interface Props {
  productId: string;
}

export function MiniSparkline({ productId }: Props) {
  const { data } = usePriceHistory(productId, undefined, 30);

  if (!data || data.history.length < 2) return null;

  // En düşük günlük fiyatı al (birden fazla site varsa en ucuzu)
  const dateMap: Record<string, number> = {};
  data.history.forEach((h) => {
    const date = h.scraped_at.slice(0, 10);
    if (dateMap[date] === undefined || h.price < dateMap[date]) {
      dateMap[date] = h.price;
    }
  });

  const chartData = Object.entries(dateMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, price]) => ({ price }));

  if (chartData.length < 2) return null;

  const prices = chartData.map((d) => d.price);
  const first = prices[0];
  const last = prices[prices.length - 1];
  const color = last < first ? "#22c55e" : last > first ? "#ef4444" : "#52525b";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const padding = (max - min) * 0.1 || 1;

  return (
    <ResponsiveContainer width="100%" height={32}>
      <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <YAxis domain={[min - padding, max + padding]} hide />
        <Line
          type="monotone"
          dataKey="price"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
