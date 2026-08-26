"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { PneumaticStatusResponse, CoachByLocationItem, CoachByLocationResponse } from "@/types/pneumatic";
import { DeviceSelector } from "@/components/brake-binding/device-selector";
import { StatusCard } from "@/components/brake-binding/status-card";
import { PneumaticGauge } from "@/components/brake-binding/pneumatic-gauge";
import { PressureChart } from "@/components/brake-binding/pressure-chart";
import { DiagnosticFlags } from "@/components/brake-binding/diagnostic-flags";
import { BrakeTimeline } from "@/components/brake-binding/brake-timeline";
import { PneumaticLog } from "@/components/brake-binding/pneumatic-log";
import { ActiveFaults } from "@/components/brake-binding/active-faults";
import { Loader2, RefreshCw } from "lucide-react";

export default function BrakeBindingPage() {
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch devices list
  const { data: coachesData, isLoading: coachesLoading } = useQuery<CoachByLocationResponse>({
    queryKey: ["coaches-by-location"],
    queryFn: () => apiGet("/pneumatic/coaches-by-location"),
    staleTime: 5 * 60 * 1000,
  });

  // Auto-select first device
  useEffect(() => {
    if (!selectedDevice && coachesData?.data?.length) {
      setSelectedDevice(coachesData.data[0].device_id);
    }
  }, [coachesData, selectedDevice]);

  // Fetch pneumatic status for selected device
  const { data: statusData, isLoading: statusLoading, refetch } = useQuery<PneumaticStatusResponse>({
    queryKey: ["pneumatic-status", selectedDevice],
    queryFn: () => apiGet("/pneumatic/status", selectedDevice ? { deviceId: selectedDevice } : undefined),
    enabled: !!selectedDevice,
    refetchInterval: 5000,
  });

  // Accumulate history for charts
  const [historyAccum, setHistoryAccum] = useState<PneumaticStatusResponse["history"]["data"]>([]);

  useEffect(() => {
    if (statusData?.history?.data) {
      setHistoryAccum((prev) => {
        const incoming = statusData.history.data;
        const merged = [...prev, ...incoming];
        const seen = new Set<string>();
        const deduped = merged.filter((row) => {
          const key = `${row.timestamp}-${row.device_id}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        return deduped.slice(-1000);
      });
    }
  }, [statusData]);

  const devices = coachesData?.data || [];
  const status = statusData;

  return (
    <div className="space-y-5">
      {/* Device Selector */}
      <DeviceSelector
        devices={devices}
        selectedId={selectedDevice}
        onSelect={(d) => setSelectedDevice(d.device_id)}
        loading={coachesLoading}
      />

      {statusLoading && !status ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-sm text-slate-500">Loading pneumatic data...</span>
        </div>
      ) : status ? (
        <>
          {/* Status Card */}
          <StatusCard
            state={status.state}
            brakeStatus={status.brakeStatus}
            lastUpdated={status.lastUpdated}
            readings={status.readings}
          />

          {/* Pneumatic Gauges */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Pneumatic Gauges</h3>
              <button
                onClick={() => refetch()}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-600 transition-colors"
              >
                <RefreshCw className="h-3 w-3" /> Refresh
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <PneumaticGauge label="BRAKE PIPE (BP)" value={status.readings.bp} standard={5.0} color="#1A9DF8" />
              <PneumaticGauge label="FEED PIPE (FP)" value={status.readings.fp} standard={6.0} color="#1A9DF8" />
              <PneumaticGauge label="BRAKE CYLINDER (BC)" value={status.readings.bc} standard={0.0} color="#FFC107" />
              <PneumaticGauge label="CONTROL RES. (CR)" value={status.readings.cr} standard={5.0} color="#E91E63" />
            </div>
          </div>

          {/* Pressure Chart */}
          <PressureChart history={historyAccum} />

          {/* Diagnostic Flags */}
          <DiagnosticFlags alerts={status.alerts} />

          {/* BC Over Time + Timeline */}
          <BrakeTimeline history={historyAccum} />

          {/* Log + Faults */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <PneumaticLog history={historyAccum} />
            <ActiveFaults faults={status.activeFaults || []} />
          </div>
        </>
      ) : (
        <div className="text-center py-20 text-slate-400 text-sm">
          Select a device to view pneumatic data
        </div>
      )}
    </div>
  );
}
