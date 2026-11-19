import Link from "next/link";
import type React from "react";
import { siteConfig } from "@/config/site";

export function Footer(): React.ReactElement {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 text-muted-foreground text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-col gap-1">
          <p className="font-medium text-foreground">{siteConfig.name}</p>
          <p className="text-xs">
            Base technique générique :{" "}
            <a
              className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-foreground"
              href={siteConfig.boilerplateCitation.url}
              rel="noreferrer"
              target="_blank"
            >
              {siteConfig.boilerplateCitation.name}
            </a>
          </p>
        </div>

        <nav aria-label="Liens légaux" className="flex flex-wrap items-center gap-4">
          <Link className="inline-flex min-h-11 items-center hover:text-foreground" href="/legal">
            Mentions légales & CGV
          </Link>
          <Link className="inline-flex min-h-11 items-center hover:text-foreground" href="/try">
            Démo
          </Link>
          <Link className="inline-flex min-h-11 items-center hover:text-foreground" href="/login">
            Accès membre
          </Link>
        </nav>
      </div>
    </footer>
  );
}
