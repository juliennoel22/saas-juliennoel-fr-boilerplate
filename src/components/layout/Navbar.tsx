import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import type React from "react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export function Navbar(): React.ReactElement {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          className="inline-flex min-h-11 min-w-0 items-center truncate font-semibold text-base text-foreground tracking-tight"
          href="/"
        >
          {siteConfig.name}
        </Link>

        <nav aria-label="Navigation principale" className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            className="hidden min-h-11 items-center rounded-lg px-3 text-muted-foreground text-sm transition-colors hover:text-foreground sm:inline-flex"
            href="/#pricing"
          >
            Tarifs
          </Link>
          <Link
            className="inline-flex min-h-11 items-center rounded-lg px-3 text-muted-foreground text-sm transition-colors hover:text-foreground"
            href="/login"
          >
            Connexion
          </Link>
          <Button
            className="min-h-11"
            render={<Link href="/try" />}
            size="default"
          >
            <span>Essayer</span>
            <ArrowRightIcon aria-hidden="true" className="size-4" />
          </Button>
        </nav>
      </div>
    </header>
  );
}
