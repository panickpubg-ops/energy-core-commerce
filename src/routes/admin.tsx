import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { BarChart3, FileText, Folder, Gauge, Package, Receipt, Search, Settings, ShieldCheck, Sparkles, Star, Tag, Users, Warehouse, Menu, X, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useDb, useSession } from "@/lib/db";
import { Logo } from "@/components/site/SiteHeader";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Voltarc" }, { name: "robots", content: "noindex" }, { name: "description", content: "Voltarc store administration." }, { property: "og:title", content: "Admin — Voltarc" }, { property: "og:description", content: "Voltarc store administration." }] }),
  component: AdminLayout,
});

const groups = [
  { label: "Overview", items: [{ to: "/admin", label: "Dashboard", icon: Gauge, exact: true }, { to: "/admin/analytics", label: "Analytics", icon: BarChart3 }] },
  { label: "Catalog", items: [{ to: "/admin/products", label: "Products", icon: Package }, { to: "/admin/categories", label: "Categories", icon: Folder }, { to: "/admin/inventory", label: "Inventory", icon: Warehouse }, { to: "/admin/audit", label: "AI listing audit", icon: Sparkles }] },
  { label: "Sales", items: [{ to: "/admin/orders", label: "Orders", icon: Receipt }, { to: "/admin/customers", label: "Customers", icon: Users }, { to: "/admin/coupons", label: "Coupons", icon: Tag }] },
  { label: "Content", items: [{ to: "/admin/blog", label: "Blog", icon: FileText }, { to: "/admin/reviews", label: "Reviews", icon: Star }] },
  { label: "Settings", items: [{ to: "/admin/settings", label: "Store & brand", icon: Settings }, { to: "/admin/payments", label: "Payments", icon: ShieldCheck }, { to: "/admin/seo", label: "SEO & tracking", icon: Search }] },
] as const;

function AdminLayout() {
  const user = useSession();
  const loaded = useDb((s) => s.loaded);
  const pendingReviews = useDb((s) => s.reviews.filter((r) => !r.approved).length);
  const pendingOrders = useDb((s) => s.orders.filter((o) => o.status === "pending" || o.status === "paid").length);
  const [open, setOpen] = useState(false);

  if (!loaded) return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;
  if (user?.role !== "admin")
    return (
      <div className="grid min-h-screen place-items-center px-4 text-center">
        <div><p className="text-lg font-semibold">Admin access required</p><p className="mt-1 text-sm text-muted-foreground">Sign in with an admin or staff account.</p><Link to="/auth" className="mt-4 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground">Sign in</Link></div>
      </div>
    );

  const badge = (to: string) => (to === "/admin/reviews" ? pendingReviews : to === "/admin/orders" ? pendingOrders : 0);

  const nav = (
    <nav className="space-y-6">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="mb-2 px-3 font-mono text-[10px] uppercase tracking-wider text-ink-foreground/40">{g.label}</p>
          <ul className="space-y-0.5">
            {g.items.map((i) => (
              <li key={i.to}>
                <Link to={i.to} onClick={() => setOpen(false)} activeOptions={{ exact: "exact" in i }}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-foreground/70 transition hover:bg-ink-foreground/5 hover:text-ink-foreground"
                  activeProps={{ className: "bg-ink-foreground/10 !text-ink-foreground font-medium" }}>
                  <i.icon className="h-4 w-4" />
                  <span className="flex-1">{i.label}</span>
                  {badge(i.to) > 0 && <span className="rounded-full bg-accent px-1.5 text-[10px] font-semibold text-accent-foreground">{badge(i.to)}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-muted/30 lg:grid lg:grid-cols-[248px_1fr]">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 overflow-y-auto bg-ink p-4 transition-transform lg:sticky lg:top-0 lg:h-screen lg:w-auto lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="mb-8 flex items-center justify-between px-2 pt-1"><Logo dark /><button className="text-ink-foreground lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button></div>
        {nav}
        <div className="mt-8 border-t border-ink-foreground/10 pt-4">
          <Link to="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-foreground/60 hover:text-ink-foreground"><ExternalLink className="h-4 w-4" />View store</Link>
          <p className="truncate px-3 pt-2 text-xs text-ink-foreground/40">{user.email}</p>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-40 bg-ink/50 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <span className="font-semibold">Admin</span>
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
