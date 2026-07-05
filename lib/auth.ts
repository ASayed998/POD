import { betterAuth } from "better-auth"
import { pool } from "@/lib/db"

const secret = process.env.BETTER_AUTH_SECRET
if (!secret) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "BETTER_AUTH_SECRET environment variable is required. Set it in your Vercel project settings."
    )
  }
  console.warn(
    "[dev] BETTER_AUTH_SECRET not set, using insecure placeholder for development only"
  )
}

export const auth = betterAuth({
  secret: secret || "development-placeholder-insecure",
  database: pool,
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  trustedOrigins: [
    // v0 preview iframe runs on a per-session *.vusercontent.net subdomain
    "https://*.vusercontent.net",
    // Vercel preview deployments
    "https://*.vercel.app",
    ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
    ...(process.env.NODE_ENV === "development"
      ? ["http://localhost:3000", "http://127.0.0.1:3000"]
      : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  ...(process.env.NODE_ENV === "development"
    ? {
        advanced: {
          defaultCookieAttributes: {
            sameSite: "none" as const,
            secure: true,
          },
        },
      }
    : {}),
})
