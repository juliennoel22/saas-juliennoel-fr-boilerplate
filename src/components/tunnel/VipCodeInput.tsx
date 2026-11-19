"use client";

import type React from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface VipCodeInputProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
}

export function VipCodeInput({ value, onChange }: VipCodeInputProps): React.ReactElement {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        className="inline-flex min-h-11 items-center text-muted-foreground text-xs underline underline-offset-4 hover:text-foreground"
        onClick={() => setOpen(true)}
        type="button"
      >
        Vous disposez d&apos;un code d&apos;accès privé ?
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-border p-3">
      <Label className="text-xs" htmlFor="vip-code-input">
        Code d&apos;accès (optionnel)
      </Label>
      <Input
        autoComplete="off"
        id="vip-code-input"
        onChange={(event) => onChange(event.target.value)}
        placeholder="VIP_..."
        type="text"
        value={value}
      />
    </div>
  );
}
