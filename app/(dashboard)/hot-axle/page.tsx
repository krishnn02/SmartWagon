"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Thermometer, LayoutGrid, LineChart, Bell, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import Link from "next/link";

import type { CoachHams, HamsData, MappedCoachData, AxleReading } from "@/types/hot-axle";

import { HotAxleFilters } from "@/components/hot-axle/hot-axle-filters";
import { HotAxleCard } from "@/components/hot-axle/hot-axle-card";
import { HotAxleModal } from "@/components/hot-axle/hot-axle-modal";
import { HotAxleChartView } from "@/components/hot-axle/hot-axle-chart-view";
import { HotAxleAlertsView } from "@/components/hot-axle/hot-axle-alerts-view";

type ViewType = "Coaches" | "Chart" | "Alerts";

export default function HotAxlePage() {
  const { user } = useAuth();
  const [viewType, setViewType] = useState<ViewType>("Coaches");
  const [selectedDevice, setSelectedDevice] = useState<MappedCoachData | null>(null);

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
      let query = supabase.from('coaches_hams').select('*');
      
      // Filter by location based on user division if available
      // if (user?.division_name) {
      //   query = query.ilike('location', `%${user.division_name}%`);
      // }

      const { data, error } = await query;
      if (error) throw error;
      return data as CoachHams[];
    }
  });

  // Fetch latest hams_data for these coaches
  const { data: rawHamsData = [], isLoading: isLoadingData } = useQuery({
    queryKey: ['hams_data', coaches.map(c => c.device_id).join(',')],
    queryFn: async () => {
      let query = supabase
        .from('hams_data')
        .select('*')
        .order('created_at', { ascending: false });

      // Since hams_data uses HAMS00X for device_id and coaches_hams uses Raspberry4_7,
      // we cannot filter hams_data by coach device_ids directly.
      // We will just fetch the latest 5000 records overall to get the latest readings for all 8 axles.
      query = query.limit(5000);

      const { data, error } = await query;

      if (error) throw error;
      return data as HamsData[];
    },
    refetchInterval: 30000, // Refetch every 30s
  });

  // Process data
  const mappedData = useMemo(() => {
    const result: MappedCoachData[] = [];
    const activeCoaches = [...coaches];

    // If no coaches exist, but we have hams_data, generate a single fallback coach
    if (activeCoaches.length === 0 && rawHamsData.length > 0) {
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
      // In this specific system, the hams_data records have device_id like HAMS001-HAMS009
      // which actually represent the individual axle sensors, while the coach is the master Raspberry Pi.
      // So, for a coach, we want to find the latest reading for EACH unique sensor.
      // If we have multiple coaches later, we'd filter by master_id. For now, we take all relevant readings.
      
      let coachReadings = rawHamsData;
      
      // If there's a clear link like master_id matching the coach device_id, filter it:
      // (But since Raspberry4_7 doesn't match HAMS-M1-001 exactly, we'll assign all readings to this coach if it's the only one)
      if (activeCoaches.length > 1 && coach.device_id) {
         // Naive match if multiple coaches
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

      // We need the LATEST reading for EACH distinct sensor (HAMS001 to HAMS008)
      const latestReadingsBySensor = new Map<string, HamsData>();
      
      // Since rawHamsData is ordered by created_at DESC, the first time we see a device_id, it's the latest
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

      const axleSlots: any = {};
      const slotNames = ['A1-1', 'A1-2', 'A2-1', 'A2-2', 'A3-1', 'A3-2', 'A4-1', 'A4-2'];
      
      // Strict mapping of specific HAMS sensors to specific axle slots
      const sensorToSlotMap: Record<string, string> = {
        'HAMS001': 'A1-1',
        'HAMS002': 'A1-2',
        'HAMS003': 'A2-1',
        'HAMS004': 'A2-2',
        'HAMS005': 'A3-1',
        'HAMS006': 'A3-2',
        'HAMS007': 'A4-1',
        'HAMS008': 'A4-2',
      };

      // Pre-initialize all 8 slots with empty data so the UI always renders exactly 8 boxes correctly
      slotNames.forEach(slot => {
        axleSlots[slot] = {
          sensorId: null,
          temperature: 0,
          isCritical: false,
          isWarning: false
        };
      });

      // Map the available latest readings into their exact designated slots
      latestReadings.forEach((reading) => {
        const deviceId = reading.device_id || '';
        const slot = sensorToSlotMap[deviceId];
        
        // Only assign if it's one of the known sensors mapped to a slot
        if (slot) {
          const temp = reading.temperature || 0;
          if (temp > maxTemp) maxTemp = temp;
          
          const isCritical = reading.status === 'Critical' || temp > 90;
          const isWarning = reading.status === 'Warning' || (temp > 80 && temp <= 90);
          
          if (isCritical) hasCritical = true;
          if (isWarning) hasWarning = true;

          axleSlots[slot] = {
            sensorId: deviceId,
            temperature: temp,
            isCritical,
            isWarning
          };
        }
      });

      let status: 'Good' | 'Warning' | 'Critical' = 'Good';
      if (hasCritical) status = 'Critical';
      else if (hasWarning) status = 'Warning';

      result.push({
        coach,
        readings: coachReadings,
        maxTemp,
        status,
        axleSlots,
        latestTimestamp
      });
    }

    return result;
  }, [coaches, rawHamsData]);

  // Filter options
  const trainOptions = Array.from(new Set(mappedData.map(d => d.coach.train_no).filter(Boolean))) as string[];
  const uniqueIdOptions = Array.from(new Set(mappedData.map(d => d.coach.device_id).filter(Boolean))) as string[];
  // Assuming coach Type is somehow derived from coach_no or not explicitly in DB, we'll mock or leave blank
  const coachTypeOptions = ["1AC", "2AC", "3AC", "SL"]; 

  // Apply filters
  const filteredData = useMemo(() => {
    return mappedData.filter((d) => {
      const matchTrain = filters.trainNumber === "All" || d.coach.train_no === filters.trainNumber;
      const matchId = filters.uniqueId === "All" || d.coach.device_id === filters.uniqueId;
      const matchStatus = filters.status === "All" || d.status === filters.status;
      // Coach type logic skipped for brevity, matching all if not implemented
      
      return matchTrain && matchId && matchStatus;
    });
  }, [mappedData, filters]);

  const onClearFilters = () => {
    setFilters({ trainNumber: "All", coachType: "All", uniqueId: "All", status: "All" });
  };

  const criticalCount = mappedData.filter(d => d.status === 'Critical').length;
  const warningCount = mappedData.filter(d => d.status === 'Warning').length;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-6 lg:p-8 pt-6 pb-24 md:pb-8 h-full overflow-y-auto bg-slate-50 w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-slate-200 transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-800"><path d="m15 18-6-6 6-6"/></svg>
          </Link>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Hot Axle Monitoring
          </h2>
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

          {/* View Type */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col justify-between w-full sm:w-auto">
            <h3 className="text-[10px] font-bold text-slate-500 mb-3 block uppercase tracking-wider">View Type</h3>
            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 h-full">
              {(["Coaches", "Chart View", "Alerts"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setViewType(v === "Chart View" ? "Chart" : v === "Alerts" ? "Alerts" : "Coaches")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg transition-all border",
                    (viewType === "Coaches" && v === "Coaches") || 
                    (viewType === "Chart" && v === "Chart View") || 
                    (viewType === "Alerts" && v === "Alerts")
                      ? "bg-white text-blue-600 shadow-sm border-slate-200/60"
                      : "text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-100"
                  )}
                >
                  {v === "Coaches" && <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2c-3.3 0-6 2.7-6 6 0 4.2 6 12 6 12s6-7.8 6-12c0-3.3-2.7-6-6-6Zm0 8.5c-1.4 0-2.5-1.1-2.5-2.5S10.6 5.5 12 5.5s2.5 1.1 2.5 2.5S13.4 10.5 12 10.5Z"/></svg>}
                  {v === "Chart View" && <LineChart className="h-3.5 w-3.5" />}
                  {v === "Alerts" && <Bell className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{v}</span>
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
              <p className="text-sm font-medium">Fetching sensor data...</p>
            </div>
          ) : (
            <>
              {viewType === "Coaches" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg md:text-xl font-bold text-slate-900">Hot Axles</h3>
                    <div className="bg-blue-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="16" rx="2" ry="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m16 19 2 3"/><path d="M2 19h20"/></svg>
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

              {viewType === "Chart" && (
                <HotAxleChartView />
              )}

              {viewType === "Alerts" && (
                <HotAxleAlertsView data={mappedData} rawHamsData={rawHamsData} />
              )}
            </>
          )}
        </div>

      {selectedDevice && (
        <HotAxleModal 
          data={selectedDevice} 
          onClose={() => setSelectedDevice(null)} 
        />
      )}
    </div>
  );
}
