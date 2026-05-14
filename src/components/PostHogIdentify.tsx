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
 * NOTE: provider name (google / email / etc.) is not surfaced by useSession()
 * unless the NextAuth session/jwt callback is extended to persist it. Until that
 * lands, this fires with provider="next-auth" as a placeholder. Tracked in the
 * taxonomy reconciliation pass.
 */
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
        provider: "next-auth",
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
