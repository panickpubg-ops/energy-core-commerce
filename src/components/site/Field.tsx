import type { InputHTMLAttributes, ReactNode } from "react";

export function Field({ label, hint, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium">{label}</span>
      <input {...props} className={`w-full rounded-xl border bg-card px-3.5 py-2.5 outline-none transition focus:border-foreground/40 focus:ring-2 focus:ring-ring/10 ${props.className ?? ""}`} />
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function PageTitle({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div className="border-b pb-8">
      {eyebrow && <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{eyebrow}</p>}
      <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">{title}</h1>
      {children && <div className="mt-3 max-w-2xl text-muted-foreground">{children}</div>}
    </div>
  );
}
