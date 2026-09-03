"use client";

import type { PneumaticHistoryRow } from "@/types/pneumatic";
import { cn } from "@/lib/utils";
import { Clock, ArrowRight } from "lucide-react";

interface PneumaticLogProps {
  history: PneumaticHistoryRow[];
  onShowAll?: () => void;
}

const statusPillColor = (s: string) => {
  const u = (s || "").toUpperCase();
  if (u.includes("APPLIED") || u === "FULL") return "bg-red-100 text-red-700 border-red-200";
  if (u.includes("RELEASED")) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (u.includes("IDLE")) return "bg-slate-100 text-slate-600 border-slate-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
};

export function PneumaticLog({ history, onShowAll }: PneumaticLogProps) {
  const recent = history.slice(0, 5);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900">Pneumatic Log History</h3>
        {onShowAll && history.length > 5 && (
          <button
            onClick={onShowAll}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            View All <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {recent.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-8">No history data yet</p>
      ) : (
        <div className="space-y-2">
          {recent.map((row, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 shrink-0 w-[120px]">
                <Clock className="h-3 w-3" />
                {new Date(row.timestamp).toLocaleString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false,
                  timeZone: "Asia/Kolkata",
                })}
              </div>
              <span className={cn("text-[10px] font-semibold border rounded-full px-2 py-0.5", statusPillColor(row.brake_status))}>
                {row.brake_status}
              </span>
              <span className="text-xs text-slate-600 truncate">{row.coach_no}</span>
              <span className="text-xs font-mono text-red-600 font-semibold">BC: {row.bc.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
