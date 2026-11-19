import type { Metadata } from "next";
import type React from "react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Mentions légales, CGV et confidentialité",
};

export default function LegalPage(): React.ReactElement {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-10 px-4 py-12 sm:px-6">
        <header className="space-y-2 border-b border-border pb-6">
          <h1 className="font-semibold text-2xl text-foreground tracking-tight sm:text-3xl">
            Mentions légales, CGV &amp; Confidentialité
          </h1>
          <p className="text-muted-foreground text-sm">
            Gabarit paramétré par la configuration du site ({siteConfig.name}). Compléter les
            informations d&apos;identification avant mise en production commerciale.
          </p>
        </header>

        <section className="space-y-2 text-sm leading-relaxed">
          <h2 className="font-semibold text-base text-foreground">1. Éditeur</h2>
          <p className="text-muted-foreground">
            Éditeur : {siteConfig.legal.companyName} — Contact : {siteConfig.legal.supportEmail} —
            Juridiction : {siteConfig.legal.jurisdiction}.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed">
          <h2 className="font-semibold text-base text-foreground">
            2. Conditions Générales de Vente &amp; Droit de rétractation
          </h2>
          <p className="text-muted-foreground">
            Les paiements sont traités de manière sécurisée via Stripe Hosted Checkout. Pour tout
            contenu ou service numérique exécuté immédiatement après paiement, le client consent
            expressément à l&apos;exécution immédiate et reconnaît renoncer à son droit de
            rétractation (Article L221-28 13° du Code de la consommation).
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed">
          <h2 className="font-semibold text-base text-foreground">
            3. Données personnelles &amp; Sous-traitants
          </h2>
          <p className="text-muted-foreground">
            Les données strictement nécessaires à l&apos;authentification, au paiement et à la
            fourniture du service sont hébergées via Supabase, Stripe, Vercel et Resend. Pour toute
            demande d&apos;accès ou de suppression, écrire à {siteConfig.legal.supportEmail}.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
