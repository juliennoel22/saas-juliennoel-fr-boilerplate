import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type React from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { sanitizeRedirectPath } from "@/lib/security";

export const metadata: Metadata = {
  title: "Connexion",
};

interface LoginPageProps {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginPage({
  searchParams,
}: LoginPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const rawNext = typeof params.next === "string" ? params.next : undefined;
  const errorParam = typeof params.error === "string" ? params.error : undefined;
  const nextPath = sanitizeRedirectPath(rawNext, "/dashboard");

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-4">
        <Link
          className="inline-flex min-h-11 items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground"
          href="/"
        >
          <ArrowLeftIcon aria-hidden="true" className="size-4" />
          <span>{siteConfig.name}</span>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connexion sans mot de passe</CardTitle>
          <CardDescription>
            Recevez un lien de connexion sécurisé ou utilisez votre compte Google.
          </CardDescription>
        </CardHeader>
        <CardPanel className="space-y-4">
          {errorParam && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-destructive text-xs">
              Le lien de connexion a expiré ou n&apos;est plus valide. Demandez-en un nouveau
              ci-dessous.
            </div>
          )}
          <LoginForm nextPath={nextPath} />
        </CardPanel>
      </Card>
    </main>
  );
}
