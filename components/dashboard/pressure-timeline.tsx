"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { COLORS } from "@/constants";
import { BpcPressure } from "@/types/database";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

export function PressureTimeline({ dataHistory }: { dataHistory: BpcPressure[] }) {
  // Format data for recharts
  const chartData = dataHistory.map((d) => ({
    time: format(new Date(d.timestamp), "HH:mm:ss"),
    bp: d.bp,
    fp: d.fp,
    cr: d.cr,
    bc: d.bc,
  }));

  return (
    <Card className="bg-zinc-950 border-zinc-800 shadow-xl col-span-1 md:col-span-4 mt-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-zinc-100">
          Realtime Pressure Telemetry
        </CardTitle>
        <CardDescription className="text-zinc-500">
          Live monitoring of Brake Pipe, Feed Pipe, Control Reservoir, and Brake Cylinder
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full mt-4">
          <ResponsiveContainer width="100%" minHeight={400}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis 
                dataKey="time" 
                stroke="#52525b" 
                tick={{ fill: "#a1a1aa", fontSize: 12 }} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#52525b" 
                tick={{ fill: "#a1a1aa", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                domain={[0, 'dataMax + 1']}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", color: "#f4f4f5" }}
                itemStyle={{ color: "#f4f4f5" }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: "20px" }}
                iconType="circle"
              />
              <Line 
                type="monotone" 
                dataKey="bp" 
                name="Brake Pipe (BP)" 
                stroke={COLORS.bp} 
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Line 
                type="monotone" 
                dataKey="fp" 
                name="Feed Pipe (FP)" 
                stroke={COLORS.fp} 
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Line 
                type="monotone" 
                dataKey="cr" 
                name="Control Reservoir (CR)" 
                stroke={COLORS.cr} 
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Line 
                type="monotone" 
                dataKey="bc" 
                name="Brake Cylinder (BC)" 
                stroke={COLORS.bc} 
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
