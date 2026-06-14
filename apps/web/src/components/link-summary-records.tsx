"use client";

import { Button } from "@qianmo-family-insurance/ui/components/button";
import { Skeleton } from "@qianmo-family-insurance/ui/components/skeleton";
import type { LinkSummary } from "@qianmo-family-insurance/db/schema/link-summary";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Clock, FileText, LinkIcon, RotateCcw, Share2, Video } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { QianmoAppShell, SearchControl } from "@/components/qianmo-design-shell";
import { useLinkSummaries, useRetryLinkSummary } from "@/hooks/use-link-summaries";
import { SOURCE_TYPE_LABELS, STATUS_LABELS } from "@/lib/link-summary-format";

function getHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function getRecordTitle(item: LinkSummary) {
  if (item.userPrompt) {
    return item.userPrompt;
  }
  return getHost(item.sourceUrl);
}

function StatusPill({ status }: { status: LinkSummary["status"] }) {
  const styles = {
    success: "bg-[#006c44]/10 text-[#006c44]",
    processing: "bg-[#003ec7]/10 text-[#003ec7] animate-pulse",
    pending: "bg-[#003ec7]/10 text-[#003ec7] animate-pulse",
    failed: "bg-[#ba1a1a]/10 text-[#ba1a1a]",
  } satisfies Record<LinkSummary["status"], string>;

  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styles[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export default function LinkSummaryRecords() {
  const { data, isLoading } = useLinkSummaries();
  const retryMutation = useRetryLinkSummary();

  if (isLoading) {
    return (
      <QianmoAppShell active="history" withSideNav>
        <main className="mx-auto min-h-screen w-full max-w-7xl space-y-4 p-6 pt-10 lg:p-10">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </main>
      </QianmoAppShell>
    );
  }

  const items = data?.items ?? [];

  return (
    <QianmoAppShell active="history" withSideNav>
      <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 sm:px-8 lg:px-10">
        <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <h1 className="text-4xl font-semibold text-[#003ec7] sm:text-5xl">总结记录</h1>
            <p className="mt-3 text-lg text-[#434656]">管理和查看您的家庭保险内容分析历史</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SearchControl />
            <select className="rounded-xl border border-[#c3c5d9]/60 bg-white px-4 py-2.5 text-sm font-semibold text-[#434656] outline-none transition-colors hover:border-[#003ec7] focus:ring-2 focus:ring-[#003ec7]/20">
              <option>所有类型</option>
              <option>文章</option>
              <option>视频</option>
            </select>
            <select className="rounded-xl border border-[#c3c5d9]/60 bg-white px-4 py-2.5 text-sm font-semibold text-[#434656] outline-none transition-colors hover:border-[#003ec7] focus:ring-2 focus:ring-[#003ec7]/20">
              <option>所有状态</option>
              <option>已完成</option>
              <option>处理中</option>
              <option>已失败</option>
            </select>
          </div>
        </div>

        {items.length === 0 && (
          <div className="rounded-xl border border-[#c3c5d9]/40 bg-white p-10 text-center shadow-sm">
            <FileText className="mx-auto size-12 text-[#737688]" />
            <p className="mt-4 text-sm font-medium text-[#434656]">暂无总结记录</p>
            <Link href="/summary" className="mt-5 inline-flex rounded-xl bg-[#003ec7] px-5 py-3 text-sm font-bold text-white">
              创建第一条总结
            </Link>
          </div>
        )}

        <div className="grid gap-6">
          {items.map((item) => {
            const isVideo =
              item.sourceType === "bilibili_video" ||
              item.sourceType === "douyin_video" ||
              item.sourceType === "xiaohongshu_video";
            const Icon = item.status === "failed" ? AlertCircle : isVideo ? Video : FileText;
            const iconClass =
              item.status === "failed"
                ? "bg-[#ffdad6]/50 text-[#ba1a1a]"
                : item.status === "success"
                  ? "bg-[#25fea8]/30 text-[#006c44]"
                  : "bg-[#dde1ff]/70 text-[#003ec7]";

            return (
              <article
                key={item.id}
                className="flex flex-col justify-between gap-5 rounded-xl border border-[#c3c5d9]/40 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#0052ff] hover:shadow-md sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-start gap-5 sm:items-center">
                  <div className={`flex size-14 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
                    <Icon className="size-7" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <h2 className="truncate text-xl font-bold text-[#0b1c30]">
                        {getRecordTitle(item)}
                      </h2>
                      <StatusPill status={item.status} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-[#434656]">
                      <span className="inline-flex items-center gap-1">
                        <LinkIcon className="size-4" />
                        {getHost(item.sourceUrl)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-4" />
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                      <span className="rounded-full bg-[#d3e4fe]/70 px-2.5 py-1 font-bold text-[#003ec7]">
                        {SOURCE_TYPE_LABELS[item.sourceType]}
                      </span>
                    </div>
                  </div>
                </div>

                {item.status === "pending" || item.status === "processing" ? (
                  <div className="w-full sm:w-48">
                    <div className="mb-1 flex justify-between text-[10px] font-bold text-[#003ec7]">
                      <span>Processing...</span>
                      <span>70%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#e5eeff]">
                      <div className="h-full w-[70%] rounded-full bg-[#003ec7] shadow-[0_0_8px_rgba(0,62,199,0.45)]" />
                    </div>
                  </div>
                ) : (
                  <div className="flex w-full items-center gap-2 sm:w-auto">
                    {item.status === "failed" ? (
                      <Button
                        type="button"
                        disabled={retryMutation.isPending}
                        onClick={async () => {
                          try {
                            await retryMutation.mutateAsync(item.id);
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : "重试失败");
                          }
                        }}
                        className="h-10 flex-1 rounded-xl bg-[#003ec7] px-5 text-sm font-bold text-white hover:bg-[#0052ff] sm:flex-none"
                      >
                        <RotateCcw className="mr-2 size-4" />
                        重试
                      </Button>
                    ) : (
                      <Link
                        href={`/summary/records/${item.id}`}
                        className="flex-1 rounded-xl bg-[#003ec7]/10 px-6 py-2.5 text-center text-sm font-bold text-[#003ec7] transition-colors hover:bg-[#003ec7] hover:text-white sm:flex-none"
                      >
                        查看详情
                      </Link>
                    )}
                    <button type="button" className="rounded-full p-2.5 text-[#737688] transition-colors hover:bg-[#d3e4fe]/60 hover:text-[#003ec7]" aria-label="分享">
                      {item.status === "success" ? <Share2 className="size-5" /> : <CheckCircle2 className="size-5" />}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {items.length > 0 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <button type="button" className="rounded-xl border border-[#c3c5d9]/60 p-2 text-[#434656] transition-colors hover:bg-[#003ec7] hover:text-white" aria-label="上一页">
              <ChevronLeft className="size-5" />
            </button>
            <button type="button" className="size-10 rounded-xl bg-[#003ec7] font-bold text-white shadow-md shadow-[#003ec7]/20">
              1
            </button>
            <button type="button" className="size-10 rounded-xl border border-[#c3c5d9]/60 font-medium text-[#434656] transition-colors hover:border-[#003ec7] hover:text-[#003ec7]">
              2
            </button>
            <button type="button" className="rounded-xl border border-[#c3c5d9]/60 p-2 text-[#434656] transition-colors hover:bg-[#003ec7] hover:text-white" aria-label="下一页">
              <ChevronRight className="size-5" />
            </button>
          </div>
        )}
      </main>
    </QianmoAppShell>
  );
}
