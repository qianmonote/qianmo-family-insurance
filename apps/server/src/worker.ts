import type { SQSBatchResponse, SQSEvent } from "aws-lambda";

import { processLinkSummaryTask } from "./services/link-summary/task-processor";

/**
 * SQS worker Lambda：消费视频类总结任务，串行处理。
 *
 * 通过返回 `batchItemFailures` 实现部分批次失败重试（需在 SQS 事件源映射上启用
 * ReportBatchItemFailures，SST 中通过 batch.partialResponses 配置）。
 * processLinkSummaryTask 内部已捕获业务异常并落库为 failed，这里仅对入参解析等
 * 基础设施级异常做重试。
 */
export async function handler(event: SQSEvent): Promise<SQSBatchResponse> {
  const batchItemFailures: { itemIdentifier: string }[] = [];

  for (const record of event.Records) {
    try {
      const { linkSummaryId } = JSON.parse(record.body) as { linkSummaryId: string };
      if (!linkSummaryId) {
        // 消息体非法，丢弃（不重试），避免毒丸消息反复占用队列。
        console.error("Invalid SQS message body, missing linkSummaryId:", record.body);
        continue;
      }
      await processLinkSummaryTask(linkSummaryId);
    } catch (error) {
      console.error("Failed to process SQS record", record.messageId, error);
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
}
