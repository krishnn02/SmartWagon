"use client";

import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

// Mock data generator for the chart based on timeframe
const generateChartData = (days: number) => {
  const data = [];
  const now = new Date();
  
  // Generating points. If live (days=0.1), generate every 5 mins for last 2 hours.
  // Else generate daily/hourly averages.
  const points = days <= 1 ? 24 : days; 
  
  for (let i = points; i >= 0; i--) {
    const time = new Date(now.getTime() - i * (days <= 1 ? 3600000 : 86400000));
    data.push({
      time: days <= 1 ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : time.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      'Max Temp': 60 + Math.random() * 25 + (Math.random() > 0.9 ? 10 : 0), // Occasional spikes
      'Avg Temp': 55 + Math.random() * 15,
    });
  }
  return data;
};

export function HotAxleChartView() {
  const [timeframe, setTimeframe] = useState<"Live" | "7D" | "15D" | "30D">("Live");
  
  const chartData = generateChartData(
    timeframe === "Live" ? 1 : timeframe === "7D" ? 7 : timeframe === "15D" ? 15 : 30
  );

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Temperature Trends</h3>
          <p className="text-xs text-slate-500 mt-1">Fleet-wide maximum vs average axle temperatures</p>
        </div>

        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 w-fit">
          {(["Live", "7D", "15D", "30D"] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                timeframe === tf
                  ? "bg-white text-blue-600 shadow-sm border border-slate-200"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {tf === "Live" ? "Live" : tf === "7D" ? "7 Days" : tf === "15D" ? "15 Days" : "30 Days"}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorMaxTemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#94a3b8' }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              domain={[0, 120]}
            />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ fontSize: '12px', fontWeight: 600 }}
              labelStyle={{ fontSize: '10px', color: '#64748b', marginBottom: '4px' }}
            />
            <Legend 
              content={() => (
                <div className="flex justify-center gap-4 text-[11px] font-medium pt-5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Critical Temp (&gt;90°C)
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Warning Temp (80-90°C)
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Normal Temp (&lt;80°C)
                  </div>
                </div>
              )}
            />
            
            <Area 
              type="monotone" 
              dataKey="Max Temp" 
              stroke="#3b82f6" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorMaxTemp)" 
              activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
        <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-[11px] text-blue-700 leading-relaxed">
          The chart displays the highest single axle temperature recorded across the selected fleet compared to the average. Sustained spikes in Max Temp often precede critical alerts.
        </p>
      </div>
    </div>
  );
}
