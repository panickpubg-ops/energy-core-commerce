import { Check } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { actions, money, useDb } from "@/lib/db";
import type { Product } from "@/lib/types";

const ADDON_CATS = ["chargers", "bms", "accessories"];

/** "Frequently bought together" kit with the BUNDLE10 code for 10% off. */
export function BundleBuilder({ product }: { product: Product }) {
  const products = useDb((s) => s.products);
  const categories = useDb((s) => s.categories);
  const addons = useMemo(() => {
    const ids = categories.filter((c) => ADDON_CATS.includes(c.slug) && c.id !== product.categoryId).map((c) => c.id);
    return ids.map((id) => products.find((p) => p.categoryId === id && p.published && p.stock > 0 && p.id !== product.id)).filter(Boolean).slice(0, 3) as Product[];
  }, [products, categories, product]);
  const [picked, setPicked] = useState<Set<string>>(() => new Set());
  const all = [product, ...addons];
  const sel = all.filter((p) => p.id === product.id || picked.has(p.id) || !picked.size);
  if (!addons.length) return null;
  const total = sel.reduce((s, p) => s + p.price, 0);
  const toggle = (id: string) => setPicked((prev) => {
    const next = new Set(prev.size ? prev : addons.map((a) => a.id));
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const on = (id: string) => id === product.id || !picked.size || picked.has(id);

  return (
    <section className="mt-16 rounded-3xl border bg-card p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold">Frequently bought together</h2>
        <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">Bundle & save 10% with code BUNDLE10</span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {all.map((p) => (
          <button key={p.id} disabled={p.id === product.id} onClick={() => toggle(p.id)} className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${on(p.id) ? "border-foreground" : "opacity-50"}`}>
            {p.images[0] ? <img src={p.images[0]} alt="" className="h-14 w-14 rounded-xl bg-muted object-cover" /> : <div className="h-14 w-14 rounded-xl bg-muted" />}
            <span className="flex-1 text-sm"><span className="line-clamp-2 font-medium">{p.name}</span><span className="text-muted-foreground">{money(p.price)}</span></span>
            <span className={`grid h-5 w-5 place-items-center rounded-full border ${on(p.id) ? "bg-primary text-primary-foreground" : ""}`}>{on(p.id) && <Check className="h-3 w-3" />}</span>
          </button>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t pt-5">
        <p className="text-sm"><span className="text-muted-foreground line-through">{money(total)}</span> <span className="ml-2 text-xl font-semibold">{money(Math.round(total * 90) / 100)}</span> <span className="text-muted-foreground">with BUNDLE10</span></p>
        <button onClick={() => { sel.forEach((p) => actions.addToCart(p.id)); toast.success(`${sel.length} items added`, { description: "Enter BUNDLE10 at checkout for 10% off." }); }} className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">Add {sel.length} to cart</button>
      </div>
    </section>
  );
}
