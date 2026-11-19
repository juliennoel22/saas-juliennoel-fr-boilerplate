"use client";

import Link from "next/link";
import type React from "react";
import { type PostHogEventName, trackClientEvent } from "@/lib/posthog/events";

interface TrackedLinkProps {
  readonly href: string;
  readonly event: PostHogEventName;
  readonly eventProperties?: Record<string, string | number | boolean | undefined>;
  readonly className?: string;
  readonly children?: React.ReactNode;
}

export function TrackedLink({
  href,
  event,
  eventProperties,
  className,
  children,
}: TrackedLinkProps): React.ReactElement {
  return (
    <Link
      className={className}
      href={href}
      onClick={() => trackClientEvent(event, eventProperties)}
    >
      {children}
    </Link>
  );
}
