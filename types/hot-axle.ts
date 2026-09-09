export interface CoachHams {
  id: number;
  technical_id: string | null;
  coach_no: string | null;
  device_id: string | null;
  train_no: string | null;
  location: string | null;
  actual_id: string | null;
}

export interface HamsData {
  id: number;
  master_id: string | null;
  device_id: string | null;
  generation_no: number | null;
  sequence_no: number | null;
  received_timestamp: string | null;
  device_time: string | null;
  temperature: number | null;
  status: string | null;
  temp_state: string | null;
  resistance: number | null;
  pt1000_voltage: number | null;
  pt1000_adc: number | null;
  battery_ads_voltage: number | null;
  battery_voltage: number | null;
  battery_adc: number | null;
  battery_status: string | null;
  message: string | null;
  db_id: number | null;
  created_at: string | null;
}

export interface AxleReading {
  sensorId: string;
  temperature: number;
  isCritical: boolean;
  isWarning: boolean;
  timestamp?: string | null;
}

export interface MappedCoachData {
  coach: CoachHams;
  readings: HamsData[];
  maxTemp: number;
  status: 'Good' | 'Warning' | 'Critical';
  axleSlots: {
    'A1-1'?: AxleReading;
    'A1-2'?: AxleReading;
    'A2-1'?: AxleReading;
    'A2-2'?: AxleReading;
    'A3-1'?: AxleReading;
    'A3-2'?: AxleReading;
    'A4-1'?: AxleReading;
    'A4-2'?: AxleReading;
  };
  latestTimestamp: string | null;
}
