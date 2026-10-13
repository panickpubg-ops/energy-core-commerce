import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { actions, money, useDb } from "@/lib/db";
import { AdminPage, Btn, Empty, Pill, SelectInput, Table, safe } from "@/components/admin/kit";

export const Route = createFileRoute("/admin/products")({
  head: () => ({ meta: [{ title: "Products — Voltarc Admin" }, { name: "robots", content: "noindex" }] }),
  component: Products,
});

function Products() {
  const products = useDb((s) => s.products);
  const categories = useDb((s) => s.categories);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [status, setStatus] = useState("");
  const [sel, setSel] = useState<string[]>([]);

  const list = products.filter((p) =>
    (!q || `${p.name} ${p.sku}`.toLowerCase().includes(q.toLowerCase())) &&
    (!cat || p.categoryId === cat) &&
    (!status || (status === "live" ? p.published : status === "draft" ? !p.published : status === "low" ? p.stock <= p.lowStockThreshold : p.stock === 0)));
  const bulk = async (fn: (id: string) => Promise<unknown>, msg: string) => {
    await safe(Promise.all(sel.map(fn)), msg);
    setSel([]);
  };
  const byId = (id: string) => products.find((p) => p.id === id)!;

  return (
    <AdminPage title="Products" description={`${products.length} products in your catalog`}
      actions={<Link to="/admin/products/$id" params={{ id: "new" }} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"><Plus className="h-4 w-4" />New product</Link>}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or SKU" className="w-full rounded-xl border bg-card py-2 pl-9 pr-3 text-sm outline-none" /></div>
        <div className="w-44"><SelectInput value={cat} onChange={(e) => setCat(e.target.value)}><option value="">All categories</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</SelectInput></div>
        <div className="w-40"><SelectInput value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Any status</option><option value="live">Published</option><option value="draft">Draft</option><option value="low">Low stock</option><option value="out">Out of stock</option></SelectInput></div>
      </div>

      {sel.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card px-4 py-2 text-sm">
          <span className="mr-2 font-medium">{sel.length} selected</span>
          <Btn variant="outline" onClick={() => bulk((id) => actions.saveProduct({ ...byId(id), published: true }), "Published")}>Publish</Btn>
          <Btn variant="outline" onClick={() => bulk((id) => actions.saveProduct({ ...byId(id), published: false }), "Moved to draft")}>Unpublish</Btn>
          <Btn variant="danger" onClick={() => confirm(`Delete ${sel.length} products?`) && bulk((id) => actions.deleteProduct(id), "Deleted")}>Delete</Btn>
        </div>
      )}

      {list.length ? (
        <Table head={[<input key="a" type="checkbox" aria-label="Select all" checked={sel.length === list.length} onChange={(e) => setSel(e.target.checked ? list.map((p) => p.id) : [])} />, "Product", "SKU", "Category", "Price", "Stock", "Status", ""]}>
          {list.map((p) => (
            <tr key={p.id} className="hover:bg-muted/30">
              <td className="px-4 py-3"><input type="checkbox" aria-label={`Select ${p.name}`} checked={sel.includes(p.id)} onChange={(e) => setSel(e.target.checked ? [...sel, p.id] : sel.filter((x) => x !== p.id))} /></td>
              <td className="px-4 py-3"><Link to="/admin/products/$id" params={{ id: p.id }} className="flex items-center gap-3 font-medium hover:underline">{p.images[0] ? <img src={p.images[0]} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <span className="h-10 w-10 rounded-lg bg-muted" />}<span className="max-w-64 truncate">{p.name}</span></Link></td>
              <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
              <td className="px-4 py-3 text-muted-foreground">{categories.find((c) => c.id === p.categoryId)?.name ?? "—"}</td>
              <td className="px-4 py-3">{money(p.price)}</td>
              <td className="px-4 py-3">{p.stock === 0 ? <Pill tone="bad">Out</Pill> : p.stock <= p.lowStockThreshold ? <Pill tone="warn">{p.stock}</Pill> : p.stock}</td>
              <td className="px-4 py-3">{p.published ? <Pill tone="good">Published</Pill> : <Pill>Draft</Pill>}{p.featured && <span className="ml-1"><Pill tone="accent">Featured</Pill></span>}</td>
              <td className="px-4 py-3 text-right"><Link to="/admin/products/$id" params={{ id: p.id }} className="text-sm underline">Edit</Link></td>
            </tr>
          ))}
        </Table>
      ) : <Empty>No products match these filters.</Empty>}
    </AdminPage>
  );
}
