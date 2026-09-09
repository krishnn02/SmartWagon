"use client";

import { useState, useMemo, useEffect } from "react";
import type { HamsData, AxleReading, MappedCoachData } from "@/types/hot-axle";
import {
  AXLE_CONFIGS,
  AXLE_SLOT_NAMES,
  SENSOR_TO_SLOT_MAP,
  SLOT_TO_SENSOR_MAP,
  AxleSlotId,
  getAxleTemperatureColor,
} from "@/lib/axle-utils";
import { AxleWheelset } from "./axle-wheelset";
import { TimelineScrubber, TimelinePoint } from "./timeline-scrubber";
import {
  Layers,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AxleDigitalTwinProps {
  coachData: MappedCoachData;
  allRawReadings?: HamsData[];
  compact?: boolean;
}

export function AxleDigitalTwin({
  coachData,
  allRawReadings = [],
  compact = false,
}: AxleDigitalTwinProps) {
  const [selectedView, setSelectedView] = useState<"ALL" | "A1" | "A2" | "A3" | "A4">("ALL");
  const [highlightSlot, setHighlightSlot] = useState<string | undefined>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [isLive, setIsLive] = useState(true);
  const [userIndex, setUserIndex] = useState<number | null>(null);

  // 1. Build chronological timeline points from historical readings
  const timelinePoints = useMemo<TimelinePoint[]>(() => {
    const readings =
      allRawReadings.length > 0 ? allRawReadings : coachData.readings;

    if (!readings || readings.length === 0) {
      const currentSnapshot: Record<string, number> = {};
      let maxT = 0;
      AXLE_SLOT_NAMES.forEach((slot) => {
        const temp = coachData.axleSlots[slot]?.temperature || 0;
        currentSnapshot[slot] = temp;
        if (temp > maxT) maxT = temp;
      });
      return [
        {
          timestamp: coachData.latestTimestamp || new Date().toISOString(),
          maxTemp: maxT,
          readings: currentSnapshot,
        },
      ];
    }

    const sorted = [...readings].sort(
      (a, b) =>
        new Date(a.created_at || "").getTime() -
        new Date(b.created_at || "").getTime()
    );

    const stateBySensor: Record<string, number> = {};
    const rawPoints: TimelinePoint[] = [];

    sorted.forEach((row) => {
      if (!row.created_at || !row.device_id || row.temperature === null || row.temperature === undefined) return;
      const slot = SENSOR_TO_SLOT_MAP[row.device_id];
      if (!slot) return;

      stateBySensor[slot] = row.temperature;

      let curMax = 0;
      Object.values(stateBySensor).forEach((t) => {
        if (t > curMax) curMax = t;
      });

      rawPoints.push({
        timestamp: row.created_at,
        maxTemp: curMax,
        readings: { ...stateBySensor },
      });
    });

    if (rawPoints.length === 0) {
      return [
        {
          timestamp: new Date().toISOString(),
          maxTemp: 0,
          readings: {},
        },
      ];
    }

    const targetCount = Math.min(100, rawPoints.length);
    if (rawPoints.length <= targetCount) {
      return rawPoints;
    }

    const step = (rawPoints.length - 1) / (targetCount - 1);
    const sampled: TimelinePoint[] = [];
    for (let i = 0; i < targetCount; i++) {
      const idx = Math.min(rawPoints.length - 1, Math.round(i * step));
      sampled.push(rawPoints[idx]);
    }
    return sampled;
  }, [allRawReadings, coachData]);

  // Derived current index: when isLive or userIndex is null, use the latest point
  const currentIndex =
    isLive || userIndex === null
      ? Math.max(0, timelinePoints.length - 1)
      : Math.min(Math.max(0, userIndex), timelinePoints.length - 1);

  // Automated playback loop
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.max(100, Math.floor(1000 / speed));
    const timer = setInterval(() => {
      setUserIndex((prev) => {
        const next = (prev === null ? 0 : prev) + 1;
        if (next >= timelinePoints.length - 1) {
          setIsPlaying(false);
          setIsLive(true);
          return null;
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, speed, timelinePoints.length]);

  // Current active snapshot from timeline
  const activePoint = timelinePoints[currentIndex] || timelinePoints[timelinePoints.length - 1];

  // Map snapshot readings into AxleReading structure for wheelsets
  const currentAxleSlots = useMemo<Record<AxleSlotId, AxleReading>>(() => {
    const res: Record<string, AxleReading> = {};
    AXLE_SLOT_NAMES.forEach((slot) => {
      const temp = activePoint?.readings[slot] ?? coachData.axleSlots[slot]?.temperature ?? 0;
      const isCritical = temp > 80;
      const isWarning = temp > 65 && temp <= 80;
      res[slot] = {
        sensorId: coachData.axleSlots[slot]?.sensorId || SLOT_TO_SENSOR_MAP[slot],
        temperature: temp,
        isCritical,
        isWarning,
      };
    });
    return res as Record<AxleSlotId, AxleReading>;
  }, [activePoint, coachData.axleSlots]);

  const maxAxleTemp = activePoint?.maxTemp || 0;
  const overallStatus = getAxleTemperatureColor(maxAxleTemp > 0 ? maxAxleTemp : null);

  const handleIndexChange = (idx: number) => {
    if (idx >= timelinePoints.length - 1) {
      setUserIndex(null);
      setIsLive(true);
    } else {
      setUserIndex(idx);
      setIsLive(false);
    }
  };

  const handleGoLive = () => {
    setUserIndex(null);
    setIsLive(true);
    setIsPlaying(false);
  };

  return (
    <div className="space-y-5">
      {/* Top Header & View Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-white backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-2.5 rounded-xl border",
              overallStatus.isCritical
                ? "bg-red-500/20 text-red-400 border-red-500/40"
                : overallStatus.isWarning
                ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
            )}
          >
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-100 tracking-tight">
                Axle Thermal Digital Twin
              </h3>
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: overallStatus.glowRgba,
                  color: overallStatus.hex,
                  border: `1px solid ${overallStatus.hex}40`,
                }}
              >
                {overallStatus.statusText}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Coach: <strong className="text-slate-200">{coachData.coach.coach_no || coachData.coach.device_id}</strong> &bull; Device:{" "}
              <strong className="text-slate-200">{coachData.coach.device_id || "N/A"}</strong>
            </p>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setSelectedView("ALL")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
              selectedView === "ALL"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>All 4 Axles</span>
          </button>
          {(["A1", "A2", "A3", "A4"] as const).map((axleId) => (
            <button
              key={axleId}
              type="button"
              onClick={() => setSelectedView(axleId)}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all",
                selectedView === axleId
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
              )}
            >
              {axleId}
            </button>
          ))}
        </div>
      </div>

      {/* Main Visualizer Area */}
      {selectedView === "ALL" ? (
        <div className="space-y-6">
          {/* Bogie 1 (Axle 1 & Axle 2) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 bg-slate-900/80 border border-slate-800 px-3 py-1 rounded-lg">
                Bogie 1 (Leading Truck)
              </span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <AxleWheelset
                config={AXLE_CONFIGS[0]}
                leftReading={currentAxleSlots["A1-1"]}
                rightReading={currentAxleSlots["A1-2"]}
                compact={compact}
                highlightSlot={highlightSlot}
                onSelectSlot={setHighlightSlot}
              />
              <AxleWheelset
                config={AXLE_CONFIGS[1]}
                leftReading={currentAxleSlots["A2-1"]}
                rightReading={currentAxleSlots["A2-2"]}
                compact={compact}
                highlightSlot={highlightSlot}
                onSelectSlot={setHighlightSlot}
              />
            </div>
          </div>

          {/* Bogie 2 (Axle 3 & Axle 4) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 bg-slate-900/80 border border-slate-800 px-3 py-1 rounded-lg">
                Bogie 2 (Trailing Truck)
              </span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <AxleWheelset
                config={AXLE_CONFIGS[2]}
                leftReading={currentAxleSlots["A3-1"]}
                rightReading={currentAxleSlots["A3-2"]}
                compact={compact}
                highlightSlot={highlightSlot}
                onSelectSlot={setHighlightSlot}
              />
              <AxleWheelset
                config={AXLE_CONFIGS[3]}
                leftReading={currentAxleSlots["A4-1"]}
                rightReading={currentAxleSlots["A4-2"]}
                compact={compact}
                highlightSlot={highlightSlot}
                onSelectSlot={setHighlightSlot}
              />
            </div>
          </div>
        </div>
      ) : (
        <div>
          {(() => {
            const config = AXLE_CONFIGS.find((c) => c.id === selectedView) || AXLE_CONFIGS[0];
            return (
              <AxleWheelset
                config={config}
                leftReading={currentAxleSlots[config.leftSlot]}
                rightReading={currentAxleSlots[config.rightSlot]}
                compact={false}
                highlightSlot={highlightSlot}
                onSelectSlot={setHighlightSlot}
              />
            );
          })()}
        </div>
      )}

      {/* Interactive Timeline Scrubber */}
      <TimelineScrubber
        points={timelinePoints}
        currentIndex={currentIndex}
        onChangeIndex={handleIndexChange}
        isPlaying={isPlaying}
        onTogglePlay={() => {
          if (!isPlaying && currentIndex >= timelinePoints.length - 1) {
            setUserIndex(0);
            setIsLive(false);
          }
          setIsPlaying(!isPlaying);
        }}
        speed={speed}
        onChangeSpeed={setSpeed}
        isLive={isLive}
        onGoLive={handleGoLive}
      />
    </div>
  );
}
