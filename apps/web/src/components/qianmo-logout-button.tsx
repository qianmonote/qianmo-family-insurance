"use client";

import { LogOut } from "lucide-react";

import { useSignOut } from "@/hooks/use-sign-out";

/**
 * Stitch 新风格顶栏的退出按钮。抽成独立 client 组件，
 * 使 `QianmoTopNav` / `QianmoAppShell` 无需整体标记 "use client" 即可拥有可交互的退出能力。
 */
export function QianmoLogoutButton() {
  const { signOut, isSigningOut } = useSignOut();

  return (
    <button
      type="button"
      onClick={() => {
        void signOut();
      }}
      disabled={isSigningOut}
      className="hidden items-center gap-1.5 rounded-xl bg-[#003ec7] px-4 py-2 text-sm font-bold text-white transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:inline-flex"
    >
      <LogOut className="size-4" />
      {isSigningOut ? "退出中..." : "退出登录"}
    </button>
  );
}
