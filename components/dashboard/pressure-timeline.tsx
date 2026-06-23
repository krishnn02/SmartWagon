"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { COLORS } from "@/constants";
import { BpcPressure } from "@/types/database";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatISTTime } from "@/lib/utils/time";

export function PressureTimeline({ dataHistory }: { dataHistory: BpcPressure[] }) {
  // Format data for recharts
  const chartData = dataHistory.map((d) => ({
    time: formatISTTime(d.timestamp),
    bp: d.bp,
    fp: d.fp,
    cr: d.cr,
    bc: d.bc,
  }));

  return (
    <Card className="bg-card border-slate-200/60 shadow-sm hover:shadow-md transition-shadow col-span-1 md:col-span-4 mt-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-card-foreground">
          Realtime Pressure Telemetry
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Live monitoring of Brake Pipe, Feed Pipe, Control Reservoir, and Brake Cylinder
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full mt-4 min-w-[300px]">
          <ResponsiveContainer width="99%" height={400} minWidth={1}>
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorBp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.bp} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={COLORS.bp} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorFp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.fp} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={COLORS.fp} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.cr} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={COLORS.cr} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorBc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.bc} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={COLORS.bc} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis 
                dataKey="time" 
                stroke="var(--color-muted-foreground)" 
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="var(--color-muted-foreground)" 
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                domain={[0, 'dataMax + 1']}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-card-foreground)" }}
                itemStyle={{ color: "var(--color-card-foreground)" }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: "20px" }}
                iconType="circle"
              />
              <Area 
                type="monotone" 
                dataKey="bp" 
                name="Brake Pipe (BP)" 
                stroke={COLORS.bp} 
                fillOpacity={1} 
                fill="url(#colorBp)"
                strokeWidth={3}
                dot={false}
                isAnimationActive={false}
              />
              <Area 
                type="monotone" 
                dataKey="fp" 
                name="Feed Pipe (FP)" 
                stroke={COLORS.fp} 
                fillOpacity={1} 
                fill="url(#colorFp)"
                strokeWidth={3}
                dot={false}
                isAnimationActive={false}
              />
              <Area 
                type="monotone" 
                dataKey="cr" 
                name="Control Reservoir (CR)" 
                stroke={COLORS.cr} 
                fillOpacity={1} 
                fill="url(#colorCr)"
                strokeWidth={3}
                dot={false}
                isAnimationActive={false}
              />
              <Area 
                type="monotone" 
                dataKey="bc" 
                name="Brake Cylinder (BC)" 
                stroke={COLORS.bc} 
                fillOpacity={1} 
                fill="url(#colorBc)"
                strokeWidth={3}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
