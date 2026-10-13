import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { actions, fmtDate, money, useDb } from "@/lib/db";
import type { InventoryMovement } from "@/lib/types";
import { AdminPage, Btn, Panel, Pill, SelectInput, Stat, Table, TextInput, safe } from "@/components/admin/kit";

export const Route = createFileRoute("/admin/inventory")({
  head: () => ({ meta: [{ title: "Inventory — Voltarc Admin" }, { name: "robots", content: "noindex" }] }),
  component: Inventory,
});

function Inventory() {
  const products = useDb((s) => s.products);
  const movements = useDb((s) => s.movements);
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [adj, setAdj] = useState({ productId: "", delta: 0, reason: "restock" as InventoryMovement["reason"], note: "" });
  const list = products.filter((p) => filter === "all" || (filter === "out" ? p.stock === 0 : p.stock <= p.lowStockThreshold)).sort((a, b) => a.stock - b.stock);
  const name = (id: string) => products.find((p) => p.id === id)?.name ?? "Deleted product";

  const submit = async () => {
    if (!adj.productId || !adj.delta) return;
    const delta = adj.reason === "adjustment" ? adj.delta : Math.abs(adj.delta);
    await safe(actions.adjustStock(adj.productId, delta, adj.reason, adj.note), "Stock updated");
    setAdj({ ...adj, delta: 0, note: "" });
  };

  return (
    <AdminPage title="Inventory" description="Stock levels, adjustments and a full movement history.">
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Units in stock" value={products.reduce((a, p) => a + p.stock, 0)} />
        <Stat label="Stock value" value={money(products.reduce((a, p) => a + p.stock * p.price, 0))} />
        <Stat label="Low stock" value={products.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold).length} />
        <Stat label="Out of stock" value={products.filter((p) => p.stock === 0).length} />
      </div>

      <Panel title="Adjust stock" description="Every change is recorded in the movement log below.">
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_2fr_auto] sm:items-end">
          <SelectInput label="Product" value={adj.productId} onChange={(e) => setAdj({ ...adj, productId: e.target.value })}><option value="">Choose…</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.stock})</option>)}</SelectInput>
          <SelectInput label="Reason" value={adj.reason} onChange={(e) => setAdj({ ...adj, reason: e.target.value as InventoryMovement["reason"] })}><option value="restock">Restock (+)</option><option value="return">Customer return (+)</option><option value="adjustment">Correction (±)</option></SelectInput>
          <TextInput label="Quantity" type="number" value={adj.delta || ""} onChange={(e) => setAdj({ ...adj, delta: +e.target.value })} />
          <TextInput label="Note" value={adj.note} placeholder="PO #, damage, recount…" onChange={(e) => setAdj({ ...adj, note: e.target.value })} />
          <Btn onClick={submit} disabled={!adj.productId || !adj.delta}>Apply</Btn>
        </div>
      </Panel>

      <div className="flex gap-2">{(["all", "low", "out"] as const).map((f) => <Btn key={f} variant={filter === f ? "primary" : "outline"} onClick={() => setFilter(f)}>{f === "all" ? "All" : f === "low" ? "Low stock" : "Out of stock"}</Btn>)}</div>
      <Table head={["Product", "SKU", "In stock", "Alert at", "Status"]}>
        {list.map((p) => (
          <tr key={p.id}><td className="px-4 py-3 font-medium">{p.name}</td><td className="px-4 py-3 font-mono text-xs">{p.sku}</td><td className="px-4 py-3">{p.stock}</td><td className="px-4 py-3 text-muted-foreground">{p.lowStockThreshold}</td>
            <td className="px-4 py-3">{p.stock === 0 ? <Pill tone="bad">Out of stock</Pill> : p.stock <= p.lowStockThreshold ? <Pill tone="warn">Low</Pill> : <Pill tone="good">Healthy</Pill>}</td></tr>
        ))}
      </Table>

      <Panel title="Movement history" description="Latest 300 changes">
        <ul className="divide-y text-sm">
          {movements.map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-2"><span className={`w-14 font-mono ${m.delta > 0 ? "text-success" : "text-destructive"}`}>{m.delta > 0 ? `+${m.delta}` : m.delta}</span><span className="flex-1 truncate">{name(m.productId)}</span><Pill>{m.reason}</Pill><span className="hidden max-w-48 truncate text-xs text-muted-foreground md:inline">{m.note}</span><span className="text-xs text-muted-foreground">{fmtDate(m.createdAt)}</span></li>
          ))}
          {!movements.length && <li className="py-4 text-muted-foreground">No stock movements yet.</li>}
        </ul>
      </Panel>
    </AdminPage>
  );
}
