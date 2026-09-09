"use client";

import { AlertTriangle, Clock, MapPin, Gauge } from "lucide-react";
import { cn, parseAndFormatIST } from "@/lib/utils";
import type { MappedCoachData } from "@/types/hot-axle";

interface HotAxleAlertsViewProps {
  data: MappedCoachData[];
}

export function HotAxleAlertsView({ data }: HotAxleAlertsViewProps) {
  // Filter for Warning and Critical only, sort by Critical first, then by maxTemp
  const alerts = data
    .filter(d => d.status === "Critical" || d.status === "Warning")
    .sort((a, b) => {
      if (a.status === "Critical" && b.status !== "Critical") return -1;
      if (b.status === "Critical" && a.status !== "Critical") return 1;
      return b.maxTemp - a.maxTemp;
    });

  const criticalCount = alerts.filter(a => a.status === "Critical").length;
  const warningCount = alerts.filter(a => a.status === "Warning").length;

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-100 shadow-sm animate-in fade-in">
        <div className="h-16 w-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">No Alerts</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          All axle temperatures are within normal operating parameters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Summary Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-slate-900">Recent Alerts</h3>
        <div className="flex gap-2">
          {criticalCount > 0 && (
            <div className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-bold">
              {criticalCount} Critical
            </div>
          )}
          {warningCount > 0 && (
            <div className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[10px] font-bold">
              {warningCount} Warning
            </div>
          )}
        </div>
      </div>

      {/* Alerts List */}
      <div className="flex flex-col gap-3">
        {alerts.map((alert) => {
          const isCritical = alert.status === "Critical";
          
          // Find the worst axle
          let worstSlot = "";
          let worstTemp = 0;
          let worstReading = null;
          
          Object.entries(alert.axleSlots).forEach(([slot, reading]) => {
            if (reading && reading.temperature > worstTemp) {
              worstTemp = reading.temperature;
              worstSlot = slot;
              worstReading = reading;
            }
          });

          // Mocking axle number
          const axleNum = worstSlot.replace(/[^0-9]/g, '').charAt(0) || "3";
          const sensorId = `AX-${alert.coach.coach_no || 'C07'}-${worstSlot}`;
          
          // Formatting date
          let dateStr = "Today, 10:39 AM";
          if (alert.latestTimestamp) {
            const d = new Date(alert.latestTimestamp);
            dateStr = `Today, ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
          }

          return (
            <div 
              key={alert.coach.id}
              className={cn(
                "p-4 rounded-xl border flex gap-4 shadow-sm",
                isCritical ? "bg-red-50/60 border-red-200" : "bg-amber-50/60 border-amber-200"
              )}
            >
              <div className="shrink-0 mt-0.5">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm",
                  isCritical ? "text-red-500 shadow-red-500/10" : "text-amber-500 shadow-amber-500/10"
                )}>
                  {isCritical ? <AlertTriangle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                </div>
              </div>
              
              <div className="flex-1 space-y-1">
                <h4 className={cn(
                  "font-bold text-sm",
                  isCritical ? "text-red-700" : "text-amber-700"
                )}>
                  {isCritical ? "Critical" : "Warning"}: Axle {axleNum} Overheat (Temp {worstTemp.toFixed(0)}°C)
                </h4>
                
                <p className={cn(
                  "text-[11px] font-medium",
                  isCritical ? "text-red-600/80" : "text-amber-600/80"
                )}>
                  Coach {alert.coach.coach_no || alert.coach.device_id} | {dateStr}
                </p>
                
                <p className={cn(
                  "text-[11px] font-medium",
                  isCritical ? "text-red-600/80" : "text-amber-600/80"
                )}>
                  Axle {axleNum} | Sensor: {sensorId} | Speed: 72 km/h
                </p>
                
                <p className={cn(
                  "text-[11px] font-bold pt-0.5",
                  isCritical ? "text-red-600" : "text-amber-600"
                )}>
                  {isCritical ? "Immediate inspection required" : "Monitor closely"} — Location: {alert.coach.location || "Near Nagda"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
