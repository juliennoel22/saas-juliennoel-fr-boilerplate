"use client";

import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from "lucide-react";
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
import { trackClientEvent } from "@/lib/posthog/events";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly options: readonly string[];
}

const QUIZ_QUESTIONS: readonly QuizQuestion[] = [
  {
    id: "goal",
    title: "[Question 1 — Objectif principal]",
    description: "Sélectionnez votre priorité immédiate.",
    options: ["[Option A — Gain de temps]", "[Option B — Réduction coût]", "[Option C — Qualité]"],
  },
  {
    id: "context",
    title: "[Question 2 — Contexte actuel]",
    description: "Précisez votre point de départ.",
    options: ["[Situation 1 — Démarrage]", "[Situation 2 — Croissance]", "[Situation 3 — Audit]"],
  },
  {
    id: "horizon",
    title: "[Question 3 — Niveau de détail souhaité]",
    description: "Adapte le format du livrable final.",
    options: ["[Synthèse directe]", "[Plan détaillé étape par étape]"],
  },
];

interface QuizTunnelProps {
  readonly onComplete: (summary: string) => void;
}

export function QuizTunnel({ onComplete }: QuizTunnelProps): React.ReactElement {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const current = QUIZ_QUESTIONS[questionIndex] ?? QUIZ_QUESTIONS[0]!;
  const selected = answers[current.id] ?? "";
  const progressPercent = Math.round(((questionIndex + 1) / QUIZ_QUESTIONS.length) * 100);

  const selectOption = (option: string): void => {
    if (Object.keys(answers).length === 0) {
      trackClientEvent("aha_started", { variant: "quiz" });
    }
    setAnswers((prev) => ({ ...prev, [current.id]: option }));
  };

  const handleNext = (): void => {
    if (!selected) return;
    trackClientEvent("aha_step_completed", {
      variant: "quiz",
      step: questionIndex + 1,
    });

    if (questionIndex + 1 < QUIZ_QUESTIONS.length) {
      setQuestionIndex((prev) => prev + 1);
      return;
    }

    const summary = QUIZ_QUESTIONS.map((q) => answers[q.id] ?? "").join(" • ");
    onComplete(summary);
  };

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <CardTitle>{current.title}</CardTitle>
        <CardDescription>{current.description}</CardDescription>
      </CardHeader>

      <CardPanel className="space-y-2.5">
        {current.options.map((option) => {
          const isSelected = selected === option;
          return (
            <button
              className={cn(
                "flex min-h-12 w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                isSelected
                  ? "border-foreground bg-muted/70 font-medium text-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted/40",
              )}
              key={option}
              onClick={() => selectOption(option)}
              type="button"
            >
              <span>{option}</span>
              {isSelected && <CheckIcon aria-hidden="true" className="size-4 shrink-0 text-success" />}
            </button>
          );
        })}
      </CardPanel>

      <CardFooter className="flex gap-2">
        {questionIndex > 0 && (
          <Button
            className="min-h-11"
            onClick={() => setQuestionIndex((prev) => Math.max(0, prev - 1))}
            variant="outline"
          >
            <ArrowLeftIcon aria-hidden="true" className="size-4" />
            <span>Retour</span>
          </Button>
        )}
        <Button
          className="min-h-11 flex-1"
          disabled={!selected}
          onClick={handleNext}
          size="lg"
        >
          <span>{questionIndex + 1 < QUIZ_QUESTIONS.length ? "Continuer" : "Voir mon aperçu"}</span>
          <ArrowRightIcon aria-hidden="true" className="size-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
