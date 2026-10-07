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
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      const u = mode === "in"
        ? actions.signIn(String(f.get("email")), String(f.get("password")))
        : actions.signUp(String(f.get("name")), String(f.get("email")), String(f.get("password")));
      toast.success(`Welcome, ${u.name.split(" ")[0]}`);
      navigate({ to: u.role === "admin" ? "/admin" : "/account" });
    } catch (err) {
      toast.error((err as Error).message);
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
          <button className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground">{mode === "in" ? "Sign in" : "Create account"}</button>
        </form>
        <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-6 text-sm text-muted-foreground">
          {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
        <div className="mt-10 rounded-2xl border border-dashed p-4 font-mono text-xs text-muted-foreground">
          Demo accounts<br />customer: demo@voltarc.dev / demo123<br />admin: admin@voltarc.dev / admin123
        </div>
      </div>
    </div>
  );
}
