import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { actions, useDb } from "@/lib/db";
import { validTrackingId } from "@/lib/site-config";
import { AdminPage, Btn, Panel, TextArea, TextInput, Toggle, safe } from "@/components/admin/kit";

export const Route = createFileRoute("/admin/seo")({
  head: () => ({ meta: [{ title: "SEO & tracking — Voltarc Admin" }, { name: "robots", content: "noindex" }] }),
  component: Seo,
});

function Seo() {
  const config = useDb((s) => s.config);
  const [seo, setSeo] = useState(config.seo);
  useEffect(() => setSeo(config.seo), [config.seo]);
  const bad = (v: string, ok: (v: string) => boolean) => !!v && !ok(v);
  const invalid = bad(seo.ga4Id, validTrackingId.ga4) || bad(seo.gtmId, validTrackingId.gtm) || bad(seo.metaPixelId, validTrackingId.pixel);

  return (
    <AdminPage title="SEO & tracking" description="How your store appears in Google and social shares, plus analytics tags."
      actions={<Btn disabled={invalid} onClick={() => safe(actions.saveConfig({ ...config, seo }), "SEO settings saved")}>Save changes</Btn>}>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Search defaults">
          <div className="space-y-3">
            <TextInput label="Title suffix" value={seo.titleSuffix} onChange={(e) => setSeo({ ...seo, titleSuffix: e.target.value })} hint="Added after page titles, e.g. “Blog — Voltarc Energy”." />
            <TextArea label="Default meta description" rows={3} value={seo.defaultDescription} onChange={(e) => setSeo({ ...seo, defaultDescription: e.target.value })} hint={`${seo.defaultDescription.length}/160`} />
            <TextInput label="Social share image URL" value={seo.ogImage} placeholder="https://…/share.jpg" onChange={(e) => setSeo({ ...seo, ogImage: e.target.value })} />
            <Toggle label="Allow search engines to index the store" checked={seo.allowIndexing} onChange={(v) => setSeo({ ...seo, allowIndexing: v })} />
          </div>
          <div className="mt-5 rounded-xl border p-4">
            <p className="text-xs text-muted-foreground">Google preview</p>
            <p className="mt-1 truncate text-lg text-primary">Shop all — {seo.titleSuffix}</p>
            <p className="line-clamp-2 text-sm text-muted-foreground">{seo.defaultDescription}</p>
          </div>
        </Panel>
        <Panel title="Analytics & tracking" description="Paste only the ID — tags are added to every storefront page automatically.">
          <div className="space-y-3">
            <TextInput label="Google Analytics 4 ID" placeholder="G-XXXXXXXXXX" value={seo.ga4Id} onChange={(e) => setSeo({ ...seo, ga4Id: e.target.value.trim() })} hint={bad(seo.ga4Id, validTrackingId.ga4) ? "Should look like G-ABC123XYZ" : undefined} />
            <TextInput label="Google Tag Manager ID" placeholder="GTM-XXXXXXX" value={seo.gtmId} onChange={(e) => setSeo({ ...seo, gtmId: e.target.value.trim() })} hint={bad(seo.gtmId, validTrackingId.gtm) ? "Should look like GTM-ABC1234" : undefined} />
            <TextInput label="Meta Pixel ID" placeholder="1234567890" value={seo.metaPixelId} onChange={(e) => setSeo({ ...seo, metaPixelId: e.target.value.trim() })} hint={bad(seo.metaPixelId, validTrackingId.pixel) ? "Digits only" : undefined} />
          </div>
        </Panel>
      </div>
    </AdminPage>
  );
}
