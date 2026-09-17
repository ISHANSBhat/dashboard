"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DegradationPoint } from "@/types";
import { formatTime } from "@/lib/format";

export function DegradationChart({ data }: { data: DegradationPoint[] }) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="degFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--destructive)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--destructive)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <ReferenceLine
            y={1}
            stroke="var(--destructive)"
            strokeOpacity={0.8}
            strokeDasharray="4 4"
          />
          <ReferenceLine
            y={0.5}
            stroke="var(--chart-2)"
            strokeOpacity={0.5}
            strokeDasharray="4 4"
          />
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="time"
            tickFormatter={formatTime}
            stroke="var(--muted-foreground)"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            minTickGap={48}
          />
          <YAxis
            domain={[0, 1.1]}
            stroke="var(--muted-foreground)"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={40}
            tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
          />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              fontSize: 12,
            }}
            labelFormatter={(label) => new Date(label as string).toLocaleString()}
            formatter={(value, name) => [
              `${(Number(value) * 100).toFixed(1)}%`,
              name === "degradationIndex" ? "Degradation" : "Index",
            ]}
          />
          <Area
            type="monotone"
            dataKey="degradationIndex"
            stroke="var(--destructive)"
            strokeWidth={2}
            fill="url(#degFill)"
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}