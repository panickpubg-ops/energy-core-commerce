import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { actions, fmtDate, money, useDb, useSession } from "@/lib/db";
import { PageTitle } from "@/components/site/Field";
import { OrderTimeline, StatusBadge } from "@/components/site/OrderStatus";
export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "My account — Voltarc" }, { name: "description", content: "Your orders and details." }, { property: "og:title", content: "Account — Voltarc" }, { property: "og:description", content: "Your Voltarc account." }] }),
  component: A,
});
function A() {
  const user = useSession();
  const nav = useNavigate();
  const orders = useDb((s) => s.orders.filter((o) => o.userId === user?.id));
  if (!user) return <div className="py-24 text-center"><Link to="/auth" className="underline">Sign in to view your account</Link></div>;
  return (<div className="mx-auto max-w-5xl px-4 py-12 lg:px-8">
    <PageTitle eyebrow="Account" title={`Hi, ${user.name.split(" ")[0]}`}>{user.email}</PageTitle>
    <div className="mt-4 flex gap-3 text-sm">{user.role === "admin" && <Link to="/admin" className="underline">Admin dashboard</Link>}<Link to="/wishlist" className="underline">Wishlist</Link><button className="underline" onClick={async () => { await actions.signOut(); nav({ to: "/auth", replace: true }); }}>Sign out</button></div>
    <h2 className="mt-10 text-xl font-semibold">Order history</h2>
    <div className="mt-4 space-y-4">{orders.map((o) => (<div key={o.id} className="rounded-2xl border bg-card p-6">
      <div className="flex flex-wrap justify-between gap-2"><span className="font-medium">{o.number} · {fmtDate(o.createdAt)}</span><span className="flex gap-3"><StatusBadge status={o.status} />{money(o.total)}</span></div>
      <p className="mt-2 text-sm text-muted-foreground">{o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}</p>
      <div className="mt-4"><OrderTimeline order={o} /></div></div>))}
      {!orders.length && <p className="text-muted-foreground">No orders yet.</p>}</div>
  </div>);
}
