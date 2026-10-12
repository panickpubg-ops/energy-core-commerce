import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { actions, money, useDb, useSession } from "@/lib/db";
import { StatusBadge } from "@/components/site/OrderStatus";
import { Logo } from "@/components/site/SiteHeader";
import { CatalogAudit } from "@/components/admin/CatalogAudit";
import type { OrderStatus } from "@/lib/types";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Voltarc" }, { name: "robots", content: "noindex" }, { name: "description", content: "Store admin." }, { property: "og:title", content: "Admin — Voltarc" }, { property: "og:description", content: "Store admin." }] }),
  component: Admin,
});

const safe = (p: Promise<unknown>) => p.catch((e: Error) => toast.error(e.message));

function Admin() {
  const user = useSession();
  const s = useDb((x) => x);
  const [importing, setImporting] = useState(false);
  if (!s.loaded) return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;
  if (user?.role !== "admin") return <div className="grid min-h-screen place-items-center"><Link to="/auth" className="underline">Sign in as an admin</Link></div>;
  const revenue = s.orders.filter((o) => o.paymentStatus === "paid").reduce((a, o) => a + o.total, 0);

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between bg-ink px-6 py-4"><Logo dark /><Link to="/" className="text-sm text-ink-foreground/70">View store</Link></header>
      <div className="mx-auto max-w-7xl space-y-10 p-6">
        <div className="grid gap-4 sm:grid-cols-4">
          {[["Revenue", money(revenue)], ["Orders", s.orders.length], ["Products", s.products.length], ["Low stock", s.products.filter((p) => p.stock <= p.lowStockThreshold).length]].map(([l, v]) => (
            <div key={l as string} className="rounded-2xl border bg-card p-5"><p className="text-xs text-muted-foreground">{l}</p><p className="mt-1 text-2xl font-semibold">{v}</p></div>
          ))}
        </div>

        {s.products.length === 0 && (
          <div className="rounded-2xl border border-dashed p-6 text-sm">
            <p className="font-medium">Your catalog is empty.</p>
            <p className="mt-1 text-muted-foreground">Copy the 12 sample products and their photos into your database to get started.</p>
            <button disabled={importing} onClick={() => { setImporting(true); safe(actions.importSampleCatalog().then(() => toast.success("Sample catalog imported"))).finally(() => setImporting(false)); }} className="mt-4 rounded-full bg-primary px-5 py-2 font-medium text-primary-foreground disabled:opacity-50">{importing ? "Importing…" : "Import sample catalog"}</button>
          </div>
        )}

        <CatalogAudit />

        <section><h2 className="mb-3 font-semibold">Orders</h2><div className="overflow-x-auto rounded-2xl border bg-card"><table className="w-full text-sm"><tbody>
          {s.orders.map((o) => (
            <tr key={o.id} className="border-b"><td className="p-3">{o.number}</td><td className="p-3">{o.email}</td><td className="p-3">{money(o.total)}</td><td className="p-3"><StatusBadge status={o.status} /></td>
              <td className="p-3"><select value={o.status} onChange={(e) => safe(actions.setOrderStatus(o.id, e.target.value as OrderStatus))} className="rounded border px-2 py-1">{["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"].map((x) => <option key={x}>{x}</option>)}</select></td></tr>
          ))}
          {!s.orders.length && <tr><td className="p-3 text-muted-foreground">No orders yet.</td></tr>}
        </tbody></table></div></section>

        <section><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Products & inventory</h2><Link to="/admin/products/$id" params={{ id: "new" }} className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">+ New product</Link></div><div className="overflow-x-auto rounded-2xl border bg-card"><table className="w-full text-sm"><tbody>
          {s.products.map((p) => (
            <tr key={p.id} className="border-b"><td className="p-3"><Link to="/admin/products/$id" params={{ id: p.id }} className="font-medium hover:underline">{p.name}</Link></td><td className="p-3 font-mono">{p.sku}</td>
              <td className="p-3"><input type="number" defaultValue={p.price} onBlur={(e) => +e.target.value !== p.price && safe(actions.saveProduct({ ...p, price: +e.target.value }))} className="w-24 rounded border px-2 py-1" /></td>
              <td className="p-3"><input type="number" defaultValue={p.stock} onBlur={(e) => +e.target.value !== p.stock && safe(actions.saveProduct({ ...p, stock: +e.target.value }))} className="w-20 rounded border px-2 py-1" /></td>
              <td className="p-3"><label className="flex gap-1"><input type="checkbox" checked={p.published} onChange={(e) => safe(actions.saveProduct({ ...p, published: e.target.checked }))} />Published</label></td>
              <td className="p-3"><Link to="/admin/products/$id" params={{ id: p.id }} className="mr-3 underline">Edit</Link><button onClick={() => confirm(`Delete ${p.name}?`) && safe(actions.deleteProduct(p.id))} className="text-destructive">Delete</button></td></tr>
          ))}
        </tbody></table></div></section>

        <section><h2 className="mb-3 font-semibold">Reviews</h2>
          {s.reviews.map((r) => <div key={r.id} className="flex justify-between border-b py-2 text-sm"><span>{r.author}: {r.title}</span><button onClick={() => safe(actions.setReviewApproved(r.id, !r.approved))} className="underline">{r.approved ? "Unapprove" : "Approve"}</button></div>)}
          {!s.reviews.length && <p className="text-sm text-muted-foreground">No reviews yet.</p>}
        </section>
      </div>
    </div>
  );
}
