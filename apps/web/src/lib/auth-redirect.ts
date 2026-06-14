/**
 * 认证页（登录 / 注册）共享的跳转地址计算逻辑。
 * 抽成纯函数便于单元测试，避免在组件内重复实现 redirect 规则。
 */

/** 默认登录/注册成功后的落地页 */
export const DEFAULT_AUTH_REDIRECT = "/summary";

/**
 * 仅接受站内绝对路径作为 redirect，防止开放重定向到外部地址。
 * 必须以单个 "/" 开头，且排除协议相对地址（"//evil.com"、"/\\evil.com"），
 * 否则浏览器会将其解析为跨站跳转。
 */
export function isSafeRedirect(redirect: string | null | undefined): redirect is string {
  if (typeof redirect !== "string" || !redirect.startsWith("/")) {
    return false;
  }
  // 第二个字符为 "/" 或 "\\" 时即为协议相对地址，拒绝
  return redirect[1] !== "/" && redirect[1] !== "\\";
}

/**
 * 登录/注册成功后的跳转目标：合法 redirect 优先，否则回落到 /summary。
 */
export function resolveRedirectTarget(redirect: string | null | undefined): string {
  return isSafeRedirect(redirect) ? redirect : DEFAULT_AUTH_REDIRECT;
}

/**
 * 在登录 ↔ 注册之间切换时构造目标地址，并透传合法的 redirect 查询参数。
 * @param base 目标认证页路径，如 "/login" 或 "/register"
 */
export function buildAuthSwitchHref(base: string, redirect: string | null | undefined): string {
  return isSafeRedirect(redirect) ? `${base}?redirect=${encodeURIComponent(redirect)}` : base;
}
