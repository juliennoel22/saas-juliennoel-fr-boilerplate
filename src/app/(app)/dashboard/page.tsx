import { ArrowRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type React from "react";
import { PortalButton, SignOutButton } from "@/components/dashboard/AccountActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { maskEmail } from "@/lib/security";
import { createServerSupabaseClient, getAuthenticatedUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Tableau de bord",
};

export default async function DashboardPage(): Promise<React.ReactElement> {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const supabase = await createServerSupabaseClient();
  const { data: profile } = supabase
    ? await supabase
        .from("profiles")
        .select("credits, plan, is_active, stripe_customer_id")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const { data: ledgerRows } = supabase
    ? await supabase
        .from("credit_ledger")
        .select("id, delta, reason, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5)
    : { data: null };

  const credits = profile?.credits ?? 0;
  const planName = profile?.plan ?? "free";
  const hasBillingProfile = Boolean(profile?.stripe_customer_id);
  const maskedIdentity = user.email ? maskEmail(user.email) : "Compte authentifié";

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link className="inline-flex min-h-11 items-center font-semibold text-base text-foreground" href="/">
            {siteConfig.name}
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{maskedIdentity}</Badge>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-semibold text-2xl text-foreground tracking-tight">
              Espace personnel
            </h1>
            <p className="text-muted-foreground text-sm">
              Consultez votre solde de crédits et lancez une nouvelle exécution.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <PortalButton disabled={!hasBillingProfile} />
            <Button className="min-h-11" render={<Link href="/try" />}>
              <span>Nouvelle action</span>
              <ArrowRightIcon aria-hidden="true" className="size-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Crédits disponibles</CardDescription>
              <CardTitle className="font-mono text-3xl">{credits}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Offre active</CardDescription>
              <CardTitle className="capitalize">{planName}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Statut du compte</CardDescription>
              <CardTitle>{profile?.is_active ? "Actif" : "Standard"}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historique récent</CardTitle>
            <CardDescription>
              Mouvements de crédits et opérations liées à votre espace.
            </CardDescription>
          </CardHeader>
          <CardPanel>
            {ledgerRows && ledgerRows.length > 0 ? (
              <ul className="divide-y divide-border text-sm">
                {ledgerRows.map((entry) => (
                  <li className="flex items-center justify-between py-3" key={entry.id}>
                    <span className="text-foreground">{entry.reason}</span>
                    <span
                      className={
                        entry.delta > 0
                          ? "font-mono font-medium text-success"
                          : "font-mono text-muted-foreground"
                      }
                    >
                      {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <p className="font-medium text-foreground text-sm">
                  Commencez votre première exécution
                </p>
                <p className="mt-1 text-muted-foreground text-xs">
                  Vos opérations et mouvements de crédits apparaîtront ici automatiquement.
                </p>
                <div className="mt-4 flex justify-center">
                  <Button className="min-h-11" render={<Link href="/try" />} variant="outline">
                    Lancer une action
                  </Button>
                </div>
              </div>
            )}
          </CardPanel>
          <CardFooter className="justify-between border-t border-border pt-4 text-muted-foreground text-xs">
            <span>Besoin de crédits supplémentaires ?</span>
            <Link className="inline-flex min-h-11 items-center font-medium text-foreground underline underline-offset-4" href="/#pricing">
              Voir les offres
            </Link>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
