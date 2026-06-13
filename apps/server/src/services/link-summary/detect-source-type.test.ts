import { describe, expect, it } from "vitest";

import { detectSourceType, isVideoSourceType } from "./detect-source-type";

describe("detectSourceType", () => {
  it("识别微信公众号文章", () => {
    expect(detectSourceType("https://mp.weixin.qq.com/s/abc123")).toBe("wechat_article");
  });

  it("识别小红书图文（默认）", () => {
    expect(detectSourceType("https://www.xiaohongshu.com/explore/abc123")).toBe(
      "xiaohongshu_image",
    );
  });

  it("识别小红书视频（path 含 /video/）", () => {
    expect(detectSourceType("https://www.xiaohongshu.com/video/abc123")).toBe(
      "xiaohongshu_video",
    );
  });

  it("识别抖音视频", () => {
    expect(detectSourceType("https://www.douyin.com/video/123456")).toBe("douyin_video");
  });

  it("识别B站视频", () => {
    expect(detectSourceType("https://www.bilibili.com/video/BV1xx411c7mD")).toBe(
      "bilibili_video",
    );
    expect(detectSourceType("https://b23.tv/abc123")).toBe("bilibili_video");
  });

  it("兜底识别为公开网站文章", () => {
    expect(detectSourceType("https://example.com/article/123")).toBe("public_article");
  });

  it("非法 URL 返回 null", () => {
    expect(detectSourceType("not-a-url")).toBeNull();
  });

  it("非 http(s) 协议返回 null", () => {
    expect(detectSourceType("ftp://example.com/file")).toBeNull();
    expect(detectSourceType("javascript:alert(1)")).toBeNull();
  });

  it("仿冒域名（前缀匹配）不应被误判为对应平台", () => {
    expect(detectSourceType("https://evilxiaohongshu.com/explore/abc")).toBe("public_article");
    expect(detectSourceType("https://notbilibili.com/video/BV1xx")).toBe("public_article");
  });
});

describe("isVideoSourceType", () => {
  it("视频类 sourceType 返回 true", () => {
    expect(isVideoSourceType("douyin_video")).toBe(true);
    expect(isVideoSourceType("bilibili_video")).toBe(true);
    expect(isVideoSourceType("xiaohongshu_video")).toBe(true);
  });

  it("图文类 sourceType 返回 false", () => {
    expect(isVideoSourceType("wechat_article")).toBe(false);
    expect(isVideoSourceType("xiaohongshu_image")).toBe(false);
    expect(isVideoSourceType("public_article")).toBe(false);
  });
});
