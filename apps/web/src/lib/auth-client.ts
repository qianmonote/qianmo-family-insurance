import { createAuthClient } from "better-auth/react";

import { getApiBaseUrl } from "./api-base";

// 同源（经 next.config.ts 的 /api/* rewrite 代理到后端），保证登录 Cookie 为第一方。
export const authClient = createAuthClient({
  baseURL: getApiBaseUrl(),
});
