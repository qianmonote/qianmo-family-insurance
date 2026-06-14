import { db } from "@qianmo-family-insurance/db";
import { linkSummary } from "@qianmo-family-insurance/db/schema/link-summary";
import { eq } from "drizzle-orm";

import { processLinkSummaryTask } from "./task-processor";

/**
 * 视频类总结任务的入队抽象，按运行环境切换实现：
 *
 * - **AWS Lambda（生产）**：设置了 `VIDEO_QUEUE_URL` 环境变量时，把任务投递到 SQS，
 *   由独立的 worker Lambda（src/worker.ts）消费处理。Lambda 在返回响应后会冻结执行环境，
 *   进程内队列的后台处理不会被执行，因此异步任务必须外置到 SQS。
 * - **本地单进程（开发）**：未设置 `VIDEO_QUEUE_URL` 时，回退到进程内内存队列，
 *   串行处理，避免并发调用 AI 超限。进程重启会清空队列（启动时扫描 processing 记录恢复）。
 */

const queueUrl = process.env.VIDEO_QUEUE_URL;

// ---- 进程内内存队列（本地开发回退实现）----
const queue: string[] = [];
let isProcessing = false;

function enqueueInMemory(linkSummaryId: string): void {
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

// ---- SQS 实现（生产）----
async function enqueueToSqs(linkSummaryId: string): Promise<void> {
  // 动态导入，避免本地开发未安装/未使用 SQS 时引入额外冷启动成本。
  const { SQSClient, SendMessageCommand } = await import("@aws-sdk/client-sqs");
  const client = new SQSClient({});
  await client.send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify({ linkSummaryId }),
    }),
  );
}

export function enqueueLinkSummaryTask(linkSummaryId: string): void {
  if (queueUrl) {
    void enqueueToSqs(linkSummaryId).catch(async (error) => {
      // 入队失败时把记录标记为 failed，避免永久卡在 processing。
      const message = error instanceof Error ? error.message : "任务入队失败";
      await db
        .update(linkSummary)
        .set({ status: "failed", errorMessage: message })
        .where(eq(linkSummary.id, linkSummaryId));
    });
    return;
  }

  enqueueInMemory(linkSummaryId);
}

/**
 * 服务启动时调用：将所有仍处于 processing 状态的记录重新加入队列，
 * 避免进程重启导致任务永久卡在 processing。
 * 仅本地单进程场景使用；Lambda 环境如需补偿，应改由定时任务扫描后重新投递 SQS。
 */
export async function recoverPendingLinkSummaryTasks(): Promise<void> {
  try {
    const stuckRecords = await db
      .select({ id: linkSummary.id })
      .from(linkSummary)
      .where(eq(linkSummary.status, "processing"));

    for (const record of stuckRecords) {
      enqueueLinkSummaryTask(record.id);
    }
  } catch (error) {
    // 启动时的任务恢复属于尽力而为：数据库暂不可达（如本地未执行 pnpm db:start）时，
    // 仅告警，不让未处理的 Promise rejection 拖垮整个服务进程。
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[link-summary] 启动恢复 processing 任务失败，已跳过：${message}`);
  }
}
