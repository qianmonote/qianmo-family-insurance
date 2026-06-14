"use client";

import { Button } from "@qianmo-family-insurance/ui/components/button";
import { Input } from "@qianmo-family-insurance/ui/components/input";
import { Label } from "@qianmo-family-insurance/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { Bot, ClipboardPaste, FileText, LinkIcon, MessageCircle, Newspaper, PlayCircle, ShieldCheck, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { QianmoAppShell } from "@/components/qianmo-design-shell";
import SummaryResultCard from "@/components/summary-result-card";
import { useCreateLinkSummary } from "@/hooks/use-link-summaries";

export default function LinkSummaryForm() {
  const createMutation = useCreateLinkSummary();
  const [submittedProcessing, setSubmittedProcessing] = useState(false);

  const form = useForm({
    defaultValues: {
      sourceUrl: "",
      userPrompt: "",
    },
    onSubmit: async ({ value }) => {
      try {
        const result = await createMutation.mutateAsync({
          sourceUrl: value.sourceUrl,
          userPrompt: value.userPrompt || undefined,
        });
        setSubmittedProcessing(result.status === "processing" || result.status === "pending");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "提交失败，请稍后重试");
      }
    },
    validators: {
      onSubmit: z.object({
        sourceUrl: z.url("请输入合法的链接地址"),
        userPrompt: z.string().max(500, "补充要求不超过500字"),
      }),
    },
  });

  const handlePaste = async (field: { handleChange: (value: string) => void }) => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        field.handleChange(text);
      }
    } catch {
      toast.error("无法读取剪贴板，请手动粘贴链接");
    }
  };

  const result = createMutation.data;

  return (
    <QianmoAppShell active="summary">
      <main className="bg-[radial-gradient(#003ec7_0.5px,transparent_0.5px)] [background-size:32px_32px]">
        <section className="mx-auto flex max-w-7xl flex-col items-center px-4 py-16 sm:px-8 lg:py-20">
          <div className="mb-8 max-w-3xl text-center">
            <h1 className="text-4xl font-semibold text-[#003ec7] sm:text-5xl">链接一键总结</h1>
            <p className="mt-4 text-lg leading-8 text-[#434656]">
              由 AI 驱动的家庭保险与数据管理助手。只需粘贴内容链接，即可提取核心摘要，让家庭保障更清晰。
            </p>
          </div>

          <div className="w-full max-w-3xl rounded-xl border border-[#c3c5d9]/40 bg-white/90 p-6 shadow-sm backdrop-blur-xl transition-all focus-within:scale-[1.01] focus-within:border-[#003ec7]/30 focus-within:shadow-xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
              className="space-y-6"
            >
              <form.Field name="sourceUrl">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name} className="flex items-center gap-2 text-sm font-bold text-[#003ec7]">
                      <LinkIcon className="size-4" />
                      粘贴内容链接
                    </Label>
                    <div className="relative">
                      <Input
                        id={field.name}
                        name={field.name}
                        placeholder="输入微信、Bilibili、抖音或其他网页链接..."
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="h-14 rounded-xl border-[#c3c5d9]/60 bg-white pr-32 text-base focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[#25fea8]"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => handlePaste(field)}
                        className="absolute bottom-2 right-2 top-2 rounded-lg bg-[#25fea8] px-4 text-sm font-bold text-[#005232] hover:bg-[#50ffaf]"
                      >
                        <ClipboardPaste className="mr-2 size-4" />
                        粘贴链接
                      </Button>
                    </div>
                    {field.state.meta.errors.map((error) => (
                      <p key={error?.message} className="text-sm text-[#ba1a1a]">
                        {error?.message}
                      </p>
                    ))}
                  </div>
                )}
              </form.Field>

              <form.Field name="userPrompt">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name} className="flex items-center justify-between gap-3 text-sm font-bold text-[#434656]">
                      <span className="flex items-center gap-2">
                        <FileText className="size-4" />
                        补充要求（选填）
                      </span>
                      <span className="hidden text-xs font-medium text-[#737688] sm:inline">
                        例如：关注点、格式偏好
                      </span>
                    </Label>
                    <textarea
                      id={field.name}
                      name={field.name}
                      rows={3}
                      placeholder="请输入您的具体需求，例如“帮我总结其中的理赔流程”..."
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full resize-none rounded-xl border border-[#c3c5d9]/60 bg-white p-4 text-base outline-none transition-all placeholder:text-[#737688] focus:border-transparent focus:ring-2 focus:ring-[#25fea8]"
                    />
                    {field.state.meta.errors.map((error) => (
                      <p key={error?.message} className="text-sm text-[#ba1a1a]">
                        {error?.message}
                      </p>
                    ))}
                  </div>
                )}
              </form.Field>

              <form.Subscribe
                selector={(state) => ({
                  canSubmit: state.canSubmit,
                  isSubmitting: state.isSubmitting,
                })}
              >
                {({ canSubmit, isSubmitting }) => (
                  <Button
                    type="submit"
                    disabled={!canSubmit || isSubmitting || createMutation.isPending}
                    className="h-16 w-full rounded-xl bg-[#003ec7] text-xl font-semibold text-white shadow-md shadow-[#25fea8]/30 transition-all hover:bg-[#0052ff] active:scale-[0.98]"
                  >
                    <Zap className="mr-2 size-6 fill-current" />
                    {createMutation.isPending ? "处理中..." : "开始总结"}
                  </Button>
                )}
              </form.Subscribe>
            </form>

            <div className="mt-10 border-t border-[#c3c5d9]/30 pt-8">
              <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-[#434656]">
                支持的平台与格式
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-6 text-sm font-medium text-[#434656]">
                {[
                  { label: "微信", icon: MessageCircle },
                  { label: "Bilibili", icon: PlayCircle },
                  { label: "抖音", icon: Bot },
                  { label: "网页文章", icon: Newspaper },
                  { label: "PDF文档", icon: FileText },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex flex-col items-center gap-2">
                      <div className="flex size-12 items-center justify-center rounded-full bg-[#eff4ff] text-[#003ec7] transition-colors hover:bg-[#dde1ff]">
                        <Icon className="size-5" />
                      </div>
                      {item.label}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {submittedProcessing && (
            <p className="mt-6 rounded-xl bg-white/80 px-5 py-3 text-sm font-medium text-[#434656] shadow-sm">
              视频内容处理中，可关闭页面，处理完成后将在
              <Link href="/summary/records" className="font-bold text-[#003ec7] underline">
                总结记录
              </Link>
              中查看结果。
            </p>
          )}

          {result && !submittedProcessing && (
            <div className="mt-8 w-full max-w-3xl">
              <SummaryResultCard item={result} />
            </div>
          )}
        </section>

        <section className="border-t border-[#c3c5d9]/20 bg-white py-16">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 md:grid-cols-3 md:px-8">
            {[
              {
                icon: ShieldCheck,
                title: "专业保险语境",
                text: "深度理解保险术语，自动识别保障期限、免赔额及理赔条件等关键家庭财务信息。",
              },
              {
                icon: Sparkles,
                title: "银行级安全保障",
                text: "所有分析链接经过脱敏处理，您的家庭隐私与数据安全是我们工作的核心优先级。",
              },
              {
                icon: Bot,
                title: "AI 深度洞察",
                text: "不仅是总结，更能通过 AI 提供对比建议，帮助您优化家庭保单组合。",
              },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="rounded-xl p-6 transition-colors hover:bg-[#eff4ff]">
                  <Icon className="mb-4 size-12 text-[#006c44]" />
                  <h2 className="text-2xl font-semibold text-[#003ec7]">{feature.title}</h2>
                  <p className="mt-3 leading-7 text-[#434656]">{feature.text}</p>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </QianmoAppShell>
  );
}
