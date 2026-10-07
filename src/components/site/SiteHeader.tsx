import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, Menu, Search, ShoppingBag, User, X, Zap } from "lucide-react";
import { useState } from "react";
import { useDb, useSession } from "@/lib/db";

export function Logo({ dark }: { dark?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-foreground">
        <Zap className="h-4 w-4" fill="currentColor" />
      </span>
      <span className={dark ? "text-ink-foreground" : ""}>Voltarc</span>
    </Link>
  );
}

const nav = [
  { to: "/shop", label: "Shop all" },
  { to: "/shop", label: "LiFePO4", search: { category: "lifepo4" } },
  { to: "/shop", label: "Power Stations", search: { category: "power-stations" } },
  { to: "/shop", label: "BMS & Chargers", search: { category: "bms" } },
  { to: "/about", label: "Why Voltarc" },
] as const;

export function SiteHeader() {
  const announcement = useDb((s) => s.home.announcement);
  const cartCount = useDb((s) => s.cart.reduce((a, l) => a + l.qty, 0));
  const wish = useDb((s) => s.wishlist.length);
  const user = useSession();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(false);
    navigate({ to: "/shop", search: { q: q || undefined } });
  };

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-ink px-4 py-2 text-center text-xs text-ink-foreground/80">{announcement}</div>
      <div className="border-b bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 lg:px-8">
          <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Logo />
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground lg:flex">
            {nav.map((n) => (
              <Link key={n.label} to={n.to} search={"search" in n ? n.search : {}} className="transition-colors hover:text-foreground">
                {n.label}
              </Link>
            ))}
          </nav>
          <form onSubmit={submit} className="ml-auto hidden max-w-xs flex-1 md:block">
            <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm focus-within:ring-2 focus-within:ring-ring/20">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search 12V 100Ah, BMS…" className="w-full bg-transparent outline-none placeholder:text-muted-foreground" />
            </div>
          </form>
          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <Link to="/wishlist" className="relative rounded-full p-2 hover:bg-muted" aria-label="Wishlist">
              <Heart className="h-5 w-5" />
              {wish > 0 && <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-accent ring-2 ring-background" />}
            </Link>
            <Link to={user ? "/account" : "/auth"} className="rounded-full p-2 hover:bg-muted" aria-label="Account">
              <User className="h-5 w-5" />
            </Link>
            <Link to="/cart" className="relative ml-1 flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              <ShoppingBag className="h-4 w-4" />
              <span className="tabular-nums">{cartCount}</span>
            </Link>
          </div>
        </div>
        {open && (
          <div className="border-t px-4 pb-6 pt-4 lg:hidden">
            <form onSubmit={submit} className="mb-4 flex items-center gap-2 rounded-full border bg-card px-4 py-2.5 text-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="w-full bg-transparent outline-none" />
            </form>
            <div className="grid gap-1">
              {[...nav, { to: "/contact", label: "Contact" }, { to: "/track", label: "Track order" }].map((n) => (
                <Link key={n.label} to={n.to} search={"search" in n ? n.search : {}} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-base hover:bg-muted">
                  {n.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
