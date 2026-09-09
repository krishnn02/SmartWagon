"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  X, Printer, FileDown, Calendar, ChevronDown, SlidersHorizontal,
  Train, Cpu, MapPin, User, Clock, Loader2, AlertCircle, RotateCw,
} from "lucide-react";
import { cn, parseAndFormatIST } from "@/lib/utils";
import type { PneumaticHistoryRow, CoachByLocationItem } from "@/types/pneumatic";
import type { HamsData, MappedCoachData } from "@/types/hot-axle";
import type { DurationPreset } from "@/components/brake-binding/pressure-chart";
import { fetchPneumaticTelemetryFromSupabase } from "@/lib/pneumatic-supabase";

/* ── Time presets ─────────────────────────────────────────────────── */
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
    return {
      startMs: new Date(customStart).getTime(),
      endMs: customEnd ? new Date(customEnd).getTime() : now,
    };
  }
  const map: Record<string, number> = {
    "1m": 60_000, "15m": 900_000, "30m": 1_800_000,
    "24h": 86_400_000, "48h": 172_800_000,
    "7d": 604_800_000, "30d": 2_592_000_000,
    "1y": 31_536_000_000, "start": now - new Date("2026-03-01").getTime(),
  };
  return { startMs: now - (map[d] ?? 900_000), endMs: now };
}

/* ── Types ────────────────────────────────────────────────────────── */
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
  /** Pass the matched device so the report can independently fetch data for any duration */
  matchedDev?: CoachByLocationItem;
  brakeHistory?: PneumaticHistoryRow[];
  hotAxleCoach?: MappedCoachData;
  rawHamsData?: HamsData[];
}

/* ── Sensor → Axle slot ───────────────────────────────────────────── */
const SENSOR_SLOT: Record<string, string> = {
  HAMS001: "A1-1", HAMS002: "A1-2",
  HAMS003: "A2-1", HAMS004: "A2-2",
  HAMS005: "A3-1", HAMS006: "A3-2",
  HAMS007: "A4-1", HAMS009: "A4-1", HAMS008: "A4-2",
};

/* ── Helpers ──────────────────────────────────────────────────────── */
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

function downloadCSV(rows: string[][], filename: string) {
  const csv = rows.map(r =>
    r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")
  ).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ────────────────────────────────────────────────────────────────────
   Build printable HTML string (runs in a new window)
─────────────────────────────────────────────────────────────────── */
function buildPrintHTML(
  meta: ReportDeviceMeta,
  periodLabel: string,
  brakeRows: PneumaticHistoryRow[],
  axleRows: HamsData[],
  generatedAt: string,
) {
  const isBrake = meta.deviceType === "brake-binding";

  /* ── summary stats ── */
  const brakeSummary = isBrake ? {
    avgBP:  brakeRows.length ? (brakeRows.reduce((s, r) => s + r.bp, 0) / brakeRows.length).toFixed(2) : "—",
    avgBC:  brakeRows.length ? (brakeRows.reduce((s, r) => s + r.bc, 0) / brakeRows.length).toFixed(2) : "—",
    applied: brakeRows.filter(r => r.brake_status === "APPLIED" || r.bc > 0.4).length,
    total:  brakeRows.length,
  } : null;

  const axleSummary = !isBrake ? {
    maxTemp:  axleRows.length ? Math.max(...axleRows.map(r => r.temperature ?? 0)).toFixed(1) : "—",
    avgTemp:  axleRows.length ? (axleRows.reduce((s, r) => s + (r.temperature ?? 0), 0) / axleRows.length).toFixed(1) : "—",
    critical: axleRows.filter(r => (r.temperature ?? 0) >= 100).length,
    total:    axleRows.length,
  } : null;

  /* ── table header / rows ── */
  const tableHead = isBrake
    ? `<tr>
        <th>#</th><th>Timestamp (IST)</th><th>BP (kg/cm²)</th><th>FP (kg/cm²)</th>
        <th>CR (kg/cm²)</th><th>BC (kg/cm²)</th><th>Brake Status</th>
        <th>Duration (s)</th><th>Applied (s)</th><th>Released (s)</th>
       </tr>`
    : `<tr>
        <th>#</th><th>Timestamp (IST)</th><th>Sensor ID</th><th>Axle Position</th>
        <th>Temperature (°C)</th><th>Status</th><th>Battery (V)</th><th>Resistance (Ω)</th>
       </tr>`;

  const brakeTableRows = brakeRows.map((r, i) => {
    const applied = r.brake_status === "APPLIED" || r.bc > 0.4;
    return `<tr class="${applied ? "applied" : i % 2 === 0 ? "" : "alt"}">
      <td>${i + 1}</td>
      <td>${formatIST(r.timestamp)}</td>
      <td class="num">${r.bp.toFixed(2)}</td>
      <td class="num">${r.fp.toFixed(2)}</td>
      <td class="num">${r.cr.toFixed(2)}</td>
      <td class="num ${applied ? "bc-applied" : ""}">${r.bc.toFixed(2)}</td>
      <td><span class="badge ${applied ? "badge-red" : "badge-green"}">${r.brake_status || (applied ? "APPLIED" : "RELEASED")}</span></td>
      <td class="num">${r.brake_duration ?? "—"}</td>
      <td class="num">${r.brake_applied_time ?? "—"}</td>
      <td class="num">${r.brake_released_time ?? "—"}</td>
    </tr>`;
  }).join("");

  const axleTableRows = axleRows.map((r, i) => {
    const temp = r.temperature ?? 0;
    const slot = SENSOR_SLOT[r.device_id || ""] || "—";
    const isCrit = temp >= 100;
    const isWarn = temp >= 70 && temp < 100;
    const statusText = r.status || r.temp_state || "Normal";
    const statusCls = isCrit ? "badge-red" : isWarn ? "badge-amber" : "badge-green";
    return `<tr class="${i % 2 === 0 ? "" : "alt"}">
      <td>${i + 1}</td>
      <td>${formatIST(r.created_at)}</td>
      <td class="num">${r.device_id || "—"}</td>
      <td class="num">${slot}</td>
      <td class="num ${isCrit ? "bc-applied" : ""}">${temp.toFixed(1)}</td>
      <td><span class="badge ${statusCls}">${statusText}</span></td>
      <td class="num">${r.battery_voltage?.toFixed(2) ?? "—"}</td>
      <td class="num">${r.resistance?.toFixed(1) ?? "—"}</td>
    </tr>`;
  }).join("");

  const summaryRow = isBrake && brakeSummary ? `
    <div class="summary-grid">
      <div class="summary-card"><div class="s-label">Avg BP</div><div class="s-val">${brakeSummary.avgBP} kg/cm²</div></div>
      <div class="summary-card"><div class="s-label">Avg BC</div><div class="s-val">${brakeSummary.avgBC} kg/cm²</div></div>
      <div class="summary-card"><div class="s-label">Brake Applied Events</div><div class="s-val">${brakeSummary.applied}</div></div>
      <div class="summary-card"><div class="s-label">Total Records</div><div class="s-val">${brakeSummary.total}</div></div>
    </div>` : axleSummary ? `
    <div class="summary-grid">
      <div class="summary-card"><div class="s-label">Max Temp</div><div class="s-val">${axleSummary.maxTemp} °C</div></div>
      <div class="summary-card"><div class="s-label">Avg Temp</div><div class="s-val">${axleSummary.avgTemp} °C</div></div>
      <div class="summary-card"><div class="s-label">Critical Readings</div><div class="s-val">${axleSummary.critical}</div></div>
      <div class="summary-card"><div class="s-label">Total Records</div><div class="s-val">${axleSummary.total}</div></div>
    </div>` : "";

  const emptyMsg = (isBrake ? brakeRows.length : axleRows.length) === 0
    ? `<tr><td colspan="10" style="text-align:center;padding:32px;color:#64748b;">
         No records found for the selected period. Try a wider time window.
       </td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${isBrake ? "Brake Binding" : "Hot Axle"} Report — ${meta.deviceId}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #1e293b; background: #fff; padding: 16px; }

    /* ── Report Header ── */
    .report-header { display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 2.5px solid #1e293b; padding-bottom: 14px; margin-bottom: 16px; }
    .logo-block { display: flex; align-items: center; gap: 14px; }
    .logo-block img { height: 72px; width: 72px; object-fit: contain; }
    .org h1 { font-size: 17px; font-weight: 900; color: #1e293b; }
    .org p  { font-size: 11px; color: #475569; margin-top: 2px; }
    .report-type { text-align: right; }
    .report-type .badge-type { display: inline-block; background: #4f46e5; color: #fff; font-size: 10px; font-weight: 900; padding: 3px 10px; border-radius: 6px; letter-spacing: 0.08em; margin-bottom: 6px; }
    .report-type .gen-info { font-size: 10px; color: #64748b; }

    /* ── Metadata grid ── */
    .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px; }
    .meta-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; }
    .meta-card .m-label { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.12em; color: #94a3b8; margin-bottom: 3px; }
    .meta-card .m-val   { font-size: 11px; font-weight: 700; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    /* ── Table ── */
    .table-title { font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.06em; color: #1e293b; margin-bottom: 8px; border-left: 4px solid #4f46e5; padding-left: 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    thead tr { background: #1e293b; color: #fff; }
    th { padding: 7px 8px; text-align: left; font-weight: 900; text-transform: uppercase; letter-spacing: 0.06em; font-size: 9px; white-space: nowrap; }
    td { padding: 5px 8px; border-bottom: 1px solid #f1f5f9; }
    tr.alt { background: #f8fafc; }
    tr.applied { background: #fef2f2; }
    .num { font-family: 'Courier New', monospace; font-weight: 600; }
    .bc-applied { color: #dc2626; font-weight: 700; }

    /* ── Badges ── */
    .badge { display: inline-block; padding: 1px 7px; border-radius: 99px; font-size: 9px; font-weight: 900; }
    .badge-red   { background: #fee2e2; color: #991b1b; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-amber { background: #fef3c7; color: #92400e; }

    /* ── Summary ── */
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 14px; }
    .summary-card { background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 8px 10px; }
    .s-label { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #6366f1; margin-bottom: 3px; }
    .s-val   { font-size: 15px; font-weight: 900; color: #3730a3; }

    /* ── Footer ── */
    .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 9px; color: #94a3b8; }

    @media print {
      body { padding: 0; }
      @page { size: A4 landscape; margin: 12mm 14mm; }
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="report-header">
    <div class="logo-block">
      <img src="${window.location.origin}/indian-railways-logo.png" alt="Indian Railways" />
      <div class="org">
        <p style="font-size:9px;font-weight:900;letter-spacing:0.18em;text-transform:uppercase;color:#64748b;">Government of India</p>
        <h1>Ministry of Railways</h1>
        <p>Smart Coach Monitoring System</p>
        <p style="color:#94a3b8;margin-top:2px;">Vehicle Axle Safety Platform — VASP v2.0</p>
      </div>
    </div>
    <div class="report-type">
      <div class="badge-type">${isBrake ? "BRAKE BINDING DIAGNOSTIC" : "HOT AXLE DETECTION"}</div>
      <div class="gen-info">Generated: ${generatedAt} IST</div>
      <div class="gen-info">By: ${meta.generatedBy || "System"}</div>
    </div>
  </div>

  <!-- Metadata -->
  <div class="meta-grid">
    <div class="meta-card"><div class="m-label">Device ID</div><div class="m-val">${meta.deviceId || "—"}</div></div>
    <div class="meta-card"><div class="m-label">Train No</div><div class="m-val">${meta.trainNo || "—"}</div></div>
    <div class="meta-card"><div class="m-label">Coach No</div><div class="m-val">${meta.coachNo || "—"}</div></div>
    <div class="meta-card"><div class="m-label">Division</div><div class="m-val">${meta.division || meta.location || "—"}</div></div>
    <div class="meta-card"><div class="m-label">Zone</div><div class="m-val">${meta.zone || "—"}</div></div>
    <div class="meta-card"><div class="m-label">Report Period</div><div class="m-val">${periodLabel}</div></div>
    <div class="meta-card"><div class="m-label">Total Records</div><div class="m-val">${isBrake ? brakeRows.length : axleRows.length}</div></div>
    <div class="meta-card"><div class="m-label">Report Timestamp</div><div class="m-val">${generatedAt}</div></div>
  </div>

  <!-- Table -->
  <div class="table-title">${isBrake ? "Brake Binding Telemetry Data" : "Hot Axle Sensor Data"}</div>
  <table>
    <thead>${tableHead}</thead>
    <tbody>${emptyMsg || (isBrake ? brakeTableRows : axleTableRows)}</tbody>
  </table>

  <!-- Summary -->
  ${summaryRow}

  <!-- Footer -->
  <div class="footer">
    <span>Smart Coach Web — VASP v2.0 | Indian Railways</span>
    <span>Confidential — For Internal Use Only</span>
    <span>Page 1 of 1</span>
  </div>

  <script>
    window.onload = function() {
      window.print();
      // Close the print window after the dialog
      window.onafterprint = function() { window.close(); };
    };
  </script>
</body>
</html>`;
}

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
export function ReportModal({ onClose, meta, matchedDev, brakeHistory = [], hotAxleCoach, rawHamsData = [] }: ReportModalProps) {
  const [duration, setDuration] = useState<DurationPreset>("24h");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd]     = useState<string>("");
  const [showCustom, setShowCustom]   = useState(false);
  const [fetching, setFetching]       = useState(false);
  const [fetchError, setFetchError]   = useState<string | null>(null);
  // Independently fetched brake data — not the dashboard's limited cache
  const [reportBrakeData, setReportBrakeData] = useState<PneumaticHistoryRow[] | null>(null);

  /* local datetime helpers */
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const toInput = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const [tempStart, setTempStart] = useState(toInput(new Date(now.getTime() - 48 * 3_600_000)));
  const [tempEnd,   setTempEnd]   = useState(toInput(now));

  /* ── Preset selection ── */
  const handlePreset = (v: DurationPreset) => {
    if (v === "custom") { setShowCustom(true); return; }
    setShowCustom(false);
    setDuration(v);
    setCustomStart(""); setCustomEnd("");
    setReportBrakeData(null); setFetchError(null);
  };

  const handleApplyCustom = () => {
    if (!tempStart) return;
    setDuration("custom");
    setCustomStart(tempStart);
    setCustomEnd(tempEnd || toInput(new Date()));
    setShowCustom(false);
    setReportBrakeData(null); setFetchError(null);
  };

  const applyQuick = (p: "7d" | "30d" | "1y" | "start") => {
    const curr = new Date();
    let s = new Date(curr.getTime() - 7 * 24 * 3_600_000);
    if (p === "30d")   s = new Date(curr.getTime() - 30 * 24 * 3_600_000);
    if (p === "1y")    s = new Date(curr.getTime() - 365 * 24 * 3_600_000);
    if (p === "start") s = new Date("2026-03-01T00:00:00Z");
    const sStr = toInput(s); const eStr = toInput(curr);
    setTempStart(sStr); setTempEnd(eStr);
    setDuration("custom"); setCustomStart(sStr); setCustomEnd(eStr);
    setShowCustom(false);
    setReportBrakeData(null); setFetchError(null);
  };

  /* ── Independent fetch on duration / range change ─────────────── */
  const fetchData = useCallback(async () => {
    if (meta.deviceType !== "brake-binding" || !meta.deviceId) return;
    setFetching(true);
    setFetchError(null);
    try {
      const result = await fetchPneumaticTelemetryFromSupabase(
        meta.deviceId,
        matchedDev,
        duration,
        customStart || undefined,
        customEnd || undefined
      );
      const rows = (result.history?.data || []).sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      setReportBrakeData(rows);
    } catch (err) {
      setFetchError("Failed to fetch fresh telemetry data. Displaying available records.");
      console.error("Report fetch error:", err);
    } finally {
      setFetching(false);
    }
  }, [meta.deviceId, meta.deviceType, matchedDev, duration, customStart, customEnd]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── filteredBrake: use freshly fetched data; fall back to snapshot ─ */
  const filteredBrake = useMemo(() => {
    if (meta.deviceType !== "brake-binding") return [];
    // If we have independently fetched data, use it (already correct window)
    if (reportBrakeData !== null) return reportBrakeData;
    // Fallback: filter the passed-in snapshot (may be limited)
    const { startMs, endMs } = durationToMs(duration, customStart, customEnd);
    return [...brakeHistory]
      .filter(r => {
        const t = new Date((r.timestamp || "").replace(" ", "T")).getTime();
        return t >= startMs && t <= endMs;
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [meta.deviceType, reportBrakeData, brakeHistory, duration, customStart, customEnd]);

  const filteredAxle = useMemo(() => {
    if (meta.deviceType !== "hot-axle") return [];
    const { startMs, endMs } = durationToMs(duration, customStart, customEnd);
    return [...rawHamsData]
      .filter(r => {
        const t = new Date(r.created_at || r.received_timestamp || "").getTime();
        return t >= startMs && t <= endMs;
      })
      .sort((a, b) =>
        new Date(a.created_at || "").getTime() - new Date(b.created_at || "").getTime()
      );
  }, [meta.deviceType, rawHamsData, duration, customStart, customEnd]);

  const labelForDuration = TIME_PRESETS.find(p => p.value === duration)?.title || "Custom Range";
  const periodLabel = duration === "custom" && customStart
    ? `${customStart.replace("T", " ")} → ${(customEnd || toInput(now)).replace("T", " ")} IST`
    : labelForDuration;

  const recordCount = meta.deviceType === "brake-binding" ? filteredBrake.length : filteredAxle.length;

  /* ── CSV: download immediately ── */
  const handleCSV = useCallback(() => {
    if (meta.deviceType === "brake-binding") {
      const headers = ["Timestamp (IST)","BP (kg/cm²)","FP (kg/cm²)","CR (kg/cm²)","BC (kg/cm²)","Brake Status","Brake Duration (s)","Applied Time (s)","Release Time (s)"];
      const rows = filteredBrake.map(r => [
        formatIST(r.timestamp), r.bp.toFixed(2), r.fp.toFixed(2),
        r.cr.toFixed(2), r.bc.toFixed(2), r.brake_status,
        String(r.brake_duration ?? ""), String(r.brake_applied_time ?? ""), String(r.brake_released_time ?? ""),
      ]);
      downloadCSV([headers, ...rows], `BrakeBinding_${meta.deviceId}_${duration}.csv`);
    } else {
      const headers = ["Timestamp (IST)","Sensor ID","Axle Position","Temperature (°C)","Status","Battery Voltage (V)","Resistance (Ω)"];
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

  /* ── Print: open new window with isolated report HTML ── */
  const handlePrint = useCallback(() => {
    const html = buildPrintHTML(meta, periodLabel, filteredBrake, filteredAxle, nowIST());
    const win = window.open("", "_blank", "width=1100,height=800");
    if (!win) { alert("Please allow pop-ups for this site to print reports."); return; }
    win.document.open();
    win.document.write(html);
    win.document.close();
  }, [meta, periodLabel, filteredBrake, filteredAxle]);

  /* ── Summary stats ── */
  const brakeSummary = {
    avgBP: filteredBrake.length ? (filteredBrake.reduce((s, r) => s + r.bp, 0) / filteredBrake.length).toFixed(2) : "—",
    avgBC: filteredBrake.length ? (filteredBrake.reduce((s, r) => s + r.bc, 0) / filteredBrake.length).toFixed(2) : "—",
    applied: filteredBrake.filter(r => r.brake_status === "APPLIED" || r.bc > 0.4).length,
  };
  const axleSummary = {
    maxTemp: filteredAxle.length ? Math.max(...filteredAxle.map(r => r.temperature ?? 0)).toFixed(1) : "—",
    avgTemp: filteredAxle.length ? (filteredAxle.reduce((s, r) => s + (r.temperature ?? 0), 0) / filteredAxle.length).toFixed(1) : "—",
    critical: filteredAxle.filter(r => (r.temperature ?? 0) >= 100).length,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-4 px-4">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden">

        {/* ── Top action bar ── */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 to-indigo-900 text-white">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/indian-railways-logo.png" alt="Indian Railways" className="h-10 w-10 object-contain drop-shadow-lg" />
            <div>
              <p className="text-[10px] font-black tracking-widest uppercase text-indigo-300">Ministry of Railways</p>
              <h2 className="text-base font-bold leading-tight">
                {meta.deviceType === "brake-binding" ? "Brake Binding" : "Hot Axle"} Report Generator
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Record count badge */}
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5",
              fetching
                ? "bg-indigo-500/20 text-indigo-200 border-indigo-400/30"
                : "bg-white/10 text-white border-white/20"
            )}>
              {fetching && <Loader2 className="h-3 w-3 animate-spin text-indigo-300" />}
              {fetching ? "Fetching records..." : `${recordCount} record${recordCount !== 1 ? "s" : ""}`}
            </span>
            <button
              onClick={handleCSV}
              disabled={fetching || recordCount === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md"
              title="Export table as CSV file"
            >
              <FileDown className="h-3.5 w-3.5" />
              Export CSV
            </button>
            <button
              onClick={handlePrint}
              disabled={fetching || recordCount === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md"
              title="Print or Save as PDF"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / PDF
            </button>
            <button onClick={onClose} className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Period chooser ── */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Report Period</span>
                <span className="text-[10px] text-slate-400 font-medium">— table updates instantly on selection</span>
              </div>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
                {periodLabel}
              </span>
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
                {meta.deviceType === "brake-binding" && (
                  <button
                    onClick={fetchData}
                    disabled={fetching}
                    title="Refresh data from Supabase for this period"
                    className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all border border-transparent disabled:opacity-40"
                  >
                    <RotateCw className={cn("h-2.5 w-2.5", fetching && "animate-spin text-indigo-400")} />
                    <span>Refresh</span>
                  </button>
                )}
              </div>
            </div>

            {/* Fetch error alert banner */}
            {fetchError && (
              <div className="flex items-center justify-between gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                  <span>{fetchError}</span>
                </div>
                <button
                  onClick={fetchData}
                  className="px-2 py-0.5 rounded bg-amber-200 hover:bg-amber-300 font-bold text-[10px] text-amber-900 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Custom range panel */}
            {showCustom && (
              <div className="p-3 bg-white border border-indigo-200 rounded-2xl shadow-sm text-xs space-y-3 animate-in fade-in-50 duration-150">
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
          </div>
        </div>

        {/* ── Report preview body ── */}
        <div className="p-6 overflow-y-auto max-h-[65vh]">

          {/* Loading status indicator */}
          {fetching && (
            <div className="flex items-center justify-center gap-2 py-3 px-4 bg-indigo-50/70 border border-indigo-100 rounded-xl mb-4 text-xs font-bold text-indigo-900 animate-pulse">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
              <span>Fetching telemetry data for {periodLabel}...</span>
            </div>
          )}

          {/* Device metadata grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {([
              { icon: Cpu,    label: "Device ID",    value: meta.deviceId || "—" },
              { icon: Train,  label: "Train No",     value: meta.trainNo  || "—" },
              { icon: Train,  label: "Coach No",     value: meta.coachNo  || "—" },
              { icon: MapPin, label: "Division",     value: meta.division || meta.location || "—" },
              { icon: MapPin, label: "Zone",         value: meta.zone     || "—" },
              { icon: Clock,  label: "Period",       value: periodLabel },
              { icon: User,   label: "Generated By", value: meta.generatedBy || "System" },
              { icon: Clock,  label: "Report Time",  value: nowIST() + " IST" },
            ] as const).map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="h-3 w-3 text-indigo-600" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</span>
                </div>
                <p className="text-xs font-bold text-slate-900 truncate">{value}</p>
              </div>
            ))}
          </div>

          {/* Summary stats */}
          {meta.deviceType === "brake-binding" && filteredBrake.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: "Avg BP",               value: brakeSummary.avgBP + " kg/cm²" },
                { label: "Avg BC",               value: brakeSummary.avgBC + " kg/cm²" },
                { label: "Brake Applied Events", value: String(brakeSummary.applied) },
              ].map(s => (
                <div key={s.label} className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                  <p className="text-[9px] text-indigo-500 font-black uppercase tracking-wider">{s.label}</p>
                  <p className="text-lg font-black text-indigo-900">{s.value}</p>
                </div>
              ))}
            </div>
          )}
          {meta.deviceType === "hot-axle" && filteredAxle.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: "Max Temp",        value: axleSummary.maxTemp + " °C" },
                { label: "Avg Temp",        value: axleSummary.avgTemp + " °C" },
                { label: "Critical Readings", value: String(axleSummary.critical) },
              ].map(s => (
                <div key={s.label} className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                  <p className="text-[9px] text-indigo-500 font-black uppercase tracking-wider">{s.label}</p>
                  <p className="text-lg font-black text-indigo-900">{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Data table */}
          {meta.deviceType === "brake-binding"
            ? <BrakeTable rows={filteredBrake} />
            : <AxleTable  rows={filteredAxle} />
          }
        </div>
      </div>
    </div>
  );
}

/* ─── BRAKE TABLE ─────────────────────────────────────────────────── */
function BrakeTable({ rows }: { rows: PneumaticHistoryRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        <p className="text-sm font-bold text-slate-400">No records for selected period</p>
        <p className="text-xs text-slate-400 mt-1">Try a wider time window (e.g. 7d or 1M)</p>
      </div>
    );
  }
  return (
    <div>
      <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
        <span className="w-1 h-4 rounded-full bg-indigo-600 inline-block" />
        Brake Binding Telemetry — {rows.length} Records
      </h2>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-[10px] border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white">
              {["#","Timestamp (IST)","BP","FP","CR","BC","Brake Status","Duration (s)","Applied (s)","Released (s)"].map(h => (
                <th key={h} className="px-2.5 py-2 text-left font-black uppercase tracking-wider text-[9px] whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const applied = r.brake_status === "APPLIED" || r.bc > 0.4;
              return (
                <tr key={i} className={cn("border-b border-slate-100", applied ? "bg-red-50" : i % 2 === 0 ? "bg-white" : "bg-slate-50/50")}>
                  <td className="px-2.5 py-1.5 text-slate-400 font-mono">{i + 1}</td>
                  <td className="px-2.5 py-1.5 font-mono text-slate-600 whitespace-nowrap">{formatIST(r.timestamp)}</td>
                  <td className="px-2.5 py-1.5 font-mono font-semibold text-blue-700">{r.bp.toFixed(2)}</td>
                  <td className="px-2.5 py-1.5 font-mono font-semibold text-emerald-700">{r.fp.toFixed(2)}</td>
                  <td className="px-2.5 py-1.5 font-mono font-semibold text-amber-700">{r.cr.toFixed(2)}</td>
                  <td className={cn("px-2.5 py-1.5 font-mono font-bold", applied ? "text-red-700" : "text-slate-700")}>{r.bc.toFixed(2)}</td>
                  <td className="px-2.5 py-1.5">
                    <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold", applied ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800")}>
                      {r.brake_status || (applied ? "APPLIED" : "RELEASED")}
                    </span>
                  </td>
                  <td className="px-2.5 py-1.5 font-mono text-slate-600">{r.brake_duration ?? "—"}</td>
                  <td className="px-2.5 py-1.5 font-mono text-slate-600">{r.brake_applied_time ?? "—"}</td>
                  <td className="px-2.5 py-1.5 font-mono text-slate-600">{r.brake_released_time ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── AXLE TABLE ──────────────────────────────────────────────────── */
function AxleTable({ rows }: { rows: HamsData[] }) {
  if (rows.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        <p className="text-sm font-bold text-slate-400">No axle records for selected period</p>
        <p className="text-xs text-slate-400 mt-1">Try a wider time window (e.g. 7d or 1M)</p>
      </div>
    );
  }
  return (
    <div>
      <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
        <span className="w-1 h-4 rounded-full bg-indigo-600 inline-block" />
        Hot Axle Sensor Data — {rows.length} Records
      </h2>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-[10px] border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white">
              {["#","Timestamp (IST)","Sensor ID","Axle Position","Temp (°C)","Status","Battery (V)","Resistance (Ω)"].map(h => (
                <th key={h} className="px-2.5 py-2 text-left font-black uppercase tracking-wider text-[9px] whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const temp = r.temperature ?? 0;
              const slot = SENSOR_SLOT[r.device_id || ""] || "—";
              const isCrit = temp >= 100;
              const isWarn = temp >= 70 && temp < 100;
              return (
                <tr key={i} className={cn("border-b border-slate-100", isCrit ? "bg-red-50" : i % 2 === 0 ? "bg-white" : "bg-slate-50/50")}>
                  <td className="px-2.5 py-1.5 text-slate-400 font-mono">{i + 1}</td>
                  <td className="px-2.5 py-1.5 font-mono text-slate-600 whitespace-nowrap">{formatIST(r.created_at)}</td>
                  <td className="px-2.5 py-1.5 font-mono font-semibold text-indigo-700">{r.device_id || "—"}</td>
                  <td className="px-2.5 py-1.5 font-mono font-bold text-slate-800">{slot}</td>
                  <td className={cn("px-2.5 py-1.5 font-mono font-bold", isCrit ? "text-red-700" : isWarn ? "text-orange-600" : "text-emerald-700")}>
                    {temp.toFixed(1)}
                  </td>
                  <td className="px-2.5 py-1.5">
                    <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold",
                      isCrit ? "bg-red-100 text-red-800" : isWarn ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800")}>
                      {r.status || r.temp_state || "Normal"}
                    </span>
                  </td>
                  <td className="px-2.5 py-1.5 font-mono text-slate-600">{r.battery_voltage?.toFixed(2) ?? "—"}</td>
                  <td className="px-2.5 py-1.5 font-mono text-slate-600">{r.resistance?.toFixed(1) ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
