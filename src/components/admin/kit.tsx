import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { toast } from "sonner";

export const safe = <T,>(p: Promise<T>, ok?: string) =>
  p.then((v) => { if (ok) toast.success(ok); return v; }).catch((e: Error) => { toast.error(e.message); return undefined; });

export function AdminPage({ title, description, actions, children }: { title: string; description?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function Panel({ title, description, actions, children, className = "" }: { title?: string; description?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border bg-card p-5 ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="font-semibold">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const inputCls = "w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:ring-2 focus:ring-ring/10";

export function TextInput({ label, hint, ...p }: InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: ReactNode }) {
  return (
    <label className="block text-sm">
      {label && <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>}
      <input {...p} className={`${inputCls} ${p.className ?? ""}`} />
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function TextArea({ label, hint, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: ReactNode }) {
  return (
    <label className="block text-sm">
      {label && <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>}
      <textarea {...p} className={`${inputCls} ${p.className ?? ""}`} />
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function SelectInput({ label, children, ...p }: SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block text-sm">
      {label && <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>}
      <select {...p} className={`${inputCls} ${p.className ?? ""}`}>{children}</select>
    </label>
  );
}

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border p-3">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>}
      </span>
      <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-primary" : "bg-muted"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </label>
  );
}

export function Btn({ variant = "primary", className = "", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "ghost" | "danger" }) {
  const v = {
    primary: "bg-primary text-primary-foreground hover:opacity-90",
    outline: "border bg-card hover:bg-muted",
    ghost: "hover:bg-muted",
    danger: "text-destructive hover:bg-destructive/10",
  }[variant];
  return <button {...p} className={`inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${v} ${className}`} />;
}

export function Pill({ tone = "muted", children }: { tone?: "muted" | "good" | "warn" | "bad" | "accent"; children: ReactNode }) {
  const t = { muted: "bg-muted text-muted-foreground", good: "bg-success/15 text-success", warn: "bg-warning/15 text-warning", bad: "bg-destructive/10 text-destructive", accent: "bg-accent/15 text-accent-foreground" }[tone];
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${t}`}>{children}</span>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">{children}</div>;
}

export function Table({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
          <tr>{head.map((h, i) => <th key={i} className="px-4 py-3 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y">{children}</tbody>
      </table>
    </div>
  );
}
