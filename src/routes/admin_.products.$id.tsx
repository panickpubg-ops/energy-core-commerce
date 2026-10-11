import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowDown, ArrowLeft, ArrowUp, ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { actions, newId, slugify, useDb, useSession } from "@/lib/db";
import { energyFrom, validateProduct, type ProductErrors } from "@/lib/product-validation";
import type { Chemistry, Product } from "@/lib/types";

export const Route = createFileRoute("/admin_/products/$id")({
  head: () => ({ meta: [{ title: "Edit product — Voltarc Admin" }, { name: "robots", content: "noindex" }, { name: "description", content: "Product editor." }, { property: "og:title", content: "Product editor — Voltarc" }, { property: "og:description", content: "Product editor." }] }),
  component: Editor,
});

const CHEM: Chemistry[] = ["LiFePO4", "NMC", "Li-ion", "LTO", "N/A"];
const blank = (): Product => ({
  id: newId(), slug: "", name: "", sku: "", categoryId: "", tagline: "", description: "", price: 0,
  stock: 0, lowStockThreshold: 10, chemistry: "LiFePO4", warrantyYears: 2, images: [], specs: [],
  featured: false, published: false, createdAt: new Date().toISOString(),
});
const optNum = (v: string) => (v.trim() === "" ? undefined : Number(v));
const input = "w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40";

function F({ label, error, hint, children, span }: { label: string; error?: string | undefined; hint?: string; children: ReactNode; span?: boolean }) {
  return (
    <label className={`block text-sm ${span ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block font-medium">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-destructive">{error}</span> : hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}
function Card({ title, children, desc }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border bg-card p-6">
      <h2 className="font-semibold">{title}</h2>
      {desc && <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Editor() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const user = useSession();
  const loaded = useDb((s) => s.loaded);
  const products = useDb((s) => s.products);
  const cats = useDb((s) => s.categories);
  const navigate = useNavigate();
  const existing = products.find((p) => p.id === id);
  const [p, setP] = useState<Product | null>(isNew ? blank() : null);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [errors, setErrors] = useState<ProductErrors>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(0);

  useEffect(() => { if (!isNew && existing && !p) setP(existing); }, [existing, isNew, p]);

  if (!loaded || (!isNew && !p && !existing && !loaded)) return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;
  if (user?.role !== "admin") return <div className="grid min-h-screen place-items-center"><Link to="/auth" className="underline">Sign in as an admin</Link></div>;
  if (!p) return <div className="grid min-h-screen place-items-center"><div className="text-center"><p>Product not found.</p><Link to="/admin" className="underline">Back to admin</Link></div></div>;

  const up = (patch: Partial<Product>) => setP((cur) => (cur ? { ...cur, ...patch } : cur));
  const suggestedWh = energyFrom(p.voltage, p.capacityAh);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = [...files].filter((f) => {
      if (!f.type.startsWith("image/")) { toast.error(`${f.name} isn't an image`); return false; }
      if (f.size > 8 * 1024 * 1024) { toast.error(`${f.name} is larger than 8 MB`); return false; }
      return true;
    });
    setUploading((n) => n + list.length);
    for (const f of list) {
      try {
        const url = await actions.uploadImage(f, f.name);
        setP((cur) => (cur ? { ...cur, images: [...cur.images, url] } : cur));
      } catch (e) {
        toast.error(`Upload failed: ${(e as Error).message}`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
  };
  const move = (i: number, d: -1 | 1) => {
    const imgs = [...p.images];
    const j = i + d;
    if (j < 0 || j >= imgs.length) return;
    [imgs[i], imgs[j]] = [imgs[j]!, imgs[i]!];
    up({ images: imgs });
  };

  const save = async (publish?: boolean) => {
    const next = { ...p, ...(publish === undefined ? {} : { published: publish }), name: p.name.trim(), sku: p.sku.trim(), specs: p.specs.filter((s) => s.label.trim() && s.value.trim()) };
    const errs = validateProduct(next, products);
    setErrors(errs);
    if (Object.keys(errs).length) { toast.error("Please fix the highlighted fields"); return; }
    setSaving(true);
    try {
      await actions.saveProduct(next);
      toast.success(isNew ? "Product created" : "Product saved");
      if (isNew) navigate({ to: "/admin/products/$id", params: { id: next.id }, replace: true });
      setP(next);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };
  const remove = async () => {
    if (!confirm(`Delete ${p.name || "this product"}? This can't be undone.`)) return;
    try { await actions.deleteProduct(p.id); toast.success("Product deleted"); navigate({ to: "/admin" }); }
    catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-3">
          <Link to="/admin" className="rounded-full p-2 hover:bg-muted" aria-label="Back"><ArrowLeft className="h-5 w-5" /></Link>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{p.name || "New product"}</p>
            <p className="text-xs text-muted-foreground">{p.published ? "Published" : "Draft"}{p.sku && ` · ${p.sku}`}</p>
          </div>
          {!isNew && p.published && <Link to="/product/$slug" params={{ slug: p.slug }} target="_blank" className="hidden text-sm underline sm:block">View in store</Link>}
          <button disabled={saving || uploading > 0} onClick={() => save()} className="rounded-full border px-4 py-2 text-sm font-medium disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
          <button disabled={saving || uploading > 0} onClick={() => save(!p.published)} className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">{p.published ? "Unpublish" : "Save & publish"}</button>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card title="Basics">
            <div className="grid gap-4 sm:grid-cols-2">
              <F label="Product name" error={errors.name} span>
                <input className={input} value={p.name} onChange={(e) => up({ name: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })} placeholder="Core 12V 100Ah LiFePO4" />
              </F>
              <F label="Tagline" hint="Short line shown above the title" span>
                <input className={input} value={p.tagline} onChange={(e) => up({ tagline: e.target.value })} />
              </F>
              <F label="Description" span>
                <textarea rows={5} className={input} value={p.description} onChange={(e) => up({ description: e.target.value })} />
              </F>
              <F label="URL slug" error={errors.slug} hint={`/product/${p.slug || "…"}`}>
                <input className={input} value={p.slug} onChange={(e) => { setSlugTouched(true); up({ slug: e.target.value.toLowerCase() }); }} />
              </F>
              <F label="Category" error={errors.categoryId}>
                <select className={input} value={p.categoryId} onChange={(e) => up({ categoryId: e.target.value })}>
                  <option value="">Choose a category</option>
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </F>
            </div>
          </Card>

          <Card title="Photos" desc="First photo is the main image. JPG, PNG or WebP up to 8 MB.">
            {errors.images && <p className="mb-3 text-xs text-destructive">{errors.images}</p>}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {p.images.map((src, i) => (
                <div key={src + i} className="group relative aspect-square overflow-hidden rounded-2xl border bg-muted">
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  {i === 0 && <span className="absolute left-2 top-2 rounded-full bg-card px-2 py-0.5 text-[10px] font-medium">Main</span>}
                  <div className="absolute inset-x-2 bottom-2 flex justify-between gap-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                    <span className="flex gap-1">
                      <button type="button" onClick={() => move(i, -1)} className="rounded-full bg-card p-1.5" aria-label="Move earlier"><ArrowUp className="h-3.5 w-3.5 -rotate-90" /></button>
                      <button type="button" onClick={() => move(i, 1)} className="rounded-full bg-card p-1.5" aria-label="Move later"><ArrowDown className="h-3.5 w-3.5 -rotate-90" /></button>
                    </span>
                    <button type="button" onClick={() => up({ images: p.images.filter((_, j) => j !== i) })} className="rounded-full bg-card p-1.5 text-destructive" aria-label="Remove photo"><X className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
              {Array.from({ length: uploading }).map((_, i) => (
                <div key={`u${i}`} className="grid aspect-square place-items-center rounded-2xl border bg-muted"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ))}
              <label
                className="grid aspect-square cursor-pointer place-items-center rounded-2xl border-2 border-dashed text-center text-xs text-muted-foreground hover:border-foreground/30"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); void upload(e.dataTransfer.files); }}
              >
                <span><ImagePlus className="mx-auto mb-1 h-6 w-6" />Upload or drop</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { void upload(e.target.files); e.target.value = ""; }} />
              </label>
            </div>
          </Card>

          <Card title="Battery specifications" desc="Leave blank what doesn't apply (e.g. chargers, accessories).">
            <div className="grid gap-4 sm:grid-cols-3">
              <F label="Chemistry">
                <select className={input} value={p.chemistry} onChange={(e) => up({ chemistry: e.target.value as Chemistry })}>{CHEM.map((c) => <option key={c}>{c}</option>)}</select>
              </F>
              <F label="Nominal voltage (V)" error={errors.voltage}><input type="number" step="0.1" className={input} value={p.voltage ?? ""} onChange={(e) => up({ voltage: optNum(e.target.value) })} /></F>
              <F label="Capacity (Ah)" error={errors.capacityAh}><input type="number" step="0.1" className={input} value={p.capacityAh ?? ""} onChange={(e) => up({ capacityAh: optNum(e.target.value) })} /></F>
              <F label="Energy (Wh)" error={errors.energyWh}>
                <input type="number" step="0.1" className={input} value={p.energyWh ?? ""} onChange={(e) => up({ energyWh: optNum(e.target.value) })} />
                {suggestedWh && suggestedWh !== p.energyWh && (
                  <button type="button" onClick={() => up({ energyWh: suggestedWh })} className="mt-1 text-xs underline">Use {suggestedWh} Wh (V × Ah)</button>
                )}
              </F>
              <F label="Cycle life" error={errors.cycleLife}><input type="number" className={input} value={p.cycleLife ?? ""} onChange={(e) => up({ cycleLife: optNum(e.target.value) })} /></F>
              <F label="Warranty (years)" error={errors.warrantyYears}><input type="number" className={input} value={p.warrantyYears} onChange={(e) => up({ warrantyYears: Number(e.target.value) })} /></F>
              <F label="Dimensions" hint="e.g. 330 × 172 × 215 mm"><input className={input} value={p.dimensions ?? ""} onChange={(e) => up({ dimensions: e.target.value || undefined })} /></F>
              <F label="Weight (kg)" error={errors.weightKg}><input type="number" step="0.01" className={input} value={p.weightKg ?? ""} onChange={(e) => up({ weightKg: optNum(e.target.value) })} /></F>
            </div>
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium">Additional specifications</p>
              <div className="space-y-2">
                {p.specs.map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <input className={input} placeholder="Label (e.g. Max discharge)" value={s.label} onChange={(e) => up({ specs: p.specs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                    <input className={input} placeholder="Value (e.g. 100 A)" value={s.value} onChange={(e) => up({ specs: p.specs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} />
                    <button type="button" onClick={() => up({ specs: p.specs.filter((_, j) => j !== i) })} className="rounded-xl border px-3 text-muted-foreground hover:text-destructive" aria-label="Remove spec"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => up({ specs: [...p.specs, { label: "", value: "" }] })} className="mt-2 flex items-center gap-1 text-sm underline"><Plus className="h-4 w-4" /> Add specification</button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Status">
            <label className="flex items-center justify-between text-sm">Published in store <input type="checkbox" checked={p.published} onChange={(e) => up({ published: e.target.checked })} className="h-4 w-4" /></label>
            <label className="mt-3 flex items-center justify-between text-sm">Featured on homepage <input type="checkbox" checked={p.featured} onChange={(e) => up({ featured: e.target.checked })} className="h-4 w-4" /></label>
          </Card>
          <Card title="Pricing">
            <div className="space-y-4">
              <F label="Price (USD)" error={errors.price}><input type="number" step="0.01" className={input} value={p.price} onChange={(e) => up({ price: Number(e.target.value) })} /></F>
              <F label="Compare-at price" error={errors.compareAt} hint="Shows as a strikethrough sale price"><input type="number" step="0.01" className={input} value={p.compareAt ?? ""} onChange={(e) => up({ compareAt: optNum(e.target.value) })} /></F>
            </div>
          </Card>
          <Card title="Inventory">
            <div className="space-y-4">
              <F label="SKU" error={errors.sku}><input className={`${input} font-mono`} value={p.sku} onChange={(e) => up({ sku: e.target.value.toUpperCase() })} placeholder="VA-LFP-12100" /></F>
              <F label="Stock on hand" error={errors.stock} hint={existing && p.stock !== existing.stock ? `Change of ${p.stock - existing.stock > 0 ? "+" : ""}${p.stock - existing.stock} will be logged` : undefined}>
                <div className="flex gap-2">
                  <button type="button" onClick={() => up({ stock: Math.max(0, p.stock - 1) })} className="rounded-xl border px-3">−</button>
                  <input type="number" className={`${input} text-center`} value={p.stock} onChange={(e) => up({ stock: Number(e.target.value) })} />
                  <button type="button" onClick={() => up({ stock: p.stock + 1 })} className="rounded-xl border px-3">+</button>
                </div>
              </F>
              <F label="Low-stock alert at" error={errors.lowStockThreshold}><input type="number" className={input} value={p.lowStockThreshold} onChange={(e) => up({ lowStockThreshold: Number(e.target.value) })} /></F>
              <p className={`text-xs ${p.stock === 0 ? "text-destructive" : p.stock <= p.lowStockThreshold ? "text-warning" : "text-success"}`}>
                {p.stock === 0 ? "Out of stock" : p.stock <= p.lowStockThreshold ? "Low stock" : "In stock"}
              </p>
            </div>
          </Card>
          {!isNew && <button onClick={remove} className="flex w-full items-center justify-center gap-2 rounded-full border border-destructive/30 py-2.5 text-sm text-destructive"><Trash2 className="h-4 w-4" /> Delete product</button>}
        </div>
      </div>
    </div>
  );
}
