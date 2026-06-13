import type { LinkSummarySourceType } from "@qianmo-family-insurance/db/schema/link-summary";

import { assertUrlIsSafeToFetch } from "./ssrf-guard";

export interface FetchedContent {
  title: string;
  text: string;
  images?: string[];
}

export interface ContentFetcher {
  fetch(url: string): Promise<FetchedContent>;
}

const MAX_IMAGES = 10;
const FETCH_TIMEOUT_MS = 15000;
// 限制正文长度，避免超长页面占用过多 AI 上下文
const MAX_TEXT_LENGTH = 8000;

/**
 * 公开免费网站文章抓取：真实 fetch + HTML 解析。
 */
export class PublicArticleFetcher implements ContentFetcher {
  async fetch(rawUrl: string): Promise<FetchedContent> {
    const url = new URL(rawUrl);
    await assertUrlIsSafeToFetch(url);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let html: string;
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { "user-agent": "Mozilla/5.0 (compatible; QianmoLinkSummaryBot/1.0)" },
        redirect: "follow",
      });
      if (!response.ok) {
        throw new Error(`抓取失败，HTTP 状态码 ${response.status}`);
      }
      html = await response.text();
    } finally {
      clearTimeout(timeout);
    }

    return {
      title: extractTitle(html),
      text: extractText(html),
      images: extractImages(html, url).slice(0, MAX_IMAGES),
    };
  }
}

/**
 * 公众号文章 / 小红书图文 / 小红书视频 / 抖音视频 / B站视频的占位抓取实现。
 * 本期暂未接入真实第三方解析服务，返回固定结构的占位内容，
 * 仅用于验证"识别 -> 抓取 -> AI总结"链路；后续可替换为真实实现而不影响调用方。
 */
export class MockPlatformFetcher implements ContentFetcher {
  constructor(private readonly platformLabel: string) {}

  async fetch(url: string): Promise<FetchedContent> {
    return {
      title: `[mock] ${this.platformLabel}内容标题`,
      text:
        `[mock] 该${this.platformLabel}内容抓取暂未接入真实第三方服务，以下为占位文本用于演示总结流程。\n` +
        `原始链接：${url}`,
      images: [],
    };
  }
}

const PLATFORM_LABELS: Record<LinkSummarySourceType, string> = {
  wechat_article: "微信公众号文章",
  xiaohongshu_image: "小红书图文",
  xiaohongshu_video: "小红书视频",
  douyin_video: "抖音视频",
  bilibili_video: "B站视频",
  public_article: "",
};

export function getContentFetcher(sourceType: LinkSummarySourceType): ContentFetcher {
  if (sourceType === "public_article") {
    return new PublicArticleFetcher();
  }
  return new MockPlatformFetcher(PLATFORM_LABELS[sourceType]);
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match?.[1]?.trim() || "未知标题";
}

function extractText(html: string): string {
  const withoutNoise = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  const text = withoutNoise
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();

  return text.slice(0, MAX_TEXT_LENGTH);
}

function extractImages(html: string, baseUrl: URL): string[] {
  const images: string[] = [];
  const regex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const src = match[1];
    if (!src) continue;
    try {
      images.push(new URL(src, baseUrl).toString());
    } catch {
      // 忽略无法解析的图片地址
    }
  }
  return images;
}
