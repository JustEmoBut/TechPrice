"use client";

import { usePriceHistory } from "@/hooks/usePriceHistory";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const SITE_COLORS: Record<string, string> = {
  itopya:    "#3b82f6",
  incehesap: "#8b5cf6",
  sinerji:   "#22c55e",
};

interface Props {
  productId: string;
  days?: number;
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(value);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
}

export function PriceHistoryChart({ productId, days = 30 }: Props) {
  const { data, isLoading } = usePriceHistory(productId, undefined, days);

  if (isLoading) {
    return <div className="animate-shimmer h-64 w-full rounded-lg" />;
  }

  if (!data || data.history.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-[#52525b] text-sm">
        Fiyat gecmisi henuz mevcut degil.
      </div>
    );
  }

  const siteSet = new Set(data.history.map((h) => h.site));
  const dateMap: Record<string, Record<string, string | number>> = {};

  data.history.forEach((point) => {
    const date = formatDate(point.scraped_at);
    if (!dateMap[date]) dateMap[date] = { date };
    dateMap[date][point.site] = point.price;
  });

  const chartData = Object.values(dateMap);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#71717a" }}
          axisLine={{ stroke: "#27272a" }}
          tickLine={{ stroke: "#27272a" }}
        />
        <YAxis
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
          tick={{ fontSize: 11, fill: "#71717a" }}
          axisLine={{ stroke: "#27272a" }}
          tickLine={{ stroke: "#27272a" }}
        />
        <Tooltip
          formatter={(value) => [formatPrice(Number(value)), ""]}
          labelStyle={{ fontWeight: "600", color: "#f4f4f5" }}
          contentStyle={{
            backgroundColor: "#18181b",
            border: "1px solid #27272a",
            borderRadius: "6px",
            color: "#f4f4f5",
          }}
          itemStyle={{ color: "#a1a1aa" }}
        />
        <Legend
          wrapperStyle={{ color: "#71717a", fontSize: "12px" }}
        />
        {[...siteSet].map((site) => (
          <Line
            key={site}
            type="monotone"
            dataKey={site}
            name={site.charAt(0).toUpperCase() + site.slice(1)}
            stroke={SITE_COLORS[site] ?? "#6366f1"}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
