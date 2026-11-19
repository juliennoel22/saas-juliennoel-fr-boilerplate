"use client";

import { ArrowRightIcon } from "lucide-react";
import type React from "react";
import { useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { trackClientEvent } from "@/lib/posthog/events";

interface AuditTunnelProps {
  readonly onComplete: (summary: string) => void;
}

export function AuditTunnel({ onComplete }: AuditTunnelProps): React.ReactElement {
  const [target, setTarget] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  const handleAnalyze = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const cleaned = target.trim();
    if (cleaned.length < 3 || isScanning) return;

    trackClientEvent("aha_started", { variant: "audit" });
    setIsScanning(true);

    window.setTimeout(() => {
      trackClientEvent("aha_step_completed", { variant: "audit", step: 1 });
      setIsScanning(false);
      onComplete(cleaned);
    }, 350);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>[Action IA — Audit instantané]</CardTitle>
        <CardDescription>
          Renseignez une URL publique ou un texte court pour générer un pré-diagnostic.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleAnalyze}>
        <CardPanel className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="audit-target-input">[URL ou référence à analyser]</Label>
            <Input
              id="audit-target-input"
              onChange={(event) => setTarget(event.target.value)}
              placeholder="https://exemple.com"
              value={target}
            />
          </div>

          {isScanning ? (
            <div className="space-y-2 rounded-xl border border-border p-4">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">
              Aperçu immédiat avant déblocage complet. Aucune donnée sensible requise.
            </p>
          )}
        </CardPanel>

        <CardFooter>
          <Button
            className="min-h-11 w-full"
            disabled={target.trim().length < 3}
            loading={isScanning}
            size="lg"
            type="submit"
          >
            <span>Lancer le pré-diagnostic</span>
            <ArrowRightIcon aria-hidden="true" className="size-4" />
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
