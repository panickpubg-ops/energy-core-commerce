import type { Product } from "./types";

export type ProductErrors = Partial<Record<keyof Product | "form", string>>;

/** Rules every product must pass before it is saved from the admin editor. */
export function validateProduct(p: Product, others: Product[]): ProductErrors {
  const e: ProductErrors = {};
  const rest = others.filter((o) => o.id !== p.id);
  if (!p.name.trim()) e.name = "Name is required";
  if (!p.sku.trim()) e.sku = "SKU is required";
  else if (!/^[A-Za-z0-9._-]+$/.test(p.sku)) e.sku = "Use letters, numbers, dots, dashes or underscores";
  else if (rest.some((o) => o.sku.toLowerCase() === p.sku.toLowerCase())) e.sku = "Another product already uses this SKU";
  if (!p.slug.trim()) e.slug = "URL slug is required";
  else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug)) e.slug = "Lowercase letters, numbers and dashes only";
  else if (rest.some((o) => o.slug === p.slug)) e.slug = "Another product already uses this URL";
  if (!(p.price >= 0) || Number.isNaN(p.price)) e.price = "Price must be 0 or more";
  if (p.compareAt !== undefined && p.compareAt <= p.price) e.compareAt = "Compare-at price must be higher than the price";
  if (!Number.isInteger(p.stock) || p.stock < 0) e.stock = "Stock must be a whole number, 0 or more";
  if (!Number.isInteger(p.lowStockThreshold) || p.lowStockThreshold < 0) e.lowStockThreshold = "Must be a whole number, 0 or more";
  if (!Number.isInteger(p.warrantyYears) || p.warrantyYears < 0) e.warrantyYears = "Whole years, 0 or more";
  for (const k of ["voltage", "capacityAh", "energyWh", "weightKg", "cycleLife"] as const) {
    const v = p[k];
    if (v !== undefined && !(v > 0)) e[k] = "Must be greater than 0";
  }
  if (p.published) {
    if (!p.categoryId) e.categoryId = "Choose a category before publishing";
    if (!p.images.length) e.images = "Add at least one photo before publishing";
  }
  return e;
}

/** Wh = V × Ah, rounded to 1 decimal. */
export const energyFrom = (v?: number, ah?: number) => (v && ah ? Math.round(v * ah * 10) / 10 : undefined);
