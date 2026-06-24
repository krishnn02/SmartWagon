"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BpcPressure } from "@/types/database";

interface GaugeProps {
  value: number;
  max: number;
  colorFrom: string;
  colorTo: string;
  label: string;
  acronym: string;
  unit: string;
}

function CircularGauge({ value, max, colorFrom, colorTo, label, acronym, unit }: GaugeProps) {
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (240 / 360) * circumference;
  const percent = Math.min(Math.max(value / max, 0), 1);
  const valueArcLength = percent * arcLength;
  const gradientId = `gauge-grad-${acronym}`;

  // Generate tick marks
  const ticks = Array.from({ length: 5 }).map((_, i) => {
    const tickPercent = i / 4;
    const angle = tickPercent * 240;
    return (
      <line
        key={i}
        x1="134"
        y1="80"
        x2="140"
        y2="80"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-slate-300/60"
        style={{ transform: `rotate(${angle}deg)`, transformOrigin: "80px 80px" }}
      />
    );
  });

  return (
    <div className="flex flex-col items-center justify-center relative">
      <div className="text-xs md:text-sm font-extrabold text-slate-400 tracking-[0.2em] mb-2 md:mb-4 uppercase drop-shadow-sm">
        {acronym}
      </div>
      <div className="relative -mt-2 -mb-2 md:-mb-4">
        <svg 
          viewBox="0 0 160 160"
          className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 drop-shadow-md" 
          style={{ transform: "rotate(150deg)" }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colorFrom} />
              <stop offset="100%" stopColor={colorTo} />
            </linearGradient>
            <filter id={`shadow-${acronym}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.15" floodColor={colorFrom} />
            </filter>
          </defs>

          {/* Background arc */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            className="text-slate-100"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          
          {/* Ticks */}
          {ticks}

          {/* Value arc */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={`${valueArcLength} ${circumference}`}
            className="transition-all duration-1000 ease-out"
            strokeLinecap="round"
            filter={`url(#shadow-${acronym})`}
          />

          {/* Premium Needle */}
          <g
            style={{
              transform: `rotate(${percent * 240}deg)`,
              transformOrigin: "80px 80px",
            }}
            className="transition-transform duration-1000 ease-out"
          >
            {/* Soft shadow under needle */}
            <circle cx="80" cy="80" r="10" className="fill-slate-900/5" />
            {/* Tapered needle body */}
            <polygon points="80,77 80,83 124,80" className="fill-slate-700" />
            {/* Metallic center cap */}
            <circle
              cx="80"
              cy="80"
              r="6"
              stroke="currentColor"
              strokeWidth="2.5"
              fill="white"
              className="text-slate-700"
            />
            {/* Center dot colored */}
            <circle cx="80" cy="80" r="2.5" fill={colorTo} />
          </g>
        </svg>
      </div>
      <div className="flex flex-col items-center mt-2 md:mt-4 z-10">
        <div className="text-[9px] md:text-[10px] font-bold text-slate-400 tracking-[0.1em] md:tracking-[0.15em] uppercase mb-0.5 md:mb-1 whitespace-nowrap">
          {label}
        </div>
        <div className="flex items-baseline gap-1 md:gap-1.5">
          <span className="text-2xl md:text-4xl font-black tracking-tight text-slate-800">
            {value.toFixed(1)}
          </span>
          <span className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase">
            {unit}
          </span>
        </div>
      </div>
    </div>
  );
}

export function KpiCards({ data }: { data: BpcPressure | null }) {
  const defaultVal = 0.0;
  
  const cardClassName = "bg-gradient-to-b from-white to-slate-50/50 border-slate-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-[1.5rem] md:rounded-[2rem] relative group overflow-hidden";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
      <Card className={cardClassName}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#0ea5e9]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="p-4 md:pt-8 md:pb-8 relative z-10">
          <CircularGauge
            value={data?.bp ?? defaultVal}
            max={6.0}
            colorFrom="#38bdf8"
            colorTo="#0284c7"
            acronym="BP"
            label="BRAKE PIPE"
            unit="kg/cm²"
          />
        </CardContent>
      </Card>
      
      <Card className={cardClassName}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#0ea5e9]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="p-4 md:pt-8 md:pb-8 relative z-10">
          <CircularGauge
            value={data?.fp ?? defaultVal}
            max={6.0}
            colorFrom="#38bdf8"
            colorTo="#0284c7"
            acronym="FP"
            label="FEED PIPE"
            unit="kg/cm²"
          />
        </CardContent>
      </Card>
      
      <Card className={cardClassName}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#facc15]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="p-4 md:pt-8 md:pb-8 relative z-10">
          <CircularGauge
            value={data?.bc ?? defaultVal}
            max={4.0}
            colorFrom="#fde047"
            colorTo="#ca8a04"
            acronym="BC"
            label="BRAKE CYLINDER"
            unit="kg/cm²"
          />
        </CardContent>
      </Card>
      
      <Card className={cardClassName}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#f43f5e]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="p-4 md:pt-8 md:pb-8 relative z-10">
          <CircularGauge
            value={data?.cr ?? defaultVal}
            max={6.0}
            colorFrom="#fb7185"
            colorTo="#be123c"
            acronym="CR"
            label="CONTROL RES."
            unit="kg/cm²"
          />
        </CardContent>
      </Card>
    </div>
  );
}
