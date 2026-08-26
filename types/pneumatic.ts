export interface PneumaticAlerts {
  binding_residual: "green" | "red";
  binding_severe: "green" | "warning";
  leakage: "green" | "warning";
  cr_overcharge: "green" | "red";
  dv_defect: "green" | "warning";
  emergency: "green" | "yellow";
}

export interface PneumaticReadings {
  bp: number;
  fp: number;
  bc: number;
  cr: number;
  dropRate: string;
  brakeDuration: number;
  appliedTime: number;
  releasedTime: number;
}

export interface PneumaticContext {
  deviceId: string;
  coach_no: string;
  Train_no: string;
  technical_id: string;
  location: string;
}

export interface PneumaticEvent {
  id: number;
  time: string;
  status: string;
  coach: string;
  bp: number;
  bc: number;
  reason: string;
}

export interface PneumaticFault {
  deviceId: string;
  type: string;
  severity: string;
  description: string;
  timestamp: string;
}

export interface PneumaticHistoryRow {
  timestamp: string;
  device_id: string;
  location: string;
  train_no: string;
  coach_no: string;
  bp: number;
  fp: number;
  cr: number;
  bc: number;
  brake_status: string;
  brake_applied_time: number;
  brake_released_time: number;
  brake_duration: number;
}

export interface PneumaticStatusResponse {
  success: boolean;
  context: PneumaticContext;
  state: string;
  brakeStatus: string;
  alerts: PneumaticAlerts;
  readings: PneumaticReadings;
  recentEvents: PneumaticEvent[];
  activeFaults: PneumaticFault[];
  history: {
    limit: number;
    data: PneumaticHistoryRow[];
  };
  lastUpdated: string;
}

export interface CoachByLocationItem {
  id: number;
  technical_id: string;
  coach_no: string;
  device_id: string;
  Train_no: string;
  Location: string;
  Actual_id: string;
}

export interface CoachByLocationResponse {
  success: boolean;
  count: number;
  data: CoachByLocationItem[];
}
