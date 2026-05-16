"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";

/**
 * Bridges NextAuth session state to PostHog identity.
 *
 * On unauthenticated → authenticated transition:
 *   1. posthog.identify(userId, { email, name })   — modern posthog-js automatically
 *      merges the anonymous distinct_id into the new userId. Explicit alias() is no
 *      longer needed (and is discouraged in posthog-js >= 1.200; the call still works
 *      but identify() handles the same merge).
 *   2. posthog.capture("login_succeeded", ...)     — single fire per session change.
 *
 * On authenticated → unauthenticated transition:
 *   - posthog.reset() — clear identity and start a fresh anonymous distinct_id.
 *
 * Idempotent across renders via a ref guard on userId.
 *
 * `provider` + `is_new_user` are surfaced from the NextAuth session (see
 * src/auth.ts jwt+session callbacks). Provider id mapping:
 *   - "google" → "google"
 *   - "resend" → "email" (we use Resend as our email magic-link provider; the
 *     taxonomy doc canonicalises this as "email" since it's the user-facing
 *     auth method)
 */
function normalizeProvider(raw: string | undefined): string {
  if (!raw) return "unknown";
  if (raw === "resend") return "email";
  return raw;
}

export function PostHogIdentify() {
  const { data: session, status } = useSession();
  const lastIdentifiedRef = useRef<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    const userId = session?.user?.id;

    if (userId && lastIdentifiedRef.current !== userId) {
      posthog.identify(userId, {
        email: session?.user?.email ?? undefined,
        name: session?.user?.name ?? undefined,
      });

      posthog.capture("login_succeeded", {
        provider: normalizeProvider(session?.user?.provider),
        is_new_user: session?.user?.isNewUser ?? false,
      });

      lastIdentifiedRef.current = userId;
      return;
    }

    if (!userId && lastIdentifiedRef.current !== null) {
      // Signed out — reset to fresh anonymous distinct_id.
      posthog.reset();
      lastIdentifiedRef.current = null;
    }
  }, [session, status]);

  return null;
}

export default PostHogIdentify;
