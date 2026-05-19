import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { postToSlack } from "@/lib/slack";

/* POST /api/admin/slack-test
   Body: { channel: "beta-signups" | "streams" | "alerts" | "digest" }
   Fires a single test message to the named channel's webhook (if configured).
   Gated by the admin allow-list. Non-admins → 401. */
export async function POST(req: Request) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email || !isAdminEmail(email)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    channel?: "beta-signups" | "streams" | "alerts" | "digest";
  };
  const { channel } = body;

  const envVar =
    channel === "beta-signups"
      ? process.env.SLACK_WEBHOOK_BETA_SIGNUPS
      : channel === "streams"
        ? process.env.SLACK_WEBHOOK_STREAMS
        : channel === "alerts"
          ? process.env.SLACK_WEBHOOK_ALERTS
          : channel === "digest"
            ? process.env.SLACK_WEBHOOK_DIGEST
            : undefined;

  if (!channel) {
    return Response.json(
      { ok: false, reason: "missing_channel" },
      { status: 400 },
    );
  }

  if (!envVar) {
    return Response.json(
      { ok: false, reason: "webhook_unset", channel },
      { status: 200 },
    );
  }

  const ok = await postToSlack(envVar, {
    text: `:white_check_mark: Test message from Zerocast admin (${channel})`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:white_check_mark: *Test message* from Zerocast admin → \`${channel}\`\nFired by ${email} at ${new Date().toISOString()}`,
        },
      },
    ],
  });

  return Response.json({ ok, channel });
}
