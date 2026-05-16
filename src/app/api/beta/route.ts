import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripHtml } from "@/lib/sanitize";
import { getPostHogClient } from "@/lib/posthog-server";

// Shape of the incoming JSON body. All attribution fields are optional and
// may arrive as undefined/null/empty when the client cannot resolve them.
type BetaRequestBody = {
  name?: unknown;
  email?: unknown;
  platform?: unknown;
  painPoint?: unknown;
  referrer?: unknown;
  landingPage?: unknown;
  utmSource?: unknown;
  utmMedium?: unknown;
  utmCampaign?: unknown;
  utmTerm?: unknown;
  utmContent?: unknown;
  posthogDistinctId?: unknown;
};

// Sanitize a single inbound string: strip HTML, trim, cap to 500 chars.
// Returns null for anything that is missing or empty post-trim so the
// Prisma create stores NULL rather than an empty string.
function clean(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  // Coerce to string defensively (client could send numbers, etc.) and cap
  // length BEFORE sanitization to limit work on hostile payloads.
  const capped = String(value).slice(0, 500);
  // stripHtml removes tags and decodes common entities while preserving emoji.
  const sanitized = stripHtml(capped).trim();
  return sanitized.length > 0 ? sanitized : null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as BetaRequestBody;

    // Sanitize required fields first so the missing-field check operates on
    // the cleaned values (an all-whitespace or all-HTML name collapses to null).
    const name = clean(body.name);
    const email = clean(body.email);
    const platform = clean(body.platform);
    const painPoint = clean(body.painPoint);

    // Attribution fields — all optional, all sanitized identically.
    const referrer = clean(body.referrer);
    const landingPage = clean(body.landingPage);
    const utmSource = clean(body.utmSource);
    const utmMedium = clean(body.utmMedium);
    const utmCampaign = clean(body.utmCampaign);
    const utmTerm = clean(body.utmTerm);
    const utmContent = clean(body.utmContent);
    const posthogDistinctId = clean(body.posthogDistinctId);

    if (!name || !email || !platform) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Vercel edge headers — present on Vercel deploys, absent in local dev.
    // Country/region are short ISO-style codes; city is URL-encoded by Vercel
    // and may include unicode (e.g. "São Paulo"), so decode then cap length.
    const country = req.headers.get("x-vercel-ip-country") ?? null;
    const region = req.headers.get("x-vercel-ip-country-region") ?? null;
    const cityRaw = req.headers.get("x-vercel-ip-city");
    const city = cityRaw ? decodeURIComponent(cityRaw).slice(0, 200) : null;
    // User agent can be long — cap to 500 chars. Empty string collapses to null
    // so the column is NULL rather than "" when the header is absent.
    const userAgent =
      (req.headers.get("user-agent") ?? "").slice(0, 500) || null;

    const betaRequest = await prisma.betaRequest.create({
      data: {
        // Required + existing fields.
        name,
        email,
        platform,
        painPoint,
        // Attribution from client body.
        referrer,
        landingPage,
        utmSource,
        utmMedium,
        utmCampaign,
        utmTerm,
        utmContent,
        // Request context resolved server-side from Vercel edge headers.
        userAgent,
        country,
        region,
        city,
        // PostHog stitch — links this row to the anonymous client-side person.
        posthogDistinctId,
      },
    });

    // Fire a server-side PostHog event so we have a durable record of the
    // persist (client capture can be blocked by ad-blockers). Uses the same
    // distinct_id the client used, so both events stitch to one person.
    // Wrapped in try/catch — a PostHog hiccup must never break the API.
    try {
      const posthog = getPostHogClient();
      posthog.capture({
        distinctId: posthogDistinctId ?? "anonymous",
        event: "beta_signup_persisted",
        properties: {
          // Non-PII context only — explicitly NO name/email here.
          platform,
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          country,
          region,
          has_referrer: !!referrer,
          has_landing_page: !!landingPage,
        },
      });
    } catch (phError) {
      // Swallow — telemetry must never block the user response.
      console.error("[Beta Request PostHog Error]", phError);
    }

    return NextResponse.json({ success: true, id: betaRequest.id });
  } catch (error: unknown) {
    // Duplicate email — return a friendly message
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint failed")
    ) {
      return NextResponse.json(
        { error: "You're already on the list!" },
        { status: 409 }
      );
    }
    console.error("[Beta Request Error]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
