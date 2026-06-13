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
- API 路由（`link-summaries.ts`）的鉴权失败/参数校验/业务错误码分支尚未补充测试，后续可补充。

## 补充自动化测试与 codex 复审（本轮）

- 为 `detect-source-type.ts`、`ssrf-guard.ts` 新增 Vitest 测试（`apps/server`，`pnpm add -D vitest` + `package.json` 增加 `test` 脚本）。
- 测试过程中发现并修复了两个真实问题：
  1. `detectSourceType` 用 `host.endsWith("xiaohongshu.com")` 等方式匹配域名，存在仿冒域名（如 `evilxiaohongshu.com`）误判风险，改为 `host === domain || host.endsWith("." + domain)`。
  2. `assertUrlIsSafeToFetch` 对 IPv6 字面量（`URL.hostname` 带方括号，如 `[::1]`）未被 `net.isIP` 识别，导致直接走 DNS 解析分支而绕过私有地址校验；修复为先去除方括号再判断，并补充了 `::ffff:a.b.c.d`（IPv4-mapped）、`::`、`ff00::/8`（多播）、`fe80::/10`（link-local）等地址段的校验。
  3. `content-fetcher.ts` 中 `PublicArticleFetcher` 原先使用 `redirect: "follow"`，重定向目标未经过 SSRF 校验；改为 `redirect: "manual"` 手动跟随，每一跳都重新调用 `assertUrlIsSafeToFetch`，并限制最大跳转次数（5）。
- **已知残留风险（codex 复审标记为阻断，本轮未修复）**：`assertUrlIsSafeToFetch` 是"先 DNS 解析校验、再让 `fetch` 自行解析连接"的两阶段模式，存在 DNS rebinding/TOCTOU 风险——攻击者控制的域名可在校验时返回公网 IP、在 `fetch` 实际连接时返回内网 IP。彻底修复需要将校验阶段解析到的 IP "钉住"并用于实际连接（例如基于 `undici` 自定义 `Agent`/`dispatcher` 的 `lookup`，并正确设置 TLS SNI/Host），属于较大改动，本轮未实现，建议作为独立任务跟进。
