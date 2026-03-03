"use client";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { usePriceHistory } from "@/hooks/usePriceHistory";

interface Props {
  productId: string;
  days?: number;
}

const SITE_COLORS: Record<string, string> = {
  itopya: "#f2f2f2",
  incehesap: "#cfcfcf",
  sinerji: "#a8a8a8",
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatLabel(date: string) {
  return new Date(date).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
  });
}

export function PriceHistoryChart({ productId, days = 30 }: Props) {
  const { data, isLoading } = usePriceHistory(productId, undefined, days);

  const grouped: Record<string, Record<string, string | number>> = {};

  for (const point of data?.history ?? []) {
    const dateKey = point.scraped_at.slice(0, 10);
    if (!grouped[dateKey]) {
      grouped[dateKey] = { date: formatLabel(point.scraped_at), dateKey };
    }
    grouped[dateKey][point.site] = point.price;
  }

  const chartData = Object.values(grouped).sort((left, right) =>
    String(left.dateKey).localeCompare(String(right.dateKey))
  );

  if (isLoading) {
    return <div className="animate-shimmer h-72 w-full rounded-xl" />;
  }

  if (chartData.length === 0) {
    return (
      <div className="flex h-52 items-center justify-center rounded-xl border border-edge/70 bg-surface-2/45 text-sm text-ink-muted">
        Fiyat geçmişi kaydı henüz oluşmadı.
      </div>
    );
  }

  const sites = Array.from(new Set(data?.history.map((point) => point.site)));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: 4, bottom: 4 }}>
        <CartesianGrid stroke="rgba(170, 170, 170, 0.16)" strokeDasharray="4 4" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#a6a6a6" }}
          axisLine={{ stroke: "rgba(170, 170, 170, 0.4)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#a6a6a6" }}
          tickFormatter={(value) => `${Math.round(Number(value) / 1000)}K`}
          axisLine={{ stroke: "rgba(170, 170, 170, 0.4)" }}
          tickLine={false}
          width={52}
        />
        <Tooltip
          formatter={(value) => [formatPrice(Number(value ?? 0)), ""]}
          labelStyle={{ color: "#f3f3f3", fontWeight: 600 }}
          contentStyle={{
            backgroundColor: "rgba(10, 10, 10, 0.94)",
            border: "1px solid rgba(112, 112, 112, 0.65)",
            borderRadius: "12px",
            color: "#d6d6d6",
          }}
          itemStyle={{ color: "#d6d6d6" }}
        />
        <Legend wrapperStyle={{ color: "#b8b8b8", fontSize: 12 }} />

        {sites.map((site) => (
          <Line
            key={site}
            type="monotone"
            dataKey={site}
            name={site.charAt(0).toUpperCase() + site.slice(1)}
            stroke={SITE_COLORS[site] ?? "#e5e5e5"}
            strokeWidth={2.4}
            dot={false}
            connectNulls
            isAnimationActive
            animationDuration={900}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
