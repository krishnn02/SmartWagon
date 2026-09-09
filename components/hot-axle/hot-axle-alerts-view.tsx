"use client";

import { AlertTriangle, Clock, MapPin, Gauge, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MappedCoachData, HamsData } from "@/types/hot-axle";

interface HotAxleAlertsViewProps {
  data: MappedCoachData[];
  rawHamsData?: HamsData[];
}

export function HotAxleAlertsView({ data, rawHamsData = [] }: HotAxleAlertsViewProps) {
  // Find all historical alerts in the raw database data
  // An alert is any reading > 80 degrees, or explicitly marked Critical/Warning/High
  const rawAlerts = rawHamsData.filter((reading) => {
    const temp = reading.temperature || 0;
    const isTempHigh = temp > 80;
    const isStatusAlert = 
      reading.status === "Critical" || 
      reading.status === "Warning" || 
      reading.status?.toLowerCase().includes("high");
    
    return isTempHigh || isStatusAlert;
  });

  // Sort newest first
  rawAlerts.sort((a, b) => {
    const timeA = new Date(a.created_at || a.received_timestamp || 0).getTime();
    const timeB = new Date(b.created_at || b.received_timestamp || 0).getTime();
    return timeB - timeA;
  });

  // Take the top 50 alerts to prevent UI lag
  const alerts = rawAlerts.slice(0, 50);

  const criticalCount = alerts.filter(a => (a.temperature || 0) > 90 || a.status === "Critical" || a.status?.includes("High")).length;
  const warningCount = alerts.filter(a => ((a.temperature || 0) > 80 && (a.temperature || 0) <= 90) || a.status === "Warning").length;

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-100 shadow-sm animate-in fade-in">
        <div className="h-16 w-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">No Historical Alerts</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          All axle temperatures in the database are within normal operating parameters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Summary Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-slate-900">Historical Alerts</h3>
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
          const temp = alert.temperature || 0;
          const isCritical = temp > 90 || alert.status === "Critical" || alert.status?.includes("High");
          
          // Match the sensor ID to a coach if possible
          const parentCoach = data.find(d => 
             Object.values(d.axleSlots).some(slot => slot.sensorId === alert.device_id) || 
             d.coach.device_id === alert.master_id
          );

          const coachName = parentCoach?.coach.coach_no || parentCoach?.coach.device_id || "Unknown Coach";
          const location = parentCoach?.coach.location || "On Route";
          
          // Formatting date
          let dateStr = "Unknown Date";
          if (alert.created_at || alert.received_timestamp) {
            const d = new Date(alert.created_at || alert.received_timestamp || 0);
            dateStr = d.toLocaleString('en-US', { 
              month: 'short', day: 'numeric', 
              hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
          }

          return (
            <div 
              key={alert.id}
              className={cn(
                "p-4 rounded-xl border flex gap-4 shadow-sm transition-all hover:shadow-md",
                isCritical ? "bg-red-50/40 border-red-200" : "bg-amber-50/40 border-amber-200"
              )}
            >
              <div className="shrink-0 mt-0.5">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm",
                  isCritical ? "text-red-600 shadow-red-500/20" : "text-amber-500 shadow-amber-500/20"
                )}>
                  {isCritical ? <AlertTriangle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                </div>
              </div>
              
              <div className="flex-1 space-y-1">
                <h4 className={cn(
                  "font-bold text-sm flex items-center justify-between",
                  isCritical ? "text-red-700" : "text-amber-700"
                )}>
                  <span>
                    {isCritical ? "Critical Overheat" : "Temperature Warning"}: {temp.toFixed(1)}°C
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white/60">
                    {alert.device_id}
                  </span>
                </h4>
                
                <p className={cn(
                  "text-[11px] font-medium flex items-center gap-1.5",
                  isCritical ? "text-red-600/80" : "text-amber-600/80"
                )}>
                  <Clock className="h-3 w-3" /> {dateStr}
                </p>
                
                <p className={cn(
                  "text-[11px] font-medium flex items-center gap-1.5",
                  isCritical ? "text-red-600/80" : "text-amber-600/80"
                )}>
                  <MapPin className="h-3 w-3" /> Coach {coachName} | Location: {location}
                </p>
                
                <p className={cn(
                  "text-[11px] font-bold pt-1",
                  isCritical ? "text-red-600" : "text-amber-600"
                )}>
                  {isCritical ? "⚠ Immediate inspection required!" : "⚠ Monitor closely"} 
                  {alert.status && ` (System marked: ${alert.status})`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
