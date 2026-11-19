import { ArrowRightIcon, CheckIcon } from "lucide-react";
import type React from "react";
import { TrackedLink } from "@/components/shared/TrackedLink";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardPanel, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";

const SHELL_HIGHLIGHTS = [
  "[Bénéfice vérifiable n°1 — résultat concret]",
  "[Bénéfice vérifiable n°2 — gain de temps mesurable]",
  "[Bénéfice vérifiable n°3 — accès immédiat sans friction]",
] as const;

export function HeroPlaceholder(): React.ReactElement {
  return (
    <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-6 sm:items-center sm:text-center">
        <Badge variant="outline">Structure générique prête à configurer</Badge>

        <h1 className="font-semibold text-3xl text-foreground tracking-tight sm:text-5xl">
          {siteConfig.tagline}
        </h1>

        <p className="max-w-2xl text-base text-muted-foreground leading-relaxed sm:text-lg">
          {siteConfig.description}
        </p>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button
            className="min-h-11 px-6"
            render={
              <TrackedLink
                event="landing_cta_clicked"
                eventProperties={{ location: "hero_primary" }}
                href="/try"
              />
            }
            size="lg"
          >
            <span>[Action IA principale]</span>
            <ArrowRightIcon aria-hidden="true" className="size-4" />
          </Button>
          <Button
            className="min-h-11 px-6"
            render={
              <TrackedLink
                event="landing_cta_clicked"
                eventProperties={{ location: "hero_pricing" }}
                href="/#pricing"
              />
            }
            size="lg"
            variant="outline"
          >
            Voir les tarifs
          </Button>
        </div>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        {SHELL_HIGHLIGHTS.map((item, idx) => (
          <Card key={item}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckIcon aria-hidden="true" className="size-4 text-success" />
                <span>Étape 0{idx + 1}</span>
              </CardTitle>
              <CardDescription>{item}</CardDescription>
            </CardHeader>
            <CardPanel>
              <p className="text-muted-foreground text-xs">
                [Remplacer par la preuve visuelle ou le flux réel après démarrage.]
              </p>
            </CardPanel>
          </Card>
        ))}
      </div>
    </section>
  );
}
