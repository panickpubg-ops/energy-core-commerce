import { createFileRoute } from "@tanstack/react-router";
import { Building2, Check, Truck, Wrench } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Field, PageTitle } from "@/components/site/Field";
import { actions } from "@/lib/db";

export const Route = createFileRoute("/wholesale")({
  head: () => ({
    meta: [
      { title: "Wholesale & trade — Voltarc" },
      { name: "description", content: "Volume pricing on LiFePO4 batteries for solar installers, RV upfitters and commercial builders. Request a quote." },
      { property: "og:title", content: "Wholesale & trade — Voltarc" },
      { property: "og:description", content: "Trade accounts and volume quotes for installers and builders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Wholesale,
});

const VOLUMES = ["5–9 units", "10–24 units", "25–49 units", "50+ units"];
const TYPES = ["Solar installer", "RV / van upfitter", "Marine", "Commercial / industrial", "Reseller", "Other"];

function Wholesale() {
  const [f, setF] = useState({ company: "", contactName: "", email: "", phone: "", businessType: TYPES[0]!, volume: VOLUMES[0]!, message: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const up = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(f.email)) { toast.error("Enter a valid email"); return; }
    setBusy(true);
    try { await actions.submitTradeRequest(f); setDone(true); } catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <PageTitle eyebrow="Trade program" title="Wholesale for installers & builders">Volume pricing, priority freight and a direct line to our engineers.</PageTitle>
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_480px]">
        <div className="space-y-6">
          {[
            [Building2, "Tiered volume pricing", "Better pricing at 5, 10, 25 and 50+ units."],
            [Truck, "Pallet freight", "Hazmat-compliant LTL freight with liftgate options."],
            [Wrench, "Engineering support", "Help with system design, BMS settings and custom packs."],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof Building2;
            return <div key={t as string} className="flex gap-4"><I className="mt-1 h-6 w-6 shrink-0" /><div><p className="font-medium">{t as string}</p><p className="text-sm text-muted-foreground">{d as string}</p></div></div>;
          })}
        </div>
        <div className="rounded-3xl border bg-card p-6">
          {done ? (
            <div className="py-10 text-center"><Check className="mx-auto h-10 w-10" /><p className="mt-3 text-lg font-semibold">Request received</p><p className="mt-1 text-sm text-muted-foreground">Our trade team will reply to {f.email}.</p></div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <p className="font-semibold">Request a quote</p>
              <Field label="Company" required maxLength={200} value={f.company} onChange={up("company")} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Your name" required maxLength={200} value={f.contactName} onChange={up("contactName")} />
                <Field label="Phone" maxLength={50} value={f.phone} onChange={up("phone")} />
              </div>
              <Field label="Work email" type="email" required maxLength={320} value={f.email} onChange={up("email")} />
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm"><span className="mb-1.5 block font-medium">Business type</span><select value={f.businessType} onChange={up("businessType")} className="w-full rounded-xl border bg-card px-3.5 py-2.5">{TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
                <label className="text-sm"><span className="mb-1.5 block font-medium">Volume</span><select value={f.volume} onChange={up("volume")} className="w-full rounded-xl border bg-card px-3.5 py-2.5">{VOLUMES.map((t) => <option key={t}>{t}</option>)}</select></label>
              </div>
              <label className="block text-sm"><span className="mb-1.5 block font-medium">Project details</span><textarea rows={4} maxLength={4000} value={f.message} onChange={up("message")} placeholder="Products, quantities, timeline…" className="w-full rounded-xl border bg-card px-3.5 py-2.5" /></label>
              <button disabled={busy} className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy ? "Sending…" : "Send request"}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
