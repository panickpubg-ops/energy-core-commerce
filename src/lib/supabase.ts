import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Your own Supabase project. Set VITE_SUPABASE_URL and
 * VITE_SUPABASE_PUBLISHABLE_KEY to enable it; until then the app runs in
 * demo mode on local seeded data (see src/lib/db.ts).
 */
const url = import.meta.env['VITE_SUPABASE_URL'] as string | undefined;
const key = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] as string | undefined;

export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;
export const isSupabaseConfigured = !!supabase;
