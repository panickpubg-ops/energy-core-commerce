import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useDb } from "@/lib/db";
import { ProductCard } from "@/components/site/ProductCard";

type Search = { q?: string | undefined; category?: string | undefined; chem?: string | undefined; volt?: string | undefined; sort?: string | undefined; stock?: boolean | undefined };

export const Route = createFileRoute("/shop")({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validateSearch: (s: any): Search => ({
    q: typeof s.q === "string" ? s.q : undefined,
    category: typeof s.category === "string" ? s.category : undefined,
    chem: typeof s.chem === "string" ? s.chem : undefined,
    volt: typeof s.volt === "string" ? s.volt : undefined,
    sort: typeof s.sort === "string" ? s.sort : undefined,
    stock: s.stock === true || s.stock === "true" ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop Lithium Batteries, BMS & Chargers — Voltarc" },
      { name: "description", content: "Browse LiFePO4 batteries, battery packs, power stations, BMS boards, chargers and accessories." },
      { property: "og:title", content: "Shop — Voltarc Energy" },
      { property: "og:description", content: "Filter lithium batteries by voltage, chemistry and capacity." },
    ],
  }),
  component: Shop,
});

const VOLTS = [["12", "12V"], ["24", "24V"], ["48", "48V+"]] as const;

function Shop() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const cats = useDb((s) => s.categories);
  const all = useDb((s) => s.products);
  const [mobile, setMobile] = useState(false);
  const cat = cats.find((c) => c.slug === search.category);
  const upd = (patch: Partial<Search>) => navigate({ search: (p) => ({ ...p, ...patch }), replace: true });

  const products = useMemo(() => {
    let list = all.filter((p) => p.published);
    if (cat) list = list.filter((p) => p.categoryId === cat.id);
    if (search.q) {
      const q = search.q.toLowerCase();
      list = list.filter((p) => [p.name, p.sku, p.tagline, p.chemistry, `${p.voltage}v`, `${p.capacityAh}ah`].join(" ").toLowerCase().includes(q.replace(/\s+/g, " ")) || q.split(" ").every((w) => [p.name, p.sku, p.chemistry, `${p.voltage}v`, `${p.capacityAh}ah`].join(" ").toLowerCase().includes(w)));
    }
    if (search.chem) list = list.filter((p) => p.chemistry === search.chem);
    if (search.volt) list = list.filter((p) => p.voltage && (search.volt === "48" ? p.voltage >= 36 : search.volt === "24" ? p.voltage >= 20 && p.voltage < 36 : p.voltage < 20));
    if (search.stock) list = list.filter((p) => p.stock > 0);
    const sorters: Record<string, (a: (typeof list)[0], b: (typeof list)[0]) => number> = {
      "price-asc": (a, b) => a.price - b.price,
      "price-desc": (a, b) => b.price - a.price,
      capacity: (a, b) => (b.energyWh ?? 0) - (a.energyWh ?? 0),
      newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
    };
    return [...list].sort(sorters[search.sort ?? ""] ?? ((a, b) => Number(b.featured) - Number(a.featured)));
  }, [all, cat, search]);

  const chip = (active: boolean) => `rounded-full border px-3.5 py-1.5 text-sm transition ${active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-foreground/30"}`;

  const filters = (
    <div className="space-y-8">
      <div>
        <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Category</h4>
        <div className="flex flex-wrap gap-2 lg:flex-col lg:items-start">
          <button className={chip(!cat)} onClick={() => upd({ category: undefined })}>All</button>
          {cats.map((c) => <button key={c.id} className={chip(cat?.id === c.id)} onClick={() => upd({ category: c.slug })}>{c.name}</button>)}
        </div>
      </div>
      <div>
        <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Nominal voltage</h4>
        <div className="flex flex-wrap gap-2">
          {VOLTS.map(([v, l]) => <button key={v} className={chip(search.volt === v)} onClick={() => upd({ volt: search.volt === v ? undefined : v })}>{l}</button>)}
        </div>
      </div>
      <div>
        <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Chemistry</h4>
        <div className="flex flex-wrap gap-2">
          {["LiFePO4", "NMC", "Li-ion"].map((c) => <button key={c} className={chip(search.chem === c)} onClick={() => upd({ chem: search.chem === c ? undefined : c })}>{c}</button>)}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={!!search.stock} onChange={(e) => upd({ stock: e.target.checked || undefined })} className="h-4 w-4 accent-primary" /> In stock only
      </label>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <nav className="text-xs text-muted-foreground"><Link to="/">Home</Link> / Shop{cat && ` / ${cat.name}`}</nav>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-4xl font-semibold">{search.q ? `“${search.q}”` : cat?.name ?? "All products"}</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">{cat?.description ?? "Batteries, power systems and the parts that make them work."}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMobile(true)} className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm lg:hidden"><SlidersHorizontal className="h-4 w-4" /> Filters</button>
          <select value={search.sort ?? ""} onChange={(e) => upd({ sort: e.target.value || undefined })} className="rounded-full border bg-card px-4 py-2 text-sm">
            <option value="">Featured</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="capacity">Energy (Wh)</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>
      <div className="mt-8 grid gap-10 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">{filters}</aside>
        {mobile && (
          <div className="fixed inset-0 z-50 bg-ink/40 lg:hidden" onClick={() => setMobile(false)}>
            <div className="absolute bottom-0 max-h-[80vh] w-full overflow-auto rounded-t-3xl bg-background p-6" onClick={(e) => e.stopPropagation()}>
              <div className="mb-6 flex justify-between"><h3 className="font-semibold">Filters</h3><button onClick={() => setMobile(false)}><X className="h-5 w-5" /></button></div>
              {filters}
              <button onClick={() => setMobile(false)} className="mt-8 w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground">Show {products.length} results</button>
            </div>
          </div>
        )}
        <div>
          <p className="mb-6 text-sm text-muted-foreground">{products.length} products</p>
          {products.length ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">{products.map((p) => <ProductCard key={p.id} product={p} />)}</div>
          ) : (
            <div className="rounded-2xl border border-dashed p-16 text-center">
              <p className="font-medium">No products match those filters.</p>
              <button onClick={() => navigate({ search: {} })} className="mt-4 text-sm underline">Clear filters</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
