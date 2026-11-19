"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useRef, useState, useSyncExternalStore } from "react";
import { AuditTunnel } from "@/components/tunnel/AuditTunnel";
import { HardPaywallCard } from "@/components/tunnel/HardPaywallCard";
import { QuizTunnel } from "@/components/tunnel/QuizTunnel";
import { UploadTunnel } from "@/components/tunnel/UploadTunnel";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { siteConfig, type TunnelVariant } from "@/config/site";
import { trackClientEvent } from "@/lib/posthog/events";

const DRAFT_STORAGE_KEY = "saas_tunnel_draft_v1";
const DRAFT_EVENT = "saas-tunnel-draft-change";

function subscribeDraft(onStoreChange: () => void): () => void {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(DRAFT_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(DRAFT_EVENT, onStoreChange);
  };
}

function readDraftSnapshot(): string {
  try {
    return window.localStorage.getItem(DRAFT_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

interface TunnelShellProps {
  readonly variant?: TunnelVariant;
}

export function TunnelShell({ variant = siteConfig.tunnelVariant }: TunnelShellProps): React.ReactElement {
  const [step, setStep] = useState<1 | 2>(1);
  const [completedSummary, setCompletedSummary] = useState("");
  const draftInput = useSyncExternalStore(subscribeDraft, readDraftSnapshot, () => "");
  const startedAtRef = useRef<number | null>(null);

  const handleDraftChange = (nextValue: string): void => {
    if (startedAtRef.current === null && nextValue.trim().length > 0) {
      startedAtRef.current = Date.now();
      trackClientEvent("aha_started", { variant });
    }
    try {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, nextValue);
      window.dispatchEvent(new Event(DRAFT_EVENT));
    } catch {
      // Ignore storage restrictions
    }
  };

  const completeStep = (summary: string): void => {
    const durationMs = startedAtRef.current ? Date.now() - startedAtRef.current : 0;
    trackClientEvent("aha_completed", { variant, durationMs });
    setCompletedSummary(summary);
    setStep(2);
  };

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col justify-between px-4 py-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-2">
          <Link
            className="inline-flex min-h-11 min-w-0 items-center gap-1.5 truncate text-muted-foreground text-sm hover:text-foreground"
            href="/"
          >
            <ArrowLeftIcon aria-hidden="true" className="size-4 shrink-0" />
            <span className="truncate">{siteConfig.name}</span>
          </Link>
          <Badge variant="outline">Étape {step}/2</Badge>
        </div>

        {step === 2 ? (
          <HardPaywallCard
            lockedHighlights={[
              "[Point de résultat n°1 — Synthèse complète]",
              "[Point de résultat n°2 — Recommandations actionnables]",
              "[Point de résultat n°3 — Export prêt à l'emploi]",
            ]}
            onBack={() => setStep(1)}
            summaryText={completedSummary || draftInput}
            summaryTitle="Entrée enregistrée"
            variant={variant}
          />
        ) : variant === "quiz" ? (
          <QuizTunnel onComplete={completeStep} />
        ) : variant === "upload" ? (
          <UploadTunnel onComplete={completeStep} />
        ) : variant === "audit" ? (
          <AuditTunnel onComplete={completeStep} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>[Action IA — Essai sans compte]</CardTitle>
              <CardDescription>
                Saisissez votre entrée de test. Votre brouillon est conservé localement sur cet
                appareil.
              </CardDescription>
            </CardHeader>
            <CardPanel className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="tunnel-input">[Champ d&apos;entrée principal]</Label>
                <Input
                  id="tunnel-input"
                  onChange={(event) => handleDraftChange(event.target.value)}
                  placeholder="[Exemple neutre de saisie]"
                  value={draftInput}
                />
              </div>
              <p className="text-muted-foreground text-xs">
                Aucun compte requis pour cette étape. Le traitement métier est branché après
                démarrage.
              </p>
            </CardPanel>
            <CardFooter>
              <Button
                className="min-h-11 w-full"
                disabled={draftInput.trim().length < 2}
                onClick={() => completeStep(draftInput)}
                size="lg"
              >
                <span>Générer l&apos;aperçu</span>
                <ArrowRightIcon aria-hidden="true" className="size-4" />
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>

      <p className="pt-6 text-center text-muted-foreground text-xs">
        <Link
          className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-foreground"
          href="/legal"
        >
          Mentions légales &amp; CGV
        </Link>
      </p>
    </main>
  );
}
