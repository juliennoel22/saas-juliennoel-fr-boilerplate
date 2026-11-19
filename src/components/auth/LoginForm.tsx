"use client";

import { MailIcon } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toastManager } from "@/components/ui/toast";
import { siteConfig } from "@/config/site";
import { trackClientEvent } from "@/lib/posthog/events";
import { createClient } from "@/lib/supabase/client";

interface LoginFormProps {
  readonly nextPath: string;
}

export function LoginForm({ nextPath }: LoginFormProps): React.ReactElement {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  useEffect(() => {
    const handlePageShow = (): void => {
      setLoading(false);
      setOauthLoading(false);
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  const getCallbackUrl = (): string => {
    const origin = window.location.origin;
    return `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
  };

  const handleMagicLink = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (loading || !email.trim()) return;

    const supabase = createClient();
    if (!supabase) {
      toastManager.add({
        title: "Authentification non configurée",
        description: "Renseignez les clés Supabase pour activer la connexion.",
        type: "error",
      });
      return;
    }

    setLoading(true);
    trackClientEvent("login_requested", { method: "magic_link" });
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: getCallbackUrl() },
    });
    setLoading(false);

    if (error) {
      toastManager.add({
        title: "Envoi impossible",
        description: "Vérifiez l'adresse email saisie puis réessayez.",
        type: "error",
      });
      return;
    }

    setSent(true);
    toastManager.add({
      title: "Lien de connexion envoyé",
      description: "Consultez votre boîte de réception pour vous connecter.",
      type: "success",
    });
  };

  const handleGoogleOAuth = async (): Promise<void> => {
    if (oauthLoading) return;
    const supabase = createClient();
    if (!supabase) {
      toastManager.add({
        title: "Authentification non configurée",
        description: "Renseignez les clés Supabase pour activer Google OAuth.",
        type: "error",
      });
      return;
    }

    setOauthLoading(true);
    trackClientEvent("oauth_initiated", { provider: "google" });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: getCallbackUrl() },
    });
    if (error) {
      setOauthLoading(false);
      toastManager.add({
        title: "Connexion Google indisponible",
        description: "Utilisez le lien email ou réessayez dans un instant.",
        type: "error",
      });
    }
  };

  if (sent) {
    return (
      <div className="space-y-4 text-sm">
        <p className="text-foreground">
          Un lien de connexion sécurisé vient d&apos;être envoyé. Cliquez dessus depuis cet appareil
          pour accéder à votre espace.
        </p>
        <Button className="min-h-11 w-full" onClick={() => setSent(false)} variant="outline">
          Utiliser une autre adresse
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form className="space-y-4" onSubmit={handleMagicLink}>
        <div className="space-y-1.5">
          <Label htmlFor="login-email">Adresse email</Label>
          <Input
            autoComplete="email"
            id="login-email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="vous@domaine.com"
            required
            type="email"
            value={email}
          />
        </div>
        <Button className="min-h-11 w-full" loading={loading} size="lg" type="submit">
          <MailIcon aria-hidden="true" className="size-4" />
          <span>Recevoir un lien de connexion</span>
        </Button>
      </form>

      {siteConfig.features.googleOAuthEnabled && (
        <>
          <div className="relative flex items-center py-1">
            <div className="flex-1 border-t border-border" />
            <span className="px-3 text-muted-foreground text-xs">ou</span>
            <div className="flex-1 border-t border-border" />
          </div>
          <Button
            className="min-h-11 w-full"
            loading={oauthLoading}
            onClick={handleGoogleOAuth}
            size="lg"
            variant="outline"
          >
            Continuer avec Google
          </Button>
        </>
      )}
    </div>
  );
}
