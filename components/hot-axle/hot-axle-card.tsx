"use client";

import { Eye } from "lucide-react";
import { cn, parseAndFormatIST } from "@/lib/utils";
import type { MappedCoachData } from "@/types/hot-axle";

interface HotAxleCardProps {
  data: MappedCoachData;
  onView: () => void;
}

export function HotAxleCard({ data, onView }: HotAxleCardProps) {
  const isCritical = data.status === "Critical";
  const isWarning = data.status === "Warning";

  return (
    <div
      className={cn(
        "rounded-xl border p-4 shadow-sm relative overflow-hidden transition-all bg-white",
        isCritical ? "border-red-200" : isWarning ? "border-amber-200" : "border-slate-200"
      )}
    >
      {/* Background soft color depending on status */}
      <div className={cn(
        "absolute inset-0 opacity-10 pointer-events-none",
        isCritical ? "bg-red-50" : isWarning ? "bg-amber-50" : "bg-transparent"
      )} />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-sm font-bold text-blue-500">{data.coach.coach_no || data.coach.device_id}</h3>
          <button 
            onClick={onView}
            className="text-slate-400 hover:text-slate-700 transition-colors p-1"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-1 mb-4">
          <p className="text-[10px] text-slate-600 font-medium">Train: {data.coach.train_no || "N/A"}</p>
          <p className="text-[10px] text-slate-600 font-medium">Device: {data.coach.device_id || "N/A"}</p>
        </div>

        <div className="flex justify-between items-end mb-2">
          <div>
            <p className="text-[10px] font-medium text-slate-500 mb-0.5">Max Temp</p>
            <p className={cn(
              "text-2xl font-bold tracking-tight",
              isCritical ? "text-red-600" : isWarning ? "text-amber-500" : "text-slate-900"
            )}>
              {data.maxTemp > 0 ? `${data.maxTemp.toFixed(1)}°C` : "--"}
            </p>
          </div>
          
          <div className={cn(
            "text-[9px] font-bold px-2.5 py-1 rounded-md tracking-wider mb-1",
            isCritical ? "bg-red-100 text-red-600" : isWarning ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
          )}>
            {data.status.toUpperCase()}
          </div>
        </div>

        {data.latestTimestamp && (
          <div className="text-[10px] text-slate-400 font-medium">
            {/* Hardcoded format to match screenshot: MM/DD/YY HH:mm */}
            {new Date(data.latestTimestamp).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute:'2-digit' }).replace(',', '')}
          </div>
        )}
      </div>
    </div>
  );
}
