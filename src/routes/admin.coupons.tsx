import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { actions, fmtDate, money, newId, useDb } from "@/lib/db";
import type { Coupon } from "@/lib/types";
import { AdminPage, Btn, Empty, Panel, Pill, SelectInput, Table, TextInput, Toggle, safe } from "@/components/admin/kit";

export const Route = createFileRoute("/admin/coupons")({
  head: () => ({ meta: [{ title: "Coupons — Voltarc Admin" }, { name: "robots", content: "noindex" }] }),
  component: Coupons,
});

const blank = (): Coupon => ({ id: newId(), code: "", type: "percent", value: 10, minSubtotal: 0, active: true, used: 0 });

function Coupons() {
  const coupons = useDb((s) => s.coupons.filter((c) => !c.id.startsWith("v-")));
  const [edit, setEdit] = useState<Coupon | null>(null);
  const status = (c: Coupon) => (!c.active ? <Pill>Inactive</Pill> : c.expiresAt && new Date(c.expiresAt) < new Date() ? <Pill tone="bad">Expired</Pill> : c.usageLimit && c.used >= c.usageLimit ? <Pill tone="warn">Used up</Pill> : <Pill tone="good">Active</Pill>);

  const save = async () => {
    if (!edit) return;
    if (!/^[A-Z0-9_-]{3,30}$/i.test(edit.code)) return void safe(Promise.reject(new Error("Code must be 3–30 letters, numbers, - or _")));
    if (edit.value <= 0 || (edit.type === "percent" && edit.value > 100)) return void safe(Promise.reject(new Error("Enter a valid discount value")));
    await safe(actions.saveCoupon(edit), "Coupon saved");
    setEdit(null);
  };

  return (
    <AdminPage title="Coupons" description="Discount codes customers enter at checkout." actions={<Btn onClick={() => setEdit(blank())}>New coupon</Btn>}>
      {edit && (
        <Panel title={coupons.some((c) => c.id === edit.id) ? `Edit ${edit.code}` : "New coupon"}>
          <div className="grid gap-3 sm:grid-cols-3">
            <TextInput label="Code" value={edit.code} onChange={(e) => setEdit({ ...edit, code: e.target.value.toUpperCase() })} placeholder="SUMMER15" />
            <SelectInput label="Type" value={edit.type} onChange={(e) => setEdit({ ...edit, type: e.target.value as Coupon["type"] })}><option value="percent">Percentage off</option><option value="fixed">Fixed amount off</option></SelectInput>
            <TextInput label={edit.type === "percent" ? "Percent" : "Amount ($)"} type="number" value={edit.value} onChange={(e) => setEdit({ ...edit, value: +e.target.value })} />
            <TextInput label="Minimum order ($)" type="number" value={edit.minSubtotal} onChange={(e) => setEdit({ ...edit, minSubtotal: +e.target.value })} />
            <TextInput label="Usage limit" type="number" placeholder="Unlimited" value={edit.usageLimit ?? ""} onChange={(e) => setEdit({ ...edit, usageLimit: e.target.value ? +e.target.value : undefined })} />
            <TextInput label="Expires" type="date" value={edit.expiresAt?.slice(0, 10) ?? ""} onChange={(e) => setEdit({ ...edit, expiresAt: e.target.value ? new Date(e.target.value + "T23:59:59").toISOString() : undefined })} />
          </div>
          <div className="mt-3 max-w-sm"><Toggle label="Active" checked={edit.active} onChange={(v) => setEdit({ ...edit, active: v })} /></div>
          <div className="mt-4 flex gap-2"><Btn onClick={save}>Save coupon</Btn><Btn variant="ghost" onClick={() => setEdit(null)}>Cancel</Btn></div>
        </Panel>
      )}
      {coupons.length ? (
        <Table head={["Code", "Discount", "Minimum", "Used", "Expires", "Status", ""]}>
          {coupons.map((c) => (
            <tr key={c.id}>
              <td className="px-4 py-3 font-mono font-medium">{c.code}</td><td className="px-4 py-3">{c.type === "percent" ? `${c.value}%` : money(c.value)}</td>
              <td className="px-4 py-3 text-muted-foreground">{c.minSubtotal ? money(c.minSubtotal) : "—"}</td><td className="px-4 py-3">{c.used}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</td>
              <td className="px-4 py-3 text-muted-foreground">{c.expiresAt ? fmtDate(c.expiresAt) : "Never"}</td><td className="px-4 py-3">{status(c)}</td>
              <td className="px-4 py-3 text-right"><button onClick={() => setEdit(c)} className="mr-3 underline">Edit</button><button onClick={() => confirm(`Delete ${c.code}?`) && safe(actions.deleteCoupon(c.id), "Deleted")} className="text-destructive">Delete</button></td>
            </tr>
          ))}
        </Table>
      ) : <Empty>No coupons yet. Create one to run a promotion.</Empty>}
    </AdminPage>
  );
}
