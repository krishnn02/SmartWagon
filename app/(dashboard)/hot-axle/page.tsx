"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Bell, Loader2, Sparkles, Train, Lock, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import Link from "next/link";

import type { CoachHams, HamsData, MappedCoachData, AxleReading } from "@/types/hot-axle";

import { HotAxleFilters } from "@/components/hot-axle/hot-axle-filters";
import { HotAxleCard } from "@/components/hot-axle/hot-axle-card";
import { HotAxleModal } from "@/components/hot-axle/hot-axle-modal";
import { HotAxleAlertsView } from "@/components/hot-axle/hot-axle-alerts-view";
import { AxleDigitalTwin } from "@/components/hot-axle/axle-digital-twin";

// Load chart view client-side only to prevent Recharts SSR width/height(-1) warnings
const HotAxleChartView = dynamic(
  () => import("@/components/hot-axle/hot-axle-chart-view").then((m) => ({ default: m.HotAxleChartView })),
  { ssr: false, loading: () => <div className="h-[300px] bg-slate-50 rounded-2xl animate-pulse" /> }
);

type ViewType = "Coaches" | "Axle Twin" | "Chart" | "Alerts";

export default function HotAxlePage() {
  const { user } = useAuth();
  const [viewType, setViewType] = useState<ViewType>("Coaches");
  const [selectedDevice, setSelectedDevice] = useState<MappedCoachData | null>(null);
  const [selectedTwinCoachIndex, setSelectedTwinCoachIndex] = useState<number>(0);

  const [filters, setFilters] = useState({
    trainNumber: "All",
    coachType: "All",
    uniqueId: "All",
    status: "All",
  });

  // Fetch coaches
  const { data: coaches = [], isLoading: isLoadingCoaches } = useQuery({
    queryKey: ['coaches_hams', user?.division_name],
    queryFn: async () => {
      const query = supabase.from('coaches_hams').select('*');
      const { data, error } = await query;
      if (error) throw error;
      return data as CoachHams[];
    },
    enabled: !!user,
  });

  const ALL_HAMS_SENSORS = [
    'HAMS001',
    'HAMS002',
    'HAMS003',
    'HAMS004',
    'HAMS005',
    'HAMS006',
    'HAMS007',
    'HAMS008',
    'HAMS009',
  ];

  // Fetch latest hams_data across all sensors in parallel to guarantee all 8 wheel bearings get live telemetry
  const { data: rawHamsData = [], isLoading: isLoadingData } = useQuery({
    queryKey: ['hams_data_all_axles', coaches.map(c => c.device_id).join(',')],
    queryFn: async () => {
      // 1. Fetch latest records for EACH known sensor to prevent PostgREST's 1000-row cap from omitting earlier sensors
      const sensorPromises = ALL_HAMS_SENSORS.map((devId) =>
        supabase
          .from('hams_data')
          .select('*')
          .eq('device_id', devId)
          .order('created_at', { ascending: false })
          .limit(100)
      );

      // 2. Also fetch latest overall records to capture any newly registered sensors and real-time updates
      const generalPromise = supabase
        .from('hams_data')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      const [generalRes, ...sensorResults] = await Promise.all([generalPromise, ...sensorPromises]);

      const recordMap = new Map<string | number, HamsData>();
      if (generalRes.data) {
        generalRes.data.forEach((r) => recordMap.set(r.id || `${r.device_id}-${r.created_at}`, r as HamsData));
      }
      sensorResults.forEach((res) => {
        if (res.data) {
          res.data.forEach((r) => recordMap.set(r.id || `${r.device_id}-${r.created_at}`, r as HamsData));
        }
      });

      return Array.from(recordMap.values()).sort(
        (a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
      );
    },
    enabled: !!user,
    refetchInterval: user ? 30000 : false,
  });

  const isAdmin =
    user?.role === "Administrator" ||
    user?.email?.toLowerCase() === "admin@vasp.com";

  const hasModuleAccess =
    isAdmin || user?.allowedModules?.includes("hot-axle");

  // Process data
  const mappedData = useMemo(() => {
    const result: MappedCoachData[] = [];
    let activeCoaches = [...coaches];

    // Filter coaches according to user's assigned hot-axle devices
    if (!isAdmin && user?.allowedDevices?.["hot-axle"]) {
      const allowed = user.allowedDevices["hot-axle"];
      if (!allowed.includes("ALL")) {
        activeCoaches = activeCoaches.filter(
          (c) =>
            (c.device_id && allowed.includes(c.device_id)) ||
            (c.coach_no && allowed.includes(c.coach_no)) ||
            (c.actual_id && allowed.includes(c.actual_id))
        );
      }
    }

    // If no coaches exist, but we have hams_data, generate a single fallback coach
    if (activeCoaches.length === 0 && rawHamsData.length > 0 && (isAdmin || user?.allowedDevices?.["hot-axle"]?.includes("ALL") || user?.allowedDevices?.["hot-axle"]?.includes("Raspberry_Fallback"))) {
      activeCoaches.push({
        id: 1,
        technical_id: `TECH-MASTER`,
        coach_no: `COACH-MAIN`,
        device_id: 'Raspberry_Fallback',
        train_no: 'Unknown',
        location: 'Unknown',
        actual_id: 'Raspberry_Fallback'
      });
    }

    for (const coach of activeCoaches) {
      let coachReadings = rawHamsData;
      
      if (activeCoaches.length > 1 && coach.device_id && coach.device_id !== 'Raspberry4_7' && coach.device_id !== 'Raspberry_Fallback') {
         coachReadings = rawHamsData.filter(d => d.master_id?.includes(coach.device_id || '') || d.device_id === coach.device_id);
      }

      if (coachReadings.length === 0) {
        result.push({
          coach,
          readings: [],
          maxTemp: 0,
          status: 'Good',
          axleSlots: {},
          latestTimestamp: null
        });
        continue;
      }

      // Latest reading for EACH distinct sensor (HAMS001 to HAMS009)
      const latestReadingsBySensor = new Map<string, HamsData>();
      for (const reading of coachReadings) {
        if (reading.device_id && !latestReadingsBySensor.has(reading.device_id)) {
          latestReadingsBySensor.set(reading.device_id, reading);
        }
      }

      const latestReadings = Array.from(latestReadingsBySensor.values());
      const latestTimestamp = latestReadings[0]?.created_at || latestReadings[0]?.received_timestamp || null;
      
      let maxTemp = 0;
      let hasCritical = false;
      let hasWarning = false;

      const axleSlots: Record<string, AxleReading> = {};
      const slotNames = ['A1-1', 'A1-2', 'A2-1', 'A2-2', 'A3-1', 'A3-2', 'A4-1', 'A4-2'];
      
      const sensorToSlotMap: Record<string, string> = {
        'HAMS001': 'A1-1',
        'HAMS002': 'A1-2',
        'HAMS003': 'A2-1',
        'HAMS004': 'A2-2',
        'HAMS005': 'A3-1',
        'HAMS006': 'A3-2',
        'HAMS007': 'A4-1',
        'HAMS009': 'A4-1',
        'HAMS008': 'A4-2',
      };

      slotNames.forEach(slot => {
        axleSlots[slot] = {
          sensorId: '',
          temperature: 0,
          isCritical: false,
          isWarning: false,
          timestamp: null
        };
      });

      latestReadings.forEach((reading) => {
        const deviceId = reading.device_id || '';
        const slot = sensorToSlotMap[deviceId];
        
        if (slot) {
          const temp = reading.temperature || 0;
          if (temp > maxTemp) maxTemp = temp;
          
          const isCritical = reading.status === 'Critical' || temp > 80;
          const isWarning = reading.status === 'Warning' || (temp > 65 && temp <= 80);
          
          if (isCritical) hasCritical = true;
          if (isWarning) hasWarning = true;

          const currentSlot = axleSlots[slot];
          if (
            !currentSlot.sensorId ||
            currentSlot.temperature === 0 ||
            (reading.created_at &&
              (!currentSlot.timestamp ||
                new Date(reading.created_at) > new Date(currentSlot.timestamp)))
          ) {
            axleSlots[slot] = {
              sensorId: deviceId,
              temperature: temp,
              isCritical,
              isWarning,
              timestamp: reading.created_at
            };
          }
        }
      });

      result.push({
        coach,
        readings: coachReadings,
        maxTemp,
        status: hasCritical ? 'Critical' : hasWarning ? 'Warning' : 'Good',
        axleSlots,
        latestTimestamp
      });
    }

    return result;
  }, [coaches, rawHamsData]);

  // Filter options
  const trainOptions = Array.from(new Set(mappedData.map(d => d.coach.train_no).filter(Boolean))) as string[];
  const uniqueIdOptions = Array.from(new Set(mappedData.map(d => d.coach.device_id).filter(Boolean))) as string[];
  const coachTypeOptions = ["1AC", "2AC", "3AC", "SL"]; 

  // Apply filters
  const filteredData = useMemo(() => {
    return mappedData.filter((d) => {
      const matchTrain = filters.trainNumber === "All" || d.coach.train_no === filters.trainNumber;
      const matchId = filters.uniqueId === "All" || d.coach.device_id === filters.uniqueId;
      const matchStatus = filters.status === "All" || d.status === filters.status;
      return matchTrain && matchId && matchStatus;
    });
  }, [mappedData, filters]);

  const onClearFilters = () => {
    setFilters({ trainNumber: "All", coachType: "All", uniqueId: "All", status: "All" });
  };

  const currentTwinCoach = filteredData[selectedTwinCoachIndex] || filteredData[0] || mappedData[0];

  if (!hasModuleAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm max-w-lg mx-auto my-12">
        <div className="p-4 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 mb-4">
          <Lock className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-2">
          Hot Axle Access Restricted
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Your railway personnel profile (<strong>{user?.name || user?.first_name}</strong> - {user?.role}) does not have permission to view the Hot Axle system.
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-colors flex items-center gap-2"
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Go to Brake Binding Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-6 lg:p-8 pt-6 pb-24 md:pb-8 h-full overflow-y-auto bg-slate-50 w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-slate-200 transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-800"><path d="m15 18-6-6 6-6"/></svg>
          </Link>
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
              Hot Axle Monitoring & Digital Twin
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Real-time bearing temperature telemetry & historical timeline playback
            </p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm text-xs font-semibold text-slate-500 self-start sm:self-auto">
          Last Updated: {new Date().toLocaleString()}
        </div>
      </div>
      
      {/* Top Controls Row */}
      <div className="flex flex-col xl:flex-row gap-4 mb-6">
        {/* Filters */}
        <div className="flex-grow">
          <HotAxleFilters 
            trainOptions={trainOptions}
            coachTypeOptions={coachTypeOptions}
            uniqueIdOptions={uniqueIdOptions}
            filters={filters}
            setFilters={setFilters}
            onClearFilters={onClearFilters}
          />
        </div>

        {/* Quick Actions & View Type */}
        <div className="flex flex-col sm:flex-row gap-4 shrink-0">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col justify-between w-full sm:w-auto">
            <h3 className="text-[10px] font-bold text-slate-500 mb-3 block uppercase tracking-wider">Quick Actions</h3>
            <div className="flex items-center gap-2 h-full">
              <button className="bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-colors whitespace-nowrap">
                <Bell className="h-3.5 w-3.5" /> Notify
              </button>
              <button className="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-colors whitespace-nowrap">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg> Report
              </button>
            </div>
          </div>

          {/* View Type Switcher */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col justify-between w-full sm:w-auto">
            <h3 className="text-[10px] font-bold text-slate-500 mb-3 block uppercase tracking-wider">View Mode</h3>
            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 h-full">
              {(
                [
                  { id: "Coaches", label: "Coaches", icon: Train },
                  { id: "Axle Twin", label: "Axle Twin", icon: Sparkles },
                  { id: "Chart", label: "Charts", icon: LineChart },
                  { id: "Alerts", label: "Alerts", icon: Bell },
                ] as const
              ).map((v) => (
                <button
                  key={v.id}
                  onClick={() => setViewType(v.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all border",
                    viewType === v.id
                      ? "bg-white text-blue-600 shadow-sm border-slate-200/60"
                      : "text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-100"
                  )}
                >
                  <v.icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">{v.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="w-full">
        {(isLoadingCoaches || isLoadingData) ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-blue-500" />
            <p className="text-sm font-medium">Fetching axle sensor data from database...</p>
          </div>
        ) : (
          <>
            {/* View 1: Coaches Grid */}
            {viewType === "Coaches" && (
              <div className="space-y-4">
                {/* Hot Axle 3D Digital Twin Interactive Banner */}
                <div
                  onClick={() => setViewType("Axle Twin")}
                  className="flex items-center justify-between p-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 border border-slate-700/60 rounded-2xl text-white shadow-md hover:border-blue-500/50 hover:shadow-lg transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      <Sparkles className="h-5 w-5" />
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
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="text-lg md:text-xl font-bold text-slate-900">Installed Devices & Coaches</h3>
                  <div className="bg-blue-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
                    <Train className="h-3.5 w-3.5" />
                    {filteredData.length} Coaches
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {filteredData.length > 0 ? (
                    filteredData.map((data) => (
                      <HotAxleCard 
                        key={data.coach.id} 
                        data={data} 
                        onView={() => setSelectedDevice(data)}
                      />
                    ))
                  ) : (
                    <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-slate-100 border-dashed">
                      <p className="text-slate-500 text-sm font-medium">No coaches found matching criteria.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* View 2: Axle Digital Twin with Timeline Scrubber */}
            {viewType === "Axle Twin" && currentTwinCoach && (
              <div className="space-y-5">
                {/* Coach selector if multiple coaches exist */}
                {filteredData.length > 1 && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-4">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Select Coach:
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto py-1">
                      {filteredData.map((c, idx) => (
                        <button
                          key={c.coach.id}
                          type="button"
                          onClick={() => setSelectedTwinCoachIndex(idx)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap",
                            selectedTwinCoachIndex === idx
                              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          )}
                        >
                          {c.coach.coach_no || c.coach.device_id}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <AxleDigitalTwin
                  coachData={currentTwinCoach}
                  allRawReadings={rawHamsData}
                />
              </div>
            )}

            {/* View 3: Fleet Charts */}
            {viewType === "Chart" && (
              <HotAxleChartView />
            )}

            {/* View 4: System Alerts */}
            {viewType === "Alerts" && (
              <HotAxleAlertsView data={mappedData} rawHamsData={rawHamsData} />
            )}
          </>
        )}
      </div>

      {/* Modal with Digital Twin & Timeline */}
      {selectedDevice && (
        <HotAxleModal 
          data={selectedDevice} 
          rawReadings={rawHamsData}
          onClose={() => setSelectedDevice(null)} 
        />
      )}
    </div>
  );
}
