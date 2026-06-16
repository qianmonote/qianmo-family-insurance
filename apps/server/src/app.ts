import { auth } from "@qianmo-family-insurance/auth";
import { env } from "@qianmo-family-insurance/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { linkSummariesRouter } from "./routes/link-summaries";

// 显式允许的前端来源（来自 CORS_ORIGIN，支持逗号分隔多个）。
const explicitOrigins = (env.CORS_ORIGIN ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// 内置来源模式：本地开发 + AWS 默认域名（无自定义域名时 CloudFront / Lambda Function URL）。
const allowedOriginPatterns = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https:\/\/[a-z0-9-]+\.cloudfront\.net$/,
  /^https:\/\/[a-z0-9-]+\.lambda-url\.[a-z0-9-]+\.on\.aws$/,
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/,
];

/**
 * 校验请求 Origin 是否允许；允许则反射该 Origin（携带 Cookie 凭证要求不能用通配符 *）。
 */
function resolveCorsOrigin(origin: string): string | undefined {
  if (explicitOrigins.includes(origin)) return origin;
  if (allowedOriginPatterns.some((re) => re.test(origin))) return origin;
  return undefined;
}

/**
 * 构建 Hono 应用实例。
 * 抽离为独立模块，供本地 node-server（src/index.ts）与 AWS Lambda（src/lambda.ts）共用，
 * 避免在导入时产生监听端口等副作用。
 */
export function createApp() {
  const app = new Hono();

  app.use(logger());
  app.use(
    "/*",
    cors({
      origin: (origin) => resolveCorsOrigin(origin),
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  );

  app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

  app.route("/api/link-summaries", linkSummariesRouter);

  app.get("/", (c) => {
    return c.text("OK");
  });

  return app;
}

export const app = createApp();
