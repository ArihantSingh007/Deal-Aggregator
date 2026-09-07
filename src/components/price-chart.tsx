"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { PriceHistoryPoint } from "@/types";

interface ChartRow {
  date: string;
  timestamp: number;
  amazon?: number;
  flipkart?: number;
}

function buildChartData(history: PriceHistoryPoint[]): ChartRow[] {
  const byDate = new Map<string, ChartRow>();

  for (const point of history) {
    const d = new Date(point.timestamp);
    const key = d.toISOString().slice(0, 10);
    const existing = byDate.get(key) ?? { date: formatDate(d), timestamp: d.getTime() };
    if (point.platform === "AMAZON") existing.amazon = point.price;
    if (point.platform === "FLIPKART") existing.flipkart = point.price;
    byDate.set(key, existing);
  }

  return Array.from(byDate.values()).sort((a, b) => a.timestamp - b.timestamp);
}

export function PriceChart({ history }: { history: PriceHistoryPoint[] }) {
  const data = buildChartData(history);

  if (data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border text-sm text-muted-foreground">
        No price history recorded yet for this product.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} minTickGap={24} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatCurrency(v)} width={80} />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="amazon" name="Amazon" stroke="#FF9900" strokeWidth={2} dot={false} connectNulls />
          <Line type="monotone" dataKey="flipkart" name="Flipkart" stroke="#2874F0" strokeWidth={2} dot={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
