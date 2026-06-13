"use client";

import { Button } from "@qianmo-family-insurance/ui/components/button";
import { Card, CardContent } from "@qianmo-family-insurance/ui/components/card";
import { Skeleton } from "@qianmo-family-insurance/ui/components/skeleton";
import Link from "next/link";
import { toast } from "sonner";

import { useLinkSummaries, useRetryLinkSummary } from "@/hooks/use-link-summaries";
import { SOURCE_TYPE_LABELS, STATUS_LABELS } from "@/lib/link-summary-format";

export default function LinkSummaryRecords() {
  const { data, isLoading } = useLinkSummaries();
  const retryMutation = useRetryLinkSummary();

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-2 p-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  const items = data?.items ?? [];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-6">
      <h1 className="text-2xl font-bold">总结记录</h1>

      {items.length === 0 && <p className="text-sm text-muted-foreground">暂无总结记录</p>}

      <div className="space-y-2">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex items-center justify-between gap-4">
              <Link href={`/summary/records/${item.id}`} className="min-w-0 flex-1 space-y-1">
                <p className="truncate text-sm font-medium">{item.sourceUrl}</p>
                <p className="text-xs text-muted-foreground">
                  {SOURCE_TYPE_LABELS[item.sourceType]} · {STATUS_LABELS[item.status]} ·{" "}
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </Link>
              {item.status === "failed" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={retryMutation.isPending}
                  onClick={async () => {
                    try {
                      await retryMutation.mutateAsync(item.id);
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "重试失败");
                    }
                  }}
                >
                  重试
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
