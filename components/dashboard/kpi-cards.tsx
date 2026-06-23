"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { COLORS } from "@/constants";
import { BpcPressure } from "@/types/database";

interface GaugeProps {
  value: number;
  max: number;
  color: string;
  label: string;
  unit: string;
}

function CircularGauge({ value, max, color, label, unit }: GaugeProps) {
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.min(Math.max(value / max, 0), 1);
  const strokeDashoffset = circumference - percent * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative">
      <svg className="w-48 h-48 transform -rotate-90 drop-shadow-sm">
        <circle
          cx="96"
          cy="96"
          r={radius}
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          className="text-slate-100"
        />
        <circle
          cx="96"
          cy="96"
          r={radius}
          stroke={color}
          strokeWidth="12"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-4xl font-black tracking-tighter" style={{ color }}>
          {value.toFixed(2)}
        </span>
        <span className="text-sm font-medium text-muted-foreground mt-2">{unit}</span>
      </div>
      <div className="mt-6 font-medium text-foreground tracking-wide">{label}</div>
    </div>
  );
}

export function KpiCards({ data }: { data: BpcPressure | null }) {
  const defaultVal = 0.0;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="bg-card border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <CircularGauge
            value={data?.bp ?? defaultVal}
            max={6.0}
            color={COLORS.bp}
            label="Brake Pipe (BP)"
            unit="kg/cm²"
          />
        </CardContent>
      </Card>
      <Card className="bg-card border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <CircularGauge
            value={data?.fp ?? defaultVal}
            max={6.0}
            color={COLORS.fp}
            label="Feed Pipe (FP)"
            unit="kg/cm²"
          />
        </CardContent>
      </Card>
      <Card className="bg-card border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <CircularGauge
            value={data?.cr ?? defaultVal}
            max={6.0}
            color={COLORS.cr}
            label="Control Reservoir (CR)"
            unit="kg/cm²"
          />
        </CardContent>
      </Card>
      <Card className="bg-card border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <CircularGauge
            value={data?.bc ?? defaultVal}
            max={4.0}
            color={COLORS.bc}
            label="Brake Cylinder (BC)"
            unit="kg/cm²"
          />
        </CardContent>
      </Card>
    </div>
  );
}
