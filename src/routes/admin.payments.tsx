import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { actions, useDb } from "@/lib/db";
import { PAYMENT_METHODS } from "@/lib/site-config";
import { AdminPage, Btn, Panel, TextArea, Toggle, safe } from "@/components/admin/kit";

export const Route = createFileRoute("/admin/payments")({
  head: () => ({ meta: [{ title: "Payments — Voltarc Admin" }, { name: "robots", content: "noindex" }] }),
  component: Payments,
});

function Payments() {
  const config = useDb((s) => s.config);
  const [p, setP] = useState(config.payments);
  useEffect(() => setP(config.payments), [config.payments]);
  const anyOn = Object.values(p.methods).some(Boolean);

  return (
    <AdminPage title="Payments" description="Choose which payment options customers see at checkout."
      actions={<Btn disabled={!anyOn} onClick={() => safe(actions.saveConfig({ ...config, payments: p }), "Payment settings saved")}>Save changes</Btn>}>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Payment methods">
          <div className="space-y-2">
            {PAYMENT_METHODS.map((m) => <Toggle key={m.key} label={m.label} description={m.description} checked={p.methods[m.key]} onChange={(v) => setP({ ...p, methods: { ...p.methods, [m.key]: v } })} />)}
          </div>
          {!anyOn && <p className="mt-3 text-xs text-destructive">Turn on at least one method.</p>}
        </Panel>
        <div className="space-y-6">
          <Panel title="Mode">
            <Toggle label="Test mode" description="Checkout shows a test-mode notice. Turn off once a live card provider is connected." checked={p.testMode} onChange={(v) => setP({ ...p, testMode: v })} />
          </Panel>
          <Panel title="Card provider" description="Online card charges need a payment provider (Stripe or Paddle).">
            <p className="text-sm text-muted-foreground">Card orders are currently recorded as <b>unpaid</b> until a provider is connected. Ask in chat to connect Stripe and orders will be charged and marked paid automatically.</p>
          </Panel>
          {p.methods.bank_transfer && <Panel title="Bank transfer instructions"><TextArea rows={4} value={p.bankInstructions} placeholder="Bank name, account number, IBAN/SWIFT, reference = order number" onChange={(e) => setP({ ...p, bankInstructions: e.target.value })} /></Panel>}
          {p.methods.invoice && <Panel title="Invoice terms"><TextArea rows={2} value={p.invoiceTerms} onChange={(e) => setP({ ...p, invoiceTerms: e.target.value })} /></Panel>}
        </div>
      </div>
    </AdminPage>
  );
}
