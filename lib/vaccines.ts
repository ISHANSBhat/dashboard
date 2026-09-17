import vaccineThresholdsJson from "@/data/vaccine-thresholds.json";
import type { VaccineThresholdDataset, VaccineThreshold } from "@/types";

export const vaccineDataset = vaccineThresholdsJson as VaccineThresholdDataset;

export const VACCINES = vaccineDataset.vaccines;

export function getVaccineById(id: string): VaccineThreshold | undefined {
  return VACCINES.find((v) => v.id === id);
}

export function getVaccineByName(name: string): VaccineThreshold | undefined {
  return VACCINES.find(
    (v) => v.name.toLowerCase() === name.toLowerCase() || v.generic.toLowerCase() === name.toLowerCase(),
  );
}

export function formatRange(v: VaccineThreshold): string {
  if (v.storageType === "frozen") return `${v.minTemp}°C to ${v.maxTemp}°C`;
  return `${v.minTemp}°C to ${v.maxTemp}°C`;
}

export function isWithinRange(v: VaccineThreshold, temp: number): boolean {
  return temp >= v.minTemp && temp <= v.maxTemp;
}

export function violationLabel(v: VaccineThreshold, temp: number): string | null {
  if (temp > v.maxTemp) return `Exceeds ${v.maxTemp}°C`;
  if (temp < v.minTemp && v.freezeSensitive) return `Freeze risk (< ${v.minTemp}°C)`;
  return null;
}

export function storageTypeLabel(t: VaccineThreshold["storageType"]): string {
  switch (t) {
    case "refrigerated":
      return "2–8°C refrigerator";
    case "frozen":
      return "Frozen storage";
    case "ultracold":
      return "Ultra-cold storage";
  }
}