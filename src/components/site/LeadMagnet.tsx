import { Link } from "@tanstack/react-router";
import { BookOpen, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { actions } from "@/lib/db";

const KEY = "voltarc-lead-dismissed";

/** Shows the handbook offer once per visitor: on exit intent (desktop) or after 40s (mobile). */
export function LeadMagnet() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(KEY) || location.pathname.startsWith("/admin") || location.pathname.startsWith("/checkout")) return;
    const show = () => { if (!localStorage.getItem(KEY)) setOpen(true); };
    const onLeave = (e: MouseEvent) => { if (e.clientY <= 0) show(); };
    document.addEventListener("mouseleave", onLeave);
    const t = setTimeout(show, 40_000);
    return () => { document.removeEventListener("mouseleave", onLeave); clearTimeout(t); };
  }, []);

  const close = () => { localStorage.setItem(KEY, "1"); setOpen(false); };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) { toast.error("Enter a valid email"); return; }
    setBusy(true);
    try { await actions.subscribeLead(email, "handbook"); setDone(true); localStorage.setItem(KEY, "1"); }
    catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4 backdrop-blur-sm" onClick={close}>
      <div role="dialog" aria-label="Free sizing handbook" className="relative w-full max-w-md rounded-3xl bg-card p-7 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={close} aria-label="Close" className="absolute right-4 top-4 rounded-full p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
        <BookOpen className="h-8 w-8" />
        {done ? (
          <>
            <p className="mt-4 text-xl font-semibold">You're in.</p>
            <p className="mt-2 text-sm text-muted-foreground">Use code <b className="font-mono text-foreground">WELCOME50</b> for $50 off orders over $500.</p>
            <Link to="/sizing-guide" onClick={close} className="mt-5 flex justify-center rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground">Open the handbook</Link>
          </>
        ) : (
          <form onSubmit={submit}>
            <p className="mt-4 text-xl font-semibold">Free 2026 off-grid lithium sizing & wiring handbook</p>
            <p className="mt-2 text-sm text-muted-foreground">Plus $50 off your first order over $500.</p>
            <input type="email" required maxLength={320} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="mt-5 w-full rounded-xl border bg-background px-3.5 py-3" />
            <button disabled={busy} className="mt-3 w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy ? "Sending…" : "Get the handbook"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
