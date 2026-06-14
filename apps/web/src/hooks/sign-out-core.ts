import { getAuthErrorMessage } from "@/lib/auth-error";

/** Better-Auth 错误对象中本编排关心的字段子集。 */
export interface SignOutErrorShape {
  code?: string | undefined;
  message?: string;
  statusText?: string;
}

/**
 * `runSignOut` 的依赖注入：把所有副作用收口为可替换的回调，
 * 使编排逻辑成为不依赖 React/Next/网络的纯函数，便于单测。
 */
export interface SignOutDeps {
  /** 调用 Better-Auth 退出，返回 `{ error }`（成功时 error 为 null/undefined）。 */
  signOut: () => Promise<{ error?: SignOutErrorShape | null }>;
  /** 清空查询缓存（退出后避免上一用户数据残留）。 */
  clearQueryCache: () => void;
  /** 跳转登录页。 */
  redirectToLogin: () => void;
  /** 失败提示。 */
  notifyError: (message: string) => void;
}

/**
 * 退出登录的编排核心：成功时**先清缓存再跳转**；失败时只提示、不跳转。
 * 纯逻辑，无 React 依赖，由 `useSignOut` 注入真实副作用。
 *
 * 失败有两种来源，均收口为 `notifyError` 且不跳转：
 * - `signOut()` resolve 后返回 `{ error }`（Better-Auth 的业务/鉴权错误）
 * - `signOut()` reject（网络层抛错等）——兜底捕获，避免未处理 rejection 与静默失败
 */
export async function runSignOut(deps: SignOutDeps): Promise<void> {
  let error: SignOutErrorShape | null | undefined;
  try {
    ({ error } = await deps.signOut());
  } catch (caught) {
    error = caught instanceof Error ? { message: caught.message } : {};
  }
  if (error) {
    deps.notifyError(getAuthErrorMessage(error));
    return;
  }
  // 顺序要求：先清空缓存，再导航，确保跳转后不会有旧用户数据残留。
  deps.clearQueryCache();
  deps.redirectToLogin();
}
