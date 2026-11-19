import { randomUUID } from "node:crypto";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies, headers } from "next/headers";
import type React from "react";
import { AnchoredToastProvider, ToastProvider } from "@/components/ui/toast";
import { siteConfig } from "@/config/site";
import { getPublicEnv } from "@/lib/env";
import { PHProvider } from "@/lib/posthog/client";
import { getPostHogBootstrap } from "@/lib/posthog/server";
import { PWAAuthRefresh } from "@/lib/supabase/pwa-auth-refresh";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getPublicEnv().NEXT_PUBLIC_APP_URL),
  title: {
    default: siteConfig.name,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): Promise<React.ReactElement> {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const distinctId = cookieStore.get("ph_distinct_id")?.value ?? randomUUID();
  const host = headerStore.get("host");
  const bootstrap = await getPostHogBootstrap(distinctId, { host });

  return (
    <html className={`${geistSans.variable} ${geistMono.variable}`} lang={siteConfig.locale}>
      <body className="min-h-[100dvh] bg-background text-foreground">
        <PHProvider bootstrap={bootstrap}>
          <ToastProvider>
            <AnchoredToastProvider>
              <PWAAuthRefresh />
              {children}
            </AnchoredToastProvider>
          </ToastProvider>
        </PHProvider>
      </body>
    </html>
  );
}
