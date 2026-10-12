import type { PaymentMethodKey, SiteConfig } from "./types";

export const PAYMENT_METHODS: { key: PaymentMethodKey; label: string; description: string }[] = [
  { key: "card", label: "Credit / debit card", description: "Online card payment. Needs a payment provider connected before live charges." },
  { key: "bank_transfer", label: "Bank transfer", description: "Customer pays by wire; you mark the order paid when funds arrive." },
  { key: "cod", label: "Cash on delivery", description: "Customer pays the courier on delivery." },
  { key: "invoice", label: "Pay by invoice", description: "For business buyers on approved credit terms." },
];

export const DEFAULT_CONFIG: SiteConfig = {
  brand: { logoUrl: "", tagline: "Lithium energy, engineered.", address: "", hours: "Mon–Fri, 9am–6pm" },
  payments: { testMode: true, methods: { card: true, bank_transfer: false, cod: false, invoice: false }, bankInstructions: "", invoiceTerms: "Net 30 for approved business accounts." },
  seo: { titleSuffix: "Voltarc Energy", defaultDescription: "Premium LiFePO4 batteries, power stations, BMS systems and chargers.", ogImage: "", ga4Id: "", gtmId: "", metaPixelId: "", allowIndexing: true },
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export function configFromRows(rows: { key: string; value: any }[], base: SiteConfig = DEFAULT_CONFIG): SiteConfig {
  const get = (k: string) => rows.find((r) => r.key === k)?.value;
  const b = get("brand"), p = get("payments"), s = get("seo");
  return {
    brand: b ? { logoUrl: b.logo_url ?? "", tagline: b.tagline ?? "", address: b.address ?? "", hours: b.hours ?? "" } : base.brand,
    payments: p ? { testMode: p.test_mode !== false, methods: { ...base.payments.methods, ...(p.methods ?? {}) }, bankInstructions: p.bank_instructions ?? "", invoiceTerms: p.invoice_terms ?? "" } : base.payments,
    seo: s ? { titleSuffix: s.title_suffix ?? "", defaultDescription: s.default_description ?? "", ogImage: s.og_image ?? "", ga4Id: s.ga4_id ?? "", gtmId: s.gtm_id ?? "", metaPixelId: s.meta_pixel_id ?? "", allowIndexing: s.allow_indexing !== false } : base.seo,
  };
}

export const configToRows = (c: SiteConfig) => ({
  brand: { logo_url: c.brand.logoUrl, tagline: c.brand.tagline, address: c.brand.address, hours: c.brand.hours },
  payments: { test_mode: c.payments.testMode, methods: c.payments.methods, bank_instructions: c.payments.bankInstructions, invoice_terms: c.payments.invoiceTerms },
  seo: { title_suffix: c.seo.titleSuffix, default_description: c.seo.defaultDescription, og_image: c.seo.ogImage, ga4_id: c.seo.ga4Id, gtm_id: c.seo.gtmId, meta_pixel_id: c.seo.metaPixelId, allow_indexing: c.seo.allowIndexing },
});

/** Only allow well-formed tracking IDs so nothing else can be injected into the page. */
export const validTrackingId = {
  ga4: (v: string) => /^G-[A-Z0-9]{4,15}$/.test(v),
  gtm: (v: string) => /^GTM-[A-Z0-9]{4,10}$/.test(v),
  pixel: (v: string) => /^\d{6,20}$/.test(v),
};
