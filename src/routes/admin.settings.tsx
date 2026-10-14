import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { actions, useDb } from "@/lib/db";
import { AdminPage, Btn, Panel, TextArea, TextInput, safe } from "@/components/admin/kit";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Store settings — Voltarc Admin" }, { name: "robots", content: "noindex" }] }),
  component: Settings,
});

function Settings() {
  const s = useDb((x) => x);
  const [st, setSt] = useState(s.settings);
  const [home, setHome] = useState(s.home);
  const [brand, setBrand] = useState(s.config.brand);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setSt(s.settings); setHome(s.home); setBrand(s.config.brand); }, [s.settings, s.home, s.config.brand]);

  const save = async () => {
    setBusy(true);
    await safe(Promise.all([actions.saveStoreSettings(st, home), actions.saveConfig({ ...s.config, brand })]), "Settings saved");
    setBusy(false);
  };
  const upload = async (f?: File) => {
    if (!f) return;
    const url = await safe(actions.uploadImage(f, f.name));
    if (url) setBrand({ ...brand, logoUrl: url });
  };

  return (
    <AdminPage title="Store & brand" description="Your store name, logo, contact details, shipping, tax and homepage." actions={<Btn disabled={busy} onClick={save}>{busy ? "Saving…" : "Save changes"}</Btn>}>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Brand">
          <div className="space-y-3">
            <TextInput label="Store name" value={st.storeName} onChange={(e) => setSt({ ...st, storeName: e.target.value })} />
            <TextInput label="Tagline" value={brand.tagline} onChange={(e) => setBrand({ ...brand, tagline: e.target.value })} />
            <div>
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Logo</span>
              <div className="flex items-center gap-4">
                {brand.logoUrl ? <img src={brand.logoUrl} alt="Logo" className="h-12 w-auto max-w-40 rounded-lg border bg-background object-contain p-1" /> : <span className="grid h-12 w-12 place-items-center rounded-lg bg-muted text-xs text-muted-foreground">None</span>}
                <input type="file" accept="image/*" onChange={(e) => upload(e.target.files?.[0])} className="text-xs" />
                {brand.logoUrl && <button className="text-xs text-destructive" onClick={() => setBrand({ ...brand, logoUrl: "" })}>Remove</button>}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Replaces the lightning icon in the header. A wide transparent PNG or SVG works best.</p>
            </div>
          </div>
        </Panel>
        <Panel title="Contact & support">
          <div className="space-y-3">
            <TextInput label="Support email" type="email" value={st.supportEmail} onChange={(e) => setSt({ ...st, supportEmail: e.target.value })} />
            <TextInput label="Support phone" value={st.supportPhone} onChange={(e) => setSt({ ...st, supportPhone: e.target.value })} />
            <TextArea label="Business address" rows={2} value={brand.address} onChange={(e) => setBrand({ ...brand, address: e.target.value })} />
            <TextInput label="Opening hours" value={brand.hours} onChange={(e) => setBrand({ ...brand, hours: e.target.value })} />
          </div>
        </Panel>
        <Panel title="Shipping & tax" description="Used by checkout to calculate totals.">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextInput label="Tax rate (%)" type="number" step="0.01" value={st.taxRate} onChange={(e) => setSt({ ...st, taxRate: +e.target.value })} />
            <TextInput label="Currency" value={st.currency} onChange={(e) => setSt({ ...st, currency: e.target.value.toUpperCase() })} />
            <TextInput label="Flat shipping ($)" type="number" value={st.flatShipping} onChange={(e) => setSt({ ...st, flatShipping: +e.target.value })} />
            <TextInput label="Free shipping over ($)" type="number" value={st.freeShippingThreshold} onChange={(e) => setSt({ ...st, freeShippingThreshold: +e.target.value })} />
          </div>
        </Panel>
        <Panel title="Homepage" description="Top banner and hero text.">
          <div className="space-y-3">
            <TextInput label="Announcement bar" value={home.announcement} onChange={(e) => setHome({ ...home, announcement: e.target.value })} />
            <TextInput label="Hero eyebrow" value={home.heroEyebrow} onChange={(e) => setHome({ ...home, heroEyebrow: e.target.value })} />
            <TextInput label="Hero headline" value={home.heroTitle} onChange={(e) => setHome({ ...home, heroTitle: e.target.value })} />
            <TextArea label="Hero subtitle" rows={2} value={home.heroSubtitle} onChange={(e) => setHome({ ...home, heroSubtitle: e.target.value })} />
            <TextInput label="Button label" value={home.heroCta} onChange={(e) => setHome({ ...home, heroCta: e.target.value })} />
          </div>
        </Panel>
      </div>
    </AdminPage>
  );
}
