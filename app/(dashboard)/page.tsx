"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { PneumaticStatusResponse, CoachByLocationResponse } from "@/types/pneumatic";
import { DeviceSelector } from "@/components/brake-binding/device-selector";
import { StatusCard } from "@/components/brake-binding/status-card";
import { PneumaticGauge } from "@/components/brake-binding/pneumatic-gauge";
import { PressureChart } from "@/components/brake-binding/pressure-chart";
import { DiagnosticFlags } from "@/components/brake-binding/diagnostic-flags";
import { PneumaticLog } from "@/components/brake-binding/pneumatic-log";
import { ActiveFaults } from "@/components/brake-binding/active-faults";
import { Loader2, RefreshCw, Thermometer } from "lucide-react";
import Link from "next/link";

export default function BrakeBindingPage() {
  const [userSelectedDevice, setUserSelectedDevice] = useState<string>("");

  // Fetch devices list
  const { data: coachesData, isLoading: coachesLoading } = useQuery<CoachByLocationResponse>({
    queryKey: ["coaches-by-location"],
    queryFn: () => apiGet("/pneumatic/coaches-by-location"),
    staleTime: 5 * 60 * 1000,
  });

  const selectedDevice = userSelectedDevice || coachesData?.data?.[0]?.device_id || "";

  // Fetch pneumatic status for selected device
  const { data: statusData, isLoading: statusLoading, refetch } = useQuery<PneumaticStatusResponse>({
    queryKey: ["pneumatic-status", selectedDevice],
    queryFn: async () => {
      const data = await apiGet<PneumaticStatusResponse>("/pneumatic/status", selectedDevice ? { deviceId: selectedDevice } : undefined);
      
      // Clean incorrect UTC timestamps specifically from this API
      const cleanTs = (ts?: string) => ts ? ts.replace('+00:00', '').replace('Z', '') : '';
      
      if (data) {
        if (data.lastUpdated) data.lastUpdated = cleanTs(data.lastUpdated);
        if (data.activeFaults) {
          data.activeFaults.forEach(f => f.timestamp = cleanTs(f.timestamp));
        }
        if (data.history?.data) {
          data.history.data.forEach(h => h.timestamp = cleanTs(h.timestamp));
        }
      }
      
      return data;
    },
    enabled: !!selectedDevice,
    refetchInterval: 5000,
  });

  // History for charts
  const historyAccum = useMemo(() => {
    if (!statusData?.history?.data) return [];
    const incoming = statusData.history.data;
    const seen = new Set<string>();
    return incoming.filter((row) => {
      const key = `${row.timestamp}-${row.device_id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [statusData?.history?.data]);

  const devices = coachesData?.data || [];
  const status = statusData;

  return (
    <div className="space-y-5">
      {/* Device Selector */}
      <DeviceSelector
        devices={devices}
        selectedId={selectedDevice}
        onSelect={(d) => setUserSelectedDevice(d.device_id)}
        loading={coachesLoading}
      />

      {/* Quick Access to Hot Axle 3D Digital Twin */}
      <Link
        href="/hot-axle"
        className="flex items-center justify-between p-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 border border-slate-700/60 rounded-2xl text-white shadow-md hover:border-blue-500/50 hover:shadow-lg transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Thermometer className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold tracking-tight text-slate-100 group-hover:text-blue-300 transition-colors">
                Hot Axle 3D Digital Twin
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Interactive Axle Telemetry
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              View real-time temperatures on realistic 3D railway axles with timeline playback
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 group-hover:text-blue-300 transition-colors shrink-0">
          <span>Open Axle Twin</span>
          <span className="text-sm font-black">&rarr;</span>
        </div>
      </Link>

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
