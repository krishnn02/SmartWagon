"use client";

import { useMemo } from "react";
import { usePressureHistory, useBrakeFaults } from "@/services/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Activity, ShieldAlert } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const BAR_COLORS = [
  "#38bdf8", // light blue
  "#f43f5e", // rose
  "#facc15", // yellow
  "#34d399", // emerald
  "#a78bfa", // purple
  "#f472b6", // pink
];

// Custom Tooltip for Bar Chart
const CustomBarTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 p-3 rounded-xl shadow-xl flex flex-col gap-1">
        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{payload[0].payload.name}</span>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].fill }} />
          <span className="text-white font-bold text-lg">{payload[0].value} occurrences</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const { data: history, isLoading: isHistoryLoading } = usePressureHistory(1000);
  const { data: faults, isLoading: isFaultsLoading } = useBrakeFaults();

  const isLoading = isHistoryLoading || isFaultsLoading;

  // Process data for charts
  const { faultData, totalApplications, totalReleases, totalFaults } = useMemo(() => {
    let appCount = 0;
    let relCount = 0;

    // Process history for status counts
    (history || []).forEach((h) => {
      if (h.brake_status === "Brake Applied") appCount++;
      if (h.brake_status === "Brake Released") relCount++;
    });

    // Process faults
    const faultCounts = (faults || []).reduce((acc, curr) => {
      if (curr.fault_name && curr.fault_name !== "None") {
        acc[curr.fault_name] = (acc[curr.fault_name] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const fData = Object.entries(faultCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return {
      faultData: fData,
      totalApplications: appCount,
      totalReleases: relCount,
      totalFaults: fData.reduce((sum, item) => sum + item.value, 0),
    };
  }, [history, faults]);

  return (
    <div className="space-y-6 pb-12 font-sans">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight text-slate-800 flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          Analytics Dashboard
        </h1>
      </div>

      {isLoading ? (
        <div className="text-slate-400 font-medium animate-pulse flex items-center gap-3 mt-8">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-purple-500 rounded-full animate-spin" />
          Loading complex analytics...
        </div>
      ) : (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="bg-white border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="pt-8 pb-8 flex items-center gap-5 relative z-10">
                <div className="p-4 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl shadow-lg shadow-amber-200/50">
                  <Activity className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Brake Applications</div>
                  <div className="text-4xl font-black text-slate-800">{totalApplications}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="pt-8 pb-8 flex items-center gap-5 relative z-10">
                <div className="p-4 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-2xl shadow-lg shadow-emerald-200/50">
                  <Activity className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Brake Releases</div>
                  <div className="text-4xl font-black text-slate-800">{totalReleases}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="pt-8 pb-8 flex items-center gap-5 relative z-10">
                <div className="p-4 bg-gradient-to-br from-rose-400 to-rose-500 rounded-2xl shadow-lg shadow-rose-200/50">
                  <ShieldAlert className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Faults</div>
                  <div className="text-4xl font-black text-slate-800">{totalFaults}</div>
                </div>
              </CardContent>
            </Card>
          </div>


          {/* Charts Row */}
          <div className="grid grid-cols-1 gap-6 mt-6">
            
            {/* Fault Distribution Bar Chart */}
            <Card className="bg-white border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] overflow-hidden flex flex-col">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100/60 pb-6 pt-8 px-8">
                <CardTitle className="text-xl font-bold text-slate-800">Fault Distribution</CardTitle>
                <p className="text-sm text-slate-400 font-medium mt-1">Frequency of specific fault occurrences</p>
              </CardHeader>
              <CardContent className="p-8">
                <div className="h-[320px] w-full relative min-w-[300px]">
                  {faultData.length > 0 ? (
                    <ResponsiveContainer width="99%" height={320} minWidth={1} minHeight={1}>
                      <BarChart data={faultData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="#f1f5f9" />
                        <XAxis 
                          type="number" 
                          tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 600 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          width={120}
                          tick={{ fontSize: 12, fill: "#64748b", fontWeight: 700 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#f8fafc' }} />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>
                          {faultData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <ShieldAlert className="w-12 h-12 mb-3 text-slate-200" />
                      <div className="font-semibold text-lg">No faults recorded</div>
                      <div className="text-sm mt-1">The system is running perfectly</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>


          </div>
        </>
      )}
    </div>
  );
}
