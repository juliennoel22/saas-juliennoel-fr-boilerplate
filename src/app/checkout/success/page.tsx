import { ArrowRightIcon, CheckCircle2Icon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Paiement confirmé",
};

interface CheckoutSuccessPageProps {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const hasSession = typeof params.session_id === "string" && params.session_id.length > 0;

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col justify-center px-4 py-10">
      <Card>
        <CardHeader>
          <CheckCircle2Icon aria-hidden="true" className="size-7 text-success" />
          <CardTitle>Paiement confirmé</CardTitle>
          <CardDescription>
            Votre accès est en cours d&apos;activation automatique.
          </CardDescription>
        </CardHeader>
        <CardPanel>
          <p className="text-muted-foreground text-sm">
            {hasSession
              ? "Votre commande Stripe a bien été enregistrée. Connectez-vous pour retrouver vos crédits dans votre tableau de bord."
              : "Connectez-vous avec votre adresse email pour accéder à votre espace."}
          </p>
        </CardPanel>
        <CardFooter className="flex-col gap-2">
          <Button className="min-h-11 w-full" render={<Link href="/dashboard" />} size="lg">
            <span>Accéder à mon espace</span>
            <ArrowRightIcon aria-hidden="true" className="size-4" />
          </Button>
          <Button className="min-h-11 w-full" render={<Link href="/" />} variant="ghost">
            Retour à l&apos;accueil
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
