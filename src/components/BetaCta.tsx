"use client";

import Link from "next/link";
import posthog from "posthog-js";
import { Children, isValidElement, type ReactNode } from "react";

interface BetaCtaProps {
  location: string;
  children: ReactNode;
  className?: string;
  ctaId?: string;
}

// Best-effort extraction of human-readable button text from JSX children for the
// cta_text property. Handles plain strings, fragments, and a single level of
// nested ReactElement children. Returns undefined if no plain string surface.
function extractCtaText(children: ReactNode): string | undefined {
  const parts: string[] = [];
  Children.forEach(children, (child) => {
    if (typeof child === "string" || typeof child === "number") {
      parts.push(String(child));
    } else if (isValidElement(child)) {
      const elementChildren = (child.props as { children?: ReactNode } | null)?.children;
      if (typeof elementChildren === "string" || typeof elementChildren === "number") {
        parts.push(String(elementChildren));
      }
    }
  });
  const joined = parts.join(" ").trim();
  return joined.length > 0 ? joined.slice(0, 80) : undefined;
}

export function BetaCta({ location, children, className, ctaId = "request_beta" }: BetaCtaProps) {
  return (
    <Link
      href="?beta=true"
      scroll={false}
      className={className}
      onClick={() => {
        posthog.capture("cta_clicked", {
          cta_id: ctaId,
          cta_location: location,
          cta_text: extractCtaText(children),
          destination: "?beta=true",
        });
      }}
    >
      {children}
    </Link>
  );
}
