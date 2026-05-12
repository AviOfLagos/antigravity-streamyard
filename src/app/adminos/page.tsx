import Link from "next/link";
import { redirect } from "next/navigation";
import { Lock } from "lucide-react";

import { auth, signIn, signOut } from "@/auth";
import { isAdminEmail } from "@/lib/admin";

/* ─────────────────────────────────────────────────────────────────────
   /adminos — admin sign-in entrypoint.
   - signed in + admin → redirect /admin
   - signed in + not admin → render unauthorized panel + sign out
   - signed out → render sign-in panel (dev test / Google / Resend)
   ───────────────────────────────────────────────────────────────────── */

export const metadata = {
  title: "Admin Sign-In — Zerocast",
  robots: { index: false, follow: false },
};

const ADMIN_HOME = "/admin";

/* dev test signin — mirrors /login page pattern, seeds dev@localhost */
async function devSignIn() {
  "use server";
  const { prisma } = await import("@/lib/prisma");
  const { encode } = await import("next-auth/jwt");
  const { cookies } = await import("next/headers");

  const DEV_EMAIL = "dev@localhost";
  const DEV_NAME = "Dev Admin";

  const user = await prisma.user.upsert({
    where: { email: DEV_EMAIL },
    update: {},
    create: { email: DEV_EMAIL, name: DEV_NAME, emailVerified: new Date() },
  });

  const secret =
    process.env.NEXTAUTH_SECRET ?? "local-dev-secret-change-in-production";
  const token = await encode({
    token: {
      id: user.id,
      sub: user.id,
      name: user.name,
      email: user.email,
      picture: null,
    },
    secret,
    salt: "authjs.session-token",
  });

  const cookieStore = await cookies();
  cookieStore.set("authjs.session-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect(ADMIN_HOME);
}

export default async function AdminOsPage() {
  const session = await auth();
  const email = session?.user?.email ?? null;

  if (email && isAdminEmail(email)) redirect(ADMIN_HOME);

  const hasGoogle = !!(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
  const hasResend = !!process.env.RESEND_API_KEY;
  // Always allow dev sign-in in development — even if Google is configured —
  // so the admin entrypoint is reachable without round-tripping OAuth locally.
  const showDevSignin = process.env.NODE_ENV === "development";

  /* signed-in but not admin → forbidden panel */
  if (email && !isAdminEmail(email)) {
    return (
      <ShellWrapper>
        <div className="flex items-center justify-center gap-2 mb-7">
          <Lock className="w-4 h-4 text-danger-text" />
          <span className="text-xs font-bold uppercase tracking-widest text-danger-text">
            Not authorized
          </span>
        </div>
        <div className="text-center mb-7">
          <h1 className="text-xl font-semibold text-white mb-2">
            This account isn&apos;t on the admin list.
          </h1>
          <p className="text-sm text-ink-subtle">
            Signed in as{" "}
            <span className="font-mono text-ink-emphasis">{email}</span>
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/adminos" });
          }}
        >
          <button
            type="submit"
            className="w-full bg-brand-on-light text-ink-inverse hover:opacity-90 rounded-xl py-2.5 font-bold text-sm transition-opacity"
          >
            Sign out & try another account
          </button>
        </form>
      </ShellWrapper>
    );
  }

  /* signed-out → sign-in panel */
  return (
    <ShellWrapper>
      <div className="flex items-center justify-center gap-2 mb-7">
        <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
          <Lock className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-white text-lg tracking-tight">
          Zerocast / Admin
        </span>
      </div>

      <div className="text-center mb-7">
        <h1 className="text-xl font-semibold text-white mb-1">adminOS</h1>
        <p className="text-sm text-ink-subtle">Internal tools — restricted</p>
      </div>

      {showDevSignin ? (
        <>
          <div className="mb-5 rounded-xl border border-warn/30 bg-warn/10 px-4 py-3">
            <p className="text-xs text-warn-text font-medium mb-0.5">
              Development mode
            </p>
            <p className="text-xs text-warn-text/70">
              Google OAuth is not configured. Signing in below seeds a
              <span className="font-mono"> dev@localhost </span> admin user.
            </p>
          </div>
          <form action={devSignIn}>
            <button
              type="submit"
              className="w-full bg-brand hover:bg-brand-soft text-white rounded-xl py-2.5 flex items-center justify-center gap-2.5 font-bold text-sm transition-colors"
            >
              Continue as Dev Admin
            </button>
          </form>
        </>
      ) : null}

      {hasGoogle ? (
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: ADMIN_HOME });
          }}
        >
          <button
            type="submit"
            className="w-full bg-white text-ink-inverse hover:opacity-90 rounded-xl py-2.5 flex items-center justify-center gap-2.5 font-bold text-sm transition-opacity"
          >
            <svg
              className="w-4 h-4 shrink-0"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>
        </form>
      ) : null}

      {hasResend ? (
        <>
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/8" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-surface-2 px-3 text-xs text-ink-subtle">
                or
              </span>
            </div>
          </div>

          <form
            action={async (formData: FormData) => {
              "use server";
              await signIn("resend", {
                email: formData.get("email") as string,
                redirectTo: ADMIN_HOME,
              });
            }}
            className="space-y-3"
          >
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-ink-muted mb-1.5"
              >
                Admin email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="w-full bg-surface-3 border border-white/8 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-ink-faint outline-none focus:ring-1 focus:ring-brand/50 focus:border-brand/40 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-white/6 hover:bg-white/10 text-white border border-white/8 rounded-xl py-2.5 text-sm font-bold transition-colors"
            >
              Send magic link
            </button>
          </form>
        </>
      ) : null}

      {!showDevSignin && !hasGoogle && !hasResend ? (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-xs text-danger-soft">
          No auth providers configured. Set <span className="font-mono">GOOGLE_CLIENT_ID</span>{" "}
          or <span className="font-mono">RESEND_API_KEY</span> in the
          environment.
        </div>
      ) : null}

      <div className="mt-6 text-center">
        <Link
          href="/"
          className="text-xs text-ink-faint hover:text-ink-muted transition-colors"
        >
          ← Back to zerocast.live
        </Link>
      </div>
    </ShellWrapper>
  );
}

function ShellWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface text-white flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 brand-glow-hero opacity-60" />
      <div className="relative w-full max-w-sm bg-surface-2 border border-white/8 rounded-2xl p-8">
        {children}
      </div>
    </div>
  );
}
