import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { actions, fmtDate, money, useDb } from "@/lib/db";
import { salesSummary } from "@/lib/analytics";
import { StatusBadge } from "@/components/site/OrderStatus";
import { AdminPage, Btn, Panel, Stat, safe } from "@/components/admin/kit";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Dashboard — Voltarc Admin" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

function Dashboard() {
  const s = useDb((x) => x);
  const [importing, setImporting] = useState(false);
  const sum = salesSummary(s.orders, 30);
  const low = s.products.filter((p) => p.stock <= p.lowStockThreshold);
  const pendingReviews = s.reviews.filter((r) => !r.approved).length;
  const toShip = s.orders.filter((o) => o.status === "paid" || o.status === "processing").length;

  return (
    <AdminPage title={`Welcome back${s.me?.name ? `, ${s.me.name.split(" ")[0]}` : ""}`} description="Here's what's happening in your store over the last 30 days.">
      {s.products.length === 0 && (
        <Panel title="Your catalog is empty" description="Copy the 12 sample products and their photos into your database to get started.">
          <Btn disabled={importing} onClick={() => { setImporting(true); safe(actions.importSampleCatalog(), "Sample catalog imported").finally(() => setImporting(false)); }}>{importing ? "Importing…" : "Import sample catalog"}</Btn>
        </Panel>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Revenue (30d)" value={money(sum.revenue)} hint={`${sum.paidOrders} paid orders`} />
        <Stat label="Orders (30d)" value={sum.orders} hint={`${toShip} waiting to ship`} />
        <Stat label="Average order" value={money(sum.aov)} />
        <Stat label="Customers" value={s.users.length} hint={`${s.products.filter((p) => p.published).length} live products`} />
      </div>

      <Panel title="Revenue" description="Paid orders per day" actions={<Link to="/admin/analytics" className="text-xs underline">Full analytics</Link>}>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sum.series}>
              <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} /><stop offset="100%" stopColor="var(--primary)" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tickFormatter={(d: string) => d.slice(5)} fontSize={11} stroke="var(--muted-foreground)" />
              <YAxis fontSize={11} stroke="var(--muted-foreground)" width={50} />
              <Tooltip formatter={(v: number) => money(v)} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
              <Area type="monotone" dataKey="revenue" stroke="var(--primary)" fill="url(#rev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Recent orders" className="lg:col-span-2" actions={<Link to="/admin/orders" className="text-xs underline">All orders</Link>}>
          <ul className="divide-y text-sm">
            {s.orders.slice(0, 6).map((o) => (
              <li key={o.id} className="flex items-center gap-3 py-2.5"><span className="font-mono text-xs">{o.number}</span><span className="flex-1 truncate text-muted-foreground">{o.email}</span><span className="hidden text-xs text-muted-foreground sm:inline">{fmtDate(o.createdAt)}</span><StatusBadge status={o.status} /><span className="w-20 text-right font-medium">{money(o.total)}</span></li>
            ))}
            {!s.orders.length && <li className="py-6 text-center text-muted-foreground">No orders yet.</li>}
          </ul>
        </Panel>
        <Panel title="Needs attention">
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between"><Link to="/admin/inventory" className="hover:underline">Low-stock products</Link><b>{low.length}</b></li>
            <li className="flex justify-between"><Link to="/admin/orders" className="hover:underline">Orders to fulfil</Link><b>{toShip}</b></li>
            <li className="flex justify-between"><Link to="/admin/reviews" className="hover:underline">Reviews to moderate</Link><b>{pendingReviews}</b></li>
            <li className="flex justify-between"><Link to="/admin/products" className="hover:underline">Draft products</Link><b>{s.products.filter((p) => !p.published).length}</b></li>
          </ul>
          {low.length > 0 && <div className="mt-4 border-t pt-3 text-xs text-muted-foreground">{low.slice(0, 4).map((p) => <p key={p.id} className="flex justify-between py-0.5"><span className="truncate">{p.name}</span><span>{p.stock} left</span></p>)}</div>}
        </Panel>
      </div>
    </AdminPage>
  );
}
