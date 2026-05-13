/* Next.js native instrumentation hook. Captures server-side errors from
   App Router routes (render, API, server actions, middleware) and persists
   them via src/lib/errors.recordError. Viewable at /admin/errors. */

export function register() {
  // intentionally empty — no startup work
}

export async function onRequestError(
  error: { digest?: string } & Error,
  request: { path: string; method: string },
  context: {
    routerKind: "Pages Router" | "App Router"
    routePath: string
    routeType: "render" | "route" | "action" | "middleware"
  },
) {
  try {
    const { recordError } = await import("@/lib/errors")
    await recordError({
      side: "server",
      level: "error",
      message: error.message || "Unknown server error",
      stack: error.stack,
      url: request.path,
      context: {
        method: request.method,
        routeType: context.routeType,
        routePath: context.routePath,
        digest: error.digest,
      },
    })
  } catch {
    // fail open
  }
}
