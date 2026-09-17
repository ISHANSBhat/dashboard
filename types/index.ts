export type WhoClass = "A" | "B" | "C";

export type StorageType = "refrigerated" | "frozen" | "ultracold";

export interface VaccineThreshold {
  id: string;
  name: string;
  generic: string;
  manufacturer: string;
  whoClass: WhoClass;
  storageType: StorageType;
  minTemp: number;
  maxTemp: number;
  freezeSensitive: boolean;
  heatExposureTemp: number;
  heatExposureHours: number;
  freezeExposureTemp: number | null;
  freezeExposureMinutes: number | null;
  ctcEligible: boolean;
  ctcHours?: number;
  ctcTemp?: number;
  notes?: string;
}

export interface VaccineReference {
  publisher: string;
  title: string;
  type: "who-guideline" | "who-pqs" | "cdc-toolkit" | "who-report" | "manufacturer";
  year: string;
  url?: string;
}

export interface VaccineThresholdDataset {
  schemaVersion: string;
  source: string;
  updated: string;
  units: string;
  references?: VaccineReference[];
  alarmDefaults: {
    stationaryHeat: { temp: number; duration: number };
    mobileHeat: { temp: number; duration: number };
    freeze: { temp: number; duration: number };
  };
  vaccines: VaccineThreshold[];
}

export interface TemperaturePoint {
  time: string;
  temperature: number;
  humidity: number;
}

export interface VaccineTemperatureSeries {
  vaccineId: string;
  vaccineName: string;
  data: TemperaturePoint[];
  threshold: VaccineThreshold | null;
}

export interface DegradationPoint {
  time: string;
  degradationIndex: number;
  cumulativeHeatHours: number;
}

export interface AlertRecord {
  time: string;
  alertId: string;
  batchNumber: string;
  unitId: string;
  alertType: string;
  details: string;
  resolutionStatus: string;
  maxStorageTemp: number;
  minStorageTemp: number;
}

export interface VaccineBatch {
  batchNumber: string;
  unitId: string;
  vaccineId: string;
  vaccineName: string;
  manufactureDate: string;
  expiryDate: string;
  quantity: number;
  degradationIndex: number;
  minStorageTemp: number;
  maxStorageTemp: number;
  freezeSensitive: boolean;
  heatThresholdTemp: number;
  heatThresholdHours: number;
}

export interface LatestReadings {
  time: string;
  temperature: number;
  humidity: number;
  latitude: number;
  longitude: number;
  vaccineId: string;
}

export interface DashboardSnapshot {
  latestReading: LatestReadings | null;
  openAlerts: number;
  totalAlerts24h: number;
  degradationIndex: number;
  cumulativeHeatHours: number;
  vaccine: VaccineBatch | null;
  uptimePercent: number;
}