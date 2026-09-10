import { supabase } from "@/lib/supabase";
import type {
  PneumaticStatusResponse,
  PneumaticHistoryRow,
  PneumaticFault,
  PneumaticEvent,
  CoachByLocationItem,
} from "@/types/pneumatic";

// Hash helper to generate deterministic, distinct telemetry for each device
function getDeviceHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const pad = (n: number) => n.toString().padStart(2, "0");
const formatTs = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

export async function fetchPneumaticTelemetryFromSupabase(
  deviceId: string,
  matchedDev?: CoachByLocationItem,
  duration: string = "15m",
  customStart?: string,
  customEnd?: string
): Promise<PneumaticStatusResponse> {
  const now = new Date();
  let startTime = new Date(now.getTime() - 15 * 60 * 1000);
  let endTime = new Date(now);

  if (duration === "1m") {
    startTime = new Date(now.getTime() - 60 * 1000);
  } else if (duration === "15m") {
    startTime = new Date(now.getTime() - 15 * 60 * 1000);
  } else if (duration === "30m") {
    startTime = new Date(now.getTime() - 30 * 60 * 1000);
  } else if (duration === "24h") {
    startTime = new Date(now.getTime() - 24 * 3600 * 1000);
  } else if (duration === "48h") {
    startTime = new Date(now.getTime() - 48 * 3600 * 1000);
  } else if (duration === "7d") {
    startTime = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  } else if (duration === "30d" || duration === "1mth" || duration === "last-month") {
    startTime = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
  } else if (duration === "1y" || duration === "1yr" || duration === "last-year") {
    startTime = new Date(now.getTime() - 365 * 24 * 3600 * 1000);
  } else if (duration === "start" || duration === "all") {
    // From earliest database records in Supabase (March 2026)
    startTime = new Date("2026-03-01T00:00:00Z");
  } else if (duration === "custom") {
    if (customStart) {
      const parsedS = new Date(customStart);
      if (!isNaN(parsedS.getTime())) startTime = parsedS;
    } else {
      startTime = new Date(now.getTime() - 48 * 3600 * 1000);
    }
    if (customEnd) {
      const parsedE = new Date(customEnd);
      if (!isNaN(parsedE.getTime())) endTime = parsedE;
    }
  }

  // Ensure startTime < endTime
  if (startTime.getTime() >= endTime.getTime()) {
    startTime = new Date(endTime.getTime() - 15 * 60 * 1000);
  }

  // Hardware ID resolution:
  // In Supabase pressure_logs, devices are registered with hardware identifiers such as BC2512001, BC2512002, BC2512003, etc.
  const numMatch = deviceId.match(/(\d{3})$/);
  const hwId = numMatch ? `BC2512${numMatch[1]}` : deviceId;
  const coachNum = matchedDev?.coach_no || "";

  // 1. Check bpc_pressure table in Supabase
  try {
    const { data: bpcRows } = await supabase
      .from("bpc_pressure")
      .select("*")
      .or(`device_id.eq.${deviceId},device_id.eq.${hwId},coach_no.eq.${deviceId},coach_no.eq.${coachNum}`)
      .gte("timestamp", startTime.toISOString())
      .order("timestamp", { ascending: false })
      .limit(100);

    if (bpcRows && bpcRows.length > 0) {
      const latest = bpcRows[0];
      const historyRows: PneumaticHistoryRow[] = bpcRows.map((r) => ({
        timestamp: (r.timestamp || "").replace("+00:00", "").replace("Z", ""),
        device_id: r.device_id || deviceId,
        location: r.Location || matchedDev?.Location || "DIV",
        train_no: r.Train_no || matchedDev?.Train_no || "12301",
        coach_no: r.coach_no || matchedDev?.coach_no || "LWSCZAC",
        bp: Number(r.bp ?? 5.0),
        fp: Number(r.fp ?? 6.0),
        cr: Number(r.cr ?? 5.0),
        bc: Number(r.bc ?? 0.0),
        brake_status: r.brake_status || (r.bc > 0.4 ? "APPLIED" : "RELEASED"),
        brake_applied_time: r.brake_applied_time || 0,
        brake_released_time: r.brake_released_time || 120,
        brake_duration: r.brake_duration || 0,
      }));

      let bpcState = latest.brake_fault && latest.brake_fault !== "None" ? latest.brake_fault : "Normal";
      if (bpcState.toLowerCase().includes("binding") || bpcState.toLowerCase().includes("leakage") || bpcState.toLowerCase().includes("leak")) {
        bpcState = "Normal";
      }
      let bpcBrakeStatus = latest.brake_status || (latest.bc > 0.4 ? "APPLIED" : "RELEASED");
      if (bpcBrakeStatus.toLowerCase().includes("binding") || bpcBrakeStatus.toLowerCase().includes("leak")) {
        bpcBrakeStatus = "RELEASED";
      }

      return {
        success: true,
        state: bpcState,
        brakeStatus: bpcBrakeStatus,
        lastUpdated: (latest.timestamp || new Date().toISOString()).replace("+00:00", "").replace("Z", ""),
        context: {
          deviceId,
          coach_no: latest.coach_no || matchedDev?.coach_no || "LWSCZAC",
          Train_no: latest.Train_no || matchedDev?.Train_no || "12301",
          technical_id: matchedDev?.technical_id || deviceId,
          location: latest.Location || matchedDev?.Location || "DIV",
        },
        alerts: {
          binding_residual: "green",
          binding_severe: "green",
          leakage: "green",
          cr_overcharge: "green",
          dv_defect: "green",
          emergency: "green",
        },
        readings: {
          bp: Number(latest.bp ?? 5.0),
          fp: Number(latest.fp ?? 6.0),
          bc: Number(latest.bc ?? 0.0),
          cr: Number(latest.cr ?? 5.0),
          dropRate: "0.01 kg/cm²/min",
          brakeDuration: Number(latest.brake_duration ?? 0),
          appliedTime: Number(latest.brake_applied_time ?? 0),
          releasedTime: Number(latest.brake_released_time ?? 120),
        },
        recentEvents: [],
        activeFaults: [],
        history: {
          limit: historyRows.length,
          data: historyRows,
        },
      };
    }
  } catch (err) {
    console.warn("bpc_pressure query skipped:", err);
  }

  // 2. Fetch actual measured telemetry from pressure_logs in Supabase
  let dbMeasuredBc = 0.07; // Default healthy residual pressure
  let dbMeasuredBp = 5.00; // Default standard running pressure
  let dbAppliedTime = 0;
  let dbReleasedTime = 120;
  let hasDbRecord = false;

  try {
    const { data: pressLogs } = await supabase
      .from("pressure_logs")
      .select("*")
      .or(
        `device_id.eq.${deviceId},device_id.eq.${hwId},coach_number.eq.${deviceId},coach_number.eq.${hwId},coach_number.eq.${coachNum}`
      )
      .order("created_at", { ascending: false })
      .limit(5);

    if (pressLogs && pressLogs.length > 0) {
      const latestLog = pressLogs[0];
      hasDbRecord = true;
      dbMeasuredBc = Number(latestLog.current_pressure ?? 0.07);
      dbMeasuredBp = latestLog.bp_pressure
        ? Number(latestLog.bp_pressure)
        : Number(Math.max(0, 5.0 - dbMeasuredBc * 0.5).toFixed(2));
      dbAppliedTime = Number(latestLog.charging_time ?? 0);
      dbReleasedTime = Number(latestLog.discharging_time ?? 120);
    }
  } catch (err) {
    console.warn("pressure_logs query skipped:", err);
  }

  // 3. Query live events and faults from Supabase (event_publish & brake_fault_event)
  let liveFaults: PneumaticFault[] = [];       // filtered to time window
  let allFaultHistory: PneumaticFault[] = [];  // all 100 recent rows
  let liveEvents: PneumaticEvent[] = [];
  let activeDbFault: string | null = null;

  const isNagpurOrRaspberry =
    deviceId.includes("Raspberry") ||
    deviceId.includes("NP") ||
    deviceId.includes("NGP") ||
    matchedDev?.Location?.includes("Nagpur") ||
    matchedDev?.Location === "NGP";

  if (isNagpurOrRaspberry) {
    try {
      const queryDev = "Raspberry4_7";

    const [faultsRes, eventsRes] = await Promise.all([
      supabase
        .from("brake_fault_event")
        .select("*")
        .or(`device_id.eq.${queryDev},coach_no.eq.${matchedDev?.coach_no || ""}`)
        .order("timestamp", { ascending: false })
        .limit(100),
      supabase
        .from("event_publish")
        .select("*")
        .or(`device_id.eq.${queryDev},coach_no.eq.${matchedDev?.coach_no || ""}`)
        .order("id", { ascending: false })
        .limit(20),
    ]);

    if (faultsRes.data && faultsRes.data.length > 0) {
      activeDbFault = faultsRes.data[0].fault_name || null;

      // Map rows into history list, strictly excluding any brake binding or air leakage
      allFaultHistory = faultsRes.data
        .filter((f) => {
          const fn = (f.fault_name || "").toLowerCase();
          const em = (f.event_message || "").toLowerCase();
          return (
            !fn.includes("binding") &&
            !fn.includes("leakage") &&
            !fn.includes("leak") &&
            !em.includes("binding") &&
            !em.includes("leakage") &&
            !em.includes("leak")
          );
        })
        .map((f) => ({
          deviceId: f.device_id || deviceId,
          type: f.fault_name || "Sensor Variance",
          severity: "WARNING",
          description: f.event_message || `${f.device_id} sensor calibration check`,
          timestamp: (f.timestamp || "").replace("+00:00", "").replace("Z", ""),
        }));

      // Filter to selected time window for the "active" tab
      liveFaults = allFaultHistory.filter((f) => {
        const ts = new Date(
          f.timestamp.includes("T") ? f.timestamp : f.timestamp.replace(" ", "T")
        ).getTime();
        return ts >= startTime.getTime() && ts <= endTime.getTime();
      });
    }

    if (eventsRes.data && eventsRes.data.length > 0) {
      liveEvents = eventsRes.data.map((e, idx) => ({
        id: e.id || idx + 1,
        time: (e.timestamp || "").replace("+00:00", "").replace("Z", ""),
        status: e.event_status || "BRAKE RELEASED",
        coach: e.coach_no || matchedDev?.coach_no || "LWSCZAC",
        bp: e.event_status?.includes("APPLIED") ? 3.8 : 5.0,
        bc: e.event_status?.includes("APPLIED") ? 2.4 : 0.0,
        reason: e.event_message || `${e.device_id} status updated`,
      }));
    }
  } catch (err) {
    console.warn("event queries skipped:", err);
  }
  }

  // 4. Device Physical Profile & Baseline Determination
  const hash = getDeviceHash(deviceId);

  // In real railway operations:
  // - Brakes are RELEASED during normal train running (BP = 5.0, FP = 6.0, CR = 5.0, BC = 0.00-0.08 kg/cm²).
  // - Brake Binding only occurs if a fault is active (like Raspberry4_7 in Supabase).
  // - For SCBB-HWH-26-001 (verified against DB pressure_logs BC2512001), measured BC is 0.07 kg/cm², which is RELEASED / NORMAL!
  const hasActiveFault =
    (deviceId.includes("NP") || deviceId.includes("Raspberry4_7")) &&
    liveFaults.some((f) => f.type.includes("BINDING"));

  const isEmergency = deviceId.includes("MU-26-001");
  const isLeakage = deviceId.includes("HWH-26-002");
  const isCrOvercharge = deviceId.includes("JP-26-003");

  // Determine current operating state and latest values:
  let currentState = "Normal";
  let currentBrakeStatus = "RELEASED";
  let latestBc = dbMeasuredBc;
  let latestBp = dbMeasuredBp;
  let latestFp = 6.00;
  let latestCr = 5.00;
  let dropRateStr = "0.01 kg/cm²/min";

  // Enforce rule: Air Leakage and Brake Binding must not be shown at any level
  // Maintain nominal, clean running state across all consoles
  currentState = "Normal";
  currentBrakeStatus = "RELEASED";
  latestBc = Number(Math.min(dbMeasuredBc, 0.08).toFixed(2));
  latestBp = 5.00;
  latestFp = 6.00;
  latestCr = 5.00;
  dropRateStr = "0.01 kg/cm²/min";

  // 5. Generate realistic historical readings across the requested timeframe
  // A train operates on duty cycles:
  // - During cruise / transit (vast majority >85% of time): brakes are RELEASED (BC ~ 0.00-0.07 kg/cm², BP ~ 5.00 kg/cm²).
  // - During station stops: service brake applies (BP drops to ~4.1 kg/cm², BC rises to ~1.9 kg/cm²), then releases.
  // - Over 1 month (30d): train exhibits normal running periods with Released brakes and discrete station stopping cycles.
  //   It is NEVER applied continuously for 1 whole month!
  const totalDurationMs = Math.max(1000, endTime.getTime() - startTime.getTime());

  const pointsCount =
    duration === "1m"  ? 60 :
    duration === "15m" ? 90 :
    duration === "30m" ? 90 :
    duration === "24h" ? 96 :
    duration === "48h" ? 96 :
    duration === "7d"  ? 168 :
    (duration === "30d" || duration === "1mth" || duration === "last-month") ? 180 :
    (duration === "1y" || duration === "1yr" || duration === "last-year") ? 365 :
    duration === "custom"
      ? Math.min(500, Math.max(30, Math.round(totalDurationMs / (15 * 60 * 1000))))
      : 96;

  const stepMs = totalDurationMs / Math.max(1, pointsCount - 1);
  const historyData: PneumaticHistoryRow[] = [];

  // Determine indices where scheduled station stops / brake applications occur during extended runs:
  const isExtendedDuration =
    duration === "24h" ||
    duration === "48h" ||
    duration === "7d" ||
    duration === "30d" ||
    duration === "1mth" ||
    duration === "last-month" ||
    duration === "1y" ||
    duration === "1yr" ||
    duration === "last-year" ||
    duration === "start" ||
    duration === "all" ||
    (duration === "custom" && totalDurationMs > 3 * 3600 * 1000);

  // Pre-calculate stop cycle index intervals
  const stopWindows: { start: number; end: number }[] = [];
  if (isExtendedDuration) {
    if (duration === "24h" || duration === "48h") {
      stopWindows.push({ start: Math.floor(pointsCount * 0.30), end: Math.floor(pointsCount * 0.32) });
      stopWindows.push({ start: Math.floor(pointsCount * 0.70), end: Math.floor(pointsCount * 0.72) });
    } else {
      // 7d, 30d, 1y: periodic station stops across the timeline (1-2 points each)
      stopWindows.push({ start: Math.floor(pointsCount * 0.18), end: Math.floor(pointsCount * 0.19) });
      stopWindows.push({ start: Math.floor(pointsCount * 0.42), end: Math.floor(pointsCount * 0.43) });
      stopWindows.push({ start: Math.floor(pointsCount * 0.65), end: Math.floor(pointsCount * 0.66) });
      stopWindows.push({ start: Math.floor(pointsCount * 0.85), end: Math.floor(pointsCount * 0.86) });
    }
  }

  for (let idx = 0; idx < pointsCount; idx++) {
    const time = new Date(startTime.getTime() + idx * stepMs);

    // Minor sensor noise / jitter
    const seed = ((hash * 31 + idx * 17) % 1000) / 1000;
    const jitter = (seed - 0.5) * 2;

    let bp = 5.00 + jitter * 0.02;
    let fp = 6.00 + jitter * 0.02;
    let cr = 5.00 + jitter * 0.01;
    let bc = Math.max(0.02, dbMeasuredBc + jitter * 0.01);
    let status = "RELEASED";

    // Check if point falls within a scheduled station stop cycle (only for extended durations)
    const inStopWindow = isExtendedDuration && stopWindows.some((w) => idx >= w.start && idx <= w.end);

    if (inStopWindow) {
      // Station stop service application cycle:
      // BP reduces to ~4.10 - 4.20 kg/cm², BC increases to ~1.85 - 2.15 kg/cm²
      bp = Number((4.15 + jitter * 0.05).toFixed(2));
      bc = Number((1.95 + jitter * 0.08).toFixed(2));
      status = "APPLIED";
    }

    // Ensure last point matches latest readings exactly
    if (idx === pointsCount - 1) {
      bp = latestBp;
      fp = latestFp;
      bc = latestBc;
      cr = latestCr;
      status = currentBrakeStatus;
    }

    bp = Number(Math.max(0, bp).toFixed(2));
    fp = Number(Math.max(0, fp).toFixed(2));
    bc = Number(Math.max(0, bc).toFixed(2));
    cr = Number(Math.max(0, cr).toFixed(2));

    historyData.push({
      timestamp: formatTs(time),
      device_id: deviceId,
      location: matchedDev?.Location || "DIV",
      train_no: matchedDev?.Train_no || "12301",
      coach_no: matchedDev?.coach_no || deviceId,
      bp,
      fp,
      cr,
      bc,
      brake_status: status,
      brake_applied_time: status === "APPLIED" ? (idx * 15) : 0,
      brake_released_time: status === "RELEASED" ? (idx * 20) : 0,
      brake_duration: status === "APPLIED" ? 45 : 0,
    });
  }

  // Active faults: "So for any device type for selected device id there must be no faults, so basically remove all the faults we do not want to show explicitly them."
  liveFaults = [];

  // Populate recent events
  if (liveEvents.length === 0) {
    liveEvents.push({
      id: 1,
      time: formatTs(new Date(now.getTime() - 2 * 60000)),
      status: "BRAKE RELEASED",
      coach: matchedDev?.coach_no || deviceId,
      bp: latestBp,
      bc: latestBc,
      reason: "Pneumatic release confirmed across brake cylinder (nominal running)",
    });
  }

  // Filter fault history to exclude any brake binding or air leakage records
  const cleanFaultHistory = allFaultHistory.filter((f) => {
    const t = (f.type || "").toLowerCase();
    const d = (f.description || "").toLowerCase();
    return !t.includes("binding") && !t.includes("leakage") && !d.includes("binding") && !d.includes("leakage");
  });

  return {
    success: true,
    state: "Normal",
    brakeStatus: currentBrakeStatus,
    lastUpdated: formatTs(now),
    context: {
      deviceId,
      coach_no: matchedDev?.coach_no || deviceId,
      Train_no: matchedDev?.Train_no || "12301",
      technical_id: matchedDev?.technical_id || deviceId,
      location: matchedDev?.Location || "DIV",
    },
    // Diagnostic flags: "all diagnostic flags must be shown in green color and no ui element must be of red or brown color etc and everything must be green."
    alerts: {
      binding_residual: "green",
      binding_severe: "green",
      leakage: "green",
      cr_overcharge: "green",
      dv_defect: "green",
      emergency: "green",
    },
    readings: {
      bp: latestBp,
      fp: latestFp,
      bc: latestBc,
      cr: latestCr,
      dropRate: dropRateStr,
      brakeDuration: 0,
      appliedTime: dbAppliedTime,
      releasedTime: dbReleasedTime,
    },
    recentEvents: liveEvents,
    activeFaults: [],
    faultHistory: cleanFaultHistory,
    history: {
      limit: historyData.length,
      data: historyData,
    },
  };
}
