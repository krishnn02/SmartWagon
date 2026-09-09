"use client";

import { Eye, Thermometer, Train } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MappedCoachData } from "@/types/hot-axle";

interface HotAxleCardProps {
  data: MappedCoachData;
  onView: () => void;
}

export function HotAxleCard({ data, onView }: HotAxleCardProps) {
  const isCritical = data.status === "Critical";
  const isWarning = data.status === "Warning";

  const slotNames = ['A1-1', 'A1-2', 'A2-1', 'A2-2', 'A3-1', 'A3-2', 'A4-1', 'A4-2'];

  return (
    <div
      onClick={onView}
      className={cn(
        "group cursor-pointer rounded-2xl border p-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-white flex flex-col justify-between",
        isCritical ? "border-red-200" : isWarning ? "border-amber-200" : "border-slate-200"
      )}
    >
      {/* Background Soft Gradient */}
      <div className={cn(
        "absolute inset-0 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none",
        isCritical ? "bg-gradient-to-br from-red-500 to-transparent" : 
        isWarning ? "bg-gradient-to-br from-amber-500 to-transparent" : 
        "bg-gradient-to-br from-emerald-500 to-transparent"
      )} />

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
              <Train className="h-4 w-4 text-slate-400" />
              {data.coach.coach_no || data.coach.device_id}
            </h3>
            <p className="text-[10px] text-slate-500 font-medium ml-5.5 mt-0.5">Device: {data.coach.device_id || "N/A"}</p>
          </div>
          <div className={cn(
            "text-[9px] font-bold px-2 py-1 rounded-md tracking-wider shadow-sm",
            isCritical ? "bg-red-500 text-white" : 
            isWarning ? "bg-amber-500 text-white" : 
            "bg-emerald-500 text-white"
          )}>
            {data.status.toUpperCase()}
          </div>
        </div>

        {/* Max Temp */}
        <div className="flex items-center gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
          <div className={cn(
            "p-2 rounded-lg",
            isCritical ? "bg-red-100 text-red-600" : 
            isWarning ? "bg-amber-100 text-amber-600" : 
            "bg-blue-100 text-blue-600"
          )}>
            <Thermometer className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-500 mb-0.5 uppercase tracking-wide">Max Temp</p>
            <p className={cn(
              "text-xl font-black tracking-tight leading-none",
              isCritical ? "text-red-600" : isWarning ? "text-amber-600" : "text-slate-800"
            )}>
              {data.maxTemp > 0 ? `${data.maxTemp.toFixed(1)}°C` : "--"}
            </p>
          </div>
        </div>

        {/* Axles Visualizer (Mini) */}
        <div>
           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Axle Status</p>
           <div className="grid grid-cols-4 gap-1.5">
              {slotNames.map(slotId => {
                const typedSlotId = slotId as keyof typeof data.axleSlots;
                const slotData = data.axleSlots[typedSlotId];
                const temp = slotData?.temperature || 0;
                const slotCrit = temp > 90 || slotData?.isCritical;
                const slotWarn = (temp > 80 && temp <= 90) || slotData?.isWarning;
                
                return (
                  <div 
                    key={slotId}
                    title={`${slotId}: ${temp > 0 ? temp.toFixed(1) + '°C' : 'No Data'}`}
                    className={cn(
                      "h-6 rounded border flex items-center justify-center text-[8px] font-bold transition-colors",
                      temp === 0 ? "bg-slate-50 border-slate-100 text-slate-300" :
                      slotCrit ? "bg-red-50 border-red-200 text-red-600" :
                      slotWarn ? "bg-amber-50 border-amber-200 text-amber-600" :
                      "bg-emerald-50 border-emerald-200 text-emerald-600"
                    )}
                  >
                    {slotId.replace('A', '')}
                  </div>
                );
              })}
           </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end pt-2 border-t border-slate-100/60">
          <div className="text-[9px] font-medium text-slate-400">
            {data.latestTimestamp ? 
              new Date(data.latestTimestamp).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute:'2-digit' }).replace(',', '')
              : 'No recent data'}
          </div>
          <div className="flex items-center text-[10px] font-bold text-blue-500 group-hover:text-blue-600 transition-colors">
            View Details <Eye className="h-3 w-3 ml-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
