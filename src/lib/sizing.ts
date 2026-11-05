/** Pure battery-system sizing math used by the /calculator page. */
import type { Category, Product } from "./types";

export type Setup = "rv" | "cabin" | "marine" | "backup";
export type SystemVoltage = 12 | 24 | 48;

export interface Appliance { id: string; name: string; watts: number; hours: number; qty: number }

export const SAFETY_BUFFER = 0.2;
export const SUN_HOURS = 4.5;

export const SETUPS: { id: Setup; label: string; blurb: string; voltage: SystemVoltage; days: number }[] = [
  { id: "rv", label: "RV / Camper van", blurb: "Boondocking, van builds, travel trailers", voltage: 12, days: 1 },
  { id: "cabin", label: "Off-grid cabin", blurb: "Solar homesteads and remote sites", voltage: 48, days: 2 },
  { id: "marine", label: "Marine / Boat", blurb: "House banks, trolling and electronics", voltage: 12, days: 1 },
  { id: "backup", label: "Home emergency backup", blurb: "Keep essentials running during outages", voltage: 48, days: 1 },
];

export const APPLIANCES: Appliance[] = [
  { id: "fridge", name: "Refrigerator (12V compressor)", watts: 60, hours: 10, qty: 1 },
  { id: "lights", name: "12V LED lighting", watts: 10, hours: 5, qty: 4 },
  { id: "microwave", name: "Microwave", watts: 1000, hours: 0.25, qty: 1 },
  { id: "induction", name: "Induction cooktop", watts: 1800, hours: 0.5, qty: 1 },
  { id: "starlink", name: "Starlink", watts: 50, hours: 8, qty: 1 },
  { id: "ac", name: "Air conditioning", watts: 1300, hours: 4, qty: 1 },
  { id: "laptop", name: "Laptop", watts: 65, hours: 4, qty: 1 },
  { id: "fan", name: "Roof vent fan", watts: 30, hours: 8, qty: 1 },
  { id: "pump", name: "Water pump", watts: 60, hours: 0.5, qty: 1 },
  { id: "tv", name: "TV / monitor", watts: 80, hours: 3, qty: 1 },
];

export function calculate(loads: Appliance[], voltage: SystemVoltage, days = 1) {
  const active = loads.filter((a) => a.qty > 0 && a.watts > 0 && a.hours > 0);
  const dailyWh = active.reduce((s, a) => s + a.watts * a.hours * a.qty, 0);
  const requiredWh = Math.ceil(dailyWh * days * (1 + SAFETY_BUFFER));
  const requiredAh = Math.ceil(requiredWh / voltage);
  const peakW = loads.filter((a) => a.qty > 0).reduce((s, a) => s + a.watts * a.qty, 0);
  const inverterW = Math.ceil((peakW * 1.25) / 500) * 500;
  const solarW = Math.ceil((dailyWh * 1.3) / SUN_HOURS / 100) * 100;
  return { dailyWh, requiredWh, requiredAh, peakW, inverterW, solarW };
}

const NON_BATTERY = new Set(["chargers", "bms", "accessories", "power-stations"]);

/** Cheapest way to meet the required Ah with one battery model at the chosen voltage. */
export function pickBatteryBank(products: Product[], categories: Category[], voltage: SystemVoltage, requiredAh: number) {
  const catSlug = (id: string) => categories.find((c) => c.id === id)?.slug ?? "";
  const options = products
    .filter((p) => p.published && p.voltage && p.capacityAh && p.chemistry !== "N/A" && !NON_BATTERY.has(catSlug(p.categoryId)))
    .map((p) => {
      const series = voltage % p.voltage! === 0 ? voltage / p.voltage! : 0;
      if (!series) return null;
      const parallel = Math.max(1, Math.ceil(requiredAh / p.capacityAh!));
      const qty = series * parallel;
      return { product: p, qty, series, parallel, total: qty * p.price };
    })
    .filter((x): x is NonNullable<typeof x> => !!x)
    .sort((a, b) => a.total - b.total);
  return options[0] ?? null;
}

/** First published product whose name or category matches any keyword. */
export function findAccessory(products: Product[], categories: Category[], keywords: string[], categorySlug?: string, voltage?: number) {
  const catSlug = (id: string) => categories.find((c) => c.id === id)?.slug ?? "";
  return products.find((p) => p.published && p.stock > 0 && (!voltage || !p.voltage || p.voltage === voltage) && (
    keywords.some((k) => p.name.toLowerCase().includes(k)) || (categorySlug && catSlug(p.categoryId) === categorySlug)
  )) ?? null;
}
