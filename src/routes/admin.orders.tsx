import { createFileRoute } from "@tanstack/react-router";
import { Printer, Search, X } from "lucide-react";
import { useState } from "react";
import { actions, fmtDate, money, useDb } from "@/lib/db";
import type { Order, OrderStatus, PaymentStatus } from "@/lib/types";
import { StatusBadge } from "@/components/site/OrderStatus";
import { AdminPage, Btn, Empty, Pill, SelectInput, Table, TextInput, safe } from "@/components/admin/kit";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({ meta: [{ title: "Orders — Voltarc Admin" }, { name: "robots", content: "noindex" }] }),
  component: Orders,
});

const STATUSES: OrderStatus[] = ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"];
const PAY: PaymentStatus[] = ["unpaid", "paid", "refunded", "failed"];
const payTone = (p: PaymentStatus) => (p === "paid" ? "good" : p === "unpaid" ? "warn" : "bad");

function Orders() {
  const orders = useDb((s) => s.orders);
  const [tab, setTab] = useState<OrderStatus | "all">("all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const list = orders.filter((o) => (tab === "all" || o.status === tab) && (!q || `${o.number} ${o.email} ${o.shippingAddress?.name ?? ""}`.toLowerCase().includes(q.toLowerCase())));
  const open = orders.find((o) => o.id === openId);

  return (
    <AdminPage title="Orders" description="Fulfil, track and manage payments for every order.">
      <div className="flex flex-wrap gap-2">
        {(["all", ...STATUSES] as const).map((s) => (
          <button key={s} onClick={() => setTab(s)} className={`rounded-full border px-3 py-1 text-sm capitalize ${tab === s ? "bg-primary text-primary-foreground" : "bg-card"}`}>
            {s} <span className="opacity-60">{s === "all" ? orders.length : orders.filter((o) => o.status === s).length}</span>
          </button>
        ))}
      </div>
      <div className="relative max-w-sm"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Order #, email or name" className="w-full rounded-xl border bg-card py-2 pl-9 pr-3 text-sm outline-none" /></div>

      {list.length ? (
        <Table head={["Order", "Date", "Customer", "Items", "Total", "Payment", "Status"]}>
          {list.map((o) => (
            <tr key={o.id} onClick={() => setOpenId(o.id)} className="cursor-pointer hover:bg-muted/30">
              <td className="px-4 py-3 font-mono text-xs">{o.number}</td><td className="px-4 py-3 text-muted-foreground">{fmtDate(o.createdAt)}</td>
              <td className="px-4 py-3"><span className="block">{o.shippingAddress?.name}</span><span className="text-xs text-muted-foreground">{o.email}</span></td>
              <td className="px-4 py-3">{o.items.reduce((a, i) => a + i.qty, 0)}</td><td className="px-4 py-3 font-medium">{money(o.total)}</td>
              <td className="px-4 py-3"><Pill tone={payTone(o.paymentStatus)}>{o.paymentStatus}</Pill></td><td className="px-4 py-3"><StatusBadge status={o.status} /></td>
            </tr>
          ))}
        </Table>
      ) : <Empty>No orders here yet.</Empty>}

      {open && <OrderDrawer order={open} onClose={() => setOpenId(null)} />}
    </AdminPage>
  );
}

function OrderDrawer({ order: o, onClose }: { order: Order; onClose: () => void }) {
  const [carrier, setCarrier] = useState(o.carrier ?? "");
  const [tracking, setTracking] = useState(o.trackingNumber ?? "");
  const a = o.shippingAddress;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/40" onClick={onClose}>
      <div className="h-full w-full max-w-lg overflow-y-auto bg-background p-6 shadow-2xl print:max-w-none" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div><p className="font-mono text-xs text-muted-foreground">{fmtDate(o.createdAt)}</p><h2 className="text-xl font-semibold">Order {o.number}</h2></div>
          <div className="flex gap-1 print:hidden"><Btn variant="ghost" onClick={() => window.print()} aria-label="Print"><Printer className="h-4 w-4" /></Btn><Btn variant="ghost" onClick={onClose} aria-label="Close"><X className="h-4 w-4" /></Btn></div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 print:hidden">
          <SelectInput label="Order status" value={o.status} onChange={(e) => safe(actions.setOrderStatus(o.id, e.target.value as OrderStatus), "Status updated")}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</SelectInput>
          <SelectInput label="Payment" value={o.paymentStatus} onChange={(e) => safe(actions.setPaymentStatus(o.id, e.target.value as PaymentStatus), "Payment updated")}>{PAY.map((s) => <option key={s}>{s}</option>)}</SelectInput>
        </div>

        <div className="mt-6 rounded-2xl border p-4 print:hidden">
          <p className="mb-3 text-sm font-medium">Shipment</p>
          <div className="grid grid-cols-2 gap-3">
            <TextInput label="Carrier" value={carrier} placeholder="UPS, FedEx, DHL…" onChange={(e) => setCarrier(e.target.value)} />
            <TextInput label="Tracking number" value={tracking} onChange={(e) => setTracking(e.target.value)} />
          </div>
          <Btn className="mt-3" onClick={() => safe(actions.setOrderStatus(o.id, o.status === "delivered" ? o.status : "shipped", { carrier, trackingNumber: tracking }), "Marked as shipped")}>Save & mark shipped</Btn>
        </div>

        <div className="mt-6 space-y-3">
          {o.items.map((i) => (
            <div key={i.sku} className="flex items-center gap-3 text-sm">{i.image ? <img src={i.image} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <span className="h-12 w-12 rounded-lg bg-muted" />}<div className="flex-1"><p className="font-medium">{i.name}</p><p className="font-mono text-xs text-muted-foreground">{i.sku} × {i.qty}</p></div><span>{money(i.price * i.qty)}</span></div>
          ))}
        </div>
        <dl className="mt-4 space-y-1 border-t pt-4 text-sm">
          {[["Subtotal", o.subtotal], ["Discount", -o.discount], ["Shipping", o.shipping], ["Tax", o.tax]].map(([l, v]) => <div key={l as string} className="flex justify-between text-muted-foreground"><dt>{l}</dt><dd>{money(v as number)}</dd></div>)}
          <div className="flex justify-between pt-1 font-semibold"><dt>Total</dt><dd>{money(o.total)}</dd></div>
        </dl>

        <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <div><p className="text-xs text-muted-foreground">Ship to</p><p className="mt-1">{a?.name}<br />{a?.line1}<br />{a?.city}, {a?.region} {a?.postal}<br />{a?.country}</p></div>
          <div><p className="text-xs text-muted-foreground">Customer</p><p className="mt-1">{o.email}</p><p className="mt-3 text-xs text-muted-foreground">Payment method</p><p className="mt-1 capitalize">{o.paymentMethod.replace("_", " ")}</p>{o.couponCode && <><p className="mt-3 text-xs text-muted-foreground">Coupon</p><p className="font-mono">{o.couponCode}</p></>}</div>
        </div>

        <div className="mt-6"><p className="mb-2 text-xs text-muted-foreground">Timeline</p><ol className="space-y-1 text-sm">{o.timeline.map((t, i) => <li key={i} className="flex justify-between"><span className="capitalize">{t.status}</span><span className="text-muted-foreground">{new Date(t.at).toLocaleString()}</span></li>)}</ol></div>
      </div>
    </div>
  );
}
