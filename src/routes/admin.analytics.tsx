import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money, useDb } from "@/lib/db";
import { revenueByCategory, salesSummary, topProducts } from "@/lib/analytics";
import { AdminPage, Panel, Stat } from "@/components/admin/kit";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Voltarc Admin" }, { name: "robots", content: "noindex" }] }),
  component: Analytics,
});

const tip = { borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" };

function Analytics() {
  const s = useDb((x) => x);
  const [days, setDays] = useState(30);
  const sum = salesSummary(s.orders, days);
  const since = Date.now() - days * 86400000;
  const inRange = s.orders.filter((o) => new Date(o.createdAt).getTime() >= since);
  const cats = revenueByCategory(inRange, s.products, s.categories);
  const top = topProducts(inRange, 8);
  const couponOrders = inRange.filter((o) => o.couponCode).length;
  const methods = Object.entries(inRange.reduce<Record<string, number>>((a, o) => ((a[o.paymentMethod || "—"] = (a[o.paymentMethod || "—"] ?? 0) + 1), a), {}));
  const inventoryValue = s.products.reduce((a, p) => a + p.price * p.stock, 0);

  return (
    <AdminPage title="Analytics" description="Sales performance from your store's orders."
      actions={<div className="flex rounded-full border bg-card p-1 text-sm">{[7, 30, 90, 365].map((d) => <button key={d} onClick={() => setDays(d)} className={`rounded-full px-3 py-1 ${days === d ? "bg-primary text-primary-foreground" : ""}`}>{d === 365 ? "1y" : `${d}d`}</button>)}</div>}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Revenue" value={money(sum.revenue)} />
        <Stat label="Orders" value={sum.orders} hint={`${sum.paidOrders} paid`} />
        <Stat label="Average order" value={money(sum.aov)} />
        <Stat label="Refunds" value={sum.refunded} hint={sum.orders ? `${Math.round((sum.refunded / sum.orders) * 100)}% of orders` : undefined} />
        <Stat label="Coupon usage" value={couponOrders} hint={sum.orders ? `${Math.round((couponOrders / sum.orders) * 100)}% of orders` : undefined} />
      </div>

      <Panel title="Revenue & orders over time">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sum.series}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tickFormatter={(d: string) => d.slice(5)} fontSize={11} stroke="var(--muted-foreground)" />
              <YAxis yAxisId="l" fontSize={11} stroke="var(--muted-foreground)" width={50} />
              <YAxis yAxisId="r" orientation="right" fontSize={11} stroke="var(--muted-foreground)" width={30} allowDecimals={false} />
              <Tooltip contentStyle={tip} />
              <Line yAxisId="l" type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2} dot={false} />
              <Line yAxisId="r" type="monotone" dataKey="orders" stroke="var(--muted-foreground)" strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Revenue by category">
          {cats.length ? (
            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={cats} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" fontSize={11} stroke="var(--muted-foreground)" /><YAxis type="category" dataKey="name" fontSize={11} width={110} stroke="var(--muted-foreground)" />
              <Tooltip formatter={(v: number) => money(v)} contentStyle={tip} /><Bar dataKey="revenue" fill="var(--primary)" radius={[0, 6, 6, 0]} />
            </BarChart></ResponsiveContainer></div>
          ) : <p className="text-sm text-muted-foreground">No paid sales in this period.</p>}
        </Panel>
        <Panel title="Top products">
          <ul className="divide-y text-sm">
            {top.map((p, i) => <li key={p.name} className="flex items-center gap-3 py-2"><span className="w-5 font-mono text-xs text-muted-foreground">{i + 1}</span><span className="flex-1 truncate">{p.name}</span><span className="text-xs text-muted-foreground">{p.qty} sold</span><span className="w-24 text-right font-medium">{money(p.revenue)}</span></li>)}
            {!top.length && <li className="py-4 text-muted-foreground">No paid sales in this period.</li>}
          </ul>
        </Panel>
        <Panel title="Payment methods">
          <ul className="space-y-2 text-sm">{methods.map(([m, n]) => <li key={m} className="flex justify-between"><span className="capitalize">{m.replace("_", " ")}</span><b>{n}</b></li>)}{!methods.length && <li className="text-muted-foreground">No orders yet.</li>}</ul>
        </Panel>
        <Panel title="Inventory snapshot">
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between"><span>Stock value at retail</span><b>{money(inventoryValue)}</b></li>
            <li className="flex justify-between"><span>Units in stock</span><b>{s.products.reduce((a, p) => a + p.stock, 0)}</b></li>
            <li className="flex justify-between"><span>Out of stock</span><b>{s.products.filter((p) => p.stock === 0).length}</b></li>
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">Visitor traffic and conversion tracking come from Google Analytics / Meta Pixel — add your IDs under SEO & tracking.</p>
        </Panel>
      </div>
    </AdminPage>
  );
}
