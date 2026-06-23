export type CoachInfo = {
  technical_id?: string;
  coach_no: string;
  device_id: string;
  Train_no: string;
  Location: string;
  Actual_id: string;
};

export type BpcPressure = {
  timestamp: string;
  bp_raw?: number;
  fp_raw?: number;
  cr_raw?: number;
  bc_raw?: number;
  bp: number;
  fp: number;
  cr: number;
  bc: number;
  brake_status: string;
  brake_fault: string;
  brake_duration?: number;
  brake_applied_time?: string;
  brake_released_time?: string;
  coach_no: string;
  device_id: string;
  Location: string;
  Train_no: string;
};

export type BrakeFaultEvent = {
  timestamp: string;
  device_id: string;
  coach_no: string;
  fault_name: string;
  fault_duration: number;
  event_message: string;
};

export type EventPublish = {
  timestamp: string;
  device_id: string;
  coach_no: string;
  event_message: string;
  event_status: string;
};
