import { describe, expect, it } from "vitest";
import { computeTotals } from "@/lib/db";
import { seedState } from "@/lib/seed";

const base = () => ({ ...seedState(), cart: [{ productId: "p8", qty: 1 }] }); // $129 charger

describe("checkout totals", () => {
  it("charges flat $15 shipping under the $250 threshold", () => {
    expect(computeTotals(base()).shipping).toBe(15);
  });
  it("ships free at or above $250 after discount", () => {
    const s = { ...base(), cart: [{ productId: "p1", qty: 1 }] }; // $349
    expect(computeTotals(s).shipping).toBe(0);
  });
  it("applies CHARGE10 as 10% off when subtotal meets $200 minimum", () => {
    const s = { ...base(), cart: [{ productId: "p1", qty: 1 }] };
    expect(computeTotals(s, "CHARGE10").discount).toBeCloseTo(34.9);
  });
  it("ignores CHARGE10 below its $200 minimum", () => {
    expect(computeTotals(base(), "CHARGE10").discount).toBe(0);
  });
});
