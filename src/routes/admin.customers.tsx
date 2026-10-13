import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { actions, fmtDate, money, useDb } from "@/lib/db";
import { customerStats } from "@/lib/analytics";
import type { AppRole } from "@/lib/types";
import { AdminPage, Empty, Pill, Stat, Table, safe } from "@/components/admin/kit";

export const Route = createFileRoute("/admin/customers")({
  head: () => ({ meta: [{ title: "Customers — Voltarc Admin" }, { name: "robots", content: "noindex" }] }),
  component: Customers,
});

function Customers() {
  const users = useDb((s) => s.users);
  const roles = useDb((s) => s.roles);
  const orders = useDb((s) => s.orders);
  const myRoles = useDb((s) => (s.sessionUserId ? s.roles[s.sessionUserId] ?? [] : []));
  const isOwner = myRoles.includes("admin");
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "staff" | "customer">("all");
  const stats = customerStats(orders);
  const guests = [...stats.keys()].filter((k) => k.startsWith("guest:")).length;

  const list = users.filter((u) => {
    const r = roles[u.id] ?? [];
    const staff = r.includes("admin") || r.includes("staff");
    return (!q || `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase())) && (roleFilter === "all" || (roleFilter === "staff" ? staff : !staff));
  });

  const toggle = (id: string, role: AppRole, on: boolean) => safe(actions.setUserRole(id, role, on), on ? `Granted ${role}` : `Removed ${role}`);

  return (
    <AdminPage title="Customers" description="Everyone who has an account, their spend, and their access level.">
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Registered" value={users.length} />
        <Stat label="Guest buyers" value={guests} />
        <Stat label="Staff & admins" value={users.filter((u) => u.role === "admin").length} />
        <Stat label="Repeat buyers" value={[...stats.values()].filter((s) => s.orders > 1).length} />
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-60 flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email" className="w-full rounded-xl border bg-card py-2 pl-9 pr-3 text-sm outline-none" /></div>
        {(["all", "customer", "staff"] as const).map((r) => <button key={r} onClick={() => setRoleFilter(r)} className={`rounded-full border px-3 py-1 text-sm capitalize ${roleFilter === r ? "bg-primary text-primary-foreground" : "bg-card"}`}>{r === "staff" ? "Staff & admins" : r}</button>)}
      </div>
      {!isOwner && <p className="text-xs text-muted-foreground">Only admins can change roles.</p>}
      {list.length ? (
        <Table head={["Customer", "Joined", "Orders", "Lifetime spend", "Last order", "Access"]}>
          {list.map((u) => {
            const r = roles[u.id] ?? [];
            const st = stats.get(u.id);
            return (
              <tr key={u.id}>
                <td className="px-4 py-3"><span className="block font-medium">{u.name || "—"}</span><span className="text-xs text-muted-foreground">{u.email}</span></td>
                <td className="px-4 py-3 text-muted-foreground">{fmtDate(u.createdAt)}</td>
                <td className="px-4 py-3">{st?.orders ?? 0}</td>
                <td className="px-4 py-3 font-medium">{money(st?.spent ?? 0)}</td>
                <td className="px-4 py-3 text-muted-foreground">{st ? fmtDate(st.last) : "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {r.includes("admin") ? <Pill tone="accent">Admin</Pill> : r.includes("staff") ? <Pill tone="good">Staff</Pill> : <Pill>Customer</Pill>}
                    {isOwner && (
                      <select aria-label={`Access for ${u.email}`} value={r.includes("admin") ? "admin" : r.includes("staff") ? "staff" : "customer"} className="rounded-lg border bg-background px-2 py-1 text-xs"
                        onChange={async (e) => {
                          const v = e.target.value as AppRole;
                          if (v === "admin" && !confirm(`Give ${u.email} full admin access?`)) return;
                          if (v !== "admin" && r.includes("admin")) await toggle(u.id, "admin", false);
                          if (v !== "staff" && r.includes("staff")) await toggle(u.id, "staff", false);
                          if (v !== "customer") await toggle(u.id, v, true);
                        }}>
                        <option value="customer">Customer</option><option value="staff">Staff</option><option value="admin">Admin</option>
                      </select>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      ) : <Empty>No customers found.</Empty>}
    </AdminPage>
  );
}
