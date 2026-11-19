"use client";

import { ArrowRightIcon, FileTextIcon, UploadIcon } from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/components/ui/card";
import { isAllowedMimeType, uploadConfig } from "@/config/uploads";
import { trackClientEvent } from "@/lib/posthog/events";

interface UploadTunnelProps {
  readonly onComplete: (summary: string) => void;
}

export function UploadTunnel({ onComplete }: UploadTunnelProps): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedName, setSelectedName] = useState<string>("");
  const [selectedSizeKb, setSelectedSizeKb] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    setErrorMessage("");
    if (!file) return;

    if (!isAllowedMimeType(file.type)) {
      setErrorMessage("Format non pris en charge (JPG, PNG, WEBP ou PDF uniquement).");
      return;
    }

    if (file.size > uploadConfig.maxFileSizeBytes) {
      setErrorMessage("Le fichier dépasse 10 Mo.");
      return;
    }

    trackClientEvent("aha_started", { variant: "upload" });
    setSelectedName(file.name);
    setSelectedSizeKb(Math.max(1, Math.round(file.size / 1024)));
  };

  const handleContinue = (): void => {
    if (!selectedName) return;
    trackClientEvent("aha_step_completed", { variant: "upload", step: 1 });
    onComplete(`${selectedName} (${selectedSizeKb} Ko)`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>[Action IA — Analyse de fichier]</CardTitle>
        <CardDescription>
          Sélectionnez une image ou un PDF (max 10 Mo). Traitement lancé après validation.
        </CardDescription>
      </CardHeader>

      <CardPanel className="space-y-4">
        <input
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="sr-only"
          onChange={handleFileChange}
          ref={inputRef}
          type="file"
        />

        <button
          className="flex min-h-36 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center transition-colors hover:bg-muted/60"
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          {selectedName ? (
            <>
              <FileTextIcon aria-hidden="true" className="size-6 text-foreground" />
              <span className="max-w-full truncate font-medium text-foreground text-sm">
                {selectedName}
              </span>
              <span className="font-mono text-muted-foreground text-xs">{selectedSizeKb} Ko</span>
            </>
          ) : (
            <>
              <UploadIcon aria-hidden="true" className="size-6 text-muted-foreground" />
              <span className="font-medium text-foreground text-sm">
                Choisir un document ou une photo
              </span>
              <span className="text-muted-foreground text-xs">JPG, PNG, WEBP ou PDF</span>
            </>
          )}
        </button>

        {errorMessage && (
          <p className="text-destructive text-xs" role="alert">
            {errorMessage}
          </p>
        )}
      </CardPanel>

      <CardFooter>
        <Button
          className="min-h-11 w-full"
          disabled={!selectedName}
          onClick={handleContinue}
          size="lg"
        >
          <span>Analyser le fichier</span>
          <ArrowRightIcon aria-hidden="true" className="size-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
