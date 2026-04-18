import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"

// Use the lightweight edge-compatible auth config in middleware.
// The full auth.ts (with PrismaAdapter) is only used in API routes / server components.
export default NextAuth(authConfig).auth

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
