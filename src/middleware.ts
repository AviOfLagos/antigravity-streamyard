import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const protectedPaths = ["/dashboard", "/settings", "/studio"]
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p))

  if (isProtected && !req.auth) {
    return NextResponse.redirect(new URL("/login", req.url))
  }
  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
