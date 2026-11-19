import { ArrowRightIcon, CheckCircle2Icon } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import type React from "react";
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
import { getServerEnv } from "@/lib/env";
import { verifyVipToken } from "@/lib/security";

export const metadata: Metadata = {
  title: "Accès",
};

const VIP_COOKIE_NAME =
  process.env.NODE_ENV === "production" ? "__Host-vip_session" : "vip_session";

interface AccessPageProps {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AccessPage({
  searchParams,
}: AccessPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const cookieStore = await cookies();
  const mode = typeof params.mode === "string" ? params.mode : undefined;
  const vipCookie = cookieStore.get(VIP_COOKIE_NAME)?.value;
  const isVerifiedVip =
    mode === "vip" && verifyVipToken(vipCookie, getServerEnv().VIP_BYPASS_CODES);

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col justify-center px-4 py-10">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CheckCircle2Icon aria-hidden="true" className="size-6 text-success" />
            {isVerifiedVip && <Badge variant="outline">Mode test interne</Badge>}
          </div>
          <CardTitle>{isVerifiedVip ? "Accès test activé" : "Votre accès est prêt"}</CardTitle>
          <CardDescription>
            {isVerifiedVip
              ? "Session ouverte via code VIP vérifié. Aucune transaction Stripe live n'a été générée."
              : "Connectez-vous avec l'adresse email utilisée lors du paiement pour ouvrir votre espace."}
          </CardDescription>
        </CardHeader>
        <CardPanel>
          <p className="text-muted-foreground text-sm">
            Si vous venez de finaliser votre paiement, un lien de connexion a également été préparé
            pour votre adresse email.
          </p>
        </CardPanel>
        <CardFooter className="flex-col gap-2">
          <Button
            className="min-h-11 w-full"
            render={<Link href="/login?next=/dashboard" />}
            size="lg"
          >
            <span>Ouvrir mon espace</span>
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
