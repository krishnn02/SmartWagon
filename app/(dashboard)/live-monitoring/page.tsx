"use client";

import { useEffect, useState } from "react";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { PressureTimeline } from "@/components/dashboard/pressure-timeline";
import { useRealtimeTelemetry } from "@/hooks/useRealtimeTelemetry";
import { usePressureHistory } from "@/services/queries";
import { BpcPressure } from "@/types/database";

export default function LiveMonitoringPage() {
  const { latestData, isConnected } = useRealtimeTelemetry();
  const { data: initialHistory } = usePressureHistory(30);
  const [history, setHistory] = useState<BpcPressure[]>([]);

  useEffect(() => {
    if (initialHistory && history.length === 0) {
      setHistory([...initialHistory].reverse());
    }
  }, [initialHistory, history.length]);

  useEffect(() => {
    if (latestData) {
      setHistory((prev) => {
        if (prev.length > 0 && prev[prev.length - 1].timestamp === latestData.timestamp) return prev;
        const newHistory = [...prev, latestData];
        if (newHistory.length > 50) return newHistory.slice(newHistory.length - 50);
        return newHistory;
      });
    }
  }, [latestData]);

  const currentData = latestData || (history.length > 0 ? history[history.length - 1] : null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
          </span>
          Live Monitoring
        </h1>
      </div>

      <KpiCards data={currentData} />
      <PressureTimeline dataHistory={history} />
    </div>
  );
}
