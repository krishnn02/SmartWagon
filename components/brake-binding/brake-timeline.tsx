"use client";

import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { PneumaticHistoryRow } from "@/types/pneumatic";

interface BrakeTimelineProps {
  history: PneumaticHistoryRow[];
}

export function BrakeTimeline({ history }: BrakeTimelineProps) {
  const chartData = useMemo(() => {
    return [...history].reverse().map((row) => ({
      time: new Date(row.timestamp).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Kolkata",
      }),
      bc: row.bc,
      brake: row.brake_status,
    }));
  }, [history]);

  const timeline = useMemo(() => {
    if (history.length < 2) return [];
    const step = Math.max(1, Math.floor(60 / history.length));
    return [...history].reverse().map((row, i) => {
      let color = "#1e293b";
      const s = (row.brake_status || "").toUpperCase();
      if (s.includes("APPLIED") || s === "FULL") color = "#7f1d1d";
      else if (s.includes("RELEASED")) color = "#065f46";
      else if (s.includes("FULL")) color = "#92400e";
      return { index: i, color, width: step, status: s };
    });
  }, [history]);

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm p-5">
      <h3 className="text-sm font-bold text-white mb-1">Brake Cylinder (BC) Pressure Over Time</h3>
      <div className="flex items-center gap-4 mb-4">
        <span className="flex items-center gap-1.5 text-[10px] text-red-400">
          <span className="w-3 h-1 rounded bg-red-500" /> Brake Applied
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-emerald-400">
          <span className="w-3 h-1 rounded bg-emerald-500" /> Brake Released
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <span className="w-3 h-1 rounded bg-slate-500" /> Idle
        </span>
      </div>

      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#64748b" }} interval="preserveStartEnd" />
            <YAxis domain={[0, 3.5]} tick={{ fontSize: 10, fill: "#64748b" }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #334155", background: "#1e293b", color: "#fff" }}
            />
            <Area
              type="monotone"
              dataKey="bc"
              name="BC"
              stroke="#DC2626"
              fill="#DC2626"
              fillOpacity={0.15}
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Braking Timeline Bar */}
      {timeline.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">Braking Timeline</p>
          <div className="flex h-3 rounded-full overflow-hidden bg-slate-800">
            {timeline.map((seg, i) => (
              <div
                key={i}
                style={{ backgroundColor: seg.color, flex: seg.width }}
                title={`${seg.status} — ${history[i]?.timestamp}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
