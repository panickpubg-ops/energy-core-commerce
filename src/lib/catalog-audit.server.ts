import { createOpenAI } from "@ai-sdk/openai";
import { NoObjectGeneratedError, Output, streamText } from "ai";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";
const RUN_ID = "X-Lovable-AIG-Run-ID";

export const auditSchema = z.object({
  summary: z.string(),
  issues: z.array(
    z.object({
      sku: z.string(),
      productName: z.string(),
      severity: z.enum(["high", "medium", "low"]),
      field: z.string(),
      problem: z.string(),
      fix: z.string(),
    }),
  ),
});
export type CatalogAudit = z.infer<typeof auditSchema>;

const INSTRUCTIONS = `You audit product listings for an online store selling lithium batteries, LiFePO4 packs, BMS boards, chargers, power stations and accessories.
Find listings that are incomplete or inconsistent and suggest concrete fixes. Check especially:
- energy (Wh) vs voltage × capacity (Ah) mismatches (tolerance ~3%)
- chemistry vs nominal voltage (LiFePO4 cells are 3.2V, so 12.8V/25.6V/51.2V packs; NMC/Li-ion 3.6-3.7V per cell)
- missing voltage/capacity/chemistry/dimensions/weight/warranty/images/description on batteries
- cycle life or warranty implausible for the chemistry
- compare-at price lower than or equal to price, zero/negative prices
- stock levels that conflict with any inventory data the admin supplied, oversold or negative stock, published items with no stock
- duplicate SKUs or slugs, SKU naming that contradicts the specs, categories that don't match the product
- specs list entries that contradict top-level fields
Each fix must say exactly what value to set or what to add. Use the product's SKU (or "N/A"). Order issues by severity. If the catalog is clean, return an empty issues list and say so in the summary.
Keep the summary to 2-3 sentences.`;

export async function runCatalogAudit(catalogJson: string, adminData: string): Promise<CatalogAudit> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured for this project.");

  let runId: string | undefined;
  const provider = createOpenAI({
    baseURL: GATEWAY,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: async (input, init) => {
      const headers = new Headers(init?.headers);
      if (runId) headers.set(RUN_ID, runId);
      const res = await fetch(input, { ...init, headers });
      runId ??= res.headers.get(RUN_ID) ?? undefined;
      return res;
    },
  });

  const prompt = `CURRENT CATALOG (JSON from the store database):\n${catalogJson}\n\nADDITIONAL CATALOG / INVENTORY DATA PROVIDED BY THE ADMIN (may be CSV, JSON or notes; may be empty):\n${adminData || "(none)"}`;

  const result = streamText({
    model: provider.responses(MODEL),
    instructions: INSTRUCTIONS,
    prompt,
    output: Output.object({ schema: auditSchema }),
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "medium",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  try {
    return await result.output;
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error) && error.text) {
      try { return auditSchema.parse(JSON.parse(error.text)); } catch { /* fall through */ }
    }
    const status = (error as { statusCode?: number }).statusCode;
    if (status === 402) throw new Error("AI credits are used up. Add credits in your Lovable workspace to run more audits.");
    if (status === 429) throw new Error("The AI service is busy right now. Please try again in a minute.");
    if (status === 403) throw new Error("AI access is blocked for this workspace. A workspace admin needs to check AI settings.");
    throw new Error("The AI audit failed. Please try again.");
  }
}
