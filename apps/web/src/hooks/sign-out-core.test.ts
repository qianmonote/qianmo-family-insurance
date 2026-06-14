import { describe, expect, it, vi } from "vitest";

import { runSignOut, type SignOutDeps } from "./sign-out-core";

function makeDeps(overrides: Partial<SignOutDeps> = {}) {
  return {
    signOut: vi.fn(async () => ({ error: null })),
    clearQueryCache: vi.fn(),
    redirectToLogin: vi.fn(),
    notifyError: vi.fn(),
    ...overrides,
  } satisfies SignOutDeps;
}

describe("runSignOut", () => {
  it("成功时清空缓存并跳转登录页，不提示错误", async () => {
    const deps = makeDeps();

    await runSignOut(deps);

    expect(deps.clearQueryCache).toHaveBeenCalledOnce();
    expect(deps.redirectToLogin).toHaveBeenCalledOnce();
    expect(deps.notifyError).not.toHaveBeenCalled();
  });

  it("成功时顺序为「先清缓存、后跳转」", async () => {
    const calls: string[] = [];
    const deps = makeDeps({
      clearQueryCache: vi.fn(() => calls.push("clear")),
      redirectToLogin: vi.fn(() => calls.push("redirect")),
    });

    await runSignOut(deps);

    expect(calls).toEqual(["clear", "redirect"]);
  });

  it("失败时提示映射后的中文文案，且不清缓存、不跳转", async () => {
    const deps = makeDeps({
      signOut: vi.fn(async () => ({ error: { code: "INVALID_EMAIL_OR_PASSWORD" } })),
    });

    await runSignOut(deps);

    expect(deps.notifyError).toHaveBeenCalledWith("邮箱或密码不正确");
    expect(deps.clearQueryCache).not.toHaveBeenCalled();
    expect(deps.redirectToLogin).not.toHaveBeenCalled();
  });

  it("失败但无错误码时回退到 message 文案", async () => {
    const deps = makeDeps({
      signOut: vi.fn(async () => ({ error: { message: "服务暂时不可用" } })),
    });

    await runSignOut(deps);

    expect(deps.notifyError).toHaveBeenCalledWith("服务暂时不可用");
  });

  it("无 code/message 时回退到 statusText", async () => {
    const deps = makeDeps({
      signOut: vi.fn(async () => ({ error: { statusText: "Bad Gateway" } })),
    });

    await runSignOut(deps);

    expect(deps.notifyError).toHaveBeenCalledWith("Bad Gateway");
  });

  it("signOut reject（网络层抛错）兜底提示，不清缓存、不跳转", async () => {
    const deps = makeDeps({
      signOut: vi.fn(async () => {
        throw new Error("Network down");
      }),
    });

    await runSignOut(deps);

    expect(deps.notifyError).toHaveBeenCalledWith("Network down");
    expect(deps.clearQueryCache).not.toHaveBeenCalled();
    expect(deps.redirectToLogin).not.toHaveBeenCalled();
  });

  it("成功路径只调用一次 signOut", async () => {
    const deps = makeDeps();

    await runSignOut(deps);

    expect(deps.signOut).toHaveBeenCalledOnce();
  });
});
