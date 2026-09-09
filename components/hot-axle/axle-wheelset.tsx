"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { AxleReading } from "@/types/hot-axle";
import {
  AxleConfig,
  getAxleTemperatureColor,
  SLOT_TO_SENSOR_MAP,
} from "@/lib/axle-utils";

interface AxleWheelsetProps {
  config: AxleConfig;
  leftReading?: AxleReading;
  rightReading?: AxleReading;
  compact?: boolean;
  highlightSlot?: string;
  onSelectSlot?: (slotId: string) => void;
}

export function AxleWheelset({
  config,
  leftReading,
  rightReading,
  compact = false,
  highlightSlot,
  onSelectSlot,
}: AxleWheelsetProps) {
  const leftTemp = leftReading?.temperature ?? 0;
  const rightTemp = rightReading?.temperature ?? 0;

  const leftColor = getAxleTemperatureColor(leftTemp > 0 ? leftTemp : null);
  const rightColor = getAxleTemperatureColor(rightTemp > 0 ? rightTemp : null);

  const deltaTemp = Math.abs(leftTemp - rightTemp);
  const hasCritical = leftColor.isCritical || rightColor.isCritical;
  const hasWarning = leftColor.isWarning || rightColor.isWarning;

  const leftSensorId = leftReading?.sensorId || SLOT_TO_SENSOR_MAP[config.leftSlot];
  const rightSensorId = rightReading?.sensorId || SLOT_TO_SENSOR_MAP[config.rightSlot];

  return (
    <div
      className={cn(
        "relative rounded-2xl border transition-all duration-300 overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white shadow-xl",
        hasCritical
          ? "border-red-500/60 shadow-red-950/40"
          : hasWarning
          ? "border-amber-500/50 shadow-amber-950/30"
          : "border-slate-800 shadow-slate-950/50",
        compact ? "p-3.5" : "p-5 sm:p-7"
      )}
    >
      {/* Dynamic ambient background glow based on axle state */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20 blur-3xl transition-all duration-700"
        style={{
          background: `radial-gradient(circle at 20% 50%, ${leftColor.hex} 0%, transparent 60%), radial-gradient(circle at 80% 50%, ${rightColor.hex} 0%, transparent 60%)`,
        }}
      />

      {/* Header bar */}
      <div className="relative z-10 flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "flex items-center justify-center font-black rounded-lg text-xs tracking-wider uppercase px-2.5 py-1 border",
              hasCritical
                ? "bg-red-500/20 text-red-400 border-red-500/40"
                : hasWarning
                ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
            )}
          >
            {config.id}
          </div>
          <div>
            <h4 className={cn("font-bold tracking-tight text-slate-100", compact ? "text-xs" : "text-sm")}>
              {config.title}
            </h4>
            <p className="text-[10px] text-slate-400 font-medium">
              {config.bogie} &bull; {config.position}
            </p>
          </div>
        </div>

        {/* Delta T badge */}
        {leftTemp > 0 && rightTemp > 0 && (
          <div
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border backdrop-blur-sm",
              deltaTemp > 15
                ? "bg-red-500/15 text-red-300 border-red-500/30"
                : deltaTemp > 8
                ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                : "bg-slate-800/80 text-slate-300 border-slate-700/60"
            )}
            title="Temperature differential between left and right wheel bearing"
          >
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">&Delta;T</span>
            <span>{deltaTemp.toFixed(1)}°C</span>
          </div>
        )}
      </div>

      {/* Main Wheelset Visualizer Stage */}
      <div className="relative z-10 my-2 sm:my-4 flex items-center justify-center">
        <div className="relative w-full max-w-2xl aspect-[2.1/1] sm:aspect-[2.3/1] flex items-center justify-center select-none">
          {/* Base Axle Image */}
          <div className="relative w-full h-full flex items-center justify-center">
            <Image
              src="/images/axle.png"
              alt={`${config.title} Wheelset`}
              width={700}
              height={320}
              priority
              className="w-full h-auto max-h-full object-contain filter contrast-[1.05] drop-shadow-2xl"
            />

            {/* Left Wheel Radial Thermal Glow Bloom */}
            <div
              className={cn(
                "absolute left-[11%] top-[8%] w-[14%] h-[84%] rounded-full pointer-events-none transition-all duration-700 mix-blend-screen",
                leftColor.isCritical ? "animate-pulse opacity-90" : "opacity-75"
              )}
              style={{
                background: `radial-gradient(ellipse at center, ${leftColor.hex} 0%, ${leftColor.glowRgba} 55%, transparent 75%)`,
                filter: `blur(${compact ? '8px' : '14px'})`,
              }}
            />

            {/* Left Wheel Bearing Journal Outer Pin Glow */}
            <div
              className="absolute left-[1%] top-[38%] w-[12%] h-[24%] rounded-full pointer-events-none transition-all duration-700 mix-blend-screen opacity-80"
              style={{
                background: `radial-gradient(circle at center, ${leftColor.hex} 0%, ${leftColor.glowRgba} 50%, transparent 80%)`,
                filter: `blur(${compact ? '6px' : '10px'})`,
              }}
            />

            {/* Right Wheel Radial Thermal Glow Bloom */}
            <div
              className={cn(
                "absolute right-[11%] top-[8%] w-[14%] h-[84%] rounded-full pointer-events-none transition-all duration-700 mix-blend-screen",
                rightColor.isCritical ? "animate-pulse opacity-90" : "opacity-75"
              )}
              style={{
                background: `radial-gradient(ellipse at center, ${rightColor.hex} 0%, ${rightColor.glowRgba} 55%, transparent 75%)`,
                filter: `blur(${compact ? '8px' : '14px'})`,
              }}
            />

            {/* Right Wheel Bearing Journal Outer Pin Glow */}
            <div
              className="absolute right-[1%] top-[38%] w-[12%] h-[24%] rounded-full pointer-events-none transition-all duration-700 mix-blend-screen opacity-80"
              style={{
                background: `radial-gradient(circle at center, ${rightColor.hex} 0%, ${rightColor.glowRgba} 50%, transparent 80%)`,
                filter: `blur(${compact ? '6px' : '10px'})`,
              }}
            />

            {/* Central Axle Shaft Thermal Conduction Gradient */}
            <div
              className="absolute left-[24%] right-[24%] top-[45%] h-[10%] rounded-full pointer-events-none opacity-40 mix-blend-screen transition-all duration-700"
              style={{
                background: `linear-gradient(90deg, ${leftColor.hex} 0%, transparent 40%, transparent 60%, ${rightColor.hex} 100%)`,
                filter: "blur(6px)",
              }}
            />

            {/* Pulsating Radiation Rings on Critical Wheel */}
            {leftColor.isCritical && (
              <div className="absolute left-[11%] top-[25%] -translate-y-1/2 w-16 h-16 rounded-full border-2 border-red-500 animate-ping opacity-60 pointer-events-none" />
            )}
            {rightColor.isCritical && (
              <div className="absolute right-[11%] top-[25%] -translate-y-1/2 w-16 h-16 rounded-full border-2 border-red-500 animate-ping opacity-60 pointer-events-none" />
            )}
          </div>
        </div>
      </div>

      {/* Temperature HUD Badges (Left & Right) */}
      <div className="relative z-10 grid grid-cols-2 gap-3 pt-2">
        {/* Left Wheel Badge (A*-1) */}
        <button
          type="button"
          onClick={() => onSelectSlot?.(config.leftSlot)}
          className={cn(
            "text-left rounded-xl p-3 sm:p-4 border transition-all duration-200 backdrop-blur-md relative overflow-hidden group",
            highlightSlot === config.leftSlot
              ? "ring-2 ring-blue-500 border-blue-400 bg-slate-800/90"
              : "border-slate-800/80 bg-slate-900/70 hover:bg-slate-800/80"
          )}
        >
          {/* Subtle colored side accent */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1.5 transition-colors"
            style={{ backgroundColor: leftColor.hex }}
          />

          <div className="flex items-center justify-between gap-1 mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-black text-slate-200 tracking-wide">
                {config.leftSlot}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold px-1.5 py-0.5 rounded bg-slate-800">
                Left Wheel
              </span>
            </div>
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: leftColor.glowRgba,
                color: leftColor.hex,
                border: `1px solid ${leftColor.hex}40`,
              }}
            >
              {leftColor.statusText}
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-2">
            <div className="flex items-baseline gap-1">
              <span
                className="text-2xl sm:text-3xl font-black tracking-tight"
                style={{ color: leftColor.hex }}
              >
                {leftTemp > 0 ? leftTemp.toFixed(1) : "--"}
              </span>
              <span className="text-sm font-bold text-slate-400">°C</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {leftSensorId}
            </span>
          </div>
        </button>

        {/* Right Wheel Badge (A*-2) */}
        <button
          type="button"
          onClick={() => onSelectSlot?.(config.rightSlot)}
          className={cn(
            "text-left rounded-xl p-3 sm:p-4 border transition-all duration-200 backdrop-blur-md relative overflow-hidden group",
            highlightSlot === config.rightSlot
              ? "ring-2 ring-blue-500 border-blue-400 bg-slate-800/90"
              : "border-slate-800/80 bg-slate-900/70 hover:bg-slate-800/80"
          )}
        >
          {/* Subtle colored side accent */}
          <div
            className="absolute right-0 top-0 bottom-0 w-1.5 transition-colors"
            style={{ backgroundColor: rightColor.hex }}
          />

          <div className="flex items-center justify-between gap-1 mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-black text-slate-200 tracking-wide">
                {config.rightSlot}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold px-1.5 py-0.5 rounded bg-slate-800">
                Right Wheel
              </span>
            </div>
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: rightColor.glowRgba,
                color: rightColor.hex,
                border: `1px solid ${rightColor.hex}40`,
              }}
            >
              {rightColor.statusText}
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-2">
            <div className="flex items-baseline gap-1">
              <span
                className="text-2xl sm:text-3xl font-black tracking-tight"
                style={{ color: rightColor.hex }}
              >
                {rightTemp > 0 ? rightTemp.toFixed(1) : "--"}
              </span>
              <span className="text-sm font-bold text-slate-400">°C</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {rightSensorId}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
