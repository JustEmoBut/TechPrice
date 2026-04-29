"use client";

import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";
import { usePriceHistory } from "@/hooks/usePriceHistory";

interface Props {
  productId: string;
}

export function MiniSparkline({ productId }: Props) {
  const { data } = usePriceHistory(productId, undefined, 30);

  if (!data || data.history.length < 2) return null;

  const lowPricePerDay: Record<string, number> = {};

  for (const point of data.history) {
    const dayKey = point.scraped_at.slice(0, 10);
    const current = lowPricePerDay[dayKey];
    if (current === undefined || point.price < current) {
      lowPricePerDay[dayKey] = point.price;
    }
  }

  const chartData = Object.entries(lowPricePerDay)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, price]) => ({ price }));

  if (chartData.length < 2) return null;

  const prices = chartData.map((entry) => entry.price);
  const first = prices[0];
  const last = prices[prices.length - 1];
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min;
  const midpoint = (min + max) / 2;
  const padding = Math.max(range * 0.18, midpoint * 0.08, 1000);

  let stroke = "#a6a6a6";
  if (last < first) stroke = "#f2f2f2";
  if (last > first) stroke = "#7d7d7d";

  return (
    <ResponsiveContainer width="100%" height={30}>
      <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <YAxis domain={[min - padding, max + padding]} hide />
        <Line
          type="monotone"
          dataKey="price"
          stroke={stroke}
          strokeWidth={1.6}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
