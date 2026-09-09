"use client";

import { Monitor, ShieldCheck, MapPin } from "lucide-react";
import type { CoachByLocationItem } from "@/types/pneumatic";
import { cn } from "@/lib/utils";

interface DeviceSelectorProps {
  devices: CoachByLocationItem[];
  selectedId: string;
  onSelect: (device: CoachByLocationItem) => void;
  loading?: boolean;
  totalDevicesCount?: number;
  userRole?: string;
}

export function DeviceSelector({
  devices,
  selectedId,
  onSelect,
  loading,
  totalDevicesCount,
  userRole,
}: DeviceSelectorProps) {
  const selected = devices.find((d) => d.device_id === selectedId);
  const isRestricted = totalDevicesCount !== undefined && devices.length < totalDevicesCount;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Monitor className="h-3.5 w-3.5 text-blue-600" />
          <span>Select Monitoring Device</span>
        </label>

        <div className="flex items-center gap-2">
          {isRestricted ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold">
              <ShieldCheck className="h-3 w-3" />
              <span>Division Scope: {devices.length} Assigned Devices</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold">
              <span>All Railway Devices ({devices.length})</span>
            </span>
          )}
        </div>
      </div>

      <div className="relative mt-1">
        <Monitor className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
        <select
          value={selectedId}
          onChange={(e) => {
            const device = devices.find((d) => d.device_id === e.target.value);
            if (device) onSelect(device);
          }}
          disabled={loading || devices.length === 0}
          className={cn(
            "w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-900",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {devices.length === 0 && (
            <option>{loading ? "Loading permitted devices..." : "No devices assigned to your profile"}</option>
          )}
          {devices.map((d) => (
            <option key={d.device_id} value={d.device_id}>
              {d.Actual_id || d.technical_id || d.coach_no}
            </option>
          ))}
        </select>
      </div>

      {selected && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
          {[
            { label: "Device", value: selected.Actual_id || selected.technical_id },
            { label: "Coach", value: selected.coach_no },
            { label: "Train", value: selected.Train_no },
            { label: "Division", value: selected.Location },
          ].map((badge) => (
            <span
              key={badge.label}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px]"
            >
              <span className="text-slate-400 font-medium">{badge.label}:</span>
              <span className="font-bold text-slate-700">{badge.value}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
