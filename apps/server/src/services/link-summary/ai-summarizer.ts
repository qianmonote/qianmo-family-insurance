import Anthropic from "@anthropic-ai/sdk";
import { env } from "@qianmo-family-insurance/env/server";

import type { FetchedContent } from "./content-fetcher";

const MODEL = "claude-sonnet-4-6";

export interface SummarizeInput extends FetchedContent {
  userPrompt?: string | null;
}

const SYSTEM_PROMPT =
  "你是一个内容总结助手。根据用户提供的文章/视频标题与正文内容，生成结构化的中文总结，" +
  "使用 Markdown 要点列表（- 开头）呈现核心信息，重点突出关键结论、数据与可执行信息，避免冗余描述。";

/**
 * 调用 Claude 生成结构化总结。失败时抛出错误，由调用方写入 errorMessage。
 */
export async function summarizeContent(input: SummarizeInput): Promise<string> {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error("AI 总结生成失败：请先配置 ANTHROPIC_API_KEY");
  }

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const userPromptSection = input.userPrompt
    ? `\n\n用户的定制化要求：${input.userPrompt}`
    : "";

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content:
          `标题：${input.title}\n\n正文内容：\n${input.text}${userPromptSection}\n\n` +
          "请基于以上内容生成结构化要点总结。",
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text" || !textBlock.text.trim()) {
    throw new Error("AI 总结生成失败：返回内容为空");
  }

  return textBlock.text.trim();
}
