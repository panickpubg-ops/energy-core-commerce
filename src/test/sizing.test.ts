import { describe, expect, it } from "vitest";
import { calculate, pickBatteryBank } from "@/lib/sizing";
import type { Product } from "@/lib/types";

describe("sizing calculator", () => {
  it("adds a 20% safety buffer to daily watt-hours", () => {
    const r = calculate([{ id: "a", name: "Fridge", watts: 100, hours: 10, qty: 1 }], 12);
    expect(r.dailyWh).toBe(1000);
    expect(r.requiredWh).toBe(1200);
    expect(r.requiredAh).toBe(100);
  });
  it("converts to amp-hours at 24V and 48V", () => {
    const loads = [{ id: "a", name: "x", watts: 100, hours: 10, qty: 1 }];
    expect(calculate(loads, 24).requiredAh).toBe(50);
    expect(calculate(loads, 48).requiredAh).toBe(25);
  });
  it("builds a 24V bank from two 12V batteries in series", () => {
    const p = { id: "b", published: true, voltage: 12, capacityAh: 100, chemistry: "LiFePO4", categoryId: "c", price: 500, stock: 5 } as Product;
    const bank = pickBatteryBank([p], [{ id: "c", slug: "lifepo4" } as never], 24, 150);
    expect(bank).toMatchObject({ series: 2, parallel: 2, qty: 4 });
  });
});
