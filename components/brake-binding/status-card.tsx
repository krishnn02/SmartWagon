"use client";

import { cn, parseAndFormatIST } from "@/lib/utils";

interface StatusCardProps {
  state: string;
  brakeStatus: string;
  lastUpdated: string;
  readings: {
    appliedTime: number;
    releasedTime: number;
    brakeDuration: number;
    dropRate: string;
  };
}

const stateColors: Record<string, { bg: string; text: string }> = {
  Normal: { bg: "from-emerald-600 to-emerald-700", text: "text-white" },
  IDLE: { bg: "from-teal-600 to-teal-700", text: "text-white" },
  "SYSTEM PROGRESS": { bg: "from-blue-600 to-blue-700", text: "text-white" },
  SERVICE: { bg: "from-yellow-500 to-yellow-600", text: "text-white" },
  "FULL SERVICE": { bg: "from-orange-500 to-orange-600", text: "text-white" },
  "SYSTEM ISOLATED": { bg: "from-purple-500 to-purple-600", text: "text-white" },
  ISOLATED: { bg: "from-purple-700 to-purple-800", text: "text-white" },
  "Sensor Offline": { bg: "from-slate-500 to-slate-600", text: "text-white" },
};

function getStateStyle(state: string) {
  for (const [key, val] of Object.entries(stateColors)) {
    if (state.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return { bg: "from-emerald-600 to-emerald-700", text: "text-white" };
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function StatusCard({ state, brakeStatus, lastUpdated, readings }: StatusCardProps) {
  // Sanitize: "air leakage and brake binding these two statuses must not be shown at any level in any console for brake binding"
  let cleanState = state || "Normal";
  const lower = cleanState.toLowerCase();
  if (lower.includes("binding") || lower.includes("leakage")) {
    cleanState = "Normal";
  }

  let cleanBrakeStatus = brakeStatus || "RELEASED";
  if (cleanBrakeStatus.toLowerCase().includes("binding") || cleanBrakeStatus.toLowerCase().includes("leak")) {
    cleanBrakeStatus = "RELEASED";
  }

  const colors = getStateStyle(cleanState);

  return (
    <div className={cn("bg-gradient-to-r rounded-2xl p-5 shadow-lg", colors.bg)}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-white/70 uppercase tracking-wider mb-1">System Status</p>
          <h2 className={cn("text-xl md:text-2xl font-extrabold uppercase tracking-widest", colors.text)}>
            {cleanState}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-white/60">Brake:</span>
            <span className="text-xs font-semibold text-white bg-white/20 rounded-full px-2.5 py-0.5">
              {cleanBrakeStatus}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="bg-white/15 rounded-xl px-4 py-2 text-center min-w-[80px]">
            <p className="text-[10px] text-white/60 uppercase">Applied</p>
            <p className="text-sm font-bold text-white">{formatDuration(readings.appliedTime)}</p>
          </div>
          <div className="bg-white/15 rounded-xl px-4 py-2 text-center min-w-[80px]">
            <p className="text-[10px] text-white/60 uppercase">Released</p>
            <p className="text-sm font-bold text-white">{formatDuration(readings.releasedTime)}</p>
          </div>
          <div className="bg-white/15 rounded-xl px-4 py-2 text-center min-w-[80px]">
            <p className="text-[10px] text-white/60 uppercase">Duration</p>
            <p className="text-sm font-bold text-white">{formatDuration(readings.brakeDuration)}</p>
          </div>
          <div className="bg-white/15 rounded-xl px-4 py-2 text-center min-w-[80px]">
            <p className="text-[10px] text-white/60 uppercase">Drop Rate</p>
            <p className="text-sm font-bold text-white">{readings.dropRate}</p>
          </div>
        </div>
      </div>
      {lastUpdated && (
        <p className="text-[10px] text-white/40 mt-3">Last active: {parseAndFormatIST(lastUpdated)}</p>
      )}
    </div>
  );
}
