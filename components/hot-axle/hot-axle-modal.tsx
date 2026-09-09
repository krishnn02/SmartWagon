"use client";

import { X, Battery, Activity, Info, Thermometer } from "lucide-react";
import { cn, parseAndFormatIST } from "@/lib/utils";
import type { MappedCoachData, AxleReading } from "@/types/hot-axle";

interface HotAxleModalProps {
  data: MappedCoachData;
  onClose: () => void;
}

export function HotAxleModal({ data, onClose }: HotAxleModalProps) {
  const isCritical = data.status === "Critical";
  const isWarning = data.status === "Warning";
  
  // Extract latest battery voltage from the readings
  const latestBattery = data.readings.length > 0 ? data.readings[0].battery_voltage : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div 
        className={cn(
          "bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-3xl sm:max-w-md shadow-2xl overflow-y-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col",
          isCritical ? "border-red-200" : isWarning ? "border-amber-200" : "border-slate-200"
        )}
      >
        {/* Header */}
        <div className={cn(
          "px-6 py-4 flex items-center justify-center sticky top-0 z-10 rounded-t-3xl sm:rounded-t-3xl",
          isCritical ? "bg-red-50 text-red-600" : isWarning ? "bg-amber-50 text-amber-600" : "bg-[#f2f8f4] text-[#347d4e]"
        )}>
          <h2 className="font-bold text-lg">
            {isCritical ? "High Temperature Alert" : isWarning ? "High Temperature Warning" : "Hot Axle Status"}
          </h2>
        </div>

        <div className="p-6 flex-1 flex flex-col">
          {/* Critical Coach Info (Only shown if critical or warning per screenshots) */}
          {(isCritical || isWarning) && (
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-xl bg-red-50 text-red-500",
                  isWarning && "bg-amber-50 text-amber-500"
                )}>
                  <Thermometer className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-blue-500">{data.coach.coach_no || data.coach.device_id}</h3>
              </div>
              <div className={cn(
                "px-2.5 py-1 text-[10px] font-bold rounded-md tracking-wider flex items-center gap-1",
                isCritical ? "bg-red-50 text-red-600 border border-red-100" : "bg-amber-50 text-amber-600 border border-amber-100"
              )}>
                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                {data.status.toUpperCase()}
              </div>
            </div>
          )}

          {/* Metadata */}
          <h3 className="text-sm font-bold text-slate-700 mb-3">Metadata</h3>
          <div className="border border-slate-200 rounded-2xl overflow-hidden mb-6">
            <MetadataRow label="Device ID" value={data.coach.device_id || "N/A"} />
            <MetadataRow label="Train No" value={data.coach.train_no || "N/A"} />
            <MetadataRow label="Coach Type" value="1AC" />
            <MetadataRow label="Railway" value={data.coach.location || "NR"} />
            <MetadataRow label="Battery" value={latestBattery ? `${latestBattery.toFixed(0)}%` : "90%"} />
            <MetadataRow label="Signal" value="-78 dBm" />
            <MetadataRow 
              label="Timestamp" 
              value={data.latestTimestamp ? new Date(data.latestTimestamp).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute:'2-digit', second:'2-digit' }).replace(',', '') : "N/A"} 
              isLast 
            />
          </div>

          <h3 className="text-sm font-bold text-slate-700 mb-3">Axle Temperatures (°C)</h3>
          
          {/* Axle Grid */}
          <div className="grid grid-cols-2 gap-3 border border-slate-100 bg-slate-50 p-3 sm:p-4 rounded-2xl mb-8">
            {(['A1-1', 'A1-2', 'A2-1', 'A2-2', 'A3-1', 'A3-2', 'A4-1', 'A4-2'] as const).map(slot => (
              <AxleReadingBox key={slot} slot={slot} reading={data.axleSlots[slot]} />
            ))}
          </div>

          {/* Close Button */}
          <div className="mt-auto pt-4 pb-2">
            <button 
              onClick={onClose}
              className="w-full py-3.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetadataRow({ label, value, isLast }: { label: string, value: string, isLast?: boolean }) {
  return (
    <div className={cn(
      "flex justify-between items-center px-4 py-3 bg-white",
      !isLast && "border-b border-slate-200"
    )}>
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-800">{value}</span>
    </div>
  );
}

function AxleReadingBox({ slot, reading }: { slot: string, reading?: AxleReading }) {
  if (!reading) {
    return (
      <div className="bg-slate-100 rounded-xl p-3 sm:p-4 flex justify-between items-center opacity-60">
        <span className="text-xs sm:text-sm font-medium text-slate-600">{slot}</span>
        <span className="text-sm sm:text-base font-bold text-slate-400">--</span>
      </div>
    );
  }

  const { temperature, isCritical, isWarning } = reading;

  return (
    <div className={cn(
      "rounded-xl p-3 sm:p-4 flex justify-between items-center transition-all",
      isCritical ? "bg-red-50" : isWarning ? "bg-amber-50" : "bg-white"
    )}>
      <span className={cn(
        "text-xs sm:text-sm font-medium",
        isCritical ? "text-red-800" : isWarning ? "text-amber-800" : "text-slate-600"
      )}>{slot}</span>
      
      <span className={cn(
        "text-sm sm:text-base font-black",
        isCritical ? "text-red-600" : isWarning ? "text-amber-600" : "text-slate-900"
      )}>
        {temperature.toFixed(1)}°
      </span>
    </div>
  );
}
