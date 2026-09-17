"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TemperaturePoint } from "@/types";
import { formatTime, formatTemp } from "@/lib/format";

export function TemperatureChart({
  data,
  minTemp,
  maxTemp,
  freezeSensitive,
  heatThresholdTemp,
  freezeThresholdTemp,
  accent = "var(--chart-1)",
}: {
  data: TemperaturePoint[];
  minTemp: number;
  maxTemp: number;
  freezeSensitive: boolean;
  heatThresholdTemp?: number | null;
  freezeThresholdTemp?: number | null;
  accent?: string;
}) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`tempFill_${accent.replace(/[^a-zA-Z0-9]/g, "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity={0.35} />
              <stop offset="100%" stopColor={accent} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {freezeSensitive ? (
            <ReferenceArea
              y1={minTemp}
              y2={maxTemp}
              fill="var(--chart-3)"
              fillOpacity={0.06}
              stroke="none"
            />
          ) : null}
          <ReferenceLine
            y={maxTemp}
            stroke="var(--destructive)"
            strokeOpacity={0.6}
            strokeDasharray="4 4"
            label={{
              value: `Max ${maxTemp}°C`,
              position: "insideTopRight",
              fill: "var(--muted-foreground)",
              fontSize: 11,
            }}
          />
          {freezeSensitive ? (
            <ReferenceLine
              y={minTemp}
              stroke="var(--chart-4)"
              strokeOpacity={0.6}
              strokeDasharray="4 4"
              label={{
                value: `Min ${minTemp}°C`,
                position: "insideBottomRight",
                fill: "var(--muted-foreground)",
                fontSize: 11,
              }}
            />
          ) : null}
          {typeof heatThresholdTemp === "number" ? (
            <ReferenceLine
              y={heatThresholdTemp}
              stroke="var(--chart-2)"
              strokeOpacity={0.8}
              strokeDasharray="2 4"
              label={{
                value: `Heat ${heatThresholdTemp}°C`,
                position: "insideTopRight",
                fill: "var(--chart-2)",
                fontSize: 11,
              }}
            />
          ) : null}
          {typeof freezeThresholdTemp === "number" && freezeThresholdTemp < minTemp ? (
            <ReferenceLine
              y={freezeThresholdTemp}
              stroke="var(--chart-5)"
              strokeOpacity={0.8}
              strokeDasharray="2 4"
              label={{
                value: `Freeze ${freezeThresholdTemp}°C`,
                position: "insideBottomRight",
                fill: "var(--chart-5)",
                fontSize: 11,
              }}
            />
          ) : null}
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
            domain={["auto", "auto"]}
            stroke="var(--muted-foreground)"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={42}
            tickFormatter={(v: number) => formatTemp(v)}
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
              name === "temperature" ? formatTemp(Number(value)) : `${value}%`,
              name === "temperature" ? "Temperature" : "Humidity",
            ]}
          />
          <Legend
            formatter={(value) =>
              value === "temperature" ? "Temperature (°C)" : "Humidity (%)"
            }
            wrapperStyle={{ fontSize: 12 }}
          />
          <Area
            type="monotone"
            dataKey="temperature"
            stroke={accent}
            strokeWidth={2}
            fill={`url(#tempFill_${accent.replace(/[^a-zA-Z0-9]/g, "")})`}
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="humidity"
            stroke="var(--chart-3)"
            strokeWidth={1.5}
            strokeOpacity={0.5}
            fill="none"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}