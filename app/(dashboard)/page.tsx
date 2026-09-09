"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type {
  PneumaticStatusResponse,
  CoachByLocationResponse,
  CoachByLocationItem,
} from "@/types/pneumatic";
import { MASTER_DEVICES } from "@/lib/railway-metadata";
import { fetchPneumaticTelemetryFromSupabase } from "@/lib/pneumatic-supabase";
import { DeviceSelector } from "@/components/brake-binding/device-selector";
import { StatusCard } from "@/components/brake-binding/status-card";
import { PneumaticGauge } from "@/components/brake-binding/pneumatic-gauge";
import { PressureChart, type DurationPreset } from "@/components/brake-binding/pressure-chart";
import { DiagnosticFlags } from "@/components/brake-binding/diagnostic-flags";
import { PneumaticLog } from "@/components/brake-binding/pneumatic-log";
import { ActiveFaults } from "@/components/brake-binding/active-faults";
import { Loader2, RefreshCw, Thermometer, Lock } from "lucide-react";
import Link from "next/link";

// Fallback master devices for division assignment matching production hardware
const FALLBACK_BRAKE_DEVICES: CoachByLocationItem[] = MASTER_DEVICES.filter(
  (d) => d.category === "brake-binding"
).map((d, i) => ({
  id: i + 1,
  technical_id: d.name,
  coach_no: d.coachNo || d.name,
  device_id: d.deviceId,
  Train_no: d.trainNo || "12301",
  Location: d.divisionCode,
  Actual_id: d.name,
}));

export default function BrakeBindingPage() {
  const { user } = useAuth();
  const [userSelectedDevice, setUserSelectedDevice] = useState<string>("");
  const [duration, setDuration] = useState<DurationPreset>("15m");
  const [customRange, setCustomRange] = useState<{ start?: string; end?: string }>({});

  const isAdmin =
    user?.role === "Administrator" ||
    user?.email?.toLowerCase() === "admin@vasp.com";

  const hasModuleAccess =
    isAdmin || user?.allowedModules?.includes("brake-binding");

  // Fetch devices list from remote API with fallback
  const { data: coachesData, isLoading: coachesLoading } = useQuery<CoachByLocationResponse>({
    queryKey: ["coaches-by-location"],
    queryFn: async () => {
      try {
        const res = await apiGet<CoachByLocationResponse>("/pneumatic/coaches-by-location");
        if (res?.data && res.data.length > 0) return res;
      } catch {
        // Fall back to local master devices
      }
      return { success: true, count: FALLBACK_BRAKE_DEVICES.length, data: FALLBACK_BRAKE_DEVICES };
    },
    staleTime: 5 * 60 * 1000,
  });

  // Base list from API merged or falling back to master list if empty
  const allDevices = useMemo(() => {
    if (coachesData?.data && coachesData.data.length > 0) {
      return coachesData.data;
    }
    return FALLBACK_BRAKE_DEVICES;
  }, [coachesData]);

  // Filtered devices strictly according to user permissions
  const filteredDevices = useMemo(() => {
    if (!hasModuleAccess) return [];
    if (isAdmin) return allDevices;

    const allowed = user?.allowedDevices?.["brake-binding"] || [];
    if (allowed.includes("ALL")) return allDevices;

    return allDevices.filter((d) => {
      return (
        allowed.includes(d.device_id) ||
        allowed.includes(d.Actual_id) ||
        allowed.some((perm) => d.device_id.includes(perm) || d.Actual_id?.includes(perm))
      );
    });
  }, [allDevices, user, isAdmin, hasModuleAccess]);

  // Keep selected device synced with allowed devices
  useEffect(() => {
    if (filteredDevices.length > 0) {
      const isCurrentValid = filteredDevices.some((d) => d.device_id === userSelectedDevice);
      if (!isCurrentValid) {
        setUserSelectedDevice(filteredDevices[0].device_id);
      }
    } else {
      setUserSelectedDevice("");
    }
  }, [filteredDevices, userSelectedDevice]);

  const selectedDevice =
    userSelectedDevice ||
    filteredDevices[0]?.device_id ||
    coachesData?.data?.[0]?.device_id ||
    "";

  // Fetch pneumatic status for selected device from Supabase & API with duration filter
  const {
    data: statusData,
    isLoading: statusLoading,
    refetch,
  } = useQuery<PneumaticStatusResponse>({
    queryKey: ["pneumatic-status", selectedDevice, duration, customRange.start, customRange.end],
    queryFn: async () => {
      // Clean incorrect UTC timestamps specifically from API (commit 385f884)
      const cleanTs = (ts?: string) =>
        ts ? ts.replace("+00:00", "").replace("Z", "") : "";

      // 1. Try remote API first if valid
      try {
        const data = await apiGet<PneumaticStatusResponse>(
          "/pneumatic/status",
          selectedDevice ? { deviceId: selectedDevice } : undefined
        );

        if (data && (data.readings || data.state || data.history)) {
          if (data.lastUpdated) data.lastUpdated = cleanTs(data.lastUpdated);
          if (data.activeFaults) {
            data.activeFaults.forEach((f) => (f.timestamp = cleanTs(f.timestamp)));
          }
          if (data.history?.data) {
            data.history.data.forEach((h) => (h.timestamp = cleanTs(h.timestamp)));
          }
          if (data.recentEvents) {
            data.recentEvents.forEach((e) => (e.time = cleanTs(e.time)));
          }
          return data;
        }
      } catch {
        // Fallback to Supabase live data
      }

      // 2. Fetch live data for this specific device from Supabase
      const matchedDev = allDevices.find((d) => d.device_id === selectedDevice);
      return await fetchPneumaticTelemetryFromSupabase(
        selectedDevice,
        matchedDev,
        duration,
        customRange.start,
        customRange.end
      );
    },
    enabled: !!selectedDevice,
    refetchInterval: duration === "1m" || duration === "15m" ? 5000 : 30000,
    retry: 1,
  });

  // History for charts with deduplication from commit 385f884 & 7a9c43a
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

  const devices = filteredDevices.length > 0 ? filteredDevices : (coachesData?.data || []);
  const status = statusData;

  // If user does not have permission for Brake Binding
  if (!hasModuleAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm max-w-lg mx-auto">
        <div className="p-4 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 mb-4">
          <Lock className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-2">
          Module Access Restricted
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Your profile (<strong>{user?.name || user?.first_name}</strong> -{" "}
          {user?.role}) is scoped to {user?.division_name} and does not have
          permission to view the Brake Binding system.
        </p>
        <Link
          href="/hot-axle"
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-colors flex items-center gap-2"
        >
          <Thermometer className="h-4 w-4" />
          <span>Switch to Hot Axle Console</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Device Selector with Role-Based Scope */}
      <DeviceSelector
        devices={devices}
        selectedId={selectedDevice}
        onSelect={(d) => setUserSelectedDevice(d.device_id)}
        loading={coachesLoading}
        totalDevicesCount={allDevices.length}
        userRole={user?.role}
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
              <PneumaticGauge
                label="BRAKE PIPE (BP)"
                value={status.readings.bp}
                standard={5.0}
                color="#1A9DF8"
              />
              <PneumaticGauge
                label="FEED PIPE (FP)"
                value={status.readings.fp}
                standard={6.0}
                color="#1A9DF8"
              />
              <PneumaticGauge
                label="BRAKE CYLINDER (BC)"
                value={status.readings.bc}
                standard={0.0}
                color="#FFC107"
              />
              <PneumaticGauge
                label="CONTROL RES. (CR)"
                value={status.readings.cr}
                standard={5.0}
                color="#E91E63"
              />
            </div>
          </div>

          {/* Pressure Chart with Extended Duration & Custom Range */}
          <PressureChart
            history={historyAccum}
            duration={duration}
            customRange={customRange}
            onDurationChange={(newDuration, start, end) => {
              setDuration(newDuration);
              if (newDuration === "custom" && start) {
                setCustomRange({ start, end });
              } else {
                setCustomRange({});
              }
            }}
          />

          {/* Diagnostic Flags */}
          <DiagnosticFlags alerts={status.alerts} />

          {/* Log + Faults */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <PneumaticLog history={historyAccum} />
            <ActiveFaults faults={status.activeFaults || []} />
          </div>
        </>
      ) : (
        <div className="text-center py-20 text-slate-400 text-sm bg-white rounded-3xl border border-dashed border-slate-200">
          Select a device to view pneumatic data
        </div>
      )}
    </div>
  );
}
