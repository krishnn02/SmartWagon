export interface RailwayZone {
  code: string;
  name: string;
  headquarters: string;
  divisions: { code: string; name: string }[];
}

export const RAILWAY_ZONES: RailwayZone[] = [
  {
    code: "ER",
    name: "Eastern Railway",
    headquarters: "Kolkata (Fairlie Place)",
    divisions: [
      { code: "HWH", name: "Howrah" },
      { code: "SDAH", name: "Sealdah" },
      { code: "ASN", name: "Asansol" },
      { code: "MLDT", name: "Malda" },
    ],
  },
  {
    code: "CR",
    name: "Central Railway",
    headquarters: "Mumbai (CSMT)",
    divisions: [
      { code: "CSMT", name: "Mumbai CSMT" },
      { code: "BSL", name: "Bhusawal" },
      { code: "NGP", name: "Nagpur" },
      { code: "PUNE", name: "Pune" },
      { code: "SUR", name: "Solapur" },
    ],
  },
  {
    code: "WR",
    name: "Western Railway",
    headquarters: "Mumbai (Churchgate)",
    divisions: [
      { code: "MMCT", name: "Mumbai Central" },
      { code: "BRC", name: "Vadodara" },
      { code: "ADI", name: "Ahmedabad" },
      { code: "RTM", name: "Ratlam" },
      { code: "RJT", name: "Rajkot" },
      { code: "BVP", name: "Bhavnagar" },
    ],
  },
  {
    code: "NWR",
    name: "North Western Railway",
    headquarters: "Jaipur",
    divisions: [
      { code: "JP", name: "Jaipur" },
      { code: "AII", name: "Ajmer" },
      { code: "BKN", name: "Bikaner" },
      { code: "JU", name: "Jodhpur" },
    ],
  },
  {
    code: "NR",
    name: "Northern Railway",
    headquarters: "New Delhi",
    divisions: [
      { code: "DLI", name: "Delhi" },
      { code: "UMB", name: "Ambala" },
      { code: "FZR", name: "Firozpur" },
      { code: "LKO", name: "Lucknow NR" },
      { code: "MB", name: "Moradabad" },
    ],
  },
  {
    code: "SR",
    name: "Southern Railway",
    headquarters: "Chennai",
    divisions: [
      { code: "MAS", name: "Chennai" },
      { code: "TPJ", name: "Tiruchirappalli" },
      { code: "MDU", name: "Madurai" },
      { code: "PGT", name: "Palakkad" },
      { code: "SA", name: "Salem" },
      { code: "TVC", name: "Thiruvananthapuram" },
    ],
  },
  {
    code: "SCR",
    name: "South Central Railway",
    headquarters: "Secunderabad",
    divisions: [
      { code: "SC", name: "Secunderabad" },
      { code: "HYB", name: "Hyderabad" },
      { code: "BZA", name: "Vijayawada" },
      { code: "GTL", name: "Guntakal" },
      { code: "GNT", name: "Guntur" },
      { code: "NED", name: "Nanded" },
    ],
  },
  {
    code: "SECR",
    name: "South East Central Railway",
    headquarters: "Bilaspur",
    divisions: [
      { code: "BSP", name: "Bilaspur" },
      { code: "R", name: "Raipur" },
      { code: "NGP-SEC", name: "Nagpur (SECR)" },
    ],
  },
  {
    code: "ALL",
    name: "All Zones (HQ / Railway Board)",
    headquarters: "Rail Bhavan, New Delhi",
    divisions: [{ code: "HQ", name: "Headquarters & All Divisions" }],
  },
];

export interface MasterDevice {
  deviceId: string;
  name: string;
  category: "brake-binding" | "hot-axle";
  zoneCode: string;
  divisionCode: string;
  coachNo?: string;
  trainNo?: string;
}

// Master list of known devices matching the production hardware
export const MASTER_DEVICES: MasterDevice[] = [
  // Brake Binding Devices (matching user's attached dropdown exactly)
  {
    deviceId: "SCBB-HWH-26-003",
    name: "SCBB-HWH-26-003",
    category: "brake-binding",
    zoneCode: "ER",
    divisionCode: "HWH",
    coachNo: "ER-26003",
    trainNo: "12301 (Rajdhani)",
  },
  {
    deviceId: "SCBB-HWH-26-002",
    name: "SCBB-HWH-26-002",
    category: "brake-binding",
    zoneCode: "ER",
    divisionCode: "HWH",
    coachNo: "ER-26002",
    trainNo: "12301 (Rajdhani)",
  },
  {
    deviceId: "SCBB-HWH-26-001",
    name: "SCBB-HWH-26-001",
    category: "brake-binding",
    zoneCode: "ER",
    divisionCode: "HWH",
    coachNo: "ER-26001",
    trainNo: "12305 (Howrah SF)",
  },
  {
    deviceId: "S5-19711/SCBB-JP-26-002",
    name: "S5-19711/SCBB-JP-26-002",
    category: "brake-binding",
    zoneCode: "NWR",
    divisionCode: "JP",
    coachNo: "S5-19711",
    trainNo: "12955 (Jaipur SF)",
  },
  {
    deviceId: "S5-22799/SCBB-JP-26-001",
    name: "S5-22799/SCBB-JP-26-001",
    category: "brake-binding",
    zoneCode: "NWR",
    divisionCode: "JP",
    coachNo: "S5-22799",
    trainNo: "12955 (Jaipur SF)",
  },
  {
    deviceId: "SCBB-JP-26-003",
    name: "SCBB-JP-26-003",
    category: "brake-binding",
    zoneCode: "NWR",
    divisionCode: "JP",
    coachNo: "NWR-26003",
    trainNo: "12985 (Double Decker)",
  },
  {
    deviceId: "SCBB-JP-26-004",
    name: "SCBB-JP-26-004",
    category: "brake-binding",
    zoneCode: "NWR",
    divisionCode: "JP",
    coachNo: "NWR-26004",
    trainNo: "12985 (Double Decker)",
  },
  {
    deviceId: "SCBB-MU-26-001",
    name: "SCBB-MU-26-001",
    category: "brake-binding",
    zoneCode: "WR",
    divisionCode: "MMCT",
    coachNo: "WR-26001",
    trainNo: "12951 (Mumbai Rajdhani)",
  },
  {
    deviceId: "SCBB-NP-26-003",
    name: "SCBB-NP-26-003",
    category: "brake-binding",
    zoneCode: "CR",
    divisionCode: "NGP",
    coachNo: "CR-26003",
    trainNo: "12289 (Duronto)",
  },

  // Hot Axle Devices (Matching coaches_hams & hams_data telemetry)
  {
    deviceId: "Raspberry4_7",
    name: "LWSCZAC (Raspberry4_7)",
    category: "hot-axle",
    zoneCode: "CR",
    divisionCode: "NGP",
    coachNo: "LWSCZAC",
    trainNo: "1207069",
  },
  {
    deviceId: "Raspberry_Fallback",
    name: "COACH-MAIN / TECH-MASTER",
    category: "hot-axle",
    zoneCode: "ALL",
    divisionCode: "HQ",
    coachNo: "COACH-MAIN",
    trainNo: "12951",
  },
];
