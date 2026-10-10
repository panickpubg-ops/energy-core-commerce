import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { actions } from "@/lib/db";
import { IMAGES } from "@/lib/seed";
import { Field } from "@/components/site/Field";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Voltarc" }, { name: "description", content: "Sign in or create your Voltarc account." }, { property: "og:title", content: "Sign in — Voltarc" }, { property: "og:description", content: "Access your Voltarc account." }] }),
  component: Auth,
});

function Auth() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const u = mode === "in"
        ? await actions.signIn(String(f.get("email")), String(f.get("password")))
        : await actions.signUp(String(f.get("name")), String(f.get("email")), String(f.get("password")));
      if (!u) {
        toast.success("Check your email to confirm your account, then sign in.");
        setMode("in");
        return;
      }
      toast.success(`Welcome, ${u.name.split(" ")[0]}`);
      navigate({ to: u.role === "admin" ? "/admin" : "/account" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-2 lg:px-8">
      <div className="relative hidden overflow-hidden rounded-3xl bg-ink lg:block">
        <img src={IMAGES.hero} alt="" className="h-full w-full object-cover opacity-80" />
        <p className="absolute bottom-8 left-8 right-8 text-2xl font-semibold text-ink-foreground">Track orders, save systems, and get warranty support in one place.</p>
      </div>
      <div className="mx-auto w-full max-w-sm py-8">
        <h1 className="text-3xl font-semibold">{mode === "in" ? "Welcome back" : "Create account"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{mode === "in" ? "Sign in to your Voltarc account." : "Join for faster checkout and order tracking."}</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          {mode === "up" && <Field label="Full name" name="name" required />}
          <Field label="Email" name="email" type="email" required />
          <Field label="Password" name="password" type="password" required minLength={6} />
          <button disabled={busy} className="w-full disabled:opacity-50 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground">{mode === "in" ? "Sign in" : "Create account"}</button>
        </form>
        <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-6 text-sm text-muted-foreground">
          {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
