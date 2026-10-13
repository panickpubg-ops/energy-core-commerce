import { describe, expect, it } from "vitest";
import { customerStats, salesSummary } from "@/lib/analytics";
import type { Order } from "@/lib/types";

const order = (o: Partial<Order>): Order => ({
  id: Math.random().toString(), number: "VA-1", email: "a@b.co", items: [], subtotal: 0, discount: 0, shipping: 0, tax: 0, total: 100,
  status: "paid", paymentStatus: "paid", paymentMethod: "card",
  shippingAddress: { name: "", line1: "", city: "", region: "", postal: "", country: "" }, timeline: [], createdAt: new Date().toISOString(), ...o,
});

describe("sales analytics", () => {
  it("counts only paid, non-refunded orders as revenue", () => {
    const s = salesSummary([order({ total: 100 }), order({ total: 50, paymentStatus: "unpaid", status: "pending" }), order({ total: 70, status: "refunded" })], 7);
    expect(s.revenue).toBe(100);
    expect(s.orders).toBe(3);
    expect(s.aov).toBe(100);
  });

  it("excludes orders older than the selected window", () => {
    const old = new Date(Date.now() - 40 * 86400000).toISOString();
    expect(salesSummary([order({ createdAt: old })], 30).orders).toBe(0);
  });

  it("totals lifetime spend per customer", () => {
    const m = customerStats([order({ userId: "u1", total: 40 }), order({ userId: "u1", total: 60 })]);
    expect(m.get("u1")).toMatchObject({ orders: 2, spent: 100 });
  });
});
