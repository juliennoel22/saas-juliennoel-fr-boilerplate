import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getServerEnv } from "@/lib/env";
import type { Database } from "@/types/database.types";

export async function createServerSupabaseClient(): Promise<SupabaseClient<Database> | null> {
  const env = getServerEnv();
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Safe no-op when invoked from a Server Component read context.
          }
        },
      },
    },
  );
}

/**
 * Always verify authenticated identity server-side via supabase.auth.getUser().
 * Never rely on getSession() for authorization decisions.
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return null;
  }
  return data.user;
}
