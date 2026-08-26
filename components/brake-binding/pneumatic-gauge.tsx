"use client";

import { useEffect, useRef } from "react";

interface PneumaticGaugeProps {
  label: string;
  value: number;
  standard: number;
  color: string;
  unit?: string;
  max?: number;
}

export function PneumaticGauge({ label, value, standard, color, unit = "KG/CM²", max = 8 }: PneumaticGaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 160;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2 + 10;
    const radius = 62;
    const startAngle = 0.75 * Math.PI;
    const endAngle = 2.25 * Math.PI;
    const sweep = endAngle - startAngle;

    ctx.clearRect(0, 0, size, size);

    // Background arc
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.stroke();

    // Value arc
    const ratio = Math.min(value / max, 1);
    const valueAngle = startAngle + sweep * ratio;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, valueAngle);
    ctx.strokeStyle = color;
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.stroke();

    // Tick marks
    const ticks = 6;
    for (let i = 0; i <= ticks; i++) {
      const angle = startAngle + (sweep * i) / ticks;
      const innerR = radius - 14;
      const outerR = radius - 8;
      ctx.beginPath();
      ctx.moveTo(cx + innerR * Math.cos(angle), cy + innerR * Math.sin(angle));
      ctx.lineTo(cx + outerR * Math.cos(angle), cy + outerR * Math.sin(angle));
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Needle
    const needleAngle = startAngle + sweep * ratio;
    const needleLen = radius - 20;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + needleLen * Math.cos(needleAngle), cy + needleLen * Math.sin(needleAngle));
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();

    // Value text
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(value.toFixed(1), cx, cy + radius + 28);

    // Unit text
    ctx.fillStyle = "#94a3b8";
    ctx.font = "7px sans-serif";
    ctx.fillText(unit, cx, cy + radius + 40);
  }, [value, color, max]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col items-center">
      <canvas ref={canvasRef} className="mb-1" />
      <span className="text-xs font-semibold text-slate-700 tracking-wide">{label}</span>
      <span className="text-[10px] text-slate-400 mt-0.5">STD: {standard.toFixed(1)} {unit}</span>
    </div>
  );
}
