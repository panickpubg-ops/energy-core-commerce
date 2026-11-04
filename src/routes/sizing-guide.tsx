import { createFileRoute, Link } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { PageTitle } from "@/components/site/Field";

export const Route = createFileRoute("/sizing-guide")({
  head: () => ({
    meta: [
      { title: "Off-grid lithium sizing & wiring handbook — Voltarc" },
      { name: "description", content: "Free handbook: how to size a LiFePO4 battery bank, wire series and parallel safely, and pick chargers and inverters." },
      { property: "og:title", content: "Off-grid lithium sizing & wiring handbook" },
      { property: "og:description", content: "Size, wire and protect a LiFePO4 system the right way." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Guide,
});

function Guide() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 lg:px-8">
      <PageTitle eyebrow="2026 handbook" title="Off-grid lithium sizing & wiring">A practical guide to building a safe, right-sized LiFePO4 system.</PageTitle>
      <button onClick={() => window.print()} className="mt-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm print:hidden"><Printer className="h-4 w-4" /> Print or save as PDF</button>
      <div className="mt-10 space-y-10 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold">1. Work out daily energy</h2>
          <p className="mt-2 text-muted-foreground">For each device, multiply watts × hours used per day. Add them up to get watt-hours (Wh) per day. A 60 W fridge running 10 hours uses 600 Wh.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">2. Size the battery bank</h2>
          <p className="mt-2 text-muted-foreground">Multiply daily Wh by the days you want to go without charging, then add 20% headroom. Divide by system voltage for amp-hours: 1,440 Wh ÷ 12 V = 120 Ah. LiFePO4 is usable to 100% depth of discharge, so you don't need to double it like lead-acid.</p>
          <Link to="/calculator" className="mt-3 inline-flex text-sm font-medium underline print:hidden">Use the calculator →</Link>
        </section>
        <section id="wiring">
          <h2 className="text-xl font-semibold">3. Series vs parallel</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li><b className="text-foreground">Series</b> adds voltage: two 12 V 100 Ah batteries = 24 V 100 Ah.</li>
            <li><b className="text-foreground">Parallel</b> adds capacity: two 12 V 100 Ah batteries = 12 V 200 Ah.</li>
            <li>Only connect identical batteries of the same age and charge level. Top-balance before connecting.</li>
            <li>Use equal-length cables and connect the main load leads diagonally across the bank.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold">4. Cables, fuses and protection</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Fuse the positive lead within 18 cm of the battery, rated for the cable, not the load.</li>
            <li>Size cable for the maximum continuous current with less than 3% voltage drop.</li>
            <li>Fit a main disconnect switch and a battery monitor (shunt) for accurate state of charge.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold">5. Chargers and inverters</h2>
          <p className="mt-2 text-muted-foreground">Pick a charger with a LiFePO4 profile (14.2–14.6 V absorb for 12 V). Size the inverter for 125% of the largest combined load you will run at once. Solar array: daily Wh × 1.3 ÷ peak sun hours.</p>
        </section>
      </div>
    </article>
  );
}
