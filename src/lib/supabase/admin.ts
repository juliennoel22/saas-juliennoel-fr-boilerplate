import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";
import type { Database } from "@/types/database.types";

let adminClient: SupabaseClient<Database> | null = null;

/**
 * Server-only service_role client. Never import into Client Components.
 */
export function getSupabaseAdmin(): SupabaseClient<Database> | null {
  if (typeof window !== "undefined") {
    throw new Error("getSupabaseAdmin() must never run in the browser.");
  }

  const env = getServerEnv();
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  if (!adminClient) {
    adminClient = createClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  return adminClient;
}
