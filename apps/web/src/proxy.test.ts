import { describe, expect, it } from "vitest";

import {
  buildLoginRedirectPath,
  getAuthenticatedAuthPageRedirectPath,
  isPublicPath,
  PUBLIC_PATHS,
} from "./proxy";

describe("proxy auth route helpers（AC-F1/F2）", () => {
  it("仅登录和注册页属于公开认证页", () => {
    expect(PUBLIC_PATHS).toEqual(["/login", "/register"]);
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/register")).toBe(true);
    expect(isPublicPath("/summary")).toBe(false);
    expect(isPublicPath("/dashboard")).toBe(false);
  });

  it("已登录用户访问公开认证页时跳转到 /summary", () => {
    expect(getAuthenticatedAuthPageRedirectPath()).toBe("/summary");
  });

  it("未登录用户访问受保护路径时构造登录 redirect", () => {
    expect(buildLoginRedirectPath("/summary")).toBe("/login?redirect=%2Fsummary");
    expect(buildLoginRedirectPath("/summary/records")).toBe("/login?redirect=%2Fsummary%2Frecords");
  });
});
