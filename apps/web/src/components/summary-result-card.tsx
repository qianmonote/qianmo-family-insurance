import type { LinkSummary } from "@qianmo-family-insurance/db/schema/link-summary";
import { AlertCircle, CheckCircle2, Clock, ExternalLink, FileText, LinkIcon } from "lucide-react";

import { SOURCE_TYPE_LABELS, STATUS_LABELS } from "@/lib/link-summary-format";

export default function SummaryResultCard({ item }: { item: LinkSummary }) {
  return (
    <article className="overflow-hidden rounded-xl border border-[#c3c5d9]/40 bg-white shadow-sm">
      <header className="border-b border-[#c3c5d9]/30 bg-[#eff4ff]/70 p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#0052ff] text-white">
            <FileText className="size-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#0b1c30]">总结结果</h2>
            <p className="text-sm text-[#434656]">AI Generated · {STATUS_LABELS[item.status]}</p>
          </div>
        </div>
        <div className="grid gap-3 text-sm text-[#434656] md:grid-cols-2">
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-w-0 items-center gap-2 rounded-full bg-white px-3 py-2 font-medium text-[#003ec7] underline underline-offset-4"
          >
            <LinkIcon className="size-4 shrink-0" />
            <span className="truncate">{item.sourceUrl}</span>
            <ExternalLink className="size-4 shrink-0" />
          </a>
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 font-medium">
            <CheckCircle2 className="size-4 text-[#006c44]" />
            {SOURCE_TYPE_LABELS[item.sourceType]}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 font-medium">
            <Clock className="size-4 text-[#003ec7]" />
            {new Date(item.updatedAt).toLocaleString()}
          </div>
        </div>
      </header>
      <div className="p-6">
        {item.status === "success" && item.summaryContent && (
          <div className="whitespace-pre-wrap text-base leading-8 text-[#0b1c30]">
            {item.summaryContent}
          </div>
        )}
        {item.status === "failed" && (
          <p className="flex items-start gap-2 text-sm font-medium text-[#ba1a1a]">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            生成失败：{item.errorMessage ?? "未知错误，请重试"}
          </p>
        )}
        {(item.status === "pending" || item.status === "processing") && (
          <p className="text-sm font-medium text-[#434656]">
            正在处理中，可关闭页面，处理完成后将在记录中展示结果。
          </p>
        )}
      </div>
    </article>
  );
}
