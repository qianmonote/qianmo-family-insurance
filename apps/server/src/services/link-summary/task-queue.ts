import { db } from "@qianmo-family-insurance/db";
import { linkSummary } from "@qianmo-family-insurance/db/schema/link-summary";
import { eq } from "drizzle-orm";

import { processLinkSummaryTask } from "./task-processor";

/**
 * 所有来源类型（含视频类占位抓取）均由 API 请求内同步处理（见 routes/link-summaries.ts）。
 * 视频类抓取当前为 mock，瞬时返回，Lambda 5min 超时足够，故不再引入 SQS + worker 异步设施。
 * 后续接入真实长耗时视频解析时，再恢复异步队列（参见 git 历史中的 SQS 实现）。
 *
 * 本地开发入口（src/index.ts）启动时调用本函数：把仍处于 processing 状态的记录重新处理，
 * 避免进程在处理中途重启导致任务永久卡在 processing。生产同步处理无需此恢复。
 */
export async function recoverPendingLinkSummaryTasks(): Promise<void> {
  try {
    const stuckRecords = await db
      .select({ id: linkSummary.id })
      .from(linkSummary)
      .where(eq(linkSummary.status, "processing"));

    for (const record of stuckRecords) {
      await processLinkSummaryTask(record.id);
    }
  } catch (error) {
    // 启动时的任务恢复属于尽力而为：数据库暂不可达（如本地未执行 pnpm db:start）时，
    // 仅告警，不让未处理的 Promise rejection 拖垮整个服务进程。
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[link-summary] 启动恢复 processing 任务失败，已跳过：${message}`);
  }
}
