import { relations } from "drizzle-orm";
import { index, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod";

import { user } from "./auth";

export const linkSummarySourceTypeEnum = pgEnum("link_summary_source_type", [
  "wechat_article",
  "xiaohongshu_image",
  "xiaohongshu_video",
  "douyin_video",
  "bilibili_video",
  "public_article",
]);

export const linkSummaryStatusEnum = pgEnum("link_summary_status", [
  "pending",
  "processing",
  "success",
  "failed",
]);

export const linkSummary = pgTable(
  "link_summary",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sourceUrl: text("source_url").notNull(),
    sourceType: linkSummarySourceTypeEnum("source_type").notNull(),
    userPrompt: text("user_prompt"),
    status: linkSummaryStatusEnum("status").notNull().default("pending"),
    summaryContent: text("summary_content"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("link_summary_user_id_idx").on(table.userId),
    index("link_summary_created_at_idx").on(table.createdAt),
  ],
);

export const linkSummaryRelations = relations(linkSummary, ({ one }) => ({
  user: one(user, {
    fields: [linkSummary.userId],
    references: [user.id],
  }),
}));

export const linkSummarySourceTypeValues = linkSummarySourceTypeEnum.enumValues;
export const linkSummaryStatusValues = linkSummaryStatusEnum.enumValues;

export type LinkSummarySourceType = (typeof linkSummarySourceTypeValues)[number];
export type LinkSummaryStatus = (typeof linkSummaryStatusValues)[number];

export const createLinkSummaryInputSchema = z.object({
  sourceUrl: z.url(),
  userPrompt: z.string().max(500).optional(),
});

export type CreateLinkSummaryInput = z.infer<typeof createLinkSummaryInputSchema>;

export const linkSummarySchema = z.object({
  id: z.uuid(),
  userId: z.string(),
  sourceUrl: z.string(),
  sourceType: z.enum(linkSummarySourceTypeValues),
  userPrompt: z.string().nullable(),
  status: z.enum(linkSummaryStatusValues),
  summaryContent: z.string().nullable(),
  errorMessage: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type LinkSummary = typeof linkSummary.$inferSelect;
