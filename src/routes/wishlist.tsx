import { createFileRoute } from "@tanstack/react-router";
import { useDb } from "@/lib/db";
import { ProductCard } from "@/components/site/ProductCard";
import { PageTitle } from "@/components/site/Field";
export const Route = createFileRoute("/wishlist")({
  head: () => ({ meta: [{ title: "Wishlist — Voltarc" }, { name: "description", content: "Saved products." }, { property: "og:title", content: "Wishlist — Voltarc" }, { property: "og:description", content: "Saved products." }] }),
  component: W,
});
function W() {
  const items = useDb((s) => s.products.filter((p) => s.wishlist.includes(p.id)));
  return (<div className="mx-auto max-w-7xl px-4 py-12 lg:px-8"><PageTitle title="Wishlist" />
    <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">{items.map((p) => <ProductCard key={p.id} product={p} />)}</div>
    {!items.length && <p className="mt-8 text-muted-foreground">Nothing saved yet.</p>}</div>);
}
