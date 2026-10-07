import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BatteryCharging, Cpu, ShieldCheck, Truck } from "lucide-react";
import { useDb } from "@/lib/db";
import { IMAGES } from "@/lib/seed";
import { ProductCard, Stars } from "@/components/site/ProductCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Voltarc Energy — Premium LiFePO4 Batteries & Power Stations" },
      { name: "description", content: "Grade-A lithium batteries, portable power stations, BMS systems and chargers with 10-year warranties." },
      { property: "og:title", content: "Voltarc Energy — Premium Lithium Energy Storage" },
      { property: "og:description", content: "Grade-A LiFePO4 batteries, power stations and BMS systems, tested cell by cell." },
    ],
  }),
  component: Home,
});

function Home() {
  const home = useDb((s) => s.home);
  const cats = useDb((s) => s.categories);
  const featured = useDb((s) => s.products.filter((p) => p.featured && p.published));
  const reviews = useDb((s) => s.reviews.filter((r) => r.approved).slice(0, 3));

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-ink-foreground">
        <div className="grid-lines absolute inset-0 opacity-60" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 lg:grid-cols-12 lg:px-8 lg:py-24">
          <div className="lg:col-span-5">
            <p className="inline-flex items-center gap-2 rounded-full border border-ink-foreground/15 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-ink-foreground/70">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> {home.heroEyebrow}
            </p>
            <h1 className="mt-6 text-5xl font-semibold leading-[0.95] sm:text-6xl lg:text-7xl">{home.heroTitle}</h1>
            <p className="mt-6 max-w-md text-lg text-ink-foreground/65">{home.heroSubtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop" className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-accent-foreground transition hover:brightness-95">
                {home.heroCta} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/shop" search={{ category: "power-stations" }} className="rounded-full border border-ink-foreground/20 px-6 py-3.5 text-sm font-medium hover:bg-ink-foreground/5">
                Power stations
              </Link>
            </div>
            <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-ink-foreground/10 pt-8">
              {[["6,000+", "cycles @ 80% DoD"], ["10 yr", "warranty"], ["48 h", "dispatch"]].map(([a, b]) => (
                <div key={b}>
                  <dt className="text-2xl font-semibold tabular-nums">{a}</dt>
                  <dd className="mt-1 text-xs text-ink-foreground/50">{b}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative lg:col-span-7">
            <img src={IMAGES.hero} alt="Voltarc LiFePO4 lithium battery" width={1600} height={1104} className="w-full rounded-3xl" />
            <div className="absolute -bottom-4 left-4 rounded-2xl border border-ink-foreground/10 bg-ink/90 p-4 backdrop-blur sm:left-8">
              <p className="font-mono text-[10px] uppercase tracking-wider text-ink-foreground/50">Live spec</p>
              <p className="mt-1 font-mono text-sm">12.8V · 100Ah · 1280Wh</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-b bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-6 text-sm lg:grid-cols-4 lg:px-8">
          {[[Truck, "Free shipping over $250"], [ShieldCheck, "Up to 10-year warranty"], [BatteryCharging, "Grade-A cells, tested"], [Cpu, "Engineer-led support"]].map(([Icon, t]) => {
            const I = Icon as typeof Truck;
            return (
              <div key={t as string} className="flex items-center gap-3 text-muted-foreground">
                <I className="h-5 w-5 text-foreground" /> {t as string}
              </div>
            );
          })}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Categories</p>
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Every part of the system.</h2>
          </div>
          <Link to="/shop" className="hidden items-center gap-1 text-sm font-medium sm:flex">View all <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3">
          {cats.map((c, i) => (
            <Link key={c.id} to="/shop" search={{ category: c.slug }} className={`group relative overflow-hidden rounded-2xl bg-muted ${i === 0 ? "md:row-span-2" : ""}`}>
              <img src={c.image} alt={c.name} loading="lazy" className="h-full min-h-48 w-full object-cover transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-5 text-ink-foreground">
                <h3 className="font-semibold">{c.name}</h3>
                <p className="mt-1 hidden text-xs text-ink-foreground/70 sm:block">{c.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 lg:px-8">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Bestsellers</p>
        <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Trusted in vans, boats and homes.</h2>
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
          {featured.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Why LiFePO4 */}
      <section className="mx-auto mt-24 max-w-7xl px-4 lg:px-8">
        <div className="grid gap-px overflow-hidden rounded-3xl border bg-border md:grid-cols-3">
          {[
            ["01", "Chemistry that lasts", "LiFePO4 delivers 10× the cycle life of lead-acid with no thermal runaway risk."],
            ["02", "Smart protection", "Every battery ships with a BMS guarding cell voltage, current and temperature."],
            ["03", "Engineered support", "Sizing help, wiring diagrams and warranty handled by our in-house engineers."],
          ].map(([n, t, d]) => (
            <div key={n} className="bg-card p-8">
              <span className="font-mono text-sm text-muted-foreground">{n}</span>
              <h3 className="mt-6 text-xl font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Reviews */}
      <section className="mx-auto mt-24 max-w-7xl px-4 lg:px-8">
        <h2 className="text-3xl font-semibold sm:text-4xl">What owners say.</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {reviews.map((r) => (
            <figure key={r.id} className="rounded-2xl border bg-card p-6">
              <Stars value={r.rating} />
              <blockquote className="mt-4 font-medium">“{r.title}”</blockquote>
              <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>
              <figcaption className="mt-4 text-xs text-muted-foreground">— {r.author}, verified buyer</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </>
  );
}
