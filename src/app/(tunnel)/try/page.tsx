import type { Metadata } from "next";
import type React from "react";
import { TunnelShell } from "@/components/tunnel/TunnelShell";
import { siteConfig, type TunnelVariant } from "@/config/site";

export const metadata: Metadata = {
  title: "Essai",
};

const VALID_VARIANTS = new Set<TunnelVariant>(["input", "quiz", "upload", "audit"]);

interface TryPageProps {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TryPage({ searchParams }: TryPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const rawVariant = typeof params.variant === "string" ? params.variant : undefined;
  const variant: TunnelVariant =
    rawVariant && VALID_VARIANTS.has(rawVariant as TunnelVariant)
      ? (rawVariant as TunnelVariant)
      : siteConfig.tunnelVariant;

  return <TunnelShell variant={variant} />;
}
