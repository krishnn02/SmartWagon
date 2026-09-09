"use client";

import { Eye, Thermometer, Train, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MappedCoachData } from "@/types/hot-axle";
import { getAxleTemperatureColor } from "@/lib/axle-utils";

interface HotAxleCardProps {
  data: MappedCoachData;
  onView: () => void;
}

export function HotAxleCard({ data, onView }: HotAxleCardProps) {
  const isCritical = data.status === "Critical";
  const isWarning = data.status === "Warning";

  const slotNames = ['A1-1', 'A1-2', 'A2-1', 'A2-2', 'A3-1', 'A3-2', 'A4-1', 'A4-2'];
  const maxTempColor = getAxleTemperatureColor(data.maxTemp > 0 ? data.maxTemp : null);

  return (
    <div
      onClick={onView}
      className={cn(
        "group cursor-pointer rounded-2xl border p-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-white flex flex-col justify-between",
        isCritical ? "border-red-200" : isWarning ? "border-amber-200" : "border-slate-200"
      )}
    >
      {/* Background Soft Gradient */}
      <div
        className={cn(
          "absolute inset-0 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none",
          isCritical
            ? "bg-gradient-to-br from-red-500 to-transparent"
            : isWarning
            ? "bg-gradient-to-br from-amber-500 to-transparent"
            : "bg-gradient-to-br from-emerald-500 to-transparent"
        )}
      />

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
              <Train className="h-4 w-4 text-slate-400" />
              {data.coach.coach_no || data.coach.device_id}
            </h3>
            <p className="text-[10px] text-slate-500 font-medium ml-5.5 mt-0.5">
              Device: {data.coach.device_id || "N/A"}
            </p>
          </div>
          <div
            className={cn(
              "text-[9px] font-bold px-2 py-1 rounded-md tracking-wider shadow-sm",
              isCritical
                ? "bg-red-500 text-white"
                : isWarning
                ? "bg-amber-500 text-white"
                : "bg-emerald-500 text-white"
            )}
          >
            {data.status.toUpperCase()}
          </div>
        </div>

        {/* Max Temp */}
        <div className="flex items-center gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
          <div
            className="p-2 rounded-lg"
            style={{
              backgroundColor: maxTempColor.glowRgba,
              color: maxTempColor.hex,
            }}
          >
            <Thermometer className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-500 mb-0.5 uppercase tracking-wide">
              Max Axle Temp
            </p>
            <p
              className="text-xl font-black tracking-tight leading-none"
              style={{ color: maxTempColor.hex }}
            >
              {data.maxTemp > 0 ? `${data.maxTemp.toFixed(1)}°C` : "--"}
            </p>
          </div>
        </div>

        {/* Axles Visualizer (Mini 8-Wheel Grid) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              Axle Bearing Temperatures
            </p>
            <span className="text-[9px] font-semibold text-blue-500 flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5" /> 3D Axle View
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {slotNames.map((slotId) => {
              const typedSlotId = slotId as keyof typeof data.axleSlots;
              const slotData = data.axleSlots[typedSlotId];
              const temp = slotData?.temperature || 0;
              const colorInfo = getAxleTemperatureColor(temp > 0 ? temp : null);

              return (
                <div
                  key={slotId}
                  title={`${slotId}: ${temp > 0 ? temp.toFixed(1) + "°C" : "No Data"}`}
                  className="h-7 rounded-lg border flex flex-col items-center justify-center text-[8px] font-bold transition-colors"
                  style={{
                    backgroundColor: temp > 0 ? colorInfo.glowRgba : "#f8fafc",
                    borderColor: temp > 0 ? `${colorInfo.hex}50` : "#e2e8f0",
                    color: temp > 0 ? colorInfo.hex : "#94a3b8",
                  }}
                >
                  <span className="text-[7px] text-slate-400 leading-none">{slotId}</span>
                  <span className="leading-tight font-black">
                    {temp > 0 ? `${temp.toFixed(0)}°` : "-"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end pt-2 border-t border-slate-100/60">
          <div className="text-[9px] font-medium text-slate-400 font-mono">
            {data.latestTimestamp
              ? new Date(data.latestTimestamp).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "No recent data"}
          </div>
          <div className="flex items-center text-[10px] font-bold text-blue-500 group-hover:text-blue-600 transition-colors">
            Interactive Digital Twin <Eye className="h-3 w-3 ml-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
