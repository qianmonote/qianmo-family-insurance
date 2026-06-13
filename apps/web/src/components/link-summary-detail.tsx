"use client";

import { Skeleton } from "@qianmo-family-insurance/ui/components/skeleton";

import SummaryResultCard from "@/components/summary-result-card";
import { useLinkSummary } from "@/hooks/use-link-summaries";

export default function LinkSummaryDetail({ id }: { id: string }) {
  const { data, isLoading } = useLinkSummary(id);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-2xl p-6">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!data) {
    return <p className="p-6 text-sm text-muted-foreground">记录不存在或无权访问</p>;
  }

  return (
    <div className="mx-auto w-full max-w-2xl p-6">
      <SummaryResultCard item={data} />
    </div>
  );
}
