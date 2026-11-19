"use client";

import { CreditCardIcon, LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { trackClientEvent } from "@/lib/posthog/events";
import { createClient } from "@/lib/supabase/client";

const portalResponseSchema = z.object({
  url: z.url().optional(),
  error: z.string().optional(),
});

export function PortalButton({ disabled }: { readonly disabled?: boolean }): React.ReactElement {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handlePageShow = (): void => setLoading(false);
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  const openPortal = async (): Promise<void> => {
    if (loading) return;
    setLoading(true);
    trackClientEvent("portal_opened");
    try {
      const response = await fetch("/api/stripe/portal", { method: "POST" });
      const rawJson: unknown = await response.json();
      const parsed = portalResponseSchema.safeParse(rawJson);
      const data = parsed.success ? parsed.data : {};

      if (!response.ok || !data.url) {
        toastManager.add({
          title: "Portail indisponible",
          description: data.error ?? "Aucun abonnement actif trouvé.",
          type: "error",
        });
        setLoading(false);
        return;
      }
      window.location.assign(data.url);
    } catch {
      toastManager.add({
        title: "Erreur réseau",
        description: "Réessayez dans un instant.",
        type: "error",
      });
      setLoading(false);
    }
  };

  return (
    <Button
      className="min-h-11"
      disabled={disabled}
      loading={loading}
      onClick={openPortal}
      variant="outline"
    >
      <CreditCardIcon aria-hidden="true" className="size-4" />
      <span>Gérer la facturation</span>
    </Button>
  );
}

export function SignOutButton(): React.ReactElement {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async (): Promise<void> => {
    if (loading) return;
    setLoading(true);
    trackClientEvent("sign_out");
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.replace("/login");
    router.refresh();
  };

  return (
    <Button className="min-h-11" loading={loading} onClick={handleSignOut} variant="ghost">
      <LogOutIcon aria-hidden="true" className="size-4" />
      <span>Déconnexion</span>
    </Button>
  );
}
