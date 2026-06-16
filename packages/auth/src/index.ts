import { createDb } from "@qianmo-family-insurance/db";
import * as schema from "@qianmo-family-insurance/db/schema/auth";
import { env } from "@qianmo-family-insurance/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

// 受信任来源：显式 CORS_ORIGIN（逗号分隔）+ AWS 默认域名通配（无自定义域名时）。
const trustedOrigins = [
  ...(env.CORS_ORIGIN ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  "https://*.cloudfront.net",
  "https://*.lambda-url.*.on.aws",
  "https://*.vercel.app",
];

export function createAuth() {
  const db = createDb();

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",

      schema: schema,
    }),
    trustedOrigins,
    emailAndPassword: {
      enabled: true,
    },
    session: {
      // 登录态保持 7 天，过期后需重新登录（PRD L-3）
      expiresIn: 60 * 60 * 24 * 7,
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: {
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
        httpOnly: true,
      },
    },
    plugins: [],
  });
}

export const auth = createAuth();
