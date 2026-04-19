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
    // Omitting it entirely prevents NextAuth from crashing on init when the key is absent.
    // From address: use RESEND_FROM env var (must be a Resend-verified domain).
    // Until a custom domain is verified, onboarding@resend.dev works for testing
    // (Resend's own verified sender — free plan only delivers to your own account email).
    ...(process.env.RESEND_API_KEY
      ? [Resend({ from: process.env.RESEND_FROM ?? "onboarding@resend.dev" })]
      : []),
  ],
  callbacks: {
    ...authConfig.callbacks,
    session({ session, user }) {
      session.user.id = user.id
      return session
    },
  },
})
