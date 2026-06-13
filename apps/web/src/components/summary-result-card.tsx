import type { LinkSummary } from "@qianmo-family-insurance/db/schema/link-summary";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@qianmo-family-insurance/ui/components/card";

import { SOURCE_TYPE_LABELS, STATUS_LABELS } from "@/lib/link-summary-format";

export default function SummaryResultCard({ item }: { item: LinkSummary }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>总结结果</CardTitle>
        <CardDescription className="space-y-1">
          <div>
            来源链接：
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="break-all text-primary underline"
            >
              {item.sourceUrl}
            </a>
          </div>
          <div>链接类型：{SOURCE_TYPE_LABELS[item.sourceType]}</div>
          <div>状态：{STATUS_LABELS[item.status]}</div>
          <div>生成时间：{new Date(item.updatedAt).toLocaleString()}</div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {item.status === "success" && item.summaryContent && (
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {item.summaryContent}
          </div>
        )}
        {item.status === "failed" && (
          <p className="text-sm text-destructive">
            生成失败：{item.errorMessage ?? "未知错误，请重试"}
          </p>
        )}
        {(item.status === "pending" || item.status === "processing") && (
          <p className="text-sm text-muted-foreground">
            正在处理中，可关闭页面，处理完成后将在记录中展示结果。
          </p>
        )}
      </CardContent>
    </Card>
  );
}
