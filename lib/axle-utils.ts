
export type AxleSlotId = 'A1-1' | 'A1-2' | 'A2-1' | 'A2-2' | 'A3-1' | 'A3-2' | 'A4-1' | 'A4-2';

export const AXLE_SLOT_NAMES: AxleSlotId[] = [
  'A1-1', 'A1-2',
  'A2-1', 'A2-2',
  'A3-1', 'A3-2',
  'A4-1', 'A4-2'
];

export const SENSOR_TO_SLOT_MAP: Record<string, AxleSlotId> = {
  'HAMS001': 'A1-1',
  'HAMS002': 'A1-2',
  'HAMS003': 'A2-1',
  'HAMS004': 'A2-2',
  'HAMS005': 'A3-1',
  'HAMS006': 'A3-2',
  'HAMS007': 'A4-1',
  'HAMS009': 'A4-1',
  'HAMS008': 'A4-2',
};

export const SLOT_TO_SENSOR_MAP: Record<AxleSlotId, string> = {
  'A1-1': 'HAMS001',
  'A1-2': 'HAMS002',
  'A2-1': 'HAMS003',
  'A2-2': 'HAMS004',
  'A3-1': 'HAMS005',
  'A3-2': 'HAMS006',
  'A4-1': 'HAMS009',
  'A4-2': 'HAMS008',
};

export interface AxleConfig {
  id: 'A1' | 'A2' | 'A3' | 'A4';
  title: string;
  bogie: 'Bogie 1' | 'Bogie 2';
  position: string;
  leftSlot: AxleSlotId;
  rightSlot: AxleSlotId;
}

export const AXLE_CONFIGS: AxleConfig[] = [
  { id: 'A1', title: 'Axle 1', bogie: 'Bogie 1', position: 'Leading Wheelset', leftSlot: 'A1-1', rightSlot: 'A1-2' },
  { id: 'A2', title: 'Axle 2', bogie: 'Bogie 1', position: 'Trailing Wheelset', leftSlot: 'A2-1', rightSlot: 'A2-2' },
  { id: 'A3', title: 'Axle 3', bogie: 'Bogie 2', position: 'Leading Wheelset', leftSlot: 'A3-1', rightSlot: 'A3-2' },
  { id: 'A4', title: 'Axle 4', bogie: 'Bogie 2', position: 'Trailing Wheelset', leftSlot: 'A4-1', rightSlot: 'A4-2' },
];

export interface ThermalColorInfo {
  hex: string;
  rgb: string;
  glowRgba: string;
  statusText: string;
  level: 'normal' | 'warm' | 'warning' | 'critical' | 'inactive';
  isWarning: boolean;
  isCritical: boolean;
}

/**
 * Computes the color along the thermal spectrum:
 * Bright Green (Normal) -> Lime/Amber -> Orange -> Bright Hot Red (Hot Axle)
 */
export function getAxleTemperatureColor(temperature: number | undefined | null): ThermalColorInfo {
  if (temperature === undefined || temperature === null || temperature <= 0) {
    return {
      hex: '#94a3b8',
      rgb: '148, 163, 184',
      glowRgba: 'rgba(148, 163, 184, 0.25)',
      statusText: 'No Signal',
      level: 'inactive',
      isWarning: false,
      isCritical: false,
    };
  }

  // Normal / Cool operating range (e.g. ambient up to 45°C) -> Bright Emerald / Green
  if (temperature < 45) {
    // Interpolate bright green (16, 185, 129) -> vivid green (34, 197, 94)
    return {
      hex: '#10b981',
      rgb: '16, 185, 129',
      glowRgba: 'rgba(16, 185, 129, 0.45)',
      statusText: 'Normal',
      level: 'normal',
      isWarning: false,
      isCritical: false,
    };
  }

  // Warm range (45°C - 65°C) -> Lime Green to Golden Yellow
  if (temperature < 65) {
    const ratio = (temperature - 45) / 20;
    // from #84cc16 to #f59e0b
    const r = Math.round(132 + (245 - 132) * ratio);
    const g = Math.round(204 + (158 - 204) * ratio);
    const b = Math.round(22 + (11 - 22) * ratio);
    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    return {
      hex,
      rgb: `${r}, ${g}, ${b}`,
      glowRgba: `rgba(${r}, ${g}, ${b}, 0.55)`,
      statusText: 'Warm',
      level: 'warm',
      isWarning: false,
      isCritical: false,
    };
  }

  // Warning range (65°C - 80°C) -> Vivid Orange
  if (temperature < 80) {
    const ratio = (temperature - 65) / 15;
    const r = Math.round(245 + (249 - 245) * ratio);
    const g = Math.round(158 + (115 - 158) * ratio);
    const b = Math.round(11 + (22 - 11) * ratio);
    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    return {
      hex,
      rgb: `${r}, ${g}, ${b}`,
      glowRgba: `rgba(${r}, ${g}, ${b}, 0.65)`,
      statusText: 'High Temp',
      level: 'warning',
      isWarning: true,
      isCritical: false,
    };
  }

  // Critical / Hot Axle (> 80°C) -> Vivid Radiant Red
  return {
    hex: '#ef4444',
    rgb: '239, 68, 68',
    glowRgba: 'rgba(239, 68, 68, 0.85)',
    statusText: 'HOT AXLE',
    level: 'critical',
    isWarning: true,
    isCritical: true,
  };
}

export function formatAxleDate(isoString: string | null | undefined): string {
  if (!isoString) return 'N/A';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return 'N/A';
  }
}
