import { env } from "@qianmo-family-insurance/env/web";

/**
 * 前端调用后端 API 的基础地址。
 *
 * 为解决「前端(Vercel)与后端(AWS Lambda)不同域 → 浏览器拦截第三方登录 Cookie」的问题，
 * 前端统一走**同源**：浏览器侧请求自己的域名（`/api/*`），再由 Next.js rewrite（见 next.config.ts）
 * 服务端代理到真正的后端。这样 Set-Cookie 落在前端域上，成为第一方 Cookie，登录态得以保持。
 *
 * - 浏览器：返回当前站点 origin（同源）。
 * - 服务端渲染（如 dashboard 的 getSession）：浏览器对象不存在，需绝对地址；
 *   Vercel 运行时用其自动注入的 VERCEL_URL，本地开发回落到 NEXT_PUBLIC_SERVER_URL。
 */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return env.NEXT_PUBLIC_SERVER_URL;
}
