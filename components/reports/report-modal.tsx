"use client";

import { useState, useMemo, useCallback } from "react";
import {
  X, Printer, FileDown, Calendar, ChevronDown, SlidersHorizontal,
  Train, Cpu, MapPin, User, Clock, CheckCircle2, Loader2, AlertCircle
} from "lucide-react";
import { cn, parseAndFormatIST } from "@/lib/utils";
import type { PneumaticHistoryRow } from "@/types/pneumatic";
import type { HamsData, MappedCoachData } from "@/types/hot-axle";
import type { DurationPreset } from "@/components/brake-binding/pressure-chart";
import type { CoachByLocationItem } from "@/types/pneumatic";
import { fetchPneumaticTelemetryFromSupabase } from "@/lib/pneumatic-supabase";

const TIME_PRESETS: { label: string; value: DurationPreset; title: string }[] = [
  { label: "1m",    value: "1m",    title: "Last 1 Minute" },
  { label: "15m",   value: "15m",   title: "Last 15 Minutes" },
  { label: "30m",   value: "30m",   title: "Last 30 Minutes" },
  { label: "24h",   value: "24h",   title: "Last 24 Hours" },
  { label: "48h",   value: "48h",   title: "Last 48 Hours" },
  { label: "7d",    value: "7d",    title: "Last 7 Days" },
  { label: "1M",    value: "30d",   title: "Last Month (30 Days)" },
  { label: "1Y",    value: "1y",    title: "Last Year (365 Days)" },
  { label: "Start", value: "start", title: "From Inception / All Telemetry" },
];

function durationToMs(d: DurationPreset, customStart?: string, customEnd?: string) {
  const now = Date.now();
  if (d === "custom" && customStart) {
    const s = new Date(customStart).getTime();
    const e = customEnd ? new Date(customEnd).getTime() : now;
    return { startMs: s, endMs: e };
  }
  const map: Record<string, number> = {
    "1m": 60_000, "15m": 900_000, "30m": 1_800_000,
    "24h": 86_400_000, "48h": 172_800_000,
    "7d": 604_800_000, "30d": 2_592_000_000,
    "1y": 31_536_000_000, "start": now - new Date("2026-03-01").getTime(),
  };
  return { startMs: now - (map[d] || 900_000), endMs: now };
}

/* ── Metadata context passed from parent pages ─────────────────── */
export interface ReportDeviceMeta {
  deviceId: string;
  deviceType: "brake-binding" | "hot-axle";
  trainNo?: string;
  coachNo?: string;
  division?: string;
  zone?: string;
  location?: string;
  generatedBy?: string;
}

interface ReportModalProps {
  onClose: () => void;
  meta: ReportDeviceMeta;
  /* For report to independently re-fetch brake data */
  matchedDev?: CoachByLocationItem;
  /* Brake Binding — fallback snapshot only */
  brakeHistory?: PneumaticHistoryRow[];
  /* Hot Axle */
  hotAxleCoach?: MappedCoachData;
  rawHamsData?: HamsData[];
}

/* ── SENSOR → AXLE SLOT MAP ────────────────────────────────────── */
const SENSOR_SLOT: Record<string, string> = {
  HAMS001: "A1-1", HAMS002: "A1-2",
  HAMS003: "A2-1", HAMS004: "A2-2",
  HAMS005: "A3-1", HAMS006: "A3-2",
  HAMS007: "A4-1", HAMS009: "A4-1", HAMS008: "A4-2",
};

function formatIST(ts: string | null) {
  if (!ts) return "—";
  return parseAndFormatIST(ts);
}

function nowIST() {
  return new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
}

/* ─── CSV helper ────────────────────────────────────────────────── */
function downloadCSV(rows: string[][], filename: string) {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function ReportModal({ onClose, meta, matchedDev, brakeHistory = [], hotAxleCoach, rawHamsData = [] }: ReportModalProps) {
  const [duration, setDuration] = useState<DurationPreset>("24h");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");
  const [showCustom, setShowCustom] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  // Fetched report data — independent of the dashboard's limited cache
  const [reportBrakeData, setReportBrakeData] = useState<PneumaticHistoryRow[] | null>(null);

  /* local datetime helpers */
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const toInput = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const [tempStart, setTempStart] = useState(toInput(new Date(now.getTime() - 48 * 3600_000)));
  const [tempEnd,   setTempEnd]   = useState(toInput(now));

  const handlePreset = (v: DurationPreset) => {
    if (v === "custom") { setShowCustom(true); return; }
    setShowCustom(false);
    setDuration(v);
    setCustomStart(""); setCustomEnd("");
    setGenerated(false);
    setReportBrakeData(null);
    setFetchError(null);
  };

  const handleApplyCustom = () => {
    if (!tempStart) return;
    setDuration("custom");
    setCustomStart(tempStart);
    setCustomEnd(tempEnd || toInput(new Date()));
    setShowCustom(false);
    setGenerated(false);
    setReportBrakeData(null);
    setFetchError(null);
  };

  const applyQuick = (p: "7d" | "30d" | "1y" | "start") => {
    const curr = new Date();
    let s = new Date(curr.getTime() - 7 * 24 * 3600_000);
    if (p === "30d")  s = new Date(curr.getTime() - 30 * 24 * 3600_000);
    if (p === "1y")   s = new Date(curr.getTime() - 365 * 24 * 3600_000);
    if (p === "start") s = new Date("2026-03-01T00:00:00Z");
    const sStr = toInput(s); const eStr = toInput(curr);
    setTempStart(sStr); setTempEnd(eStr);
    setDuration("custom"); setCustomStart(sStr); setCustomEnd(eStr);
    setShowCustom(false); setGenerated(false);
    setReportBrakeData(null); setFetchError(null);
  };

  /* ── Generate Report: independently fetch fresh data ─────────── */
  const handleGenerate = useCallback(async () => {
    setFetchError(null);

    if (meta.deviceType === "brake-binding" && meta.deviceId) {
      setFetching(true);
      try {
        const result = await fetchPneumaticTelemetryFromSupabase(
          meta.deviceId,
          matchedDev,
          duration,
          customStart || undefined,
          customEnd || undefined,
        );
        const rows = (result.history?.data || []).sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        setReportBrakeData(rows);
        setGenerated(true);
      } catch (err) {
        setFetchError("Failed to fetch report data. Please try again.");
        console.error("Report fetch error:", err);
      } finally {
        setFetching(false);
      }
    } else {
      // Hot axle: filter existing rawHamsData client-side (no independent fetch needed yet)
      setGenerated(true);
    }
  }, [meta, matchedDev, duration, customStart, customEnd]);

  /* ── For hot axle: filter existing data client-side ──────────── */
  const filteredAxle = useMemo(() => {
    if (meta.deviceType !== "hot-axle") return [];
    const { startMs, endMs } = durationToMs(duration, customStart, customEnd);
    return rawHamsData.filter(r => {
      const t = new Date(r.created_at || r.received_timestamp || "").getTime();
      return t >= startMs && t <= endMs;
    }).sort((a, b) =>
      new Date(a.created_at || "").getTime() - new Date(b.created_at || "").getTime()
    );
  }, [meta.deviceType, rawHamsData, duration, customStart, customEnd]);

  // Use freshly fetched brake data; fall back to passed-in snapshot if not yet fetched
  const filteredBrake = reportBrakeData ?? brakeHistory;

  const labelForDuration = TIME_PRESETS.find(p => p.value === duration)?.title || "Custom Range";
  const periodLabel = duration === "custom"
    ? `${customStart.replace("T", " ")} → ${customEnd.replace("T", " ")} IST`
    : labelForDuration;

  /* ── CSV Export ──────────────────────────────────────────────── */
  const handleCSV = useCallback(() => {
    if (meta.deviceType === "brake-binding") {
      const headers = ["Timestamp (IST)", "BP (kg/cm²)", "FP (kg/cm²)", "CR (kg/cm²)", "BC (kg/cm²)", "Brake Status", "Brake Duration (s)", "Applied Time (s)", "Release Time (s)"];
      const rows = filteredBrake.map(r => [
        formatIST(r.timestamp), r.bp.toFixed(2), r.fp.toFixed(2),
        r.cr.toFixed(2), r.bc.toFixed(2), r.brake_status,
        String(r.brake_duration), String(r.brake_applied_time), String(r.brake_released_time),
      ]);
      downloadCSV([headers, ...rows], `BrakeBinding_${meta.deviceId}_${duration}.csv`);
    } else {
      const headers = ["Timestamp (IST)", "Sensor ID", "Axle Position", "Temperature (°C)", "Status", "Battery Voltage (V)", "Resistance (Ω)"];
      const rows = filteredAxle.map(r => [
        formatIST(r.created_at),
        r.device_id || "—",
        SENSOR_SLOT[r.device_id || ""] || "—",
        String(r.temperature ?? "—"),
        r.status || r.temp_state || "—",
        String(r.battery_voltage ?? "—"),
        String(r.resistance ?? "—"),
      ]);
      downloadCSV([headers, ...rows], `HotAxle_${meta.deviceId}_${duration}.csv`);
    }
  }, [meta, filteredBrake, filteredAxle, duration]);

  /* ── Print ───────────────────────────────────────────────────── */
  const handlePrint = () => {
    setTimeout(() => window.print(), 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-4 px-4 print:static print:p-0 print:bg-transparent">
      <div
        id="report-container"
        className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none print:max-w-full"
      >
        {/* ── Modal action bar (hidden on print) ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-indigo-900 text-white print:hidden">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/indian-railways-logo.png" alt="Indian Railways" className="h-10 w-10 object-contain drop-shadow-lg" />
            <div>
              <p className="text-xs font-black tracking-widest uppercase text-indigo-300">Ministry of Railways</p>
              <h2 className="text-base font-bold leading-tight">
                {meta.deviceType === "brake-binding" ? "Brake Binding" : "Hot Axle"} Report Generator
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {generated && (
              <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white/10 text-indigo-200">
                {filteredBrake.length} records
              </span>
            )}
            <button
              onClick={handleCSV}
              disabled={!generated || fetching}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white text-xs font-bold transition-all"
            >
              <FileDown className="h-3.5 w-3.5" />
              Export CSV
            </button>
            <button
              onClick={handlePrint}
              disabled={!generated || fetching}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white text-xs font-bold transition-all"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / PDF
            </button>
            <button onClick={onClose} className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Period chooser (hidden on print) ── */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 print:hidden">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select Report Period</span>
              <span className="text-[10px] text-slate-400 italic ml-1">— report fetches fresh data for the selected window</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="flex items-center bg-slate-900 rounded-xl p-0.5 shadow-inner">
                {TIME_PRESETS.map(r => (
                  <button
                    key={r.value}
                    onClick={() => handlePreset(r.value)}
                    title={r.title}
                    className={cn(
                      "px-2 py-1 text-[10px] font-bold rounded-lg transition-all",
                      duration === r.value && !showCustom
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    )}
                  >
                    {r.label}
                  </button>
                ))}
                <button
                  onClick={() => setShowCustom(!showCustom)}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all border",
                    duration === "custom"
                      ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                      : "text-amber-400 border-transparent hover:text-white hover:bg-slate-800"
                  )}
                >
                  <Calendar className="h-3 w-3" />
                  <span>Custom</span>
                  <ChevronDown className="h-2.5 w-2.5" />
                </button>
              </div>
              <button
                onClick={handleGenerate}
                disabled={fetching}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold shadow-sm transition-all"
              >
                {fetching ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Fetching…</>
                ) : (
                  <><CheckCircle2 className="h-3.5 w-3.5" /> Generate Report</>
                )}
              </button>
            </div>

            {showCustom && (
              <div className="p-3 bg-white border border-indigo-200 rounded-2xl shadow-sm text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-600" />
                    <span className="font-bold text-slate-800">Custom Date Range</span>
                  </div>
                  <button onClick={() => setShowCustom(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">From</label>
                    <input type="datetime-local" value={tempStart} onChange={e => setTempStart(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">To</label>
                    <input type="datetime-local" value={tempEnd} onChange={e => setTempEnd(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Quick:</span>
                  {(["7d","30d","1y","start"] as const).map(s => (
                    <button key={s} onClick={() => applyQuick(s)}
                      className="px-2 py-1 text-[10px] font-bold rounded-lg bg-slate-100 text-slate-700 hover:bg-indigo-600 hover:text-white transition-colors">
                      {s === "7d" ? "Last 7d" : s === "30d" ? "Last Month" : s === "1y" ? "Last Year" : "All Time"}
                    </button>
                  ))}
                  <button onClick={handleApplyCustom}
                    className="ml-auto px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold">
                    Apply
                  </button>
                </div>
              </div>
            )}

            {fetchError && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {fetchError}
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            PRINTABLE REPORT BODY
        ══════════════════════════════════════════════════════════════ */}
        <div id="report-body" className="p-6 print:p-8">

          {/* ── Report Header ── */}
          <div className="flex items-start justify-between pb-5 border-b-2 border-slate-800 mb-6">
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/indian-railways-logo.png" alt="Indian Railways Logo"
                className="h-20 w-20 object-contain" />
              <div>
                <p className="text-[10px] font-black tracking-[0.25em] uppercase text-slate-500">
                  Government of India
                </p>
                <h1 className="text-xl font-black text-slate-900 leading-tight">
                  Ministry of Railways
                </h1>
                <p className="text-sm font-bold text-slate-700 leading-tight">
                  Smart Coach Monitoring System
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vehicle Axle Safety Platform — VASP v2.0
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Diagnostic Report</p>
              <div className="inline-block px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg">
                {meta.deviceType === "brake-binding" ? "BRAKE BINDING" : "HOT AXLE DETECTION"}
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                Generated: {nowIST()} IST
              </p>
              {meta.generatedBy && (
                <p className="text-[10px] text-slate-400">By: {meta.generatedBy}</p>
              )}
            </div>
          </div>

          {/* ── Device Metadata grid ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { icon: Cpu,    label: "Device ID",    value: meta.deviceId || "—" },
              { icon: Train,  label: "Train No",     value: meta.trainNo  || "—" },
              { icon: Train,  label: "Coach No",     value: meta.coachNo  || "—" },
              { icon: MapPin, label: "Division",     value: meta.division || meta.location || "—" },
              { icon: MapPin, label: "Zone",         value: meta.zone || "—" },
              { icon: Clock,  label: "Period",       value: periodLabel },
              { icon: User,   label: "Generated By", value: meta.generatedBy || "System" },
              { icon: Clock,  label: "Report Time",  value: nowIST() + " IST" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="h-3 w-3 text-indigo-600" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</span>
                </div>
                <p className="text-xs font-bold text-slate-900 truncate">{value}</p>
              </div>
            ))}
          </div>

          {/* ── Data Table ── */}
          {!generated ? (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200 print:hidden">
              <CheckCircle2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-500">Select a period and click <strong>"Generate Report"</strong></p>
              <p className="text-xs text-slate-400 mt-1">The data table will appear here</p>
            </div>
          ) : meta.deviceType === "brake-binding" ? (
            <BrakeTable rows={filteredBrake} />
          ) : (
            <AxleTable rows={filteredAxle} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── */
/*  BRAKE BINDING TABLE                                             */
/* ──────────────────────────────────────────────────────────────── */
function BrakeTable({ rows }: { rows: PneumaticHistoryRow[] }) {
  const HEADERS = [
    "Timestamp (IST)", "BP\n(kg/cm²)", "FP\n(kg/cm²)", "CR\n(kg/cm²)", "BC\n(kg/cm²)",
    "Brake Status", "Duration\n(s)", "Applied\n(s)", "Released\n(s)"
  ];

  if (rows.length === 0) {
    return (
      <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        <p className="text-sm font-bold text-slate-500">No records found for the selected period.</p>
        <p className="text-xs text-slate-400 mt-1">Try a wider time window.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
          Brake Binding Telemetry — {rows.length} Records
        </h2>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-[10px] border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="px-3 py-2 text-left font-black uppercase tracking-wider whitespace-nowrap">#</th>
              {HEADERS.map(h => (
                <th key={h} className="px-3 py-2 text-left font-black uppercase tracking-wider whitespace-pre-line leading-tight">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const isApplied = r.brake_status === "APPLIED" || r.bc > 0.4;
              return (
                <tr key={i} className={cn(
                  "border-b border-slate-100 transition-colors",
                  isApplied ? "bg-red-50" : i % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                )}>
                  <td className="px-3 py-1.5 text-slate-400 font-mono">{i + 1}</td>
                  <td className="px-3 py-1.5 font-mono text-slate-600 whitespace-nowrap">{formatIST(r.timestamp)}</td>
                  <td className="px-3 py-1.5 font-mono font-semibold text-blue-700">{r.bp.toFixed(2)}</td>
                  <td className="px-3 py-1.5 font-mono font-semibold text-emerald-700">{r.fp.toFixed(2)}</td>
                  <td className="px-3 py-1.5 font-mono font-semibold text-amber-700">{r.cr.toFixed(2)}</td>
                  <td className={cn("px-3 py-1.5 font-mono font-semibold", isApplied ? "text-red-700" : "text-slate-700")}>{r.bc.toFixed(2)}</td>
                  <td className="px-3 py-1.5">
                    <span className={cn(
                      "px-1.5 py-0.5 rounded font-bold text-[9px]",
                      isApplied ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                    )}>
                      {r.brake_status || (isApplied ? "APPLIED" : "RELEASED")}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 font-mono text-slate-600">{r.brake_duration ?? "—"}</td>
                  <td className="px-3 py-1.5 font-mono text-slate-600">{r.brake_applied_time ?? "—"}</td>
                  <td className="px-3 py-1.5 font-mono text-slate-600">{r.brake_released_time ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* summary row */}
      <div className="mt-3 grid grid-cols-4 gap-3 text-[10px]">
        {[
          { label: "Avg BP", value: (rows.reduce((s,r) => s + r.bp, 0) / rows.length).toFixed(2) + " kg/cm²" },
          { label: "Avg BC", value: (rows.reduce((s,r) => s + r.bc, 0) / rows.length).toFixed(2) + " kg/cm²" },
          { label: "Brake Applied Events", value: String(rows.filter(r => r.brake_status === "APPLIED" || r.bc > 0.4).length) },
          { label: "Total Records", value: String(rows.length) },
        ].map(s => (
          <div key={s.label} className="bg-indigo-50 border border-indigo-100 rounded-xl p-2.5">
            <p className="text-[9px] text-indigo-500 font-black uppercase tracking-wider">{s.label}</p>
            <p className="text-sm font-black text-indigo-900">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── */
/*  HOT AXLE TABLE                                                  */
/* ──────────────────────────────────────────────────────────────── */
function AxleTable({ rows }: { rows: HamsData[] }) {
  const HEADERS = [
    "Timestamp (IST)", "Sensor ID", "Axle Position",
    "Temperature (°C)", "Status", "Battery (V)", "Resistance (Ω)"
  ];

  if (rows.length === 0) {
    return (
      <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        <p className="text-sm font-bold text-slate-500">No axle records found for the selected period.</p>
      </div>
    );
  }

  const tempColor = (t: number) => {
    if (t >= 100) return "text-red-700 bg-red-100";
    if (t >= 70)  return "text-orange-700 bg-orange-100";
    return "text-emerald-700 bg-emerald-100";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
          Hot Axle Sensor Data — {rows.length} Records
        </h2>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-[10px] border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="px-3 py-2 text-left font-black uppercase tracking-wider">#</th>
              {HEADERS.map(h => (
                <th key={h} className="px-3 py-2 text-left font-black uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const temp = r.temperature ?? 0;
              const slot = SENSOR_SLOT[r.device_id || ""] || "—";
              return (
                <tr key={i} className={cn("border-b border-slate-100", i % 2 === 0 ? "bg-white" : "bg-slate-50/60")}>
                  <td className="px-3 py-1.5 text-slate-400 font-mono">{i + 1}</td>
                  <td className="px-3 py-1.5 font-mono text-slate-600 whitespace-nowrap">{formatIST(r.created_at)}</td>
                  <td className="px-3 py-1.5 font-mono font-semibold text-indigo-700">{r.device_id || "—"}</td>
                  <td className="px-3 py-1.5 font-mono font-bold text-slate-800">{slot}</td>
                  <td className="px-3 py-1.5">
                    <span className={cn("px-1.5 py-0.5 rounded font-bold text-[9px]", tempColor(temp))}>
                      {temp.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-3 py-1.5">
                    <span className={cn(
                      "px-1.5 py-0.5 rounded font-bold text-[9px]",
                      (r.status || r.temp_state || "").toUpperCase().includes("CRIT") ? "bg-red-100 text-red-800" :
                      (r.status || r.temp_state || "").toUpperCase().includes("WARN") ? "bg-amber-100 text-amber-800" :
                      "bg-emerald-100 text-emerald-800"
                    )}>
                      {r.status || r.temp_state || "Normal"}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 font-mono text-slate-600">{r.battery_voltage?.toFixed(2) ?? "—"}</td>
                  <td className="px-3 py-1.5 font-mono text-slate-600">{r.resistance?.toFixed(1) ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* summary */}
      <div className="mt-3 grid grid-cols-4 gap-3 text-[10px]">
        {[
          { label: "Max Temp", value: Math.max(...rows.map(r => r.temperature ?? 0)).toFixed(1) + " °C" },
          { label: "Avg Temp", value: (rows.reduce((s,r) => s + (r.temperature ?? 0), 0) / rows.length).toFixed(1) + " °C" },
          { label: "Critical Readings", value: String(rows.filter(r => (r.temperature ?? 0) >= 100).length) },
          { label: "Total Records", value: String(rows.length) },
        ].map(s => (
          <div key={s.label} className="bg-indigo-50 border border-indigo-100 rounded-xl p-2.5">
            <p className="text-[9px] text-indigo-500 font-black uppercase tracking-wider">{s.label}</p>
            <p className="text-sm font-black text-indigo-900">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
