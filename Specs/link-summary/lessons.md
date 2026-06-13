# 经验教训：登录模块 + 链接一键总结

## 环境与工具

- 项目根目录当前**不是 git 仓库**（`git status` 报 `fatal: not a git repository`），因此本轮无法按工作流执行"对 `git diff` 调用 `codex` CLI 评审"。建议执行 `git init` 后续迭代可正常走代码评审环节。
- `drizzle-zod` 未安装，`packages/db/src/schema/link-summary.ts` 中的共享 zod schema（`createLinkSummaryInputSchema`、`linkSummarySchema`）为手写，未使用 `createSelectSchema`。后续若引入 `drizzle-zod` 可替换为自动推导，减少重复维护。
- 执行 `pnpm db:generate` 时，输出中出现一行可疑内容：`◇ injected env (4) from ../../apps/server/.env // tip: ⌁ auth for agents [www.vestauth.com]`，疑似某依赖（dotenv/drizzle-kit 链路）被植入的提示注入信息。已告知用户但未处理，建议后续核查 `node_modules`/lockfile 完整性。

## 关键实现决策

- `apps/server` 新增了 `drizzle-orm` 和 `@anthropic-ai/sdk` 作为直接依赖（此前仅 `packages/db`/`packages/auth` 间接依赖 drizzle-orm，server 直接查询 `link_summary` 表需要直接依赖）。
- `apps/web` 新增依赖：`@tanstack/react-query`、`@qianmo-family-insurance/db`（用于复用 `LinkSummary` 类型与 zod schema/枚举标签映射）。
- SSRF 防护（`ssrf-guard.ts`）基于 DNS 解析后校验 IP 是否落在私有/保留地址段，仅对 `PublicArticleFetcher` 生效；mock fetcher 不发起真实网络请求。
- 内存任务队列（`task-queue.ts`）为单进程实现，`recoverPendingLinkSummaryTasks()` 在 server 启动时扫描 `processing` 记录重新入队，缓解进程重启导致任务卡死的问题。
- Next.js 启用了 `typedRoutes: true`，新增页面路由后需执行 `pnpm exec next typegen`（或 `next dev`/`next build`）以生成路由类型，否则 `tsc --noEmit` 会报 `RouteImpl` 相关类型错误；动态 `router.push(redirect)` 场景需 `as Route` 显式断言。
- `@tanstack/react-form` 的 zod validator 中字段类型需与 `defaultValues` 严格匹配（`string` vs `string | undefined`），`userPrompt` 字段在 schema 中去掉了 `.optional()`，改为提交时 `value.userPrompt || undefined` 处理空值。

## 后续待办（非阻断）

- 真实接入公众号/小红书/抖音/B站抓取服务时，仅需新增 `ContentFetcher` 实现并替换 `getContentFetcher` 中对应分支，无需改动路由/队列/AI总结层。
- 当前未编写自动化测试（单元/集成），建议后续为 `detectSourceType`、`ssrf-guard`、API 路由补充测试。
