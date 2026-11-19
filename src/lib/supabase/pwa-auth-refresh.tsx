"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Refreshes Supabase Auth session when an iOS Safari PWA or mobile tab
 * returns from background suspension or recovers network connectivity.
 */
export function PWAAuthRefresh(): null {
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    let inFlight = false;

    const refresh = async (): Promise<void> => {
      if (inFlight || document.visibilityState === "hidden") return;
      inFlight = true;
      try {
        await supabase.auth.getUser();
      } catch {
        // Silent recovery; next user navigation re-validates via proxy.
      } finally {
        inFlight = false;
      }
    };

    const handleVisibility = (): void => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };

    const handleOnline = (): void => {
      void refresh();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("online", handleOnline);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return null;
}
