"use client";

import { Monitor } from "lucide-react";
import type { CoachByLocationItem } from "@/types/pneumatic";
import { cn } from "@/lib/utils";

interface DeviceSelectorProps {
  devices: CoachByLocationItem[];
  selectedId: string;
  onSelect: (device: CoachByLocationItem) => void;
  loading?: boolean;
}

export function DeviceSelector({ devices, selectedId, onSelect, loading }: DeviceSelectorProps) {
  const selected = devices.find((d) => d.device_id === selectedId);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Select Monitoring Device</label>
      <div className="relative mt-2">
        <Monitor className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
        <select
          value={selectedId}
          onChange={(e) => {
            const device = devices.find((d) => d.device_id === e.target.value);
            if (device) onSelect(device);
          }}
          disabled={loading}
          className={cn(
            "w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {devices.length === 0 && <option>{loading ? "Loading devices..." : "No devices found"}</option>}
          {devices.map((d) => (
            <option key={d.device_id} value={d.device_id}>
              {d.Actual_id || d.technical_id || d.coach_no}
            </option>
          ))}
        </select>
      </div>

      {selected && (
        <div className="flex flex-wrap gap-2 mt-3">
          {[
            { label: "Device", value: selected.Actual_id || selected.technical_id },
            { label: "Coach", value: selected.coach_no },
            { label: "Train", value: selected.Train_no },
            { label: "Location", value: selected.Location },
          ].map((badge) => (
            <span
              key={badge.label}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px]"
            >
              <span className="text-slate-400">{badge.label}:</span>
              <span className="font-semibold text-slate-700">{badge.value}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
