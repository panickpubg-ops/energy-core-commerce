import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase-config";

/** Admin-only: audits catalog + admin-supplied inventory data with AI. */
export const auditCatalog = createServerFn({ method: "POST" })
  .inputValidator((input: { accessToken: string; catalog: string; adminData: string }) => {
    if (typeof input?.accessToken !== "string" || typeof input.catalog !== "string" || typeof input.adminData !== "string") throw new Error("Invalid input");
    if (input.catalog.length + input.adminData.length > 400_000) throw new Error("That's too much data for one audit — split it into smaller batches.");
    return input;
  })
  .handler(async ({ data }) => {
    // Verify the caller is a signed-in store admin in the owner's Supabase project.
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${data.accessToken}` } },
    });
    const { data: u, error } = await sb.auth.getUser(data.accessToken);
    if (error || !u.user) throw new Error("Please sign in again.");
    const { data: isAdmin } = await sb.rpc("is_staff", { _user_id: u.user.id });
    if (!isAdmin) throw new Error("Only store admins can run catalog audits.");

    const { runCatalogAudit } = await import("./catalog-audit.server");
    return runCatalogAudit(data.catalog, data.adminData);
  });
