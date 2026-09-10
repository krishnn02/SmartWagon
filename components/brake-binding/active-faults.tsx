"use client";

import { useState, useMemo } from "react";
import type { PneumaticFault } from "@/types/pneumatic";
import { CheckCircle2, Clock, Calendar, ChevronDown, X, SlidersHorizontal, Search, History, Zap } from "lucide-react";
import { cn, parseAndFormatIST } from "@/lib/utils";
import type { DurationPreset } from "@/components/brake-binding/pressure-chart";

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

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: "border-emerald-200 bg-emerald-50/70",
  HIGH:     "border-emerald-200 bg-emerald-50/70",
  WARNING:  "border-emerald-200 bg-emerald-50/70",
  NORMAL:   "border-emerald-200 bg-emerald-50/70",
};

const SEVERITY_BADGE: Record<string, string> = {
  CRITICAL: "bg-emerald-100 text-emerald-800",
  HIGH:     "bg-emerald-100 text-emerald-800",
  WARNING:  "bg-emerald-100 text-emerald-800",
  NORMAL:   "bg-emerald-100 text-emerald-800",
};

const SEVERITY_ICON: Record<string, string> = {
  CRITICAL: "text-emerald-600",
  HIGH:     "text-emerald-600",
  WARNING:  "text-emerald-600",
  NORMAL:   "text-emerald-600",
};

interface ActiveFaultsProps {
  faults: PneumaticFault[];         // already filtered to selected window from parent
  faultHistory?: PneumaticFault[];  // all 100 rows from Supabase
  duration?: DurationPreset;
  customRange?: { start?: string; end?: string };
  onDurationChange?: (d: DurationPreset, start?: string, end?: string) => void;
}

type Tab = "timeframe" | "history";

export function ActiveFaults({
  faults,
  faultHistory = [],
  duration = "15m",
  customRange,
  onDurationChange,
}: ActiveFaultsProps) {
  const [tab, setTab] = useState<Tab>("timeframe");
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [internalDuration, setInternalDuration] = useState<DurationPreset>(duration);
  const [historySearch, setHistorySearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");

  // Custom range local state
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const toInput = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

  const [tempStart, setTempStart] = useState<string>(
    customRange?.start || toInput(new Date(now.getTime() - 48 * 3600 * 1000))
  );
  const [tempEnd, setTempEnd] = useState<string>(customRange?.end || toInput(now));

  const activeDuration = onDurationChange ? duration : internalDuration;

  const handlePreset = (val: DurationPreset) => {
    if (val === "custom") { setShowCustomModal(true); return; }
    setShowCustomModal(false);
    setInternalDuration(val);
    onDurationChange?.(val);
  };

  const handleApplyCustom = () => {
    if (!tempStart) return;
    setShowCustomModal(false);
    setInternalDuration("custom");
    onDurationChange?.("custom", tempStart, tempEnd || toInput(new Date()));
  };

  const applyQuickShortcut = (preset: "7d" | "30d" | "1y" | "start") => {
    const curr = new Date();
    let s = new Date(curr.getTime() - 7 * 24 * 3600 * 1000);
    if (preset === "30d") s = new Date(curr.getTime() - 30 * 24 * 3600 * 1000);
    if (preset === "1y")  s = new Date(curr.getTime() - 365 * 24 * 3600 * 1000);
    if (preset === "start") s = new Date("2026-03-01T00:00:00Z");
    const sStr = toInput(s);
    const eStr = toInput(curr);
    setTempStart(sStr); setTempEnd(eStr);
    setShowCustomModal(false); setInternalDuration("custom");
    onDurationChange?.("custom", sStr, eStr);
  };

  // Rule: "So for any device type for selected device id there must be no faults, so basically remove all the faults we do not want to show explicitly them. Though for longer duration we can show some of the faults. But the fault must not be brake binding or air leakage etc"
  const cleanFaults = useMemo(() => {
    const isLongDuration = activeDuration === "7d" || activeDuration === "30d" || activeDuration === "1y" || activeDuration === "start";
    if (!isLongDuration) {
      return [];
    }
    return faults.filter((f) => {
      const t = (f.type || "").toLowerCase();
      const d = (f.description || "").toLowerCase();
      return !t.includes("binding") && !t.includes("leak") && !d.includes("binding") && !d.includes("leak");
    });
  }, [faults, activeDuration]);

  // Filter history tab: completely exclude any brake binding or air leakage faults
  const filteredHistory = useMemo(() => {
    let result = faultHistory.filter((f) => {
      const t = (f.type || "").toLowerCase();
      const d = (f.description || "").toLowerCase();
      return !t.includes("binding") && !t.includes("leak") && !d.includes("binding") && !d.includes("leak");
    });
    if (severityFilter !== "ALL") result = result.filter(f => f.severity === severityFilter);
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      result = result.filter(f =>
        f.type.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.deviceId.toLowerCase().includes(q)
      );
    }
    return result;
  }, [faultHistory, severityFilter, historySearch]);

  const historyOutsideWindow = filteredHistory.length - cleanFaults.length;

  const labelForDuration = (d: DurationPreset) =>
    TIME_PRESETS.find(p => p.value === d)?.title || "Custom Range";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-0">
      {/* Header row */}
      <div className="flex flex-col gap-2 mb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-600" />
            Faults
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {cleanFaults.length > 0 ? `${cleanFaults.length} in window` : "None in window"}
            </span>
          </h3>
          {/* Tab pills */}
          <div className="flex items-center bg-slate-100 rounded-xl p-0.5 gap-0.5">
            <button
              onClick={() => setTab("timeframe")}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer",
                tab === "timeframe"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Clock className="h-3 w-3" />
              In Timeframe
            </button>
            <button
              onClick={() => setTab("history")}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer",
                tab === "history"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              <History className="h-3 w-3" />
              Fault History
              {filteredHistory.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black">
                  {filteredHistory.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Timeline chooser — shown in timeframe tab */}
        {tab === "timeframe" && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center bg-slate-900 rounded-xl p-0.5 shadow-inner">
              {TIME_PRESETS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => handlePreset(r.value)}
                  title={r.title}
                  className={cn(
                    "px-2 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer",
                    activeDuration === r.value
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  {r.label}
                </button>
              ))}
              <button
                onClick={() => setShowCustomModal(!showCustomModal)}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all border cursor-pointer",
                  activeDuration === "custom"
                    ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                    : "text-blue-400 border-transparent hover:text-white hover:bg-slate-800"
                )}
              >
                <Calendar className="h-3 w-3" />
                <span>Custom</span>
                <ChevronDown className="h-2.5 w-2.5" />
              </button>
            </div>
          </div>
        )}

        {/* Custom date range panel */}
        {tab === "timeframe" && showCustomModal && (
          <div className="p-3 bg-gradient-to-br from-slate-50 to-blue-50/40 border border-blue-200/80 rounded-2xl shadow-sm text-xs space-y-3 animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-600 text-white">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                </div>
                <span className="font-bold text-slate-800">Custom Fault Range</span>
              </div>
              <button type="button" onClick={() => setShowCustomModal(false)} className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">From</label>
                <input type="datetime-local" value={tempStart} onChange={e => setTempStart(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">To</label>
                <input type="datetime-local" value={tempEnd} onChange={e => setTempEnd(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Quick:</span>
              {(["7d","30d","1y","start"] as const).map(s => (
                <button key={s} onClick={() => applyQuickShortcut(s)}
                  className="px-2 py-1 text-[10px] font-bold rounded-lg bg-slate-200 text-slate-700 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer">
                  {s === "7d" ? "Last 7d" : s === "30d" ? "Last Month" : s === "1y" ? "Last Year" : "All Time"}
                </button>
              ))}
              <button onClick={handleApplyCustom}
                className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold transition-colors shadow-sm cursor-pointer">
                Apply Range
              </button>
            </div>
          </div>
        )}
      </div>

      {/* TAB: In Timeframe */}
      {tab === "timeframe" && (
        <div>
          <p className="text-[10px] text-slate-400 mb-3">
            Showing faults for: <span className="font-semibold text-slate-600">{activeDuration === "custom" ? `${customRange?.start?.replace("T"," ")} – ${customRange?.end?.replace("T"," ")}` : labelForDuration(activeDuration)}</span>
          </p>

          {cleanFaults.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 mb-2">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="text-xs font-bold text-emerald-800">No faults in selected timeframe</p>
              <p className="text-[10px] text-slate-400 mt-0.5">System operating normally with zero faults</p>
              {historyOutsideWindow > 0 && (
                <button onClick={() => setTab("history")}
                  className="mt-3 text-[10px] font-bold text-blue-600 hover:text-blue-700 underline underline-offset-2 cursor-pointer">
                  {historyOutsideWindow} older event{historyOutsideWindow > 1 ? "s" : ""} stored in History →
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {cleanFaults.map((fault, i) => (
                <div key={i} className={cn("flex items-start gap-3 rounded-xl border p-3", SEVERITY_COLOR[fault.severity] || "border-slate-200 bg-slate-50")}>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-semibold text-slate-900">{fault.type}</p>
                      <span className={cn("text-[10px] font-bold rounded-full px-2 py-0.5", SEVERITY_BADGE[fault.severity] || "bg-slate-200 text-slate-700")}>
                        {fault.severity}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">{fault.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                      <Clock className="h-2.5 w-2.5" />
                      <span>{parseAndFormatIST(fault.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: Fault History */}
      {tab === "history" && (
        <div className="flex flex-col gap-3">
          {/* Search + severity filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search telemetry records..."
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="flex items-center bg-slate-100 rounded-xl p-0.5 shrink-0">
              {["ALL","NORMAL","WARNING"].map(sv => (
                <button key={sv} onClick={() => setSeverityFilter(sv)}
                  className={cn("px-2 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer",
                    severityFilter === sv ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}>
                  {sv}
                </button>
              ))}
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No historical records found.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {filteredHistory.map((fault, i) => (
                <div key={i} className={cn("flex items-start gap-3 rounded-xl border p-3", SEVERITY_COLOR[fault.severity] || "border-slate-200 bg-slate-50")}>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-semibold text-slate-900">{fault.type}</p>
                      <span className={cn("text-[10px] font-bold rounded-full px-2 py-0.5", SEVERITY_BADGE[fault.severity] || "bg-emerald-100 text-emerald-800")}>
                        {fault.severity}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">{fault.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                      <Clock className="h-2.5 w-2.5" />
                      <span>{parseAndFormatIST(fault.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-[10px] text-slate-400 text-right">{filteredHistory.length} record{filteredHistory.length !== 1 ? "s" : ""} shown</p>
        </div>
      )}
    </div>
  );
}
