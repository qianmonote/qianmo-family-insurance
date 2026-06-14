import type { LinkSummarySourceType } from "@qianmo-family-insurance/db/schema/link-summary";
import { Agent } from "undici";

import { resolveSafeAddress } from "./ssrf-guard";

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
// 限制最大跳转次数，避免重定向循环
const MAX_REDIRECTS = 5;

/**
 * 创建一个将指定 hostname 的连接"钉住"到 `address` 的 dispatcher。
 *
 * 用于消除 SSRF 校验与实际网络连接之间的 TOCTOU/DNS rebinding 窗口：
 * `resolveSafeAddress` 校验通过后返回的 IP 会通过此 dispatcher 直接用于建立连接，
 * fetch 不会再对 hostname 重新发起 DNS 解析。TLS SNI/Host 头仍使用原始 hostname。
 */
function createPinnedDispatcher(hostname: string, address: string, family: 4 | 6): Agent {
  return new Agent({
    connect: {
      // `lookup` 遵循 `dns.lookup` 回调约定：当 `options.all` 为真时返回数组形式，
      // 否则返回单个 `(err, address, family)`。两种形式都需支持。
      lookup: (lookupHostname, options, callback) => {
        if (lookupHostname.toLowerCase() !== hostname) {
          callback(
            new Error(`unexpected hostname for pinned connection: ${lookupHostname}`),
            // biome-ignore lint/suspicious/noExplicitAny: 错误分支的返回值类型不影响调用方
            null as any,
            undefined as any,
          );
          return;
        }
        if (options?.all) {
          callback(null, [{ address, family }]);
        } else {
          callback(null, address, family);
        }
      },
    },
  });
}

/**
 * 公开免费网站文章抓取：真实 fetch + HTML 解析。
 */
export class PublicArticleFetcher implements ContentFetcher {
  async fetch(rawUrl: string): Promise<FetchedContent> {
    let url = new URL(rawUrl);

    let html: string;
    let finalUrl = url;
    for (let redirectCount = 0; ; redirectCount++) {
      const { address, family } = await resolveSafeAddress(url);
      const dispatcher = createPinnedDispatcher(url.hostname.toLowerCase(), address, family);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      let response: Response;
      try {
        try {
          response = await fetch(url, {
            signal: controller.signal,
            headers: { "user-agent": "Mozilla/5.0 (compatible; QianmoLinkSummaryBot/1.0)" },
            redirect: "manual",
            // @ts-expect-error -- dispatcher is a Node/undici fetch extension not in the lib.dom types
            dispatcher,
          });
        } finally {
          clearTimeout(timeout);
        }

        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get("location");
          // 重定向响应体未被消费，主动取消以便 dispatcher 可以正常关闭
          await response.body?.cancel();
          if (!location) {
            throw new Error(`抓取失败，重定向缺少 Location 头（HTTP ${response.status}）`);
          }
          if (redirectCount >= MAX_REDIRECTS) {
            throw new Error("抓取失败，重定向次数过多");
          }
          // 每一跳重定向都需重新校验，避免跳转到内网地址（SSRF）
          url = new URL(location, url);
          continue;
        }

        if (!response.ok) {
          await response.body?.cancel();
          throw new Error(`抓取失败，HTTP 状态码 ${response.status}`);
        }

        finalUrl = url;
        html = await response.text();
        break;
      } finally {
        // fetch() 在响应头到达时即 resolve，需等响应体被消费/取消后才能安全关闭 dispatcher
        await dispatcher.close();
      }
    }

    return {
      title: extractTitle(html),
      text: extractText(html),
      images: extractImages(html, finalUrl).slice(0, MAX_IMAGES),
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
