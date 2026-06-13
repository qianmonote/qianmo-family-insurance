import type { LinkSummarySourceType } from "@qianmo-family-insurance/db/schema/link-summary";

/**
 * 视频类 sourceType（决定异步任务流程）
 */
export const VIDEO_SOURCE_TYPES: LinkSummarySourceType[] = [
  "xiaohongshu_video",
  "douyin_video",
  "bilibili_video",
];

/**
 * 图文类 sourceType（决定同步处理流程）
 */
export const IMAGE_TEXT_SOURCE_TYPES: LinkSummarySourceType[] = [
  "wechat_article",
  "xiaohongshu_image",
  "public_article",
];

export function isVideoSourceType(sourceType: LinkSummarySourceType): boolean {
  return VIDEO_SOURCE_TYPES.includes(sourceType);
}

/**
 * 根据 URL 识别链接的来源类型。
 * 返回 null 表示链接非法或不在支持范围内（提示"暂不支持该链接类型"）。
 */
export function detectSourceType(rawUrl: string): LinkSummarySourceType | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null;
  }

  const host = url.hostname.toLowerCase();

  if (host.endsWith("mp.weixin.qq.com") || host === "weixin.qq.com") {
    return "wechat_article";
  }

  if (host.endsWith("xiaohongshu.com") || host.endsWith("xhslink.com")) {
    // mock 阶段无法区分图文/视频，path 含 /video/ 视为视频，否则按图文处理
    return url.pathname.includes("/video/") ? "xiaohongshu_video" : "xiaohongshu_image";
  }

  if (host.endsWith("douyin.com") || host.endsWith("iesdouyin.com")) {
    return "douyin_video";
  }

  if (host.endsWith("bilibili.com") || host.endsWith("b23.tv")) {
    return "bilibili_video";
  }

  // 兜底：公开网站文章
  return "public_article";
}
