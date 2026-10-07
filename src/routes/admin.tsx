import { createFileRoute, Link } from "@tanstack/react-router";
import { actions, money, useDb, useSession } from "@/lib/db";
import { StatusBadge } from "@/components/site/OrderStatus";
import { Logo } from "@/components/site/SiteHeader";
import type { OrderStatus } from "@/lib/types";
export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Voltarc" }, { name: "robots", content: "noindex" }, { name: "description", content: "Store admin." }, { property: "og:title", content: "Admin — Voltarc" }, { property: "og:description", content: "Store admin." }] }),
  component: Admin,
});
function Admin() {
  const user = useSession();
  const s = useDb((x) => x);
  if (user?.role !== "admin") return <div className="grid min-h-screen place-items-center"><Link to="/auth" className="underline">Sign in as an admin</Link></div>;
  const revenue = s.orders.filter((o) => o.paymentStatus === "paid").reduce((a, o) => a + o.total, 0);
  return (<div className="min-h-screen">
    <header className="flex items-center justify-between bg-ink px-6 py-4"><Logo dark /><Link to="/" className="text-sm text-ink-foreground/70">View store</Link></header>
    <div className="mx-auto max-w-7xl space-y-10 p-6">
      <div className="grid gap-4 sm:grid-cols-4">{[["Revenue", money(revenue)], ["Orders", s.orders.length], ["Products", s.products.length], ["Low stock", s.products.filter((p) => p.stock <= p.lowStockThreshold).length]].map(([l, v]) => <div key={l as string} className="rounded-2xl border bg-card p-5"><p className="text-xs text-muted-foreground">{l}</p><p className="mt-1 text-2xl font-semibold">{v}</p></div>)}</div>
      <section><h2 className="mb-3 font-semibold">Orders</h2><div className="overflow-x-auto rounded-2xl border bg-card"><table className="w-full text-sm"><tbody>{s.orders.map((o) => <tr key={o.id} className="border-b"><td className="p-3">{o.number}</td><td className="p-3">{o.email}</td><td className="p-3">{money(o.total)}</td><td className="p-3"><StatusBadge status={o.status} /></td><td className="p-3"><select value={o.status} onChange={(e) => actions.setOrderStatus(o.id, e.target.value as OrderStatus)} className="rounded border px-2 py-1">{["paid","processing","shipped","delivered","cancelled","refunded"].map((x) => <option key={x}>{x}</option>)}</select></td></tr>)}</tbody></table></div></section>
      <section><h2 className="mb-3 font-semibold">Products & inventory</h2><div className="overflow-x-auto rounded-2xl border bg-card"><table className="w-full text-sm"><tbody>{s.products.map((p) => <tr key={p.id} className="border-b"><td className="p-3">{p.name}</td><td className="p-3 font-mono">{p.sku}</td><td className="p-3"><input type="number" value={p.price} onChange={(e) => actions.saveProduct({ ...p, price: +e.target.value })} className="w-24 rounded border px-2 py-1" /></td><td className="p-3"><input type="number" value={p.stock} onChange={(e) => actions.saveProduct({ ...p, stock: +e.target.value })} className="w-20 rounded border px-2 py-1" /></td><td className="p-3"><label className="flex gap-1"><input type="checkbox" checked={p.published} onChange={(e) => actions.saveProduct({ ...p, published: e.target.checked })} />Published</label></td><td className="p-3"><button onClick={() => actions.deleteProduct(p.id)} className="text-destructive">Delete</button></td></tr>)}</tbody></table></div></section>
      <section><h2 className="mb-3 font-semibold">Reviews</h2>{s.reviews.map((r) => <div key={r.id} className="flex justify-between border-b py-2 text-sm"><span>{r.author}: {r.title}</span><button onClick={() => actions.setReviewApproved(r.id, !r.approved)} className="underline">{r.approved ? "Unapprove" : "Approve"}</button></div>)}</section>
    </div></div>);
}
