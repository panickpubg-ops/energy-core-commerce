import { Link } from "@tanstack/react-router";
import { useDb } from "@/lib/db";
import { Logo } from "./SiteHeader";

export function SiteFooter() {
  const settings = useDb((s) => s.settings);
  const cats = useDb((s) => s.categories);
  return (
    <footer className="mt-24 bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 md:grid-cols-2 lg:grid-cols-5 lg:px-8">
        <div className="lg:col-span-2">
          <Logo dark />
          <p className="mt-4 max-w-sm text-sm text-ink-foreground/60">
            Engineered lithium energy storage. Every cell graded, every pack tested, every order supported by people who build batteries.
          </p>
          <p className="mt-6 font-mono text-xs text-ink-foreground/50">{settings.supportEmail} · {settings.supportPhone}</p>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-medium">Shop</h4>
          <ul className="space-y-2 text-sm text-ink-foreground/60">
            {cats.map((c) => (
              <li key={c.id}><Link to="/shop" search={{ category: c.slug }} className="hover:text-accent">{c.name}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-medium">Support</h4>
          <ul className="space-y-2 text-sm text-ink-foreground/60">
            <li><Link to="/track" className="hover:text-accent">Track an order</Link></li>
            <li><Link to="/contact" className="hover:text-accent">Contact us</Link></li>
            <li><Link to="/shipping" className="hover:text-accent">Shipping & returns</Link></li>
            <li><Link to="/warranty" className="hover:text-accent">Warranty</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-medium">Company</h4>
          <ul className="space-y-2 text-sm text-ink-foreground/60">
            <li><Link to="/about" className="hover:text-accent">About</Link></li>
            <li><Link to="/account" className="hover:text-accent">My account</Link></li>
            <li><Link to="/admin" className="hover:text-accent">Admin</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-foreground/10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 px-4 py-6 text-xs text-ink-foreground/40 sm:flex-row lg:px-8">
          <span>© {new Date().getFullYear()} {settings.storeName}. All rights reserved.</span>
          <span>UN38.3 · CE · UL1973 certified products</span>
        </div>
      </div>
    </footer>
  );
}
