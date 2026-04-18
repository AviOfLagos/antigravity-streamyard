import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

/**
 * Lightweight auth config used by the Edge middleware.
 * Must NOT import Prisma or any Node.js-only modules.
 */
export const authConfig = {
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const protectedPaths = ["/dashboard", "/settings", "/studio", "/session-summary"]
      const isProtected = protectedPaths.some((p) =>
        nextUrl.pathname.startsWith(p)
      )
      if (isProtected && !isLoggedIn) return false
      return true
    },
  },
} satisfies NextAuthConfig
