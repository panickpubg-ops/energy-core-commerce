import type { Category, Order, Product } from "./types";

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Orders that count as real revenue (paid and not refunded/cancelled). */
export const isRevenue = (o: Order) => o.paymentStatus === "paid" && o.status !== "refunded" && o.status !== "cancelled";

export function salesSummary(orders: Order[], days: number, now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  const inRange = orders.filter((o) => new Date(o.createdAt) >= start);
  const paid = inRange.filter(isRevenue);
  const revenue = paid.reduce((a, o) => a + o.total, 0);

  const series: { date: string; revenue: number; orders: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    series.push({ date: ymd(d), revenue: 0, orders: 0 });
  }
  const byDate = new Map(series.map((s) => [s.date, s]));
  for (const o of inRange) {
    const row = byDate.get(ymd(new Date(o.createdAt)));
    if (!row) continue;
    row.orders += 1;
    if (isRevenue(o)) row.revenue = Math.round((row.revenue + o.total) * 100) / 100;
  }

  return {
    revenue: Math.round(revenue * 100) / 100,
    orders: inRange.length,
    paidOrders: paid.length,
    aov: paid.length ? Math.round((revenue / paid.length) * 100) / 100 : 0,
    refunded: inRange.filter((o) => o.status === "refunded").length,
    series,
  };
}

export function topProducts(orders: Order[], limit = 5) {
  const m = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const o of orders.filter(isRevenue))
    for (const i of o.items) {
      const r = m.get(i.sku) ?? { name: i.name, qty: 0, revenue: 0 };
      r.qty += i.qty;
      r.revenue += i.price * i.qty;
      m.set(i.sku, r);
    }
  return [...m.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}

export function revenueByCategory(orders: Order[], products: Product[], categories: Category[]) {
  const catOf = new Map(products.map((p) => [p.id, p.categoryId]));
  const name = new Map(categories.map((c) => [c.id, c.name]));
  const m = new Map<string, number>();
  for (const o of orders.filter(isRevenue))
    for (const i of o.items) {
      const n = name.get(catOf.get(i.productId) ?? "") ?? "Other";
      m.set(n, (m.get(n) ?? 0) + i.price * i.qty);
    }
  return [...m.entries()].map(([name, revenue]) => ({ name, revenue: Math.round(revenue * 100) / 100 })).sort((a, b) => b.revenue - a.revenue);
}

export function customerStats(orders: Order[]) {
  const m = new Map<string, { orders: number; spent: number; last: string }>();
  for (const o of orders) {
    const key = o.userId ?? `guest:${o.email.toLowerCase()}`;
    const r = m.get(key) ?? { orders: 0, spent: 0, last: o.createdAt };
    r.orders += 1;
    if (isRevenue(o)) r.spent += o.total;
    if (o.createdAt > r.last) r.last = o.createdAt;
    m.set(key, r);
  }
  return m;
}
