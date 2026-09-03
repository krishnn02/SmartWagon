"use client";

import type { PneumaticFault } from "@/types/pneumatic";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActiveFaultsProps {
  faults: PneumaticFault[];
  onShowAll?: () => void;
}

export function ActiveFaults({ faults, onShowAll }: ActiveFaultsProps) {
  const visible = faults.slice(0, 5);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900">Active Faults</h3>
        {onShowAll && faults.length > 5 && (
          <button
            onClick={onShowAll}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            View All <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 mb-2">
            <span className="text-emerald-600 text-lg">&#10003;</span>
          </div>
          <p className="text-xs font-medium text-emerald-700">No active faults</p>
          <p className="text-[10px] text-slate-400 mt-0.5">System operating normally</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((fault, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3"
            >
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-semibold text-red-800">{fault.type}</p>
                  <span
                    className={cn(
                      "text-[10px] font-bold rounded-full px-2 py-0.5",
                      fault.severity === "High" ? "bg-red-200 text-red-800" : "bg-amber-200 text-amber-800"
                    )}
                  >
                    {fault.severity}
                  </span>
                </div>
                <p className="text-[10px] text-red-600 mt-0.5 truncate">{fault.description.replace(fault.deviceId, "").trim()}</p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                  <span>{new Date(fault.timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
