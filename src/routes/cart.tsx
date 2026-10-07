import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { actions, computeTotals, money, useDb } from "@/lib/db";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your cart — Voltarc" }, { name: "description", content: "Review items in your Voltarc cart." }, { property: "og:title", content: "Cart — Voltarc" }, { property: "og:description", content: "Your Voltarc cart." }] }),
  component: Cart,
});

function Cart() {
  const s = useDb((x) => x);
  const t = computeTotals(s);
  const left = s.settings.freeShippingThreshold - t.subtotal;

  if (!t.lines.length)
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-4xl font-semibold">Your cart is empty.</h1>
        <p className="mt-3 text-muted-foreground">Let's find the right battery for your system.</p>
        <Link to="/shop" className="mt-8 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">Start shopping</Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <h1 className="text-4xl font-semibold">Cart</h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <ul className="divide-y border-y">
          {t.lines.map((l) => (
            <li key={l.productId} className="flex gap-4 py-6">
              <img src={l.product.images[0]} alt="" className="h-24 w-24 rounded-xl bg-muted object-cover sm:h-28 sm:w-28" />
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-4">
                  <div>
                    <Link to="/product/$slug" params={{ slug: l.product.slug }} className="font-medium hover:underline">{l.product.name}</Link>
                    <p className="font-mono text-xs text-muted-foreground">{l.product.sku}</p>
                  </div>
                  <p className="font-semibold tabular-nums">{money(l.product.price * l.qty)}</p>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-center rounded-full border bg-card">
                    <button className="p-2" onClick={() => actions.setQty(l.productId, l.qty - 1)} aria-label="Decrease"><Minus className="h-3.5 w-3.5" /></button>
                    <span className="w-8 text-center text-sm tabular-nums">{l.qty}</span>
                    <button className="p-2" onClick={() => actions.setQty(l.productId, Math.min(l.product.stock, l.qty + 1))} aria-label="Increase"><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                  <button onClick={() => actions.setQty(l.productId, 0)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /> Remove</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <aside className="h-fit rounded-3xl border bg-card p-6">
          {left > 0 ? (
            <div className="mb-6">
              <p className="text-sm">You're <b>{money(left)}</b> away from free shipping.</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-accent" style={{ width: `${Math.min(100, (t.subtotal / s.settings.freeShippingThreshold) * 100)}%` }} /></div>
            </div>
          ) : (
            <p className="mb-6 text-sm text-success">✓ You've unlocked free shipping</p>
          )}
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="tabular-nums">{money(t.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd>{t.shipping ? money(t.shipping) : "Free"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Est. tax</dt><dd className="tabular-nums">{money(t.tax)}</dd></div>
            <div className="flex justify-between border-t pt-3 text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{money(t.total)}</dd></div>
          </dl>
          <Link to="/checkout" className="mt-6 block rounded-full bg-primary py-3.5 text-center text-sm font-semibold text-primary-foreground">Checkout</Link>
          <p className="mt-3 text-center text-xs text-muted-foreground">Discount codes applied at checkout</p>
        </aside>
      </div>
    </div>
  );
}
