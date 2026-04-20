import { Prisma, PrismaClient } from "@prisma/client"

const RETRYABLE_CODES = new Set(["P1001", "P1002", "P1008", "P1017"])
const MAX_RETRIES = 3
const BASE_DELAY_MS = 500

function isRetryable(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return RETRYABLE_CODES.has(error.code)
  }
  if (error instanceof Error && error.message.includes("Can't reach database server")) {
    return true
  }
  return false
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function withRetry(client: PrismaClient): PrismaClient {
  return client.$extends({
    query: {
      async $allOperations({ args, query }) {
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
          try {
            return await query(args)
          } catch (error) {
            if (attempt < MAX_RETRIES - 1 && isRetryable(error)) {
              const delay = BASE_DELAY_MS * Math.pow(2, attempt)
              console.warn(
                `[Prisma] Retryable error (attempt ${attempt + 1}/${MAX_RETRIES}), retrying in ${delay}ms...`,
                error instanceof Error ? error.message : error,
              )
              await sleep(delay)
              continue
            }
            throw error
          }
        }
        throw new Error("Prisma retry exhausted")
      },
    },
  }) as unknown as PrismaClient
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createClient(): PrismaClient {
  const base = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })
  return withRetry(base)
}

export const prisma = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
