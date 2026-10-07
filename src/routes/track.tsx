import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { money, useDb } from "@/lib/db";
import { Field, PageTitle } from "@/components/site/Field";
import { OrderTimeline } from "@/components/site/OrderStatus";
type S = { number?: string; email?: string; placed?: boolean };
export const Route = createFileRoute("/track")({
  validateSearch: (s: Record<string, unknown>): S => ({ number: s.number as string | undefined, email: s.email as string | undefined, placed: s.placed ? true : undefined }),
  head: () => ({ meta: [{ title: "Track your order — Voltarc" }, { name: "description", content: "Track a Voltarc order." }, { property: "og:title", content: "Track order — Voltarc" }, { property: "og:description", content: "Order tracking." }] }),
  component: T,
});
function T() {
  const s = Route.useSearch();
  const [q, setQ] = useState({ number: s.number ?? "", email: s.email ?? "" });
  const order = useDb((d) => d.orders.find((o) => o.number === q.number && o.email.toLowerCase() === q.email.toLowerCase()));
  return (<div className="mx-auto max-w-3xl px-4 py-12">
    <PageTitle title={s.placed ? "Thank you — order confirmed" : "Track your order"} />
    <div className="mt-8 grid gap-4 sm:grid-cols-2">
      <Field label="Order number" value={q.number} onChange={(e) => setQ({ ...q, number: e.target.value })} placeholder="VA-10421" />
      <Field label="Email" value={q.email} onChange={(e) => setQ({ ...q, email: e.target.value })} />
    </div>
    {order && <div className="mt-8 rounded-3xl border bg-card p-6">
      <div className="flex justify-between"><b>{order.number}</b><span>{money(order.total)}</span></div>
      <div className="mt-6"><OrderTimeline order={order} /></div>
      {order.trackingNumber && <p className="mt-4 font-mono text-sm">{order.carrier} · {order.trackingNumber}</p>}
    </div>}
  </div>);
}
