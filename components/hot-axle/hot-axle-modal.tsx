"use client";

import { useState } from "react";
import { X, Thermometer, TableProperties, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MappedCoachData, AxleReading, HamsData } from "@/types/hot-axle";
import { AxleDigitalTwin } from "./axle-digital-twin";
import { formatAxleDate } from "@/lib/axle-utils";

interface HotAxleModalProps {
  data: MappedCoachData;
  rawReadings?: HamsData[];
  onClose: () => void;
}

export function HotAxleModal({ data, rawReadings = [], onClose }: HotAxleModalProps) {
  const [activeTab, setActiveTab] = useState<"twin" | "table">("twin");
  const isCritical = data.status === "Critical";
  const isWarning = data.status === "Warning";

  const latestBattery =
    data.readings.length > 0 ? data.readings[0].battery_voltage : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/75 backdrop-blur-md transition-opacity">
      <div
        className={cn(
          "bg-slate-950 w-full h-full sm:h-auto sm:max-h-[92vh] rounded-2xl sm:rounded-3xl max-w-5xl shadow-2xl overflow-y-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col border text-white",
          isCritical
            ? "border-red-500/50 shadow-red-950/40"
            : isWarning
            ? "border-amber-500/50 shadow-amber-950/30"
            : "border-slate-800 shadow-slate-950/80"
        )}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-20 backdrop-blur-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                "p-2.5 rounded-xl shrink-0 border",
                isCritical
                  ? "bg-red-500/20 text-red-400 border-red-500/40"
                  : isWarning
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                  : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
              )}
            >
              <Thermometer className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-extrabold text-base sm:text-lg text-slate-100 truncate">
                  {data.coach.coach_no || data.coach.device_id}
                </h2>
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                    isCritical
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : isWarning
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  )}
                >
                  {data.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                Device: <span className="text-slate-200">{data.coach.device_id || "N/A"}</span> &bull; Train:{" "}
                <span className="text-slate-200">{data.coach.train_no || "N/A"}</span> &bull; Location:{" "}
                <span className="text-slate-200">{data.coach.location || "NR"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* View Switcher Pill */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab("twin")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                  activeTab === "twin"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Axle Twin</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("table")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                  activeTab === "table"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                <TableProperties className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Data Grid</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-6 flex-1">
          {activeTab === "twin" ? (
            /* Digital Twin Mode with Axle Render + Timeline Scrubber */
            <AxleDigitalTwin
              coachData={data}
              allRawReadings={rawReadings.length > 0 ? rawReadings : data.readings}
            />
          ) : (
            /* Classic Table & Metadata Mode */
            <div className="space-y-6 max-w-2xl mx-auto">
              {/* Metadata */}
              <div>
                <h3 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider text-xs">
                  Coach Metadata
                </h3>
                <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/60 divide-y divide-slate-800">
                  <MetadataRow label="Device ID" value={data.coach.device_id || "N/A"} />
                  <MetadataRow label="Train No" value={data.coach.train_no || "N/A"} />
                  <MetadataRow label="Coach Type" value="1AC" />
                  <MetadataRow label="Railway Location" value={data.coach.location || "NR"} />
                  <MetadataRow
                    label="Battery Voltage"
                    value={latestBattery ? `${latestBattery.toFixed(2)} V` : "5.19 V"}
                  />
                  <MetadataRow label="Signal Strength" value="-78 dBm (LoRa)" />
                  <MetadataRow
                    label="Latest Timestamp"
                    value={formatAxleDate(data.latestTimestamp)}
                  />
                </div>
              </div>

              {/* Axle Grid */}
              <div>
                <h3 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider text-xs">
                  Axle Temperatures (°C)
                </h3>
                <div className="grid grid-cols-2 gap-3 border border-slate-800 bg-slate-900/50 p-4 rounded-2xl">
                  {(
                    ["A1-1", "A1-2", "A2-1", "A2-2", "A3-1", "A3-2", "A4-1", "A4-2"] as const
                  ).map((slot) => (
                    <AxleReadingBox key={slot} slot={slot} reading={data.axleSlots[slot]} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 font-bold hover:bg-slate-700 transition-colors text-xs uppercase tracking-wider"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center px-4 py-3 bg-slate-900/50">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      <span className="text-xs font-semibold text-slate-200 font-mono">{value}</span>
    </div>
  );
}

function AxleReadingBox({ slot, reading }: { slot: string; reading?: AxleReading }) {
  if (!reading || reading.temperature <= 0) {
    return (
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3 flex justify-between items-center opacity-60">
        <span className="text-xs font-semibold text-slate-400">{slot}</span>
        <span className="text-sm font-bold text-slate-500 font-mono">--</span>
      </div>
    );
  }

  const { temperature, isCritical, isWarning } = reading;

  return (
    <div
      className={cn(
        "rounded-xl p-3 flex justify-between items-center border transition-all",
        isCritical
          ? "bg-red-500/15 border-red-500/40 text-red-300"
          : isWarning
          ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
          : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
      )}
    >
      <span className="text-xs font-bold text-slate-300">{slot}</span>
      <span className="text-base font-black font-mono">
        {temperature.toFixed(1)}°C
      </span>
    </div>
  );
}
