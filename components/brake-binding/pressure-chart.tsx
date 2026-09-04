"use client";

import { useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, Cell } from "recharts";
import type { PneumaticHistoryRow } from "@/types/pneumatic";
import { cn, parseAndFormatIST } from "@/lib/utils";

interface PressureChartProps {
  history: PneumaticHistoryRow[];
}

const METRICS = [
  { key: "bp", label: "BP", color: "#2563EB" },
  { key: "bc", label: "BC", color: "#DC2626" },
  { key: "fp", label: "FP", color: "#059669" },
  { key: "cr", label: "CR", color: "#D97706" },
] as const;

type TimeRange = "1m" | "15m" | "30m" | "24h" | "48h";
const TIME_RANGES: { label: string; value: TimeRange; seconds: number }[] = [
  { label: "1m", value: "1m", seconds: 60 },
  { label: "15m", value: "15m", seconds: 900 },
  { label: "30m", value: "30m", seconds: 1800 },
  { label: "24h", value: "24h", seconds: 86400 },
  { label: "48h", value: "48h", seconds: 172800 },
];

export function PressureChart({ history }: PressureChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("15m");
  const [visibleMetrics, setVisibleMetrics] = useState<Set<string>>(new Set(["bp", "bc", "fp", "cr"]));

  const filteredData = useMemo(() => {
    // If we have history, use the latest data point as 'now' so that historical data is visible.
    // Otherwise fallback to the actual current time.
    let now = new Date().getTime();
    if (history.length > 0) {
      let dStr = history[0].timestamp;
      if (typeof dStr === 'string') dStr = dStr.replace(' ', 'T');
      dStr = dStr + (dStr.endsWith('Z') || dStr.includes('+') ? '' : '+05:30');
      const latestTime = new Date(dStr).getTime();
      if (!isNaN(latestTime)) now = latestTime;
    }
    
    const range = TIME_RANGES.find((r) => r.value === timeRange)?.seconds || 900;
    const cutoff = now - range * 1000;

    return [...history]
      .reverse() // Sort oldest first so the X-axis flows left to right
      .filter((row) => {
        let dStr = row.timestamp;
        if (typeof dStr === 'string') dStr = dStr.replace(' ', 'T');
        dStr = dStr + (dStr.endsWith('Z') || dStr.includes('+') ? '' : '+05:30');
        return new Date(dStr).getTime() >= cutoff;
      })
      .map((row) => {
        let timelineColor = "#1e293b"; // Idle
        let timelineStatus = "Idle";
        if (row.bc > 0.4) {
          timelineColor = "#7f1d1d"; // Applied
          timelineStatus = "Applied";
        } else if (row.bc > 0.1) {
          timelineColor = "#065f46"; // Released
          timelineStatus = "Released";
        }

        return {
          time: parseAndFormatIST(row.timestamp, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }),
          bp: row.bp,
          fp: row.fp,
          cr: row.cr,
          bc: row.bc,
          timelineColor,
          timelineStatus,
          timelineValue: 1, // Fixed height for the bar chart
        };
      });
  }, [history, timeRange]);

  const toggleMetric = (key: string) => {
    setVisibleMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Pressure Status</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">X-AXIS: TIME | Y-AXIS: PRESSURE (KG/CM²)</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Time range buttons */}
          <div className="flex bg-slate-900 rounded-lg p-0.5">
            {TIME_RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setTimeRange(r.value)}
                className={cn(
                  "px-2.5 py-1 text-[10px] font-medium rounded-md transition-colors",
                  timeRange === r.value ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metric toggles */}
      <div className="flex gap-2 mb-4">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => toggleMetric(m.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors",
              visibleMetrics.has(m.key)
                ? "text-white border-transparent"
                : "text-slate-400 border-slate-200 bg-white"
            )}
            style={visibleMetrics.has(m.key) ? { backgroundColor: m.color } : undefined}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
            {m.label}
          </button>
        ))}
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <AreaChart data={filteredData} syncId="pressure-charts" margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#94a3b8" }} interval="preserveStartEnd" />
            <YAxis domain={[0, 7]} tick={{ fontSize: 10, fill: "#94a3b8" }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
            />
            <Legend />
            {METRICS.filter((m) => visibleMetrics.has(m.key)).map((m) => (
              <Area
                key={m.key}
                type="monotone"
                dataKey={m.key}
                name={m.label}
                stroke={m.color}
                fill={m.color}
                fillOpacity={0.08}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Braking State Graph */}
      {filteredData.length > 0 && (
        <div className="mt-6 border-t border-slate-100 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Braking State Timeline</h3>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-red-600" /> Applied
              </span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-600" /> Released
              </span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-slate-500" /> Idle
              </span>
            </div>
          </div>
          <div className="h-[150px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={filteredData} syncId="pressure-charts" margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#94a3b8" }} interval="preserveStartEnd" />
                <YAxis 
                  domain={[0, 2]} 
                  ticks={[0, 1, 2]} 
                  tickFormatter={(val) => {
                    if (val === 2) return "Applied";
                    if (val === 1) return "Released";
                    return "Idle";
                  }}
                  tick={{ fontSize: 10, fill: "#64748b", fontWeight: 600 }}
                  width={60}
                />
                <Tooltip 
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }} 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white border border-slate-200 rounded shadow-lg p-3 text-xs">
                          <p className="text-slate-500 mb-1">{data.time}</p>
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: data.timelineColor }} />
                            <span className="font-bold text-sm" style={{ color: data.timelineColor }}>
                              {data.timelineStatus}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <defs>
                  <linearGradient id="colorState" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area 
                  type="stepAfter" 
                  dataKey={(row) => {
                    if (row.bc > 0.4) return 2;
                    if (row.bc > 0.1) return 1;
                    return 0;
                  }}
                  stroke="#334155" 
                  strokeWidth={2}
                  fill="url(#colorState)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#0f172a", stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
