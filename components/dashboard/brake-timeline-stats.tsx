"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatISTTime } from "@/lib/utils/time";
import { BpcPressure } from "@/types/database";
import { Activity, Gauge, Clock, Power } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isApplied = data.state === 1;
    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 p-4 rounded-2xl shadow-2xl flex flex-col gap-2 min-w-[140px] transform transition-all duration-200">
        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">{data.time}</span>
        <div className="flex items-center gap-3 mt-1">
          <div className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isApplied ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isApplied ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
          </div>
          <span className={`font-black text-base tracking-wide ${isApplied ? 'text-amber-400' : 'text-emerald-400'}`}>
            {data.status}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export function BrakeTimelineStats({ dataHistory }: { dataHistory: BpcPressure[] }) {
  // Map data to binary states for the step chart
  const chartData = dataHistory.map((d) => ({
    time: formatISTTime(d.timestamp),
    state: d.brake_status === "Brake Applied" ? 1 : 0,
    status: d.brake_status || "Unknown"
  }));

  // Calculate premium statistics
  let totalEngagements = 0;
  let totalAppliedTicks = 0;
  
  for (let i = 0; i < chartData.length; i++) {
    if (chartData[i].state === 1) totalAppliedTicks++;
    if (i > 0 && chartData[i].state === 1 && chartData[i - 1].state === 0) {
      totalEngagements++;
    }
  }

  const currentState = chartData.length > 0 ? chartData[chartData.length - 1] : null;
  const isCurrentlyApplied = currentState?.state === 1;

  return (
    <Card className="bg-white border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] w-full mt-6 overflow-hidden">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100/60 pb-6 pt-8 px-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg shadow-orange-200/50">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-black text-slate-800">
              Brake State Timeline
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium mt-1 text-base">
              Real-time square-wave telemetry and engagement statistics
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-8">
        {chartData.length > 0 ? (
          <div className="flex flex-col gap-8">
            {/* Premium Mini-KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100 flex items-center gap-4 hover:bg-slate-100/80 transition-colors">
                <div className={`p-3 rounded-xl ${isCurrentlyApplied ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  <Power className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Current State</div>
                  <div className={`text-xl font-black ${isCurrentlyApplied ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {currentState?.status || "Unknown"}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100 flex items-center gap-4 hover:bg-slate-100/80 transition-colors">
                <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                  <Gauge className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Engagements</div>
                  <div className="text-xl font-black text-slate-700">
                    {totalEngagements} <span className="text-sm font-semibold text-slate-400">times</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100 flex items-center gap-4 hover:bg-slate-100/80 transition-colors">
                <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Time Applied</div>
                  <div className="text-xl font-black text-slate-700">
                    {totalAppliedTicks} <span className="text-sm font-semibold text-slate-400">ticks</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Glowing Step Chart */}
            <div className="h-[280px] w-full relative min-w-[300px]">
              <ResponsiveContainer width="99%" height={280} minWidth={1} minHeight={1}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 10, bottom: 0 }}
                >
                  <defs>
                    {/* Vibrant Glow Filter */}
                    <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    
                    {/* Rich Multi-stop Gradient */}
                    <linearGradient id="colorState" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.6}/>
                      <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.2}/>
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  
                  <CartesianGrid strokeDasharray="6 6" stroke="#f1f5f9" vertical={false} />
                  
                  <XAxis 
                    dataKey="time" 
                    stroke="#94a3b8" 
                    tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }} 
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    domain={[0, 1.2]} 
                    ticks={[0, 1]}
                    width={70}
                    tickFormatter={(val) => val === 1 ? 'Applied' : 'Released'}
                    stroke="#94a3b8" 
                    tick={{ fill: "#64748b", fontSize: 13, fontWeight: 800 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    content={<CustomTooltip />} 
                    cursor={{ stroke: '#cbd5e1', strokeWidth: 2, strokeDasharray: '4 4' }} 
                  />
                  
                  <Area 
                    type="stepAfter" 
                    dataKey="state" 
                    stroke="#f59e0b" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorState)"
                    isAnimationActive={false}
                    activeDot={{ r: 8, strokeWidth: 0, fill: "#f59e0b", filter: "url(#neonGlow)" }}
                    style={{ filter: "url(#neonGlow)" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
            <div className="p-4 bg-slate-100 rounded-full mb-4">
              <Activity className="w-10 h-10 text-slate-300" />
            </div>
            <span className="font-bold text-lg text-slate-500">Waiting for real-time telemetry...</span>
            <span className="text-sm mt-1">The system will chart brake states once data arrives.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
