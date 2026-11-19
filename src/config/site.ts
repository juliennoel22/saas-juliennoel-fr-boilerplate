export type AuthMode = "post_aha" | "gated_dashboard";
export type LandingMode = "marketing" | "tunnel";
export type TunnelVariant = "input" | "quiz" | "upload" | "audit";
export type BillingMode = "one_shot" | "subscription";
export type PlanKey = "starter" | "pro";

export interface PricingPlan {
  readonly key: PlanKey;
  readonly name: string;
  readonly description: string;
  readonly priceCents: number;
  readonly currency: "eur" | "usd";
  readonly mode: "payment" | "subscription";
  readonly interval?: "month" | "year";
  readonly credits: number;
  readonly stripePriceEnvKey: "STRIPE_PRICE_ID_STARTER" | "STRIPE_PRICE_ID_PRO";
  readonly features: readonly string[];
  readonly highlighted?: boolean;
}

export interface SiteConfig {
  readonly name: string;
  readonly slug: string;
  readonly tagline: string;
  readonly description: string;
  readonly locale: "fr" | "en";
  readonly authMode: AuthMode;
  readonly landingMode: LandingMode;
  readonly tunnelVariant: TunnelVariant;
  readonly billingMode: BillingMode;
  readonly features: {
    readonly mcpEnabled: boolean;
    readonly vipBypassEnabled: boolean;
    readonly googleOAuthEnabled: boolean;
    readonly uploadsEnabled: boolean;
  };
  readonly legal: {
    readonly companyName: string;
    readonly supportEmail: string;
    readonly websiteUrl: string;
    readonly jurisdiction: string;
    readonly requiresImmediateExecutionWaiver: boolean;
  };
  readonly boilerplateCitation: {
    readonly name: string;
    readonly url: string;
  };
  readonly plans: Record<PlanKey, PricingPlan>;
}

export const siteConfig: SiteConfig = {
  name: "[Nom du SaaS]",
  slug: "saas-juliennoel-fr-boilerplate",
  tagline: "[Accroche principale orientée résultat mesurable]",
  description:
    "[Description neutre en une phrase expliquant ce que l'utilisateur obtient immédiatement.]",
  locale: "fr",
  authMode: "post_aha",
  landingMode: "marketing",
  tunnelVariant: "input",
  billingMode: "one_shot",
  features: {
    mcpEnabled: true,
    vipBypassEnabled: true,
    googleOAuthEnabled: true,
    uploadsEnabled: true,
  },
  legal: {
    companyName: "[Nom de la société ou de l'éditeur]",
    supportEmail: "contact@example.com",
    websiteUrl: "https://example.com",
    jurisdiction: "France",
    requiresImmediateExecutionWaiver: true,
  },
  boilerplateCitation: {
    name: "saas-juliennoel-fr-boilerplate",
    url: "https://github.com/juliennoel22/saas-juliennoel-fr-boilerplate",
  },
  plans: {
    starter: {
      key: "starter",
      name: "Pack Essentiel",
      description: "[Accès immédiat à l'action principale, paiement unique]",
      priceCents: 1900,
      currency: "eur",
      mode: "payment",
      credits: 20,
      stripePriceEnvKey: "STRIPE_PRICE_ID_STARTER",
      features: [
        "[20 crédits d'exécution inclus]",
        "[Accès immédiat après paiement]",
        "[Export et historique disponibles]",
      ],
    },
    pro: {
      key: "pro",
      name: "Pack Fondateur",
      description: "[Capacité étendue pour usage intensif]",
      priceCents: 4900,
      currency: "eur",
      mode: "payment",
      credits: 100,
      stripePriceEnvKey: "STRIPE_PRICE_ID_PRO",
      highlighted: true,
      features: [
        "[100 crédits d'exécution inclus]",
        "[Priorité d'exécution IA et fallbacks]",
        "[Support email prioritaire]",
      ],
    },
  },
};

export function formatPrice(priceCents: number, currency: "eur" | "usd", locale: "fr" | "en"): string {
  const safeCents = Math.max(50, Math.round(priceCents));
  const intlLocale = locale === "fr" ? "fr-FR" : "en-US";
  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: safeCents % 100 === 0 ? 0 : 2,
  }).format(safeCents / 100);
}
