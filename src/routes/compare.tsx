import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, ShoppingCart, X } from "lucide-react";
import { toast } from "sonner";
import { PageTitle } from "@/components/site/Field";
import { actions, money, useDb } from "@/lib/db";
import type { Product } from "@/lib/types";

type Search = { ids?: string | undefined };

export const Route = createFileRoute("/compare")({
  validateSearch: (s: Record<string, unknown>): Search => ({ ids: typeof s["ids"] === "string" ? s["ids"] : undefined }),
  head: () => ({
    meta: [
      { title: "Compare batteries — Voltarc" },
      { name: "description", content: "Compare up to 4 Voltarc batteries side by side, and see how LiFePO4 stacks up against AGM and lead-acid." },
      { property: "og:title", content: "Compare batteries — Voltarc" },
      { property: "og:description", content: "Side-by-side specs, plus LiFePO4 vs AGM lifetime cost." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Compare,
});

const CHEM = [
  ["Usable capacity (depth of discharge)", "100%", "50%"],
  ["Cycle life", "4,000+ cycles", "~500 cycles"],
  ["Weight (100Ah, 12V)", "~11 kg", "~30 kg"],
  ["Cost per cycle", "$0.08", "$0.35"],
  ["Voltage under load", "Flat until empty", "Sags as it drains"],
  ["Maintenance", "None", "Equalizing, venting"],
  ["Charge time", "2–3 hours", "8+ hours"],
  ["Built-in protection", "BMS, Bluetooth, low-temp options", "None"],
];

const rows: [string, (p: Product) => string][] = [
  ["Price", (p) => money(p.price)],
  ["Chemistry", (p) => p.chemistry],
  ["Voltage", (p) => (p.voltage ? `${p.voltage} V` : "—")],
  ["Capacity", (p) => (p.capacityAh ? `${p.capacityAh} Ah` : "—")],
  ["Energy", (p) => { const wh = p.energyWh ?? (p.voltage && p.capacityAh ? p.voltage * p.capacityAh : 0); return wh ? `${wh.toLocaleString()} Wh` : "—"; }],
  ["Cost per Wh", (p) => { const wh = p.energyWh ?? (p.voltage && p.capacityAh ? p.voltage * p.capacityAh : 0); return wh ? `$${(p.price / wh).toFixed(2)}` : "—"; }],
  ["Cycle life", (p) => (p.cycleLife ? `${p.cycleLife.toLocaleString()}` : "—")],
  ["Weight", (p) => (p.weightKg ? `${p.weightKg} kg` : "—")],
  ["Dimensions", (p) => p.dimensions ?? "—"],
  ["Warranty", (p) => `${p.warrantyYears} years`],
  ["Bluetooth", (p) => specHas(p, "bluetooth")],
  ["Low-temp heater", (p) => specHas(p, "heat")],
  ["In stock", (p) => (p.stock > 0 ? "Yes" : "No")],
];

function specHas(p: Product, word: string) {
  const s = p.specs.find((x) => x.label.toLowerCase().includes(word));
  if (s) return s.value;
  return p.description.toLowerCase().includes(word) ? "Yes" : "—";
}

function Compare() {
  const { ids } = Route.useSearch();
  const navigate = Route.useNavigate();
  const products = useDb((s) => s.products.filter((p) => p.published));
  const chosen = (ids ?? "").split(",").map((id) => products.find((p) => p.id === id)).filter(Boolean) as Product[];
  const setIds = (list: string[]) => navigate({ search: { ids: list.length ? list.join(",") : undefined }, replace: true });
  const available = products.filter((p) => !chosen.some((c) => c.id === p.id) && p.chemistry !== "N/A");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <PageTitle eyebrow="Compare" title="Side by side">Pick up to four batteries. Share the link with your installer — your selection is saved in it.</PageTitle>

      <div className="mt-8 overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b">
              <th className="w-44 p-4" />
              {chosen.map((p) => (
                <th key={p.id} className="p-4 text-left align-top font-normal">
                  <div className="relative">
                    <button aria-label={`Remove ${p.name}`} onClick={() => setIds(chosen.filter((c) => c.id !== p.id).map((c) => c.id))} className="absolute right-0 top-0 rounded-full p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
                    {p.images[0] && <img src={p.images[0]} alt={p.name} className="mb-3 aspect-square w-24 rounded-xl bg-muted object-cover" />}
                    <Link to="/product/$slug" params={{ slug: p.slug }} className="block pr-6 font-medium hover:underline">{p.name}</Link>
                    <button disabled={p.stock <= 0} onClick={() => { actions.addToCart(p.id); toast.success("Added to cart"); }} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-40"><ShoppingCart className="h-3.5 w-3.5" /> Add</button>
                  </div>
                </th>
              ))}
              {chosen.length < 4 && (
                <th className="p-4 text-left align-top font-normal">
                  <label className="flex flex-col gap-2 rounded-xl border border-dashed p-4 text-muted-foreground">
                    <span className="flex items-center gap-1.5 text-xs"><Plus className="h-4 w-4" /> Add a battery</span>
                    <select value="" onChange={(e) => e.target.value && setIds([...chosen.map((c) => c.id), e.target.value])} className="rounded-lg border bg-background px-2 py-1.5 text-sm text-foreground">
                      <option value="">Choose…</option>
                      {available.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </label>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {chosen.length === 0 ? (
              <tr><td colSpan={2} className="p-8 text-center text-muted-foreground">Add a battery to start comparing.</td></tr>
            ) : rows.map(([label, fn]) => (
              <tr key={label} className="border-b last:border-0">
                <td className="p-4 text-muted-foreground">{label}</td>
                {chosen.map((p) => <td key={p.id} className="p-4 font-mono">{fn(p)}</td>)}
                {chosen.length < 4 && <td />}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mt-16">
        <h2 className="text-2xl font-semibold">LiFePO4 vs AGM / lead-acid</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">Why lithium iron phosphate costs less over its life, even though it costs more on day one.</p>
        <div className="mt-6 overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full min-w-[560px] text-sm">
            <thead><tr className="border-b text-left"><th className="p-4" /><th className="p-4">Voltarc LiFePO4</th><th className="p-4 text-muted-foreground">AGM / lead-acid</th></tr></thead>
            <tbody>
              {CHEM.map(([k, a, b]) => (
                <tr key={k} className="border-b last:border-0"><td className="p-4 text-muted-foreground">{k}</td><td className="p-4 font-medium">{a}</td><td className="p-4 text-muted-foreground">{b}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <Link to="/calculator" className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">Size my system</Link>
      </section>
    </div>
  );
}
