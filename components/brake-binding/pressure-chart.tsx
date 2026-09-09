"use client";

import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { PneumaticHistoryRow } from "@/types/pneumatic";
import { cn, parseAndFormatIST } from "@/lib/utils";
import { Calendar, Clock, Check, X, ChevronDown, SlidersHorizontal } from "lucide-react";

export type DurationPreset =
  | "1m"
  | "15m"
  | "30m"
  | "24h"
  | "48h"
  | "7d"
  | "30d"
  | "1y"
  | "start"
  | "custom";

interface PressureChartProps {
  history: PneumaticHistoryRow[];
  duration?: DurationPreset;
  onDurationChange?: (
    newDuration: DurationPreset,
    customStart?: string,
    customEnd?: string
  ) => void;
  customRange?: { start?: string; end?: string };
}

const METRICS = [
  { key: "bp", label: "BP", color: "#2563EB", standard: "5.0" },
  { key: "bc", label: "BC", color: "#DC2626", standard: "0.0" },
  { key: "fp", label: "FP", color: "#059669", standard: "6.0" },
  { key: "cr", label: "CR", color: "#D97706", standard: "5.0" },
] as const;

const TIME_PRESETS: { label: string; value: DurationPreset; title: string }[] = [
  { label: "1m", value: "1m", title: "Last 1 Minute" },
  { label: "15m", value: "15m", title: "Last 15 Minutes" },
  { label: "30m", value: "30m", title: "Last 30 Minutes" },
  { label: "24h", value: "24h", title: "Last 24 Hours" },
  { label: "48h", value: "48h", title: "Last 48 Hours" },
  { label: "7d", value: "7d", title: "Last 7 Days" },
  { label: "1M", value: "30d", title: "Last Month (30 Days)" },
  { label: "1Y", value: "1y", title: "Last Year (365 Days)" },
  { label: "Start", value: "start", title: "From Inception / All Telemetry" },
];

export function PressureChart({
  history,
  duration = "15m",
  onDurationChange,
  customRange,
}: PressureChartProps) {
  const [internalDuration, setInternalDuration] = useState<DurationPreset>(duration);
  const [visibleMetrics, setVisibleMetrics] = useState<Set<string>>(
    new Set(["bp", "bc", "fp", "cr"])
  );
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Local state for custom range inputs
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const toInputFormat = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

  const [tempStart, setTempStart] = useState<string>(
    customRange?.start || toInputFormat(new Date(now.getTime() - 48 * 3600 * 1000))
  );
  const [tempEnd, setTempEnd] = useState<string>(
    customRange?.end || toInputFormat(now)
  );

  const activeDuration = onDurationChange ? duration : internalDuration;

  const handleSelectDuration = (val: DurationPreset) => {
    if (val === "custom") {
      setShowCustomModal(true);
      return;
    }
    setShowCustomModal(false);
    setInternalDuration(val);
    if (onDurationChange) {
      onDurationChange(val);
    }
  };

  const handleApplyCustom = () => {
    if (!tempStart) return;
    setShowCustomModal(false);
    setInternalDuration("custom");
    if (onDurationChange) {
      onDurationChange("custom", tempStart, tempEnd || toInputFormat(new Date()));
    }
  };

  const applyQuickShortcut = (preset: "7d" | "30d" | "1y" | "start") => {
    const curr = new Date();
    let startD = new Date(curr.getTime() - 7 * 24 * 3600 * 1000);
    if (preset === "30d") startD = new Date(curr.getTime() - 30 * 24 * 3600 * 1000);
    if (preset === "1y") startD = new Date(curr.getTime() - 365 * 24 * 3600 * 1000);
    if (preset === "start") startD = new Date("2026-03-01T00:00:00Z");

    const sStr = toInputFormat(startD);
    const eStr = toInputFormat(curr);
    setTempStart(sStr);
    setTempEnd(eStr);
    setShowCustomModal(false);
    setInternalDuration("custom");
    if (onDurationChange) {
      onDurationChange("custom", sStr, eStr);
    }
  };

  const formatPointTime = (ts: string, curDuration: DurationPreset) => {
    let dStr = ts;
    if (typeof dStr === "string") dStr = dStr.replace(" ", "T");
    dStr = dStr + (dStr.endsWith("Z") || dStr.includes("+") ? "" : "+05:30");
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return ts;

    // Short durations: 1m, 15m, 30m -> HH:mm:ss
    if (curDuration === "1m" || curDuration === "15m" || curDuration === "30m") {
      return parseAndFormatIST(ts, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    }

    // 24h, 48h, 7d -> DD MMM HH:mm
    if (curDuration === "24h" || curDuration === "48h" || curDuration === "7d") {
      const day = d.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
      });
      const time = d.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      return `${day} ${time}`;
    }

    // 30d (Last Month) -> DD MMM (e.g. 15 Aug)
    if (curDuration === "30d") {
      return d.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
      });
    }

    // 1y, start, or custom multi-month -> DD MMM YYYY
    return d.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "2-digit",
    });
  };

  const formatFullIST = (ts: string) => {
    let dStr = ts;
    if (typeof dStr === "string") dStr = dStr.replace(" ", "T");
    dStr = dStr + (dStr.endsWith("Z") || dStr.includes("+") ? "" : "+05:30");
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return ts;
    return d.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const filteredData = useMemo(() => {
    // Sort oldest first so the X-axis flows chronologically left to right
    const sorted = [...history].sort((a, b) => {
      const ta = new Date((a.timestamp || "").replace(" ", "T")).getTime();
      const tb = new Date((b.timestamp || "").replace(" ", "T")).getTime();
      return ta - tb;
    });

    return sorted.map((row) => {
      let timelineColor = "#059669"; // Default Released
      let timelineStatus = "Released";
      if (row.bc > 0.4 || row.brake_status === "APPLIED") {
        timelineColor = "#dc2626"; // Applied
        timelineStatus = "Applied";
      } else if (row.brake_status === "RELEASED" || row.bc <= 0.4) {
        timelineColor = "#059669"; // Released
        timelineStatus = "Released";
      } else {
        timelineColor = "#64748b"; // Idle
        timelineStatus = "Idle";
      }

      return {
        rawTime: row.timestamp,
        time: formatPointTime(row.timestamp, activeDuration),
        fullTime: formatFullIST(row.timestamp),
        bp: row.bp,
        fp: row.fp,
        cr: row.cr,
        bc: row.bc,
        timelineColor,
        timelineStatus,
        timelineValue: 1,
      };
    });
  }, [history, activeDuration]);

  const toggleMetric = (key: string) => {
    setVisibleMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>Pressure Status</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200/60">
              Live Pneumatic Telemetry
            </span>
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">
            X-AXIS: TIME | Y-AXIS: PRESSURE (KG/CM²)
          </p>
        </div>

        {/* Duration Selection Bar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Preset Buttons Pill Bar */}
          <div className="flex items-center bg-slate-900 rounded-xl p-0.5 shadow-inner">
            {TIME_PRESETS.map((r) => (
              <button
                key={r.value}
                onClick={() => handleSelectDuration(r.value)}
                title={r.title}
                className={cn(
                  "px-2 py-1 text-[10px] font-bold rounded-lg transition-all",
                  activeDuration === r.value
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {r.label}
              </button>
            ))}

            {/* Custom Range Toggle Button */}
            <button
              onClick={() => setShowCustomModal(!showCustomModal)}
              title="Select custom duration older than 48h (e.g. Last Month, Last Year, From Start)"
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all border",
                activeDuration === "custom"
                  ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                  : "text-amber-400 border-transparent hover:text-white hover:bg-slate-800"
              )}
            >
              <Calendar className="h-3 w-3" />
              <span>Custom</span>
              <ChevronDown className="h-2.5 w-2.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Custom Date Range Panel */}
      {showCustomModal && (
        <div className="mb-4 p-4 bg-gradient-to-br from-slate-50 to-blue-50/40 border border-blue-200/80 rounded-2xl shadow-sm text-xs space-y-3 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-600 text-white">
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </div>
              <span className="font-bold text-slate-800">
                Custom Duration & Historical Data Range
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowCustomModal(false)}
              className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                From Date & Time
              </label>
              <input
                type="datetime-local"
                value={tempStart}
                onChange={(e) => setTempStart(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                To Date & Time
              </label>
              <input
                type="datetime-local"
                value={tempEnd}
                onChange={(e) => setTempEnd(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleApplyCustom}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Apply Range</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200 text-[11px] flex-wrap">
            <span className="font-bold text-slate-500 mr-1">Quick Presets:</span>
            <button
              type="button"
              onClick={() => applyQuickShortcut("7d")}
              className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 rounded-lg font-medium transition-colors"
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => applyQuickShortcut("30d")}
              className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 rounded-lg font-medium transition-colors"
            >
              Last Month (30d)
            </button>
            <button
              type="button"
              onClick={() => applyQuickShortcut("1y")}
              className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 rounded-lg font-medium transition-colors"
            >
              Last Year (365d)
            </button>
            <button
              type="button"
              onClick={() => applyQuickShortcut("start")}
              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-bold transition-colors"
            >
              From Inception (Mar 2026)
            </button>
          </div>
        </div>
      )}

      {/* Active Custom Badge */}
      {activeDuration === "custom" && customRange?.start && (
        <div className="flex items-center justify-between mb-3 px-3 py-1.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 font-medium">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-blue-600" />
            <span>
              Active Custom Filter:{" "}
              <strong>{formatFullIST(customRange.start)}</strong> &rarr;{" "}
              <strong>
                {customRange.end ? formatFullIST(customRange.end) : "Latest"}
              </strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleSelectDuration("15m")}
            className="text-blue-600 hover:text-blue-800 font-bold hover:underline flex items-center gap-1 text-[11px]"
          >
            Reset to 15m
          </button>
        </div>
      )}

      {/* Metric toggles */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => toggleMetric(m.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all shadow-sm",
              visibleMetrics.has(m.key)
                ? "text-white border-transparent"
                : "text-slate-400 border-slate-200 bg-white hover:bg-slate-50"
            )}
            style={
              visibleMetrics.has(m.key) ? { backgroundColor: m.color } : undefined
            }
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: m.color }}
            />
            <span>{m.label}</span>
            <span className="text-[10px] opacity-75 font-normal">
              ({m.standard})
            </span>
          </button>
        ))}
      </div>

      {/* Area Chart */}
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <AreaChart
            data={filteredData}
            syncId="pressure-charts"
            margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              interval="preserveStartEnd"
            />
            <YAxis domain={[0, 7]} tick={{ fontSize: 10, fill: "#94a3b8" }} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const pt = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white rounded-xl shadow-xl p-3 border border-slate-800 text-xs min-w-[200px]">
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-2 border-b border-slate-800 pb-1.5">
                        <Clock className="h-3 w-3 text-blue-400" />
                        <span>{pt.fullTime || pt.time}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-blue-400 font-semibold">
                          <span>Brake Pipe (BP):</span>
                          <span className="font-mono">{pt.bp.toFixed(2)} kg/cm²</span>
                        </div>
                        <div className="flex items-center justify-between text-red-400 font-semibold">
                          <span>Brake Cylinder (BC):</span>
                          <span className="font-mono">{pt.bc.toFixed(2)} kg/cm²</span>
                        </div>
                        <div className="flex items-center justify-between text-emerald-400 font-semibold">
                          <span>Feed Pipe (FP):</span>
                          <span className="font-mono">{pt.fp.toFixed(2)} kg/cm²</span>
                        </div>
                        <div className="flex items-center justify-between text-amber-400 font-semibold">
                          <span>Control Res. (CR):</span>
                          <span className="font-mono">{pt.cr.toFixed(2)} kg/cm²</span>
                        </div>
                      </div>
                      <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Status:</span>
                        <span
                          className="font-bold uppercase px-1.5 py-0.5 rounded text-[10px]"
                          style={{
                            backgroundColor: pt.timelineColor + "33",
                            color: pt.timelineColor,
                          }}
                        >
                          {pt.timelineStatus}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
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

      {/* Braking State Timeline */}
      {filteredData.length > 0 && (
        <div className="mt-6 border-t border-slate-100 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              Braking State Timeline
            </h3>
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
          <div className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart
                data={filteredData}
                syncId="pressure-charts"
                margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  interval="preserveStartEnd"
                />
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
                  cursor={{ stroke: "#cbd5e1", strokeWidth: 1, strokeDasharray: "3 3" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
                          <p className="text-slate-500 mb-1">{data.fullTime || data.time}</p>
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: data.timelineColor }}
                            />
                            <span
                              className="font-bold text-sm"
                              style={{ color: data.timelineColor }}
                            >
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
                    if (row.bc > 0.4 || row.brake_status === "APPLIED") return 2;
                    if (row.brake_status === "RELEASED" || row.bc <= 0.4) return 1;
                    return 0;
                  }}
                  stroke="#334155"
                  strokeWidth={2}
                  fill="url(#colorState)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "#0f172a",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
