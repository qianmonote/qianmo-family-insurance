"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

import { runSignOut } from "./sign-out-core";

/**
 * 统一的退出登录逻辑（任务 L-17 / L-18）：
 * - 调用 Better-Auth 的 `authClient.signOut` 清除服务端 session 与本地 cookie
 * - 成功后清空 TanStack Query 缓存，避免上一用户的受保护数据残留在内存中被下一用户看到
 * - 成功后跳转 `/login`（用 `replace` 防止用户回退到已退出的受保护页面）
 * - 失败时通过 toast 给出统一中文提示，不静默吞错
 *
 * 实际的「成功清缓存→跳转 / 失败提示」编排在纯函数 `runSignOut` 中（见 sign-out-core.ts），
 * 本 hook 仅负责注入 React/Next 副作用与防重入锁，便于对核心逻辑做单测。
 *
 * 旧版 Header 的 `UserMenu` 与 Stitch 新风格的 `QianmoTopNav` 共用此 hook，保证退出行为一致。
 */
export function useSignOut() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSigningOut, setIsSigningOut] = useState(false);
  // 同步锁：state 更新是异步的，连续快速点击可能在 re-render 前重复进入；用 ref 保证幂等。
  const inFlightRef = useRef(false);

  async function signOut() {
    if (inFlightRef.current) {
      return;
    }
    inFlightRef.current = true;
    setIsSigningOut(true);
    try {
      await runSignOut({
        signOut: async () => {
          const { error } = await authClient.signOut();
          return { error };
        },
        clearQueryCache: () => queryClient.clear(),
        redirectToLogin: () => router.replace("/login"),
        notifyError: (message) => toast.error(message),
      });
    } finally {
      inFlightRef.current = false;
      setIsSigningOut(false);
    }
  }

  return { signOut, isSigningOut };
}
