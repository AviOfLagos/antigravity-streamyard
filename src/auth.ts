import { PrismaAdapter } from "@auth/prisma-adapter"
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Resend from "next-auth/providers/resend"

import { authConfig } from "@/auth.config"
import { prisma } from "@/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),

  // JWT strategy is required when using both a database adapter AND Edge middleware.
  // Database sessions (the adapter default) can't be verified by the Edge middleware
  // because it has no Prisma access — causing every request to appear unauthenticated
  // and redirect back to /login in an infinite loop.
  // JWT sessions are verified entirely from the signed cookie — no DB round-trip needed.
  session: { strategy: "jwt" },

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "openid email profile",
          prompt: "select_account",
        },
      },
    }),
    // Resend email magic links — only registered when RESEND_API_KEY is set.
    // Free plan: onboarding@resend.dev only delivers to emails verified in your Resend account.
    // Production: set RESEND_FROM to a sender on a verified domain (resend.com/domains).
    ...(process.env.RESEND_API_KEY
      ? [Resend({ from: process.env.RESEND_FROM ?? "onboarding@resend.dev" })]
      : []),
  ],

  callbacks: {
    ...authConfig.callbacks,

    // Persist the user's database id into the JWT on first sign-in.
    jwt({ token, user }) {
      if (user?.id) token.id = user.id
      return token
    },

    // Expose the id from the JWT to the session object.
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string
      return session
    },
  },
})
