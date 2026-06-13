import { db } from "@qianmo-family-insurance/db";
import { linkSummary } from "@qianmo-family-insurance/db/schema/link-summary";
import { eq } from "drizzle-orm";

import { processLinkSummaryTask } from "./task-processor";

/**
 * 进程内内存任务队列：视频类总结任务串行处理，避免并发调用 AI 超限。
 * 已知限制：仅适用于单进程部署；进程重启会清空队列（启动时会重新扫描 processing 记录恢复）。
 */
const queue: string[] = [];
let isProcessing = false;

export function enqueueLinkSummaryTask(linkSummaryId: string): void {
  queue.push(linkSummaryId);
  void runQueue();
}

async function runQueue(): Promise<void> {
  if (isProcessing) return;
  isProcessing = true;

  try {
    let nextId = queue.shift();
    while (nextId) {
      await processLinkSummaryTask(nextId);
      nextId = queue.shift();
    }
  } finally {
    isProcessing = false;
  }
}

/**
 * 服务启动时调用：将所有仍处于 processing 状态的记录重新加入队列，
 * 避免进程重启导致任务永久卡在 processing。
 */
export async function recoverPendingLinkSummaryTasks(): Promise<void> {
  const stuckRecords = await db
    .select({ id: linkSummary.id })
    .from(linkSummary)
    .where(eq(linkSummary.status, "processing"));

  for (const record of stuckRecords) {
    enqueueLinkSummaryTask(record.id);
  }
}
