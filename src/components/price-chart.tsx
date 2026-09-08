"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts";
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
      <div className="flex h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-6 text-center text-sm text-muted-foreground">
        <p className="font-semibold">No price history recorded yet</p>
        <p className="mt-1 text-xs text-muted-foreground/80">Historical data will populate as daily scrapers track price updates.</p>
      </div>
    );
  }

  return (
    <div className="h-80 w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 12, right: 16, left: -10, bottom: 4 }}>
          <defs>
            <linearGradient id="amazonGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF9900" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#FF9900" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="flipkartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2874F0" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#2874F0" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={{ stroke: "hsl(var(--border))" }}
            minTickGap={28}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            width={52}
          />
          <Tooltip
            formatter={(value: number, name: string) => [formatCurrency(value), name === "amazon" ? "Amazon India" : "Flipkart"]}
            labelStyle={{ fontWeight: "bold", color: "hsl(var(--foreground))", marginBottom: 4 }}
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 12,
              fontSize: 12,
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
            }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ fontSize: 12, paddingBottom: 16 }}
            formatter={(value) => (value === "amazon" ? "Amazon India" : "Flipkart")}
          />
          <Area type="monotone" dataKey="amazon" stroke="none" fill="url(#amazonGrad)" connectNulls />
          <Area type="monotone" dataKey="flipkart" stroke="none" fill="url(#flipkartGrad)" connectNulls />
          <Line
            type="monotone"
            dataKey="amazon"
            name="amazon"
            stroke="#FF9900"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#FF9900", strokeWidth: 0 }}
            activeDot={{ r: 6, stroke: "#FF9900", strokeWidth: 2 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="flipkart"
            name="flipkart"
            stroke="#2874F0"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#2874F0", strokeWidth: 0 }}
            activeDot={{ r: 6, stroke: "#2874F0", strokeWidth: 2 }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

