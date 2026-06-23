"use client";

import { useEffect, useState } from "react";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { StatusPanel } from "@/components/dashboard/status-panel";
import { PressureTimeline } from "@/components/dashboard/pressure-timeline";
import { useRealtimeTelemetry } from "@/hooks/useRealtimeTelemetry";
import { usePressureHistory } from "@/services/queries";
import { BpcPressure } from "@/types/database";

export default function Dashboard() {
  const { latestData, isConnected, isMockMode } = useRealtimeTelemetry();
  const { data: initialHistory } = usePressureHistory(30);
  const [history, setHistory] = useState<BpcPressure[]>([]);

  // Load initial historical data into the chart
  useEffect(() => {
    if (initialHistory && history.length === 0) {
      // reverse it because the query returns descending (newest first), but timeline goes left to right
      setHistory([...initialHistory].reverse());
    }
  }, [initialHistory, history.length]);

  // Append new real-time data
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
        <h1 className="text-2xl font-bold tracking-tight text-white">Overview</h1>
        <div className="flex items-center gap-2">
          {isMockMode && (
            <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-500 rounded border border-amber-500/30">
              Mock Data Mode
            </span>
          )}
          <span className={`text-xs px-2 py-1 rounded border ${isConnected ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' : 'bg-red-500/20 text-red-500 border-red-500/30'}`}>
            {isConnected ? "DB Connected" : "DB Disconnected"}
          </span>
        </div>
      </div>

      <KpiCards data={currentData} />
      <StatusPanel data={currentData} />
      <PressureTimeline dataHistory={history} />
    </div>
  );
}
