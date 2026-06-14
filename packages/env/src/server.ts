import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    // 部署到 AWS 默认 URL（Function URL）时不预先可知，留空则由 Better-Auth 从请求推断 baseURL。
    BETTER_AUTH_URL: z.url().optional(),
    // 允许的前端来源：单个 URL 或逗号分隔的多个 URL；留空则仅按内置模式（localhost/cloudfront/lambda-url）反射校验。
    CORS_ORIGIN: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().min(1).optional(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
