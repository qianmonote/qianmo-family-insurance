import { auth } from "@qianmo-family-insurance/auth";
import { createMiddleware } from "hono/factory";

export type AuthVariables = {
  userId: string;
};

/**
 * 鉴权中间件：从 Better-Auth session 中解析当前用户，写入 c.var.userId。
 * 未登录返回统一响应格式 { code: 40003, data: null, message: "未登录或登录已过期" }。
 */
export const requireAuth = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session?.user) {
    return c.json({ code: 40003, data: null, message: "未登录或登录已过期" });
  }

  c.set("userId", session.user.id);
  await next();
});
