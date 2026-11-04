import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminPage, Panel, safe } from "@/components/admin/kit";
import { actions, fmtDate } from "@/lib/db";

export const Route = createFileRoute("/admin/leads")({
  head: () => ({ meta: [{ title: "Trade & leads — Voltarc admin" }, { name: "robots", content: "noindex" }] }),
  component: Leads,
});

const STATUSES = ["new", "contacted", "quoted", "won", "lost"];

/* eslint-disable @typescript-eslint/no-explicit-any */
function Leads() {
  const [trade, setTrade] = useState<any[] | null>(null);
  const [leads, setLeads] = useState<any[] | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    actions.listTradeRequests().then(setTrade).catch((e: Error) => setErr(e.message));
    actions.listLeads().then(setLeads).catch((e: Error) => setErr(e.message));
  }, []);
  const csv = () => {
    const blob = new Blob(["email,source,created_at\n" + (leads ?? []).map((l) => `${l.email},${l.source},${l.created_at}`).join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "leads.csv"; a.click();
  };

  return (
    <AdminPage title="Trade requests & leads" description="Wholesale quote requests and handbook email sign-ups.">
      {err && <p className="rounded-xl border border-destructive/40 p-4 text-sm">Couldn't load: {err}. Run supabase/growth-upgrade.sql in the SQL editor.</p>}
      <Panel title={`Wholesale requests (${trade?.length ?? 0})`}>
        <div className="divide-y">
          {trade?.length === 0 && <p className="text-sm text-muted-foreground">No requests yet.</p>}
          {trade?.map((t) => (
            <div key={t.id} className="grid gap-2 py-4 text-sm md:grid-cols-[1fr_auto]">
              <div>
                <p className="font-medium">{t.company} · <span className="text-muted-foreground">{t.business_type} · {t.volume}</span></p>
                <p className="text-muted-foreground">{t.contact_name} · <a className="underline" href={`mailto:${t.email}`}>{t.email}</a>{t.phone && ` · ${t.phone}`} · {fmtDate(t.created_at)}</p>
                {t.message && <p className="mt-1 whitespace-pre-wrap">{t.message}</p>}
              </div>
              <select value={t.status} onChange={(e) => { const status = e.target.value; safe(actions.setTradeStatus(t.id, status), "Updated").then(() => setTrade((l) => l!.map((x) => (x.id === t.id ? { ...x, status } : x)))); }} className="h-9 rounded-lg border bg-background px-2 capitalize">
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title={`Email leads (${leads?.length ?? 0})`} actions={<button onClick={csv} className="rounded-full border px-3 py-1.5 text-xs">Export CSV</button>}>
        <div className="divide-y text-sm">
          {leads?.length === 0 && <p className="text-muted-foreground">No sign-ups yet.</p>}
          {leads?.map((l) => <div key={l.id} className="flex justify-between py-2"><span>{l.email}</span><span className="text-muted-foreground">{fmtDate(l.created_at)}</span></div>)}
        </div>
      </Panel>
    </AdminPage>
  );
}
