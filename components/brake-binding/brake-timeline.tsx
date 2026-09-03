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
      bp: row.bp,
      fp: row.fp,
      cr: row.cr,
      brake: row.brake_status,
    }));
  }, [history]);

  const timeline = useMemo(() => {
    if (history.length < 2) return [];
    const step = Math.max(1, Math.floor(60 / history.length));
    return [...history].reverse().map((row, i) => {
      let color = "#1e293b"; // Idle
      let status = "Idle";
      
      if (row.bc > 0.4) {
        color = "#7f1d1d"; // Applied
        status = "Brake Applied";
      } else if (row.bc > 0.1) {
        color = "#065f46"; // Released
        status = "Brake Released";
      }

      return { 
        index: i, 
        color, 
        width: step, 
        status,
        timestamp: new Date(row.timestamp).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })
      };
    });
  }, [history]);

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm p-5">
      <h3 className="text-sm font-bold text-white mb-1">Pneumatic Pressures Over Time</h3>
      <div className="flex items-center gap-4 mb-4">
        <span className="flex items-center gap-1.5 text-[10px] text-blue-400">
          <span className="w-3 h-1 rounded bg-blue-600" /> BP
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-emerald-400">
          <span className="w-3 h-1 rounded bg-emerald-600" /> FP
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-orange-400">
          <span className="w-3 h-1 rounded bg-orange-500" /> CR
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-red-400">
          <span className="w-3 h-1 rounded bg-red-600" /> BC
        </span>
      </div>

      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#64748b" }} interval="preserveStartEnd" />
            <YAxis domain={[0, 7]} tick={{ fontSize: 10, fill: "#64748b" }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #334155", background: "#1e293b", color: "#fff" }}
            />
            <Area type="monotone" dataKey="bp" name="BP" stroke="#2563EB" fill="#2563EB" fillOpacity={0.08} strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="fp" name="FP" stroke="#059669" fill="#059669" fillOpacity={0.08} strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="cr" name="CR" stroke="#D97706" fill="#D97706" fillOpacity={0.08} strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="bc" name="BC" stroke="#DC2626" fill="#DC2626" fillOpacity={0.15} strokeWidth={2} dot={false} />
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
                title={`${seg.status} — ${seg.timestamp}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
