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
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      let query = supabase
        .from('hams_data')
        .select('*')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false });

      // If we have specific coaches, filter by them. Otherwise, just fetch recent rows.
      if (coaches.length > 0) {
        const deviceIds = coaches.map(c => c.device_id).filter(Boolean);
        if (deviceIds.length > 0) {
          query = query.in('device_id', deviceIds);
        }
      } else {
        // Limit to 1000 so we don't fetch everything if coaches is empty
        query = query.limit(1000);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as HamsData[];
    },
    refetchInterval: 30000, // Refetch every 30s
  });

  // Process data
  const mappedData = useMemo(() => {
    let activeCoaches = [...coaches];
    let activeRawData = [...rawHamsData];

    const result: MappedCoachData[] = [];

    // Find all unique device_ids in activeRawData
    const allDeviceIds = Array.from(new Set(activeRawData.map(d => d.device_id).filter(Boolean))) as string[];

    // Ensure every device_id in hams_data has a corresponding coach record
    allDeviceIds.forEach(deviceId => {
      if (!activeCoaches.find(c => c.device_id === deviceId)) {
        activeCoaches.push({
          id: Math.random(),
          technical_id: `TECH-${deviceId}`,
          coach_no: `COACH-${deviceId}`,
          device_id: deviceId,
          train_no: 'Unknown',
          location: 'Unknown',
          actual_id: deviceId
        });
      }
    });

    for (const coach of activeCoaches) {
      if (!coach.device_id) continue;

      // Get readings for this coach
      const coachReadings = activeRawData.filter(d => d.device_id === coach.device_id);
      
      // Get the most recent timestamp to group by
      if (coachReadings.length === 0) {
        // Only push if it was an original coach
        if (coaches.find(c => c.id === coach.id)) {
          result.push({
            coach,
            readings: [],
            maxTemp: 0,
            status: 'Good',
            axleSlots: {},
            latestTimestamp: null
          });
        }
        continue;
      }

      const latestTimestamp = coachReadings[0].created_at || coachReadings[0].received_timestamp;
      
      const latest8 = coachReadings.slice(0, 8);
      
      let maxTemp = 0;
      let hasCritical = false;
      let hasWarning = false;

      const axleSlots: any = {};
      const slotNames = ['A1-1', 'A1-2', 'A2-1', 'A2-2', 'A3-1', 'A3-2', 'A4-1', 'A4-2'];

      latest8.forEach((reading, idx) => {
        const temp = reading.temperature || 0;
        if (temp > maxTemp) maxTemp = temp;
        
        const isCritical = reading.status === 'Critical' || temp > 90;
        const isWarning = reading.status === 'Warning' || (temp > 80 && temp <= 90);
        
        if (isCritical) hasCritical = true;
        if (isWarning) hasWarning = true;

        const slot = slotNames[idx] || `Extra-${idx}`;
        axleSlots[slot] = {
          sensorId: slot,
          temperature: temp,
          isCritical,
          isWarning
        };
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
      
      <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {/* Left Column (Filters & Actions) */}
        <div className="lg:col-span-1 xl:col-span-1 space-y-4">
          <HotAxleFilters 
            trainOptions={trainOptions}
            coachTypeOptions={coachTypeOptions}
            uniqueIdOptions={uniqueIdOptions}
            filters={filters}
            setFilters={setFilters}
            onClearFilters={onClearFilters}
          />

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <h3 className="text-sm font-bold text-slate-800 mb-3">Quick Actions</h3>
            <div className="flex items-center gap-2">
              <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold shadow-sm transition-colors">
                <Bell className="h-3.5 w-3.5" /> Send Alerts
              </button>
              <button className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold shadow-sm transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg> Generate Report
              </button>
              <button className="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 p-2 rounded-xl shadow-sm transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              </button>
            </div>
          </div>

          {/* View Type */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sticky top-4">
            <h3 className="text-sm font-bold text-slate-800 mb-3">View Type</h3>
            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-2">
              {(["Coaches", "Chart View", "Alerts"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setViewType(v === "Chart View" ? "Chart" : v === "Alerts" ? "Alerts" : "Coaches")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all border",
                    (viewType === "Coaches" && v === "Coaches") || 
                    (viewType === "Chart" && v === "Chart View") || 
                    (viewType === "Alerts" && v === "Alerts")
                      ? "bg-blue-500 text-white border-blue-600 shadow-sm"
                      : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  {v === "Coaches" && <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2c-3.3 0-6 2.7-6 6 0 4.2 6 12 6 12s6-7.8 6-12c0-3.3-2.7-6-6-6Zm0 8.5c-1.4 0-2.5-1.1-2.5-2.5S10.6 5.5 12 5.5s2.5 1.1 2.5 2.5S13.4 10.5 12 10.5Z"/></svg>}
                  {v === "Chart View" && <LineChart className="h-3.5 w-3.5" />}
                  {v === "Alerts" && <Bell className="h-3.5 w-3.5" />}
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Content) */}
        <div className="lg:col-span-3 xl:col-span-4 min-w-0">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
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
                <HotAxleAlertsView data={mappedData} />
              )}
            </>
          )}
        </div>
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
