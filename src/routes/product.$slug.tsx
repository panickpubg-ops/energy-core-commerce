import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Check, Heart, Minus, Plus, ShieldCheck, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { actions, fmtDate, money, useDb, useSession } from "@/lib/db";
import { ProductCard, Stars } from "@/components/site/ProductCard";

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => {
    const name = params.slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    return {
      meta: [
        { title: `${name} — Voltarc Energy` },
        { name: "description", content: `${name}: specifications, pricing and reviews at Voltarc Energy.` },
        { property: "og:title", content: `${name} — Voltarc` },
        { property: "og:description", content: `Shop ${name} at Voltarc Energy.` },
      ],
    };
  },
  component: ProductPage,
  notFoundComponent: () => <div className="p-20 text-center">Product not found.</div>,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const product = useDb((s) => s.products.find((p) => p.slug === slug));
  const cat = useDb((s) => s.categories.find((c) => c.id === product?.categoryId));
  const reviews = useDb((s) => s.reviews.filter((r) => r.productId === product?.id && r.approved));
  const related = useDb((s) => s.products.filter((p) => p.categoryId === product?.categoryId && p.id !== product?.id && p.published).slice(0, 4));
  const wished = useDb((s) => !!product && s.wishlist.includes(product.id));
  const user = useSession();
  const [img, setImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"specs" | "reviews">("specs");
  const [rev, setRev] = useState({ rating: 5, title: "", body: "" });

  const loaded = useDb((s) => s.loaded);
  if (!product) {
    if (loaded) throw notFound();
    return <div className="mx-auto max-w-7xl px-4 py-24 text-center text-muted-foreground">Loading product…</div>;
  }
  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;
  const specs = [
    ["Chemistry", product.chemistry],
    ["Nominal voltage", product.voltage && `${product.voltage} V`],
    ["Capacity", product.capacityAh && `${product.capacityAh} Ah`],
    ["Energy", product.energyWh && `${product.energyWh} Wh`],
    ["Cycle life", product.cycleLife && `${product.cycleLife.toLocaleString()} cycles`],
    ["Dimensions", product.dimensions],
    ["Weight", product.weightKg && `${product.weightKg} kg`],
    ["Warranty", `${product.warrantyYears} years`],
    ["SKU", product.sku],
    ...product.specs.map((s) => [s.label, s.value]),
  ].filter(([, v]) => v && v !== "N/A") as [string, string][];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <nav className="text-xs text-muted-foreground">
        <Link to="/">Home</Link> / <Link to="/shop" search={{ category: cat?.slug }}>{cat?.name}</Link> / {product.name}
      </nav>
      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <div className="aspect-square overflow-hidden rounded-3xl bg-muted">
            <img src={product.images[img]} alt={product.name} className="h-full w-full object-cover" />
          </div>
          <div className="mt-3 flex gap-3">
            {product.images.map((src, i) => (
              <button key={i} onClick={() => setImg(i)} className={`h-20 w-20 overflow-hidden rounded-xl border-2 ${i === img ? "border-primary" : "border-transparent"}`}>
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
        <div className="lg:sticky lg:top-32 lg:self-start">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{product.tagline}</p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{product.name}</h1>
          {reviews.length > 0 && (
            <button onClick={() => setTab("reviews")} className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><Stars value={avg} /> {avg.toFixed(1)} · {reviews.length} reviews</button>
          )}
          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-semibold tabular-nums">{money(product.price)}</span>
            {product.compareAt && <span className="text-lg text-muted-foreground line-through">{money(product.compareAt)}</span>}
          </div>
          <div className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border bg-border text-center">
            {[["Voltage", product.voltage ? `${product.voltage}V` : "—"], ["Capacity", product.capacityAh ? `${product.capacityAh}Ah` : "—"], ["Energy", product.energyWh ? `${product.energyWh}Wh` : "—"]].map(([l, v]) => (
              <div key={l} className="bg-card p-4"><p className="font-mono text-lg font-medium">{v}</p><p className="text-xs text-muted-foreground">{l}</p></div>
            ))}
          </div>
          <p className="mt-6 leading-relaxed text-muted-foreground">{product.description}</p>
          <p className={`mt-6 flex items-center gap-2 text-sm ${product.stock > 0 ? "text-success" : "text-destructive"}`}>
            <span className="h-2 w-2 rounded-full bg-current" />
            {product.stock > product.lowStockThreshold ? "In stock — ships in 48h" : product.stock > 0 ? `Only ${product.stock} left` : "Out of stock"}
          </p>
          <div className="mt-4 flex gap-3">
            <div className="flex items-center rounded-full border bg-card">
              <button className="p-3" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease"><Minus className="h-4 w-4" /></button>
              <span className="w-8 text-center tabular-nums">{qty}</span>
              <button className="p-3" onClick={() => setQty(Math.min(product.stock, qty + 1))} aria-label="Increase"><Plus className="h-4 w-4" /></button>
            </div>
            <button
              disabled={product.stock <= 0}
              onClick={() => { actions.addToCart(product.id, qty); toast.success("Added to cart", { description: `${qty} × ${product.name}` }); }}
              className="flex-1 rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
            >
              Add to cart
            </button>
            <button onClick={() => actions.toggleWishlist(product.id).catch((e: Error) => toast.error(e.message))} className="grid w-12 place-items-center rounded-full border bg-card" aria-label="Wishlist">
              <Heart className={`h-5 w-5 ${wished ? "fill-foreground" : ""}`} />
            </button>
          </div>
          <ul className="mt-8 space-y-3 border-t pt-6 text-sm text-muted-foreground">
            <li className="flex gap-3"><Truck className="h-5 w-5 text-foreground" /> Free shipping over $250 · UN38.3 certified transport</li>
            <li className="flex gap-3"><ShieldCheck className="h-5 w-5 text-foreground" /> {product.warrantyYears}-year warranty, handled in-house</li>
          </ul>
        </div>
      </div>

      <div className="mt-20">
        <div className="flex gap-6 border-b">
          {(["specs", "reviews"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`-mb-px border-b-2 pb-3 text-sm font-medium capitalize ${tab === t ? "border-primary" : "border-transparent text-muted-foreground"}`}>
              {t === "specs" ? "Technical specifications" : `Reviews (${reviews.length})`}
            </button>
          ))}
        </div>
        {tab === "specs" ? (
          <dl className="mt-6 grid gap-x-12 md:grid-cols-2">
            {specs.map(([k, v]) => (
              <div key={k} className="flex justify-between border-b py-3 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="font-mono">{v}</dd></div>
            ))}
          </dl>
        ) : (
          <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              {reviews.length === 0 && <p className="text-muted-foreground">No reviews yet — be the first.</p>}
              {reviews.map((r) => (
                <div key={r.id} className="border-b pb-6">
                  <div className="flex items-center justify-between"><Stars value={r.rating} /><span className="text-xs text-muted-foreground">{fmtDate(r.createdAt)}</span></div>
                  <p className="mt-3 font-medium">{r.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>
                  <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><Check className="h-3 w-3" /> {r.author}</p>
                </div>
              ))}
            </div>
            <form
              className="h-fit space-y-3 rounded-2xl border bg-card p-6"
              onSubmit={(e) => {
                e.preventDefault();
                if (!user) return;
                actions.addReview({ ...rev, productId: product.id, author: user.name, userId: user.id })
                  .then(() => { setRev({ rating: 5, title: "", body: "" }); toast.success("Thanks! Your review will appear after moderation."); })
                  .catch((err: Error) => toast.error(err.message));
              }}
            >
              <h3 className="font-semibold">Write a review</h3>
              {user ? (
                <>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button type="button" key={n} onClick={() => setRev({ ...rev, rating: n })} className={`h-8 w-8 rounded-lg border text-sm ${n <= rev.rating ? "bg-primary text-primary-foreground" : ""}`}>{n}</button>
                    ))}
                  </div>
                  <input required placeholder="Title" value={rev.title} onChange={(e) => setRev({ ...rev, title: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                  <textarea required placeholder="How is it performing?" rows={4} value={rev.body} onChange={(e) => setRev({ ...rev, body: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                  <button className="w-full rounded-full bg-primary py-2.5 text-sm font-medium text-primary-foreground">Submit review</button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground"><Link to="/auth" className="underline">Sign in</Link> to leave a review.</p>
              )}
            </form>
          </div>
        )}
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="text-2xl font-semibold">Pairs well with</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">{related.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </section>
      )}
    </div>
  );
}
