import type { LinkSummarySourceType, LinkSummaryStatus } from "@qianmo-family-insurance/db/schema/link-summary";

export const SOURCE_TYPE_LABELS: Record<LinkSummarySourceType, string> = {
  wechat_article: "微信公众号文章",
  xiaohongshu_image: "小红书图文",
  xiaohongshu_video: "小红书视频",
  douyin_video: "抖音视频",
  bilibili_video: "B站视频",
  public_article: "公开网站文章",
};

export const STATUS_LABELS: Record<LinkSummaryStatus, string> = {
  pending: "等待中",
  processing: "处理中",
  success: "成功",
  failed: "失败",
};
