import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The store owner's own Supabase project (not Lovable Cloud).
 * The anon key is publishable — safe in the browser; RLS protects data.
 * Env vars override these defaults if set.
 */
const url = (import.meta.env["VITE_SUPABASE_URL"] as string | undefined) ?? "https://xfrietvxwvarxryazoyb.supabase.co";
const key =
  (import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined) ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcmlldHZ4d3ZhcnhyeWF6b3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzOTk0MTUsImV4cCI6MjEwNjk3NTQxNX0.Ais0qBTqlXFztputBEBqMavowhOtC9noxOtPETvWxh8";

export const supabase: SupabaseClient = createClient(url, key, {
  auth: { persistSession: typeof window !== "undefined", autoRefreshToken: true },
});
export const isSupabaseConfigured = true;
