import { db } from "@qianmo-family-insurance/db";
import { createLinkSummaryInputSchema, linkSummary } from "@qianmo-family-insurance/db/schema/link-summary";
import { and, count, desc, eq } from "drizzle-orm";
import { Hono } from "hono";

import type { AuthVariables } from "../middleware/auth";
import { requireAuth } from "../middleware/auth";
import { detectSourceType } from "../services/link-summary/detect-source-type";
import { processLinkSummaryTask } from "../services/link-summary/task-processor";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const linkSummariesRouter = new Hono<{ Variables: AuthVariables }>();

linkSummariesRouter.use("*", requireAuth);

// POST /api/link-summaries 创建总结任务
linkSummariesRouter.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createLinkSummaryInputSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ code: 40001, data: null, message: "参数校验失败" });
  }

  const sourceType = detectSourceType(parsed.data.sourceUrl);
  if (!sourceType) {
    return c.json({ code: 40002, data: null, message: "暂不支持该链接类型" });
  }

  const userId = c.get("userId");
  const [record] = await db
    .insert(linkSummary)
    .values({
      userId,
      sourceUrl: parsed.data.sourceUrl,
      sourceType,
      userPrompt: parsed.data.userPrompt ?? null,
      status: "pending",
    })
    .returning();

  if (!record) {
    return c.json({ code: 50000, data: null, message: "创建任务失败" });
  }

  // 所有来源类型均在请求内同步处理（视频类为占位抓取，瞬时完成）。
  await processLinkSummaryTask(record.id);

  const [latest] = await db.select().from(linkSummary).where(eq(linkSummary.id, record.id));
  return c.json({ code: 0, data: latest, message: "ok" });
});

// GET /api/link-summaries 总结记录列表（按创建时间倒序）
linkSummariesRouter.get("/", async (c) => {
  const userId = c.get("userId");
  const limit = Math.min(Number(c.req.query("limit") ?? "20") || 20, 100);
  const offset = Math.max(Number(c.req.query("offset") ?? "0") || 0, 0);

  const items = await db
    .select()
    .from(linkSummary)
    .where(eq(linkSummary.userId, userId))
    .orderBy(desc(linkSummary.createdAt))
    .limit(limit)
    .offset(offset);

  const [totalRow] = await db
    .select({ value: count() })
    .from(linkSummary)
    .where(eq(linkSummary.userId, userId));

  return c.json({ code: 0, data: { items, total: totalRow?.value ?? 0 }, message: "ok" });
});

// GET /api/link-summaries/:id 记录详情
linkSummariesRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  if (!UUID_REGEX.test(id)) {
    return c.json({ code: 40004, data: null, message: "记录不存在或无权访问" });
  }

  const userId = c.get("userId");
  const [record] = await db
    .select()
    .from(linkSummary)
    .where(and(eq(linkSummary.id, id), eq(linkSummary.userId, userId)));

  if (!record) {
    return c.json({ code: 40004, data: null, message: "记录不存在或无权访问" });
  }

  return c.json({ code: 0, data: record, message: "ok" });
});

// POST /api/link-summaries/:id/retry 重试失败任务
linkSummariesRouter.post("/:id/retry", async (c) => {
  const id = c.req.param("id");
  if (!UUID_REGEX.test(id)) {
    return c.json({ code: 40004, data: null, message: "记录不存在或无权访问" });
  }

  const userId = c.get("userId");
  const [record] = await db
    .select()
    .from(linkSummary)
    .where(and(eq(linkSummary.id, id), eq(linkSummary.userId, userId)));

  if (!record) {
    return c.json({ code: 40004, data: null, message: "记录不存在或无权访问" });
  }

  if (record.status !== "failed") {
    return c.json({ code: 40001, data: null, message: "仅失败的任务可重试" });
  }

  // 同步重试（processLinkSummaryTask 内部会将状态置为 processing 并清理 errorMessage）。
  await processLinkSummaryTask(id);

  const [latest] = await db.select().from(linkSummary).where(eq(linkSummary.id, id));
  return c.json({ code: 0, data: latest, message: "ok" });
});
