import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { auditCatalog } from "@/lib/catalog-audit.functions";
import type { CatalogAudit as Audit } from "@/lib/catalog-audit.server";
import { getDb } from "@/lib/db";
import { supabase } from "@/lib/supabase";

const tone = { high: "bg-destructive/10 text-destructive", medium: "bg-warning/20 text-foreground", low: "bg-muted text-muted-foreground" };

export function CatalogAudit() {
  const run = useServerFn(auditCatalog);
  const [adminData, setAdminData] = useState("");
  const [includeCatalog, setIncludeCatalog] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Audit | null>(null);

  const go = async () => {
    const s = getDb();
    if (!includeCatalog && !adminData.trim()) { toast.error("Add some data or include the current catalog."); return; }
    setBusy(true);
    setResult(null);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error("Please sign in again.");
      const catalog = includeCatalog
        ? JSON.stringify(s.products.map((p) => ({
            sku: p.sku, name: p.name, slug: p.slug, category: s.categories.find((c) => c.id === p.categoryId)?.name ?? null,
            price: p.price, compareAt: p.compareAt ?? null, stock: p.stock, lowStockThreshold: p.lowStockThreshold,
            voltage: p.voltage ?? null, capacityAh: p.capacityAh ?? null, energyWh: p.energyWh ?? null, chemistry: p.chemistry,
            cycleLife: p.cycleLife ?? null, dimensions: p.dimensions ?? null, weightKg: p.weightKg ?? null, warrantyYears: p.warrantyYears,
            imageCount: p.images.length, descriptionLength: p.description.length, specs: p.specs, published: p.published,
          })))
        : "[]";
      setResult(await run({ data: { accessToken: data.session.access_token, catalog, adminData } }));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-3xl border bg-card p-6">
      <div className="flex items-center gap-2"><Sparkles className="h-5 w-5" /><h2 className="font-semibold">AI listing audit</h2></div>
      <p className="mt-1 text-sm text-muted-foreground">Paste or upload supplier sheets, stock counts or spec data. Lovable AI checks them against your catalog for missing or conflicting details and suggests fixes.</p>
      <textarea value={adminData} onChange={(e) => setAdminData(e.target.value)} rows={6} placeholder={"sku,stock,voltage,capacity_ah\nVA-LFP-12100,120,12.8,100"} className="mt-4 w-full rounded-xl border bg-background p-3 font-mono text-xs" />
      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
        <label className="flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5"><Upload className="h-4 w-4" /> Upload CSV / JSON
          <input type="file" accept=".csv,.json,.txt,.tsv" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setAdminData(await f.text()); }} />
        </label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={includeCatalog} onChange={(e) => setIncludeCatalog(e.target.checked)} /> Include current catalog</label>
        <button onClick={go} disabled={busy} className="ml-auto rounded-full bg-primary px-5 py-2 font-medium text-primary-foreground disabled:opacity-50">{busy ? "Analyzing…" : "Run audit"}</button>
      </div>
      {result && (
        <div className="mt-6">
          <p className="text-sm">{result.summary}</p>
          <ul className="mt-4 space-y-3">
            {result.issues.map((i, n) => (
              <li key={n} className="rounded-2xl border p-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${tone[i.severity]}`}>{i.severity}</span>
                  <span className="font-medium">{i.productName}</span>
                  <span className="font-mono text-xs text-muted-foreground">{i.sku} · {i.field}</span>
                </div>
                <p className="mt-2 text-muted-foreground">{i.problem}</p>
                <p className="mt-1"><b>Fix:</b> {i.fix}</p>
              </li>
            ))}
            {!result.issues.length && <li className="text-sm text-success">No problems found.</li>}
          </ul>
        </div>
      )}
    </section>
  );
}
