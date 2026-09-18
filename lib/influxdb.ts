import { InfluxDB } from "@influxdata/influxdb-client";
import type { FluxTableMetaData } from "@influxdata/influxdb-client";
import type {
  AlertRecord,
  DashboardSnapshot,
  DegradationPoint,
  LatestReadings,
  TemperaturePoint,
  VaccineBatch,
  VaccineTemperatureSeries,
} from "@/types";
import { getVaccineById } from "@/lib/vaccines";

const url = process.env.INFLUXDB_URL ?? "";
const token = process.env.INFLUXDB_TOKEN ?? "";
const org = process.env.INFLUXDB_ORG ?? "";
const bucket = process.env.INFLUXDB_BUCKET ?? "cold_chain";

const client = new InfluxDB({ url, token });
const queryApi = client.getQueryApi(org);

export interface FluxRecord {
  [key: string]: string | number | boolean | null;
  _field: string;
  _measurement: string;
  _time: string;
  _value: string | number | boolean | null;
}

async function runFlux(flux: string): Promise<FluxRecord[]> {
  const rows: FluxRecord[] = [];
  await new Promise<void>((resolve, reject) => {
    queryApi.queryRows(flux, {
      next(row: string[], tableMeta: FluxTableMetaData) {
        const obj = tableMeta.toObject(row) as Record<string, string | number | boolean>;
        const record: FluxRecord = {
          _measurement: String(obj["_measurement"] ?? ""),
          _field: String(obj["_field"] ?? ""),
          _time: String(obj["_time"] ?? ""),
          _value: (obj["_value"] as string | number | boolean | null) ?? null,
        };
        for (const [key, value] of Object.entries(obj)) {
          if (key.startsWith("_")) continue;
          record[key] = value;
        }
        rows.push(record);
      },
      error(error) {
        reject(error);
      },
      complete() {
        resolve();
      },
    });
  });
  return rows;
}



export async function queryTemperatureHistory(range: string): Promise<TemperaturePoint[]> {
  const flux = `
from(bucket: "${bucket}")
  |> range(start: ${range})
  |> filter(fn: (r) => r._measurement == "TEMPERATURE_LOG")
  |> filter(fn: (r) => r._field == "TEMPERATURE_READING" or r._field == "HUMIDITY_READING")
  |> aggregateWindow(every: 1m, fn: last, createEmpty: false)
  |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
  |> sort(columns: ["_time"])
  |> limit(n: 720)`;
  const rows = await runFlux(flux);
  return rows.map((r) => ({
    time: r._time,
    temperature: Number(r.TEMPERATURE_READING ?? 0),
    humidity: Number(r.HUMIDITY_READING ?? 0),
  }));
}

export async function queryTemperatureHistoryByVaccine(range: string): Promise<VaccineTemperatureSeries[]> {
  const flux = `
from(bucket: "${bucket}")
  |> range(start: ${range})
  |> filter(fn: (r) => r._measurement == "TEMPERATURE_LOG")
  |> filter(fn: (r) => r._field == "TEMPERATURE_READING" or r._field == "HUMIDITY_READING" or r._field == "VACCINE_ID")
  |> aggregateWindow(every: 1m, fn: last, createEmpty: false)
  |> sort(columns: ["_time"])
  |> limit(n: 4320)`;
  const rows = await runFlux(flux);

  const byMinute = new Map<string, { temperature?: number; humidity?: number; vaccineId?: string }>();
  for (const r of rows) {
    const t = r._time.slice(0, 16);
    const entry = byMinute.get(t) ?? {};
    if (r._field === "TEMPERATURE_READING") entry.temperature = Number(r._value ?? 0);
    else if (r._field === "HUMIDITY_READING") entry.humidity = Number(r._value ?? 0);
    else if (r._field === "VACCINE_ID") entry.vaccineId = String(r._value ?? "");
    if (r.VACCINE_ID && !entry.vaccineId) entry.vaccineId = String(r.VACCINE_ID);
    byMinute.set(t, entry);
  }

  const byVaccine = new Map<string, TemperaturePoint[]>();
  for (const [t, e] of byMinute) {
    const vid = e.vaccineId ?? "";
    const arr = byVaccine.get(vid) ?? [];
    arr.push({ time: t + ":00Z", temperature: e.temperature ?? 0, humidity: e.humidity ?? 0 });
    byVaccine.set(vid, arr);
  }

  const result: VaccineTemperatureSeries[] = [];
  for (const [vid, data] of byVaccine) {
    const threshold = vid ? getVaccineById(vid) ?? null : null;
    const name = threshold?.name ?? (vid === "" ? "Legacy / unknown" : vid);
    result.push({ vaccineId: vid, vaccineName: name, data, threshold });
  }
  return result.sort((a, b) => a.vaccineName.localeCompare(b.vaccineName));
}

export async function queryLatestReading(): Promise<LatestReadings | null> {
  const flux = `
from(bucket: "${bucket}")
  |> range(start: -1h)
  |> filter(fn: (r) => r._measurement == "TEMPERATURE_LOG")`;
  const rows = await runFlux(flux);
  if (rows.length === 0) return null;
  let latestTime = "";
  for (const r of rows) {
    if (r._time > latestTime) latestTime = r._time;
  }
  if (!latestTime) return null;
  const f: Record<string, string | number | boolean | null> = {};
  for (const r of rows) {
    if (r._time === latestTime) f[r._field] = r._value;
  }
  return {
    time: latestTime,
    temperature: Number(f["TEMPERATURE_READING"] ?? 0),
    humidity: Number(f["HUMIDITY_READING"] ?? 0),
    latitude: Number(f["LATITUDE"] ?? 0),
    longitude: Number(f["LONGITUDE"] ?? 0),
    vaccineId: String(f["VACCINE_ID"] ?? ""),
  };
}

export async function queryDegradationHistory(range: string): Promise<DegradationPoint[]> {
  const flux = `
from(bucket: "${bucket}")
  |> range(start: ${range})
  |> filter(fn: (r) => r._measurement == "DEGRADATION_LOG")
  |> filter(fn: (r) => r._field == "DEGRADATION_INDEX" or r._field == "CUMULATIVE_HEAT_HOURS" or r._field == "MAX_TEMP_SEEN" or r._field == "MIN_TEMP_SEEN")
  |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
  |> sort(columns: ["_time"])`;
  const rows = await runFlux(flux);
  return rows.map((r) => ({
    time: r._time,
    degradationIndex: Number(r.DEGRADATION_INDEX ?? 0),
    cumulativeHeatHours: Number(r.CUMULATIVE_HEAT_HOURS ?? 0),
  }));
}

export async function queryLatestDegradation(): Promise<DegradationPoint | null> {
  const rows = await queryDegradationHistory("-7d");
  return rows.length ? rows[rows.length - 1] : null;
}

export async function queryVaccineBatch(): Promise<VaccineBatch | null> {
  const flux = `
from(bucket: "${bucket}")
  |> range(start: -90d)
  |> filter(fn: (r) => r._measurement == "VACCINE_BATCH")
  |> last()`;
  const rows = await runFlux(flux);
  if (rows.length === 0) return null;
  const f: Record<string, string | number | boolean | null> = {};
  for (const r of rows) f[r._field] = r._value;
  return {
    batchNumber: String(rows[0].BATCH_NUMBER ?? ""),
    unitId: String(rows[0].UNIT_ID ?? ""),
    vaccineId: String(f["VACCINE_ID"] ?? ""),
    vaccineName: String(f["VACCINE_NAME"] ?? ""),
    manufactureDate: String(f["MANUFACTURE_DATE"] ?? ""),
    expiryDate: String(f["EXPIRY_DATE"] ?? ""),
    quantity: Number(f["QUANTITY"] ?? 0),
    degradationIndex: Number(f["DEGRADATION_INDEX"] ?? 0),
    minStorageTemp: Number(f["MIN_STORAGE_TEMP"] ?? 2),
    maxStorageTemp: Number(f["MAX_STORAGE_TEMP"] ?? 8),
    freezeSensitive:
      f["FREEZE_SENSITIVE"] === null ? true : Number(f["FREEZE_SENSITIVE"] ?? 1) === 1,
    heatThresholdTemp: Number(f["HEAT_THRESHOLD_TEMP"] ?? 10),
    heatThresholdHours: Number(f["HEAT_THRESHOLD_HOURS"] ?? 20),
  };
}

export async function queryAlerts(range: string): Promise<AlertRecord[]> {
  const flux = `
from(bucket: "${bucket}")
  |> range(start: ${range})
  |> filter(fn: (r) => r._measurement == "ALERT")`;
  const rows = await runFlux(flux);
  const byKey = new Map<string, AlertRecord>();
  for (const r of rows) {
    const key = `${r.ALERT_ID}|${r._time}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, {
        time: r._time,
        alertId: String(r.ALERT_ID ?? ""),
        batchNumber: String(r.BATCH_NUMBER ?? ""),
        unitId: String(r.UNIT_ID ?? ""),
        alertType: String(r._field === "ALERT_TYPE" ? r._value : ""),
        details: String(r._field === "DETAILS" ? r._value : ""),
        resolutionStatus: String(r._field === "RESOLUTION_STATUS" ? r._value : "Unresolved"),
        maxStorageTemp: Number(r._field === "MAX_STORAGE_TEMP" ? r._value : 8),
        minStorageTemp: Number(r._field === "MIN_STORAGE_TEMP" ? r._value : 2),
      });
    } else {
      if (r._field === "ALERT_TYPE") existing.alertType = String(r._value ?? "");
      else if (r._field === "DETAILS") existing.details = String(r._value ?? "");
      else if (r._field === "RESOLUTION_STATUS") existing.resolutionStatus = String(r._value ?? "Unresolved");
      else if (r._field === "MAX_STORAGE_TEMP") existing.maxStorageTemp = Number(r._value ?? 8);
      else if (r._field === "MIN_STORAGE_TEMP") existing.minStorageTemp = Number(r._value ?? 2);
    }
  }
  return Array.from(byKey.values()).sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
  );
}

export async function queryAlertCounts(range: string): Promise<{
  open: number;
  total: number;
  heat24h: number;
  cold24h: number;
}> {
  const alerts = await queryAlerts(range);
  const open = alerts.filter((a) => a.resolutionStatus === "Unresolved").length;
  const total = alerts.length;
  const heat24h = alerts.filter((a) => a.alertType.includes("Heat") || a.alertType.includes("Degradation")).length;
  const cold24h = alerts.filter((a) => a.alertType.includes("Cold") || a.alertType.includes("Freeze")).length;
  return { open, total, heat24h, cold24h };
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const [latest, degradation, vaccine, alertCounts, tempHistory] = await Promise.all([
    queryLatestReading(),
    queryLatestDegradation(),
    queryVaccineBatch(),
    queryAlertCounts("-7d"),
    queryTemperatureHistory("-7d"),
  ]);

  const threshold = vaccine ? getVaccineById(vaccine.vaccineId) : undefined;

  let uptimePercent = 100;
  if (tempHistory.length > 0) {
    const violations = tempHistory.filter(
      (t) => threshold && (t.temperature > threshold.maxTemp || t.temperature < threshold.minTemp),
    ).length;
    uptimePercent = Math.max(0, Math.round((1 - violations / tempHistory.length) * 100));
  }

  return {
    latestReading: latest,
    openAlerts: alertCounts.open,
    totalAlerts24h: alertCounts.total,
    degradationIndex: degradation?.degradationIndex ?? vaccine?.degradationIndex ?? 0,
    cumulativeHeatHours: degradation?.cumulativeHeatHours ?? 0,
    vaccine: vaccine,
    uptimePercent,
  };
}

export function readingStatus(temperature: number, min: number, max: number): "normal" | "high" | "low" {
  if (temperature > max) return "high";
  if (temperature < min) return "low";
  return "normal";
}
