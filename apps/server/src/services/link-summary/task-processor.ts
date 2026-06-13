import { db } from "@qianmo-family-insurance/db";
import { linkSummary } from "@qianmo-family-insurance/db/schema/link-summary";
import { eq } from "drizzle-orm";

import { summarizeContent } from "./ai-summarizer";
import { getContentFetcher } from "./content-fetcher";

/**
 * 处理单个总结任务：抓取内容 -> AI 总结 -> 更新记录状态。
 * 任意一步失败均会将记录标记为 failed 并记录 errorMessage，不会抛出异常。
 */
export async function processLinkSummaryTask(linkSummaryId: string): Promise<void> {
  const [record] = await db
    .select()
    .from(linkSummary)
    .where(eq(linkSummary.id, linkSummaryId));

  if (!record) {
    return;
  }

  if (record.status !== "processing") {
    await db
      .update(linkSummary)
      .set({ status: "processing" })
      .where(eq(linkSummary.id, linkSummaryId));
  }

  try {
    const fetcher = getContentFetcher(record.sourceType);
    const content = await fetcher.fetch(record.sourceUrl);
    const summaryContent = await summarizeContent({
      ...content,
      userPrompt: record.userPrompt,
    });

    await db
      .update(linkSummary)
      .set({ status: "success", summaryContent, errorMessage: null })
      .where(eq(linkSummary.id, linkSummaryId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "处理失败，请稍后重试";
    await db
      .update(linkSummary)
      .set({ status: "failed", errorMessage: message })
      .where(eq(linkSummary.id, linkSummaryId));
  }
}
