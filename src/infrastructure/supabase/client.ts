import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SupabaseConfig } from "./types";

const supabaseConfig: SupabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
};

let client: SupabaseClient | undefined;

export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    if (!supabaseConfig.url || !supabaseConfig.anonKey) {
      throw new Error(
        "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.",
      );
    }
    client = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    });
  }
  return client;
}

export function resetSupabaseClient(): void {
  client = undefined;
}
