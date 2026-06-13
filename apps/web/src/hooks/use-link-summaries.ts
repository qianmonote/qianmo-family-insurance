import type { LinkSummary } from "@qianmo-family-insurance/db/schema/link-summary";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createLinkSummary,
  getLinkSummary,
  listLinkSummaries,
  retryLinkSummary,
} from "@/api/link-summary";

const linkSummariesKey = ["link-summaries"] as const;
const linkSummaryKey = (id: string) => ["link-summaries", id] as const;

const POLL_INTERVAL_MS = 5000;

function hasProcessingItem(items: LinkSummary[] | undefined) {
  return items?.some((item) => item.status === "processing" || item.status === "pending") ?? false;
}

export function useLinkSummaries() {
  return useQuery({
    queryKey: linkSummariesKey,
    queryFn: listLinkSummaries,
    refetchInterval: (query) => (hasProcessingItem(query.state.data?.items) ? POLL_INTERVAL_MS : false),
  });
}

export function useLinkSummary(id: string) {
  return useQuery({
    queryKey: linkSummaryKey(id),
    queryFn: () => getLinkSummary(id),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "processing" || status === "pending" ? POLL_INTERVAL_MS : false;
    },
  });
}

export function useCreateLinkSummary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLinkSummary,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: linkSummariesKey });
    },
  });
}

export function useRetryLinkSummary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: retryLinkSummary,
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: linkSummariesKey });
      void queryClient.invalidateQueries({ queryKey: linkSummaryKey(data.id) });
    },
  });
}
