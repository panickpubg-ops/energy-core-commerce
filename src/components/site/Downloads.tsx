import { Link } from "@tanstack/react-router";
import { FileDown, FileText, Link2 } from "lucide-react";
import type { Product } from "@/lib/types";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function datasheet(p: Product) {
  const wh = p.energyWh ?? (p.voltage && p.capacityAh ? p.voltage * p.capacityAh : undefined);
  const rows: [string, string | number | undefined][] = [
    ["SKU", p.sku], ["Chemistry", p.chemistry], ["Nominal voltage", p.voltage && `${p.voltage} V`], ["Capacity", p.capacityAh && `${p.capacityAh} Ah`],
    ["Energy", wh && `${wh} Wh`], ["Cycle life", p.cycleLife && `${p.cycleLife}`], ["Dimensions", p.dimensions], ["Weight", p.weightKg && `${p.weightKg} kg`],
    ["Warranty", `${p.warrantyYears} years`], ...p.specs.filter((s) => !/^https?:/.test(s.value)).map((s) => [s.label, s.value] as [string, string]),
  ];
  const body = rows.filter(([, v]) => v).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(String(v))}</td></tr>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(p.name)} datasheet</title><style>body{font:14px system-ui;max-width:720px;margin:40px auto;color:#111}h1{margin:0}td{padding:8px;border-bottom:1px solid #ddd}td:first-child{color:#666;width:40%}</style></head><body><p>VOLTARC ENERGY · TECHNICAL DATASHEET</p><h1>${esc(p.name)}</h1><p>${esc(p.tagline)}</p><table>${body}</table><p style="color:#666;font-size:12px">Specifications subject to change. UN38.3 certified for transport.</p></body></html>`;
}

export function Downloads({ product }: { product: Product }) {
  const files = product.specs.filter((s) => /^https?:\/\//.test(s.value));
  const download = () => {
    const url = URL.createObjectURL(new Blob([datasheet(product)], { type: "text/html" }));
    const a = document.createElement("a"); a.href = url; a.download = `${product.slug}-datasheet.html`; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  };
  const item = "flex items-center gap-3 rounded-2xl border bg-card p-4 text-left text-sm transition hover:border-foreground/40";
  return (
    <div className="mt-6 grid gap-3 md:grid-cols-2">
      <button onClick={download} className={item}><FileDown className="h-5 w-5" /><span><span className="block font-medium">Technical datasheet</span><span className="text-muted-foreground">Printable spec sheet</span></span></button>
      <Link to="/sizing-guide" hash="wiring" className={item}><FileText className="h-5 w-5" /><span><span className="block font-medium">Series / parallel wiring guide</span><span className="text-muted-foreground">Safe bank wiring, fusing, cabling</span></span></Link>
      {files.map((f) => (
        <a key={f.label} href={f.value} target="_blank" rel="noopener noreferrer" className={item}><Link2 className="h-5 w-5" /><span><span className="block font-medium">{f.label}</span><span className="text-muted-foreground">Download</span></span></a>
      ))}
    </div>
  );
}
