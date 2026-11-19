import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Paiement annulé",
};

export default function CheckoutCancelPage(): React.ReactElement {
  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col justify-center px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Paiement non finalisé</CardTitle>
          <CardDescription>
            Aucun montant n&apos;a été débité. Vous pouvez reprendre votre commande à tout moment.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex-col gap-2">
          <Button className="min-h-11 w-full" render={<Link href="/#pricing" />} size="lg">
            Retourner aux tarifs
          </Button>
          <Button className="min-h-11 w-full" render={<Link href="/" />} variant="ghost">
            <ArrowLeftIcon aria-hidden="true" className="size-4" />
            <span>Retour à l&apos;accueil</span>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
