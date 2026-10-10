import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase-config";

/** Browser client for the owner's own Supabase project (not Lovable Cloud). */
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: typeof window !== "undefined", autoRefreshToken: true },
});
