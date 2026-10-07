import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { actions, computeTotals, money, useDb, useSession } from "@/lib/db";
import { Field } from "@/components/site/Field";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Secure checkout — Voltarc" }, { name: "description", content: "Complete your Voltarc order." }, { property: "og:title", content: "Checkout — Voltarc" }, { property: "og:description", content: "Secure checkout." }] }),
  component: Checkout,
});

function Checkout() {
  const s = useDb((x) => x);
  const user = useSession();
  const navigate = useNavigate();
  const [code, setCode] = useState<string>("");
  const [applied, setApplied] = useState<string | undefined>(undefined);
  const [pay, setPay] = useState("card");
  const [busy, setBusy] = useState(false);
  const t = computeTotals(s, applied);

  if (!t.lines.length)
    return <div className="py-24 text-center"><p>Your cart is empty.</p><Link to="/shop" className="mt-4 inline-block underline">Shop</Link></div>;

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const g = (k: string) => String(f.get(k) ?? "");
    setBusy(true);
    try {
      const order = actions.placeOrder({
        email: g("email"),
        couponCode: applied,
        paymentMethod: pay === "card" ? `Card •••• ${g("card").slice(-4) || "4242"}` : "PayPal",
        address: { name: g("name"), line1: g("line1"), city: g("city"), region: g("region"), postal: g("postal"), country: g("country") },
      });
      toast.success(`Order ${order.number} confirmed`);
      navigate({ to: "/track", search: { number: order.number, email: order.email, placed: true } });
    } catch (err) {
      toast.error((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <h1 className="flex items-center gap-3 text-3xl font-semibold"><Lock className="h-6 w-6" /> Checkout</h1>
      <form onSubmit={submit} className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px]">
        <div className="space-y-10">
          <section>
            <h2 className="mb-4 font-semibold">Contact</h2>
            <Field label="Email" name="email" type="email" required defaultValue={user?.email} />
            {!user && <p className="mt-2 text-xs text-muted-foreground">Have an account? <Link to="/auth" className="underline">Sign in</Link> to track orders easily.</p>}
          </section>
          <section>
            <h2 className="mb-4 font-semibold">Shipping address</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Field label="Full name" name="name" required defaultValue={user?.name} /></div>
              <div className="sm:col-span-2"><Field label="Address" name="line1" required /></div>
              <Field label="City" name="city" required />
              <Field label="State / Region" name="region" required />
              <Field label="Postal code" name="postal" required />
              <Field label="Country" name="country" required defaultValue="US" />
            </div>
          </section>
          <section>
            <h2 className="mb-4 font-semibold">Payment</h2>
            <div className="grid grid-cols-2 gap-3">
              {[["card", "Credit card"], ["paypal", "PayPal"]].map(([v, l]) => (
                <button type="button" key={v} onClick={() => setPay(v ?? "card")} className={`rounded-xl border p-4 text-left text-sm ${pay === v ? "border-primary ring-2 ring-primary/10" : "bg-card"}`}>{l}</button>
              ))}
            </div>
            {pay === "card" && (
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-3"><Field label="Card number" name="card" placeholder="4242 4242 4242 4242" inputMode="numeric" /></div>
                <Field label="Expiry" placeholder="MM / YY" />
                <Field label="CVC" placeholder="123" />
              </div>
            )}
            <p className="mt-3 text-xs text-muted-foreground">Test mode — no real charge is made. A payment provider will be connected before launch.</p>
          </section>
        </div>
        <aside className="h-fit rounded-3xl border bg-card p-6 lg:sticky lg:top-32">
          <ul className="space-y-4">
            {t.lines.map((l) => (
              <li key={l.productId} className="flex gap-3 text-sm">
                <div className="relative"><img src={l.product.images[0]} alt="" className="h-14 w-14 rounded-lg object-cover" /><span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">{l.qty}</span></div>
                <span className="flex-1">{l.product.name}</span>
                <span className="tabular-nums">{money(l.product.price * l.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex gap-2">
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Discount code" className="flex-1 rounded-xl border bg-background px-3 py-2 text-sm uppercase" />
            <button type="button" onClick={() => { const r = computeTotals(s, code); if (r.coupon) { setApplied(code); toast.success("Code applied"); } else toast.error("Code invalid or minimum not met"); }} className="rounded-xl border px-4 text-sm font-medium">Apply</button>
          </div>
          <dl className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{money(t.subtotal)}</dd></div>
            {t.discount > 0 && <div className="flex justify-between text-success"><dt>Discount ({t.coupon?.code})</dt><dd>−{money(t.discount)}</dd></div>}
            <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd>{t.shipping ? money(t.shipping) : "Free"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Tax ({s.settings.taxRate}%)</dt><dd>{money(t.tax)}</dd></div>
            <div className="flex justify-between border-t pt-3 text-lg font-semibold"><dt>Total</dt><dd className="tabular-nums">{money(t.total)}</dd></div>
          </dl>
          <button disabled={busy} className="mt-6 w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">Pay {money(t.total)}</button>
        </aside>
      </form>
    </div>
  );
}
