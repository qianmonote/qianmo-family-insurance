import { describe, expect, it } from "vitest";

import {
  buildAuthSwitchHref,
  DEFAULT_AUTH_REDIRECT,
  isSafeRedirect,
  resolveRedirectTarget,
} from "./auth-redirect";

describe("isSafeRedirect", () => {
  it("接受站内绝对路径", () => {
    expect(isSafeRedirect("/summary")).toBe(true);
    expect(isSafeRedirect("/summary/records?id=1")).toBe(true);
  });

  it("拒绝外部地址、协议相对地址与空值", () => {
    expect(isSafeRedirect("https://evil.com")).toBe(false);
    expect(isSafeRedirect("//evil.com")).toBe(false); // 协议相对地址 → 跨站跳转，拒绝
    expect(isSafeRedirect("/\\evil.com")).toBe(false); // 反斜杠变体，浏览器同样解析为跨站
    expect(isSafeRedirect("evil.com")).toBe(false);
    expect(isSafeRedirect(null)).toBe(false);
    expect(isSafeRedirect(undefined)).toBe(false);
    expect(isSafeRedirect("")).toBe(false);
  });
});

describe("resolveRedirectTarget（AC-F1：注册/登录成功跳转规则）", () => {
  it("合法 redirect 优先", () => {
    expect(resolveRedirectTarget("/summary")).toBe("/summary");
  });

  it("缺省或非法 redirect 回落 /summary", () => {
    expect(resolveRedirectTarget(null)).toBe(DEFAULT_AUTH_REDIRECT);
    expect(resolveRedirectTarget("https://evil.com")).toBe(DEFAULT_AUTH_REDIRECT);
    expect(resolveRedirectTarget("//evil.com")).toBe(DEFAULT_AUTH_REDIRECT);
    expect(resolveRedirectTarget("")).toBe("/summary");
  });
});

describe("buildAuthSwitchHref（AC-M3.3：login ↔ register 跳转透传 redirect）", () => {
  it("无 redirect 时返回纯基础路径", () => {
    expect(buildAuthSwitchHref("/register", null)).toBe("/register");
    expect(buildAuthSwitchHref("/login", undefined)).toBe("/login");
  });

  it("合法 redirect 时附加并编码 query", () => {
    expect(buildAuthSwitchHref("/register", "/summary")).toBe("/register?redirect=%2Fsummary");
    expect(buildAuthSwitchHref("/login", "/summary/records?id=1")).toBe(
      "/login?redirect=%2Fsummary%2Frecords%3Fid%3D1",
    );
  });

  it("非法 redirect 不附加 query", () => {
    expect(buildAuthSwitchHref("/register", "https://evil.com")).toBe("/register");
    expect(buildAuthSwitchHref("/register", "//evil.com")).toBe("/register");
  });
});
