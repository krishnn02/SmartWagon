"use client";

import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Radio,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatAxleDate, getAxleTemperatureColor } from "@/lib/axle-utils";

export interface TimelinePoint {
  timestamp: string;
  maxTemp: number;
  readings: Record<string, number>;
}

interface TimelineScrubberProps {
  points: TimelinePoint[];
  currentIndex: number;
  onChangeIndex: (index: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  speed: number;
  onChangeSpeed: (speed: number) => void;
  isLive: boolean;
  onGoLive: () => void;
}

export function TimelineScrubber({
  points,
  currentIndex,
  onChangeIndex,
  isPlaying,
  onTogglePlay,
  speed,
  onChangeSpeed,
  isLive,
  onGoLive,
}: TimelineScrubberProps) {
  const currentPoint = points[currentIndex] || points[points.length - 1];
  const maxTemp = currentPoint?.maxTemp || 0;
  const tempColor = getAxleTemperatureColor(maxTemp > 0 ? maxTemp : null);

  const speedOptions = [1, 2, 5, 10];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 text-white backdrop-blur-xl shadow-2xl space-y-4">
      {/* Top row: Status, Current Timestamp, Max Temp indicator, Live badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-800/80 text-blue-400 border border-slate-700/60">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Timeline Playback
              </span>
              {isLive ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded-full">
                  HISTORICAL ({currentIndex + 1}/{points.length})
                </span>
              )}
            </div>
            <p className="text-sm sm:text-base font-bold text-slate-100 mt-0.5 font-mono">
              {formatAxleDate(currentPoint?.timestamp)}
            </p>
          </div>
        </div>

        {/* Peak Temp in this time slice */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
              Peak Axle Temp
            </span>
            <div className="flex items-baseline gap-1">
              <span
                className="text-base sm:text-lg font-black"
                style={{ color: tempColor.hex }}
              >
                {maxTemp > 0 ? `${maxTemp.toFixed(1)}°C` : "--"}
              </span>
            </div>
            <span
              className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: tempColor.glowRgba,
                color: tempColor.hex,
              }}
            >
              {tempColor.statusText}
            </span>
          </div>

          <button
            type="button"
            onClick={onGoLive}
            disabled={isLive}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border",
              isLive
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 cursor-default"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-slate-600 active:scale-95"
            )}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>Latest</span>
          </button>
        </div>
      </div>

      {/* Scrubber Track and Slider */}
      <div className="space-y-1.5">
        <div className="relative w-full h-7 flex items-center">
          {/* Background Heat Strip Visualizer */}
          <div className="absolute inset-x-0 h-2 rounded-full bg-slate-950 overflow-hidden flex">
            {points.length > 0 &&
              points.map((pt, idx) => {
                const ptColor = getAxleTemperatureColor(pt.maxTemp > 0 ? pt.maxTemp : null);
                return (
                  <div
                    key={pt.timestamp + idx}
                    className="h-full flex-1 transition-opacity"
                    style={{
                      backgroundColor: ptColor.hex,
                      opacity: idx <= currentIndex ? 0.9 : 0.35,
                    }}
                  />
                );
              })}
          </div>

          {/* Interactive Range Input */}
          <input
            type="range"
            min={0}
            max={Math.max(0, points.length - 1)}
            value={currentIndex}
            onChange={(e) => onChangeIndex(parseInt(e.target.value, 10))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          />

          {/* Animated Thumb Indicator */}
          {points.length > 0 && (
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none z-10 transition-all duration-75 flex flex-col items-center"
              style={{
                left: `${(currentIndex / Math.max(1, points.length - 1)) * 100}%`,
              }}
            >
              <div
                className="w-4 h-4 rounded-full border-2 border-white shadow-lg transition-transform hover:scale-125"
                style={{
                  backgroundColor: tempColor.hex,
                  boxShadow: `0 0 12px ${tempColor.hex}`,
                }}
              />
            </div>
          )}
        </div>

        {/* Start / End Timestamp Labels */}
        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>{formatAxleDate(points[0]?.timestamp)}</span>
          <span className="text-slate-400 font-sans text-[11px]">
            Scroll or drag slider to observe thermal changes
          </span>
          <span>{formatAxleDate(points[points.length - 1]?.timestamp)}</span>
        </div>
      </div>

      {/* Bottom Controls Row: Play/Pause, Step Buttons, Speeds */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          {/* Step Back */}
          <button
            type="button"
            onClick={() => onChangeIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex <= 0}
            title="Step backward"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:hover:bg-slate-800 transition-colors"
          >
            <SkipBack className="h-4 w-4" />
          </button>

          {/* Play / Pause */}
          <button
            type="button"
            onClick={onTogglePlay}
            className={cn(
              "px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95",
              isPlaying
                ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20"
                : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20"
            )}
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                <span>Play Timeline</span>
              </>
            )}
          </button>

          {/* Step Forward */}
          <button
            type="button"
            onClick={() => onChangeIndex(Math.min(points.length - 1, currentIndex + 1))}
            disabled={currentIndex >= points.length - 1}
            title="Step forward"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:hover:bg-slate-800 transition-colors"
          >
            <SkipForward className="h-4 w-4" />
          </button>

          {/* Reset to Start */}
          <button
            type="button"
            onClick={() => onChangeIndex(0)}
            title="Rewind to start"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Speed Multiplier Options */}
        <div className="flex items-center gap-1.5 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 px-2 font-semibold uppercase">Speed:</span>
          {speedOptions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChangeSpeed(s)}
              className={cn(
                "px-2 py-1 rounded-lg text-[11px] font-bold transition-all",
                speed === s
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              )}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
