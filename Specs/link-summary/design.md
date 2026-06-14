# 技术方案设计：登录模块 + 链接一键总结

## 1. 数据模型设计

### 1.1 复用现有表

`packages/db/src/schema/auth.ts` 中的 `user` / `session` / `account` / `verification` 表直接复用，无变更。

Better-Auth session 过期时间（L-3：7天登录态）通过 `packages/auth/src/index.ts` 中 `session.expiresIn` 配置（Better-Auth 默认即 7 天 = 604800 秒，确认/显式声明即可）。

### 1.2 新增表：`link_summary`

文件：`packages/db/src/schema/link-summary.ts`

```ts
export const linkSummarySourceTypeEnum = pgEnum("link_summary_source_type", [
  "wechat_article",     // 微信公众号文章
  "xiaohongshu_image",  // 小红书图文
  "xiaohongshu_video",  // 小红书视频
  "douyin_video",       // 抖音短视频
  "bilibili_video",     // B站视频
  "public_article",     // 公开免费网站文章
]);

export const linkSummaryStatusEnum = pgEnum("link_summary_status", [
  "pending", "processing", "success", "failed",
]);

export const linkSummary = pgTable("link_summary", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  sourceUrl: text("source_url").notNull(),
  sourceType: linkSummarySourceTypeEnum("source_type").notNull(),
  userPrompt: text("user_prompt"),
  status: linkSummaryStatusEnum("status").notNull().default("pending"),
  summaryContent: text("summary_content"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => [
  index("link_summary_user_id_idx").on(table.userId),
  index("link_summary_created_at_idx").on(table.createdAt),
]);

export const linkSummaryRelations = relations(linkSummary, ({ one }) => ({
  user: one(user, { fields: [linkSummary.userId], references: [user.id] }),
}));
```

`sourceType` 中 图文类 = `wechat_article | xiaohongshu_image | public_article`，视频类 = `xiaohongshu_video | douyin_video | bilibili_video`（决定同步/异步分支）。

### 1.3 共享 Zod Schema

文件：`packages/db/src/schema/link-summary.ts` 同时导出（前后端共用）：

```ts
export const createLinkSummaryInputSchema = z.object({
  sourceUrl: z.url(),
  userPrompt: z.string().max(500).optional(),
});

export const linkSummarySelectSchema = createSelectSchema(linkSummary); // drizzle-zod，用于响应类型
```

## 2. API 设计

统一响应格式 `{ code, data, message }`，`code === 0` 成功。所有以下接口需登录鉴权（复用 `auth` middleware，从 session 取 `userId`）。

错误码约定（业务码，HTTP 状态可统一 200，由 `code` 区分）：
- `0`：成功
- `40001`：参数校验失败
- `40002`：不支持的链接类型
- `40004`：记录不存在或无权访问

### 2.1 `POST /api/link-summaries`

创建总结任务。

- 入参：`createLinkSummaryInputSchema` = `{ sourceUrl: string (url), userPrompt?: string }`
- 处理逻辑：
  1. 调用 `detectSourceType(sourceUrl)`，无法识别 → 返回 `code=40002, message="暂不支持该链接类型"`
  2. 创建 `link_summary` 记录，`status = "pending"`
  3. 若 `sourceType` 属于图文类 → **同步处理**：抓取内容 → 调 AI 总结 → 更新记录为 `success`/`failed`，本次请求直接返回最终记录（满足 30s 内返回的非功能要求）
  4. 若 `sourceType` 属于视频类 → 更新为 `processing` 并推入内存任务队列，立即返回 `processing` 状态的记录
- 出参：`data: LinkSummary`（含 id/status/summaryContent/errorMessage 等全部字段）

### 2.2 `GET /api/link-summaries`

总结记录列表（按 `createdAt` 倒序），仅返回当前用户的记录。

- query：`?limit=20&offset=0`（可选，默认 limit=20）
- 出参：`data: { items: LinkSummary[], total: number }`

### 2.3 `GET /api/link-summaries/:id`

获取单条记录详情（含 `summaryContent`）。

- 出参：`data: LinkSummary`；非本人记录或不存在 → `code=40004`

### 2.4 `POST /api/link-summaries/:id/retry`

重试失败任务。

- 仅 `status === "failed"` 的记录可重试；重置为 `pending`/`processing` 并重新进入对应处理流程（同 2.1 步骤 3/4，依据原 `sourceType` 判断同步/异步）
- 出参：`data: LinkSummary`

## 3. 前端页面/组件设计

### 3.1 全局路由保护（L-5）

新增 `apps/web/src/middleware.ts`：

- 使用 Better-Auth 提供的 session cookie 校验（`authClient.getSession` 或读取 cookie 后调用 server `/api/auth/get-session`）
- 未登录访问受保护路径（除 `/login`、`/register`、静态资源、`/api/*`）→ 重定向至 `/login?redirect=<原路径>`
- 登录成功后读取 `redirect` 参数跳转回原目标页（在 `sign-in-form.tsx` / `sign-up-form.tsx` 的 `onSuccess` 中处理 `router.push(redirect ?? "/dashboard")`）

### 3.2 登录/注册页（复用现有，按 L-1/L-6 微调）

- `apps/web/src/components/sign-up-form.tsx`：补充"该邮箱已注册"等统一错误文案映射（Better-Auth 错误 code → 中文文案）
- `apps/web/src/components/sign-in-form.tsx`：补充"账号不存在/密码错误"统一文案（不区分两者，文案如"邮箱或密码不正确"）
- 两表单密码长度校验已是 `min(8)`，符合 L-1

### 3.2.1 退出登录逻辑（L-3/L-5/L-6 补充）

退出登录入口放在所有登录态页面的导航区域/用户菜单中，至少覆盖 `/summary`、`/summary/records`、`/summary/records/[id]` 等受保护页面。

- 交互入口：
  - 桌面端：导航右侧显示"退出登录"按钮，或在用户头像/账户菜单中提供"退出登录"菜单项。
  - Stitch 新风格页面使用 `QianmoTopNav` / `QianmoSideNav` 时，应复用同一个退出处理函数，避免各页面重复实现。
- 前端实现：
  - 新增或复用 `LogoutButton` / `UserMenu` 组件。
  - 点击后调用 `authClient.signOut`。
  - 成功回调中执行 `router.replace("/login")`，必要时调用 TanStack Query `queryClient.clear()` 清理当前用户相关缓存。
  - 提交期间按钮置为 loading/disabled，避免重复点击。
  - 失败时使用 `toast.error("退出登录失败，请稍后重试")`。
- 路由保护联动：
  - 退出成功后 session cookie 被清除。
  - 用户再次访问 `/summary`、`/summary/records`、详情页等受保护路径时，仍由 `apps/web/src/proxy.ts` / 全局路由保护重定向到 `/login?redirect=<原路径>`。
- 验收标准：
  - 已登录用户点击退出后回到 `/login`。
  - 刷新页面后仍保持未登录状态。
  - 退出后浏览器后退到受保护页面时，页面不能展示上一位用户的数据，应被重定向或显示未登录状态。

### 3.3 一键总结入口页 `/summary`

路径：`apps/web/src/app/summary/page.tsx` + `summary-form.tsx`（client component）

- 组件：`LinkSummaryForm`
  - 链接输入框（`Input`）+ "粘贴链接"按钮（调用 `navigator.clipboard.readText()` 填充输入框）
  - 补充要求文本框（选填，`Textarea`，对应 `userPrompt`）
  - "开始总结"按钮 → 调用 `useCreateLinkSummary` mutation（`POST /api/link-summaries`）
  - 提交后：
    - 图文类（同步返回 success/failed）→ 直接展示 `SummaryResultCard`
    - 视频类（返回 processing）→ 展示提示"可关闭页面，处理完成后将在记录中通知"，并跳转/引导至 `/summary/records`
  - 异常处理：捕获 `code !== 0` 统一通过 `toast.error(message)` 展示（S-2/S-10）

### 3.4 总结结果展示 `SummaryResultCard` 组件

- 展示：来源链接、链接类型（中文标签）、总结内容（按行/要点渲染）、生成时间
- 复用于：提交后立即展示 + 记录详情页

### 3.5 总结记录列表页 `/summary/records`

路径：`apps/web/src/app/summary/records/page.tsx` + `records-list.tsx`

- 使用 `useLinkSummaries` (TanStack Query, `GET /api/link-summaries`)
- 对存在 `status === "processing"` 的记录，列表页以 `refetchInterval: 5000` 轮询（S-7/S-8）
- 每行展示：来源链接（截断）、类型标签、状态徽章（处理中/成功/失败，对应颜色）、创建时间
- 失败项展示"重试"按钮 → `useRetryLinkSummary` mutation（`POST /api/link-summaries/:id/retry`）
- 点击行 → 跳转 `/summary/records/[id]` 详情页

### 3.6 记录详情页 `/summary/records/[id]`

路径：`apps/web/src/app/summary/records/[id]/page.tsx`

- `useLinkSummary(id)` 获取详情，渲染 `SummaryResultCard`
- 若 `status === "processing"`，轮询直至完成

### 3.7 TanStack Query 接入

- 新增 `apps/web/src/components/providers.tsx` 中包裹 `QueryClientProvider`（新增依赖 `@tanstack/react-query`）
- API 封装：`apps/web/src/api/link-summary.ts`（统一 fetch 封装，`credentials: "include"`，基于 `env.NEXT_PUBLIC_SERVER_URL`）
- Hooks：`apps/web/src/hooks/use-link-summaries.ts`（`useLinkSummaries` / `useLinkSummary` / `useCreateLinkSummary` / `useRetryLinkSummary`）

### 3.8 导航

`apps/web/src/components/header.tsx` 增加"一键总结"、"总结记录"入口链接（登录后可见）。

登录态导航还需提供"退出登录"入口：

- 旧导航：在 `UserMenu` 或 Header 右侧显示退出入口。
- Stitch 新风格导航：在 `QianmoTopNav` 右侧 `Logout` 按钮接入真实 `authClient.signOut`，不可仅保留静态按钮。

## 4. 关键业务逻辑

### 4.1 链接类型识别（`src/services/link-summary/detect-source-type.ts`）

基于 URL host/path 正则匹配：

| sourceType | 匹配规则示例 |
|---|---|
| wechat_article | host 包含 `mp.weixin.qq.com` |
| xiaohongshu_image / xiaohongshu_video | host 包含 `xiaohongshu.com` 或 `xhslink.com`；图文/视频区分依赖抓取结果（mock 阶段按 URL path 简单区分，如含 `/explore/` 视为图文，否则按抓取返回类型决定，mock 中默认 image） |
| douyin_video | host 包含 `douyin.com` |
| bilibili_video | host 包含 `bilibili.com` 或 `b23.tv` |
| public_article | 其他 `http(s)://` 合法 URL，作为兜底（公开文章） |
| 不支持 | URL 格式非法、或为本地/内网地址（SSRF 防护，见非功能需求） |

> mock 阶段优先级：先匹配明确平台 host，否则兜底为 `public_article`（真实抓取仅支持 public_article 走 fetch+解析，其余平台 mock）。

### 4.2 内容抓取（`src/services/link-summary/content-fetcher.ts`）

定义统一接口：

```ts
interface FetchedContent {
  title: string;
  text: string;
  images?: string[]; // 最多10张
}
interface ContentFetcher {
  fetch(url: string): Promise<FetchedContent>;
}
```

- `PublicArticleFetcher`：真实实现，`fetch(url)` 拉取 HTML，使用简单文本提取（如提取 `<title>` + 正文标签文本，去除 script/style），图片提取 `<img src>` 前10个
- `MockPlatformFetcher`：用于 wechat_article / xiaohongshu_* / douyin_video / bilibili_video，返回固定结构的占位内容（如 `title: "[mock] <平台名>内容标题"`, `text: "[mock] 该平台内容抓取暂未接入，以下为占位文本用于演示AI总结流程..."`），便于后续替换为真实抓取实现而不改动上层调用方
- 抓取失败（如 `PublicArticleFetcher` 请求超时/4xx/5xx）→ 抛出错误，由上层捕获写入 `errorMessage`，`status = failed`

**SSRF 防护**：`PublicArticleFetcher` 请求前校验目标 host 不可解析为内网/私有 IP 段（10.x/172.16-31.x/192.168.x/127.x/169.254.x/::1），命中则拒绝并报错。

### 4.3 AI 总结生成（`src/services/link-summary/ai-summarizer.ts`）

- 使用 `@anthropic-ai/sdk`，模型 `claude-sonnet-4-6`
- Prompt 结构：系统提示要求输出结构化要点列表（Markdown 要点格式），用户消息包含：抓取到的 `title` + `text`（截断到合理长度，如 8000 字符）+ 用户 `userPrompt`（如有，作为"用户的定制化要求"）
- 返回 `summaryContent: string`（Markdown 文本，前端按 Markdown/纯文本渲染均可，本期简单按换行展示）
- 调用失败（超时/API错误）→ 抛出错误，上层捕获写入 `errorMessage`

### 4.4 任务处理与队列（`src/services/link-summary/task-processor.ts` + `task-queue.ts`）

```
创建任务 (POST /api/link-summaries)
   │
   ├─ 图文类 → processTask(id) 同步 await（流程图中"同步抓取+AI总结"）
   │            成功 → status=success, summaryContent=...
   │            失败 → status=failed, errorMessage=...
   │
   └─ 视频类 → status=processing, 写入内存队列(enqueue) → 立即返回
                后台 worker 串行 take 队列任务 → processTask(id) → 更新最终状态
```

- `task-queue.ts`：进程内 `Array` 作为队列 + 一个常驻异步循环（`while (true) { await new Promise; ... }` 或基于事件的简单 worker），保证同一时刻只处理一个视频任务（避免并发调用 AI 超限）。**已知限制**：仅适用于单进程部署，多实例部署需后续迁移到 Redis/BullMQ（已在 proposal 范围边界中说明）
- `processTask(linkSummaryId)`：
  1. 读取记录，`status = processing`（若尚未是）
  2. 调用对应 `ContentFetcher.fetch(sourceUrl)`
  3. 调用 `aiSummarizer.summarize({ title, text, images, userPrompt })`
  4. 更新 `status = success, summaryContent`；任一步异常 → `status = failed, errorMessage`
- 重试（`POST /api/link-summaries/:id/retry`）：仅允许 `status === failed`，复用 `processTask` 流程（图文同步执行并返回结果，视频重新入队）

## 5. 第三方集成

| 集成 | 说明 | 环境变量 |
|---|---|---|
| Anthropic Claude API | AI 总结生成 | `ANTHROPIC_API_KEY`（新增至 `apps/server/.env.example` 及 `packages/env/src/server.ts`） |
| 公众号/小红书/抖音/B站内容抓取 | 本期 mock，预留 `ContentFetcher` 接口扩展位，后续接入真实第三方服务时新增实现类即可，无需改动 service 层调用方 |

## 6. 风险与权衡

- **内存队列单点限制**：进程重启会丢失队列中未处理任务（DB 中仍为 `processing` 状态但无人处理）。本期接受该限制（用户可手动"重试"，但当前设计仅允许对 `failed` 重试，`processing` 状态卡住需人工介入数据库修正）——记录为后续优化点（如启动时扫描 `processing` 超时记录标记为 `failed` 以便用户重试）。**本次设计补充**：server 启动时扫描所有 `processing` 状态记录重新入队，降低该风险。
- **mock 抓取**：除公开网站文章外其余平台为占位内容，AI 总结结果不具备真实业务价值，仅验证链路；上线前需替换为真实抓取服务（涉及成本与合规评估，PRD Q-2）。
- **SSRF 防护**仅覆盖 `PublicArticleFetcher` 的真实 fetch 路径；mock fetcher 不发起真实网络请求，无 SSRF 风险。
