import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { actions, money } from "@/lib/db";
import { Field, PageTitle } from "@/components/site/Field";
import { OrderTimeline } from "@/components/site/OrderStatus";
import type { Order } from "@/lib/types";

type S = { number?: string | undefined; email?: string | undefined; placed?: boolean | undefined };
type Tracked = NonNullable<Awaited<ReturnType<typeof actions.trackOrder>>>;

export const Route = createFileRoute("/track")({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validateSearch: (s: any): S => ({ number: s.number as string | undefined, email: s.email as string | undefined, placed: s.placed ? true : undefined }),
  head: () => ({ meta: [{ title: "Track your order — Voltarc" }, { name: "description", content: "Track a Voltarc order with your order number and email." }, { property: "og:title", content: "Track order — Voltarc" }, { property: "og:description", content: "Order tracking." }] }),
  component: T,
});

function T() {
  const s = Route.useSearch();
  const [q, setQ] = useState({ number: s.number ?? "", email: s.email ?? "" });
  const [res, setRes] = useState<Tracked | null | "none">(null);
  const [busy, setBusy] = useState(false);

  const lookup = async () => {
    if (!q.number || !q.email) return;
    setBusy(true);
    try { setRes((await actions.trackOrder(q.number.trim(), q.email.trim())) ?? "none"); }
    catch { setRes("none"); }
    finally { setBusy(false); }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (s.number && s.email) void lookup(); }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PageTitle title={s.placed ? "Thank you — order confirmed" : "Track your order"}>
        {s.placed && "We've emailed your receipt. Keep your order number handy to check progress here anytime."}
      </PageTitle>
      <form onSubmit={(e) => { e.preventDefault(); void lookup(); }} className="mt-8 grid items-end gap-4 sm:grid-cols-[1fr_1fr_auto]">
        <Field label="Order number" value={q.number} onChange={(e) => setQ({ ...q, number: e.target.value })} placeholder="VA-10500" />
        <Field label="Email" type="email" value={q.email} onChange={(e) => setQ({ ...q, email: e.target.value })} />
        <button disabled={busy} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">{busy ? "Checking…" : "Track"}</button>
      </form>
      {res === "none" && <p className="mt-6 text-sm text-destructive">We couldn't find an order with that number and email.</p>}
      {res && res !== "none" && (
        <div className="mt-8 rounded-3xl border bg-card p-6">
          <div className="flex justify-between"><b>{res.number}</b><span>{money(res.total)}</span></div>
          <div className="mt-6"><OrderTimeline order={{ status: res.status, timeline: res.timeline } as unknown as Order} /></div>
          {res.trackingNumber && <p className="mt-4 font-mono text-sm">{res.carrier} · {res.trackingNumber}</p>}
        </div>
      )}
    </div>
  );
}
