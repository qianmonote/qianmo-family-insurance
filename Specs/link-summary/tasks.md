# 任务清单：登录模块 + 链接一键总结

状态枚举：待开始 / 进行中 / 已完成 / 阻塞 / 需复核

| 编号 | 模块 | 任务描述 | 依赖 | 状态 |
|---|---|---|---|---|
| 1 | 共享/数据模型 | 新增 `packages/db/src/schema/link-summary.ts`：`linkSummary` 表（含 `sourceType`/`status` 枚举）、relations、共享 zod schema（`createLinkSummaryInputSchema` 等），导出至 `schema/index.ts`，生成 drizzle 迁移文件 | - | 已完成 |
| 2 | 共享/配置 | `packages/env/src/server.ts` 新增 `ANTHROPIC_API_KEY` 校验；更新 `apps/server/.env.example`；`packages/auth` 显式配置 7 天 session 过期（L-3） | - | 已完成 |
| 3 | 后端 | 链接类型识别 `detectSourceType(url)`（`apps/server/src/services/link-summary/detect-source-type.ts`），含 SSRF 风险地址识别 | 1 | 已完成 |
| 4 | 后端 | 内容抓取模块：`ContentFetcher` 接口 + `PublicArticleFetcher`（真实 fetch+解析+SSRF防护）+ `MockPlatformFetcher`（占位） | 3 | 已完成 |
| 5 | 后端 | AI 总结生成 `ai-summarizer.ts`（`@anthropic-ai/sdk`，prompt 拼装、错误处理） | 2 | 已完成 |
| 6 | 后端 | 任务处理与队列：`task-processor.ts`（processTask）+ `task-queue.ts`（内存队列+worker）+ server 启动时恢复 `processing` 记录 | 1,4,5 | 已完成 |
| 7 | 后端 | API 路由：`POST /api/link-summaries`、`GET /api/link-summaries`、`GET /api/link-summaries/:id`、`POST /api/link-summaries/:id/retry`，含鉴权 middleware 与统一响应格式 | 1,3,6 | 已完成 |
| 8 | 前端 | 全局路由保护 `apps/web/src/middleware.ts`（未登录重定向 `/login?redirect=`，登录后跳回） | - | 已完成 |
| 9 | 前端 | 登录/注册表单错误文案统一（L-1 邮箱已注册 / L-6 账号或密码错误），调整 `sign-in-form.tsx`/`sign-up-form.tsx`，登录成功后处理 `redirect` 跳转 | 8 | 已完成 |
| 10 | 前端 | 接入 TanStack Query：`providers.tsx` 包裹 `QueryClientProvider`，新增依赖 | - | 已完成 |
| 11 | 前端/共享 | API 封装 `apps/web/src/api/link-summary.ts` + hooks `apps/web/src/hooks/use-link-summaries.ts`（create/list/detail/retry） | 7,10 | 已完成 |
| 12 | 前端 | 一键总结入口页 `/summary`：`LinkSummaryForm`（粘贴链接、补充要求、提交）+ `SummaryResultCard` | 11 | 已完成 |
| 13 | 前端 | 总结记录列表页 `/summary/records`：列表、状态徽章、轮询、重试按钮 | 11 | 已完成 |
| 14 | 前端 | 记录详情页 `/summary/records/[id]`：复用 `SummaryResultCard`，processing 时轮询 | 11,12 | 已完成 |
| 15 | 前端 | `header.tsx` 新增"一键总结"/"总结记录"导航入口（登录态可见） | 12,13 | 已完成 |
| 16 | 后端 | 修复 SSRF 防护的 DNS rebinding/TOCTOU 风险：`assertUrlIsSafeToFetch` 改为返回校验通过的 IP，`PublicArticleFetcher` 使用该 IP "钉住"实际连接（自定义 dispatcher lookup），避免校验与连接之间域名重新解析到内网地址 | 4 | 已完成 |
| 17 | 前端 | 补充退出登录逻辑：在旧 Header/UserMenu 与 Stitch 新风格 `QianmoTopNav` 中接入真实 `authClient.signOut`，退出成功跳转 `/login`，清理查询缓存，失败 toast 提示，并验证退出后受保护页面不可继续展示用户数据 | 8,10,15 | 已完成 |
| 18 | 前端/测试 | 为退出登录补单测：将 `useSignOut` 的编排逻辑抽为纯函数 `runSignOut`（成功清缓存→跳 /login、失败 toast），用 vitest（node 环境，零新依赖）覆盖成功/失败两条路径与「先清缓存后跳转」顺序 | 17 | 已完成 |

## 父任务/子任务说明

当前所有任务粒度均控制在半天内，暂无需拆分子任务。若实现过程中发现某任务（如任务6/7）超出预期工作量，将按规则拆分为 `6.1`/`6.2` 等子任务并更新此表。
