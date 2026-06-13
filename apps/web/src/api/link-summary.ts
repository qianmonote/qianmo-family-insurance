import type { CreateLinkSummaryInput, LinkSummary } from "@qianmo-family-insurance/db/schema/link-summary";
import { env } from "@qianmo-family-insurance/env/web";

interface ApiResponse<T> {
  code: number;
  data: T | null;
  message: string;
}

class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${env.NEXT_PUBLIC_SERVER_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const json = (await response.json()) as ApiResponse<T>;
  if (json.code !== 0) {
    throw new ApiError(json.message);
  }
  return json.data as T;
}

export interface LinkSummaryListResult {
  items: LinkSummary[];
  total: number;
}

export function createLinkSummary(input: CreateLinkSummaryInput) {
  return request<LinkSummary>("/api/link-summaries", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listLinkSummaries() {
  return request<LinkSummaryListResult>("/api/link-summaries");
}

export function getLinkSummary(id: string) {
  return request<LinkSummary>(`/api/link-summaries/${id}`);
}

export function retryLinkSummary(id: string) {
  return request<LinkSummary>(`/api/link-summaries/${id}/retry`, {
    method: "POST",
  });
}
