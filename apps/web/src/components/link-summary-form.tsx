"use client";

import { Button } from "@qianmo-family-insurance/ui/components/button";
import { Input } from "@qianmo-family-insurance/ui/components/input";
import { Label } from "@qianmo-family-insurance/ui/components/label";
import { useForm } from "@tanstack/react-form";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

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
    <div className="mx-auto w-full max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">链接一键总结</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        <form.Field name="sourceUrl">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>链接</Label>
              <div className="flex gap-2">
                <Input
                  id={field.name}
                  name={field.name}
                  placeholder="粘贴公众号文章 / 小红书 / 抖音 / B站 / 公开网站文章链接"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <Button type="button" variant="outline" onClick={() => handlePaste(field)}>
                  粘贴链接
                </Button>
              </div>
              {field.state.meta.errors.map((error) => (
                <p key={error?.message} className="text-destructive">
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Field name="userPrompt">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>补充要求（选填）</Label>
              <textarea
                id={field.name}
                name={field.name}
                rows={3}
                placeholder="例如：帮我整理理财相关的内容"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className="w-full rounded-none border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 dark:bg-input/30"
              />
              {field.state.meta.errors.map((error) => (
                <p key={error?.message} className="text-destructive">
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Subscribe
          selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
        >
          {({ canSubmit, isSubmitting }) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting || createMutation.isPending}>
              {createMutation.isPending ? "处理中..." : "开始总结"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      {submittedProcessing && (
        <p className="text-sm text-muted-foreground">
          视频内容处理中，可关闭页面，处理完成后将在
          <Link href="/summary/records" className="text-primary underline">
            总结记录
          </Link>
          中查看结果。
        </p>
      )}

      {result && !submittedProcessing && <SummaryResultCard item={result} />}
    </div>
  );
}
