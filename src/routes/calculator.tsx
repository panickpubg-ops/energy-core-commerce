import { createFileRoute, Link } from "@tanstack/react-router";
import { Anchor, Battery, Caravan, Home, Minus, Plus, ShoppingCart, Sun, Trees, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageTitle } from "@/components/site/Field";
import { actions, money, useDb } from "@/lib/db";
import { APPLIANCES, SAFETY_BUFFER, SETUPS, calculate, findAccessory, pickBatteryBank, type Appliance, type Setup, type SystemVoltage } from "@/lib/sizing";

export const Route = createFileRoute("/calculator")({
  head: () => ({
    meta: [
      { title: "Battery sizing calculator — Voltarc" },
      { name: "description", content: "Size your RV, marine, off-grid or home backup lithium battery bank in under a minute and get a matched system." },
      { property: "og:title", content: "Battery sizing calculator — Voltarc" },
      { property: "og:description", content: "Work out the watt-hours and amp-hours you need and get a recommended LiFePO4 system." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Calculator,
});

const icons: Record<Setup, typeof Caravan> = { rv: Caravan, cabin: Trees, marine: Anchor, backup: Home };

function Calculator() {
  const products = useDb((s) => s.products);
  const categories = useDb((s) => s.categories);
  const [setup, setSetup] = useState<Setup>("rv");
  const [voltage, setVoltage] = useState<SystemVoltage>(12);
  const [days, setDays] = useState(1);
  const [loads, setLoads] = useState<Appliance[]>(APPLIANCES.map((a) => ({ ...a, qty: ["fridge", "lights", "laptop"].includes(a.id) ? a.qty : 0 })));

  const r = calculate(loads, voltage, days);
  const bank = useMemo(() => pickBatteryBank(products, categories, voltage, r.requiredAh), [products, categories, voltage, r.requiredAh]);
  const charger = useMemo(() => findAccessory(products, categories, ["mppt", "solar charge", "charger"], "chargers", voltage), [products, categories, voltage]);
  const inverter = useMemo(() => findAccessory(products, categories, ["inverter"], undefined, voltage), [products, categories, voltage]);
  const system = !bank ? [] : [bank && { p: bank.product, qty: bank.qty }, charger && { p: charger, qty: 1 }, inverter && { p: inverter, qty: 1 }].filter(Boolean) as { p: (typeof products)[number]; qty: number }[];
  const systemTotal = system.reduce((s, l) => s + l.p.price * l.qty, 0);

  const pickSetup = (id: Setup) => {
    const s = SETUPS.find((x) => x.id === id)!;
    setSetup(id); setVoltage(s.voltage); setDays(s.days);
  };
  const update = (id: string, patch: Partial<Appliance>) => setLoads((l) => l.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <PageTitle eyebrow="System sizing" title="How much battery do you need?">
        Pick your setup and what you run each day. We add a {SAFETY_BUFFER * 100}% safety buffer and match a complete system from stock.
      </PageTitle>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_400px]">
        <div className="space-y-10">
          <section>
            <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">1 · Your setup</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {SETUPS.map((s) => {
                const Icon = icons[s.id];
                return (
                  <button key={s.id} onClick={() => pickSetup(s.id)} className={`flex gap-4 rounded-2xl border p-4 text-left transition ${setup === s.id ? "border-foreground bg-card shadow-sm" : "hover:border-foreground/30"}`}>
                    <Icon className="mt-0.5 h-6 w-6 shrink-0" />
                    <span><span className="block font-medium">{s.label}</span><span className="text-sm text-muted-foreground">{s.blurb}</span></span>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">2 · What you power</h2>
            <div className="mt-4 divide-y rounded-2xl border bg-card">
              {loads.map((a) => (
                <div key={a.id} className={`grid grid-cols-[1fr_auto] items-center gap-3 p-4 sm:grid-cols-[1fr_110px_110px_auto] ${a.qty === 0 ? "opacity-60" : ""}`}>
                  <span className="text-sm font-medium">{a.name}</span>
                  <label className="hidden text-xs text-muted-foreground sm:block">Watts<input type="number" min={0} value={a.watts} onChange={(e) => update(a.id, { watts: +e.target.value })} className="mt-1 w-full rounded-lg border bg-background px-2 py-1.5 font-mono text-sm text-foreground" /></label>
                  <label className="hidden text-xs text-muted-foreground sm:block">Hours/day<input type="number" min={0} step={0.25} value={a.hours} onChange={(e) => update(a.id, { hours: +e.target.value })} className="mt-1 w-full rounded-lg border bg-background px-2 py-1.5 font-mono text-sm text-foreground" /></label>
                  <div className="flex items-center gap-1 rounded-full border bg-background p-1">
                    <button aria-label={`Fewer ${a.name}`} onClick={() => update(a.id, { qty: Math.max(0, a.qty - 1) })} className="rounded-full p-1.5 hover:bg-muted"><Minus className="h-3.5 w-3.5" /></button>
                    <span className="w-6 text-center font-mono text-sm">{a.qty}</span>
                    <button aria-label={`More ${a.name}`} onClick={() => update(a.id, { qty: a.qty + 1 })} className="rounded-full p-1.5 hover:bg-muted"><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-wrap gap-8">
            <div>
              <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">3 · System voltage</h2>
              <div className="mt-3 inline-flex rounded-full border bg-card p-1">
                {([12, 24, 48] as const).map((v) => (
                  <button key={v} onClick={() => setVoltage(v)} className={`rounded-full px-5 py-2 font-mono text-sm ${voltage === v ? "bg-primary text-primary-foreground" : ""}`}>{v}V</button>
                ))}
              </div>
            </div>
            <div>
              <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Days without charging</h2>
              <div className="mt-3 inline-flex rounded-full border bg-card p-1">
                {[1, 2, 3].map((d) => (
                  <button key={d} onClick={() => setDays(d)} className={`rounded-full px-5 py-2 font-mono text-sm ${days === d ? "bg-primary text-primary-foreground" : ""}`}>{d}</button>
                ))}
              </div>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-3xl bg-ink p-6 text-ink-foreground">
            <p className="font-mono text-xs uppercase tracking-wider text-ink-foreground/60">Your numbers</p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Metric label="Daily use" value={`${r.dailyWh.toLocaleString()} Wh`} />
              <Metric label="Bank needed" value={`${r.requiredWh.toLocaleString()} Wh`} />
              <Metric label={`At ${voltage}V`} value={`${r.requiredAh} Ah`} />
              <Metric label="Inverter" value={`${r.inverterW.toLocaleString()} W`} />
              <Metric label="Solar array" value={`${r.solarW.toLocaleString()} W`} />
              <Metric label="Peak load" value={`${r.peakW.toLocaleString()} W`} />
            </div>
          </div>

          <div className="mt-4 rounded-3xl border bg-card p-6">
            <p className="font-semibold">Your recommended system</p>
            {r.dailyWh === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Add at least one appliance to see a recommendation.</p>
            ) : system.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No matching {voltage}V batteries are in stock right now. <Link to="/contact" className="underline">Ask our engineers</Link> for a custom pack.</p>
            ) : (
              <>
                <ul className="mt-4 space-y-3">
                  {bank && <Line icon={Battery} qty={bank.qty} name={bank.product.name} note={`${bank.series}S${bank.parallel}P · ${(bank.product.capacityAh! * bank.parallel)} Ah @ ${voltage}V`} price={bank.total} slug={bank.product.slug} />}
                  {charger && <Line icon={Sun} qty={1} name={charger.name} note="Charging" price={charger.price} slug={charger.slug} />}
                  {inverter && <Line icon={Zap} qty={1} name={inverter.name} note={`Need ≥ ${r.inverterW} W`} price={inverter.price} slug={inverter.slug} />}
                </ul>
                <div className="mt-5 flex items-center justify-between border-t pt-4"><span className="text-sm text-muted-foreground">System total</span><span className="text-xl font-semibold tabular-nums">{money(systemTotal)}</span></div>
                <button
                  onClick={() => { system.forEach((l) => actions.addToCart(l.p.id, l.qty)); toast.success("System added to cart"); }}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  <ShoppingCart className="h-4 w-4" /> Add complete system to cart
                </button>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-ink-foreground/60">{label}</p><p className="mt-0.5 font-mono text-lg">{value}</p></div>;
}

function Line({ icon: Icon, qty, name, note, price, slug }: { icon: typeof Battery; qty: number; name: string; note: string; price: number; slug: string }) {
  return (
    <li className="flex gap-3 text-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1"><Link to="/product/$slug" params={{ slug }} className="font-medium hover:underline">{qty} × {name}</Link><p className="text-xs text-muted-foreground">{note}</p></div>
      <span className="tabular-nums">{money(price)}</span>
    </li>
  );
}
