"use client";

import { Button } from "@qianmo-family-insurance/ui/components/button";
import { Skeleton } from "@qianmo-family-insurance/ui/components/skeleton";
import { ArrowLeft, Brain, CalendarDays, Download, FileText, Info, Lightbulb, LinkIcon, Share2, ShieldAlert, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";

import { QianmoAppShell } from "@/components/qianmo-design-shell";
import { useLinkSummary } from "@/hooks/use-link-summaries";
import { SOURCE_TYPE_LABELS, STATUS_LABELS } from "@/lib/link-summary-format";

function getSummaryPoints(content: string | null) {
  if (!content) {
    return [];
  }
  return content
    .split(/\n+/)
    .map((line) => line.replace(/^[-*\d.、\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 4);
}

export default function LinkSummaryDetail({ id }: { id: string }) {
  const { data, isLoading } = useLinkSummary(id);

  if (isLoading) {
    return (
      <QianmoAppShell active="history" withSideNav>
        <main className="mx-auto min-h-screen w-full max-w-7xl p-6 lg:p-10">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="mt-6 h-96 w-full rounded-xl" />
        </main>
      </QianmoAppShell>
    );
  }

  if (!data) {
    return (
      <QianmoAppShell active="history" withSideNav>
        <main className="mx-auto min-h-screen w-full max-w-7xl p-6 lg:p-10">
          <div className="rounded-xl border border-[#c3c5d9]/40 bg-white p-10 text-center text-sm font-medium text-[#434656]">
            记录不存在或无权访问
          </div>
        </main>
      </QianmoAppShell>
    );
  }

  const points = getSummaryPoints(data.summaryContent);
  const title = data.userPrompt || "家庭保险内容智能摘要报告";

  return (
    <QianmoAppShell active="history" withSideNav>
      <header className="sticky top-16 z-30 border-b border-[#c3c5d9]/30 bg-[#f8f9ff]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8 lg:px-10">
          <div className="flex items-center gap-4">
            <Link href="/summary/records" className="inline-flex items-center gap-2 rounded-full p-2 text-sm font-bold text-[#003ec7] transition-colors hover:bg-[#003ec7]/5">
              <ArrowLeft className="size-5" />
              返回列表
            </Link>
            <div className="hidden h-6 w-px bg-[#c3c5d9] sm:block" />
            <span className="hidden text-xl font-bold text-[#0b1c30] sm:inline">报告详情</span>
          </div>
          <Button className="h-10 rounded-full bg-[#003ec7] px-5 text-sm font-bold text-white hover:bg-[#0052ff]">
            <Share2 className="mr-2 size-4" />
            分享报告
          </Button>
        </div>
      </header>

      <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 sm:px-8 lg:px-10">
        <section className="mb-10 flex flex-col gap-8 rounded-xl border border-[#c3c5d9]/30 bg-white p-6 shadow-sm md:flex-row md:p-8">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-[#c3c5d9]/20 bg-[linear-gradient(135deg,#003ec7,#0b1c30)] md:w-1/3">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(37,254,168,0.45),transparent_28%),radial-gradient(circle_at_80%_65%,rgba(183,196,255,0.35),transparent_30%)]" />
            <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/90 px-3 py-1 text-xs font-bold text-[#003ec7] shadow-sm backdrop-blur">
              <FileText className="size-4" />
              {SOURCE_TYPE_LABELS[data.sourceType]}
            </div>
            <Sparkles className="absolute bottom-6 right-6 size-16 text-white/70" />
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-[#006c44]/20 bg-[#25fea8]/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#006c44]">
                AI Generated
              </span>
              <span className="rounded-full border border-[#003ec7]/20 bg-[#dde1ff]/60 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#003ec7]">
                {STATUS_LABELS[data.status]}
              </span>
            </div>
            <h1 className="text-3xl font-semibold leading-tight text-[#0b1c30] sm:text-5xl">{title}</h1>
            <div className="flex flex-wrap gap-3 text-sm font-medium text-[#434656]">
              <a href={data.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-2 rounded-full bg-[#eff4ff] px-3 py-2 text-[#003ec7] underline underline-offset-4">
                <LinkIcon className="size-4 shrink-0" />
                <span className="truncate">{data.sourceUrl}</span>
              </a>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#eff4ff] px-3 py-2">
                <CalendarDays className="size-4" />
                {new Date(data.updatedAt).toLocaleString()}
              </span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-12 gap-6">
          <section className="col-span-12 space-y-6 lg:col-span-8">
            <article className="rounded-xl border border-[#c3c5d9]/40 bg-white p-6 shadow-sm md:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-[#0052ff] text-white">
                  <Sparkles className="size-5" />
                </div>
                <h2 className="text-2xl font-bold text-[#0b1c30]">核心要点</h2>
              </div>
              {points.length > 0 ? (
                <ul className="space-y-4">
                  {points.map((point, index) => (
                    <li key={`${point}-${index}`} className="flex gap-4 rounded-lg p-4 transition-colors hover:bg-[#eff4ff]">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#003ec7] text-sm font-bold text-white shadow-md shadow-[#003ec7]/20">
                        {index + 1}
                      </div>
                      <p className="leading-7 text-[#434656]">{point}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm font-medium text-[#434656]">当前记录尚未生成摘要内容。</p>
              )}
            </article>

            <article className="rounded-xl border border-[#c3c5d9]/40 bg-white p-6 shadow-sm md:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-[#25fea8] text-[#005232]">
                  <Brain className="size-5" />
                </div>
                <h2 className="text-2xl font-bold text-[#0b1c30]">详细分析</h2>
              </div>
              {data.summaryContent ? (
                <div className="whitespace-pre-wrap text-base leading-8 text-[#434656]">
                  {data.summaryContent}
                </div>
              ) : (
                <p className="text-sm font-medium text-[#434656]">
                  {data.status === "failed"
                    ? `生成失败：${data.errorMessage ?? "未知错误，请重试"}`
                    : "正在处理中，可稍后回来查看完整报告。"}
                </p>
              )}
              <div className="mt-8 overflow-hidden rounded-xl border-l-4 border-[#003ec7] bg-[#eff4ff] p-6">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase text-[#003ec7]">
                  <Lightbulb className="size-5" />
                  专家建议
                </div>
                <p className="text-lg italic leading-8 text-[#0b1c30]">
                  优先核对家庭保障责任、免赔额、等待期和续保条件；如发现保障缺口，可结合现有保单做组合优化。
                </p>
              </div>
            </article>
          </section>

          <aside className="col-span-12 space-y-6 lg:col-span-4">
            <article className="rounded-xl border border-[#c3c5d9]/40 bg-white p-6 shadow-sm">
              <h3 className="mb-6 flex items-center gap-2 text-sm font-bold text-[#0b1c30]">
                <Info className="size-5 text-[#003ec7]" />
                报告元数据
              </h3>
              <div className="space-y-1">
                {[
                  ["生成日期", new Date(data.createdAt).toLocaleDateString()],
                  ["更新时间", new Date(data.updatedAt).toLocaleTimeString()],
                  ["来源类型", SOURCE_TYPE_LABELS[data.sourceType]],
                  ["处理状态", STATUS_LABELS[data.status]],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between border-b border-[#c3c5d9]/20 py-3 text-sm">
                    <span className="text-[#434656]">{label}</span>
                    <span className="font-bold text-[#0b1c30]">{value}</span>
                  </div>
                ))}
                <div className="py-3">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-[#434656]">置信度评分</span>
                    <span className="font-bold text-[#006c44]">98%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#e5eeff]">
                    <div className="h-full w-[98%] rounded-full bg-[#006c44] shadow-[0_0_8px_rgba(37,254,168,0.5)]" />
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-xl border border-[#003ec7]/20 bg-[#dde1ff]/35 p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-lg bg-[#0052ff] p-2 text-white">
                  <ShieldAlert className="size-5" />
                </div>
                <h3 className="text-sm font-bold text-[#003ec7]">AI 洞察推荐</h3>
              </div>
              <p className="mb-6 text-sm leading-6 text-[#434656]">
                根据这份摘要，建议检查家庭意外险、医疗险和重疾险之间是否存在保障重叠或缺口。
              </p>
              <Button className="h-11 w-full rounded-xl bg-[#25fea8] text-sm font-bold text-[#005232] hover:bg-[#50ffaf]">
                更新保险方案
              </Button>
            </article>

            <div className="flex flex-col gap-3">
              <Button variant="outline" className="h-11 rounded-xl border-2 border-[#003ec7] bg-transparent text-sm font-bold text-[#003ec7] hover:bg-[#003ec7]/5">
                <Download className="mr-2 size-4" />
                下载 PDF 报告
              </Button>
              <Button variant="outline" className="h-11 rounded-xl border border-[#ba1a1a] bg-transparent text-sm font-bold text-[#ba1a1a] hover:bg-[#ba1a1a]/5">
                <Trash2 className="mr-2 size-4" />
                删除此条记录
              </Button>
            </div>
          </aside>
        </div>
      </main>
    </QianmoAppShell>
  );
}
