import { Link } from "@tanstack/react-router";
import { Heart, Plus, Star } from "lucide-react";
import { toast } from "sonner";
import { actions, money, useDb } from "@/lib/db";
import type { Product } from "@/lib/types";

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} style={{ width: size, height: size }} className={i <= Math.round(value) ? "fill-foreground text-foreground" : "text-border"} />
      ))}
    </span>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const wished = useDb((s) => s.wishlist.includes(product.id));
  const reviews = useDb((s) => s.reviews.filter((r) => r.productId === product.id && r.approved));
  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;
  const out = product.stock <= 0;

  return (
    <div className="group relative flex flex-col">
      <Link to="/product/$slug" params={{ slug: product.slug }} className="relative block aspect-square overflow-hidden rounded-2xl bg-muted">
        <img src={product.images[0]} alt={product.name} loading="lazy" width={600} height={600} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute left-3 top-3 flex gap-1.5">
          {product.compareAt && <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-foreground">−{Math.round((1 - product.price / product.compareAt) * 100)}%</span>}
          {out && <span className="rounded-full bg-card px-2.5 py-1 text-[11px] font-medium">Sold out</span>}
        </div>
      </Link>
      <button
        onClick={() => actions.toggleWishlist(product.id)}
        className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-card/90 backdrop-blur transition hover:scale-105"
        aria-label="Toggle wishlist"
      >
        <Heart className={`h-4 w-4 ${wished ? "fill-foreground" : ""}`} />
      </button>
      <div className="mt-4 flex flex-1 flex-col">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          {product.chemistry !== "N/A" && <span>{product.chemistry}</span>}
          {product.voltage && <span>· {product.voltage}V</span>}
          {product.capacityAh && <span>· {product.capacityAh}Ah</span>}
        </div>
        <Link to="/product/$slug" params={{ slug: product.slug }} className="mt-1 font-medium leading-snug hover:underline">
          {product.name}
        </Link>
        {reviews.length > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Stars value={avg} size={12} /> ({reviews.length})
          </div>
        )}
        <div className="mt-auto flex items-end justify-between pt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold tabular-nums">{money(product.price)}</span>
            {product.compareAt && <span className="text-sm text-muted-foreground line-through">{money(product.compareAt)}</span>}
          </div>
          <button
            disabled={out}
            onClick={() => {
              actions.addToCart(product.id);
              toast.success("Added to cart", { description: product.name });
            }}
            className="grid h-9 w-9 place-items-center rounded-full border bg-card transition hover:bg-primary hover:text-primary-foreground disabled:opacity-40"
            aria-label="Add to cart"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
