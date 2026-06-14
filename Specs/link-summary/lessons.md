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

## 任务16：修复 SSRF DNS rebinding/TOCTOU（本轮）

- `ssrf-guard.ts` 的 `assertUrlIsSafeToFetch` 重命名为 `resolveSafeAddress`，返回校验通过的 `{ address, family }`，供调用方"钉住"实际连接，而不是仅做布尔校验。
- `content-fetcher.ts` 新增 `createPinnedDispatcher(hostname, address, family)`：基于 `undici.Agent` 的 `connect.lookup` 自定义解析，将 fetch 实际连接强制使用校验阶段已确认安全的 IP；TLS SNI/Host 仍使用原始 hostname（dispatcher 不影响 URL）。新增 `undici` 为 `apps/server` 直接依赖（此前为 Node 内置 fetch 隐式依赖，未声明）。
- 每一跳重定向都重新 `resolveSafeAddress` + 创建新 dispatcher，消除了"校验时解析到公网 IP、连接时域名已被改为内网 IP"的窗口。
- **codex 两轮复审踩坑**：
  1. 首轮实现中 `connect.lookup` 回调用了 `dns.lookup(..., {all:true})` 的数组形式 `callback(null, [{address, family}])`，但 `net.connect`/`tls.connect` 的 `lookup` 在 `options.all` 为假时期望 `(err, address, family)` 单值形式——回调形状不匹配会导致连接在建立前失败，pinned dispatcher 实际不生效。修复为根据 `options.all` 分别返回两种形式。
  2. 首轮在 `finally` 中紧跟 `fetch()` 之后就 `await dispatcher.close()`，但 undici `fetch()` 在响应头到达即 resolve，body 仍是活跃请求；`Agent.close()` 会等待活跃请求结束，提前调用可能在消费 body 前阻塞/干扰读取。修复为：成功路径在 `response.text()` 之后关闭；重定向/非 2xx 路径先 `await response.body?.cancel()` 再关闭，统一放在外层 `finally`。
  - 经验：自定义 undici `connect.lookup`/dispatcher 生命周期管理是容易出错的细节，**修改后必须用 codex 复审一轮确认（不能只靠类型检查和单元测试，二者均未捕获这两个问题）**。
- 新增 `content-fetcher.test.ts`：验证 `PublicArticleFetcher` 对内网/回环地址（IPv4/IPv6）在抓取前即抛出 `UnsafeUrlError`。

## 后续待办（非阻断，codex 建议）

- 补充一个针对"DNS rebinding 场景"的回归测试：mock DNS 返回结果，断言实际连接使用的是 `resolveSafeAddress` 返回的 IP（而非二次解析的结果）。
- `isPrivateOrReservedIp` 仍可进一步覆盖 `100.64.0.0/10`（CGNAT）、`192.0.0.0/24`、`198.18.0.0/15` 等特殊用途/文档保留地址段。
- fetch 超时仅覆盖到响应头返回（`clearTimeout` 在 `fetch()` resolve 后立即执行），慢速/无限响应体仍可能导致 `response.text()` 挂起；如需收紧，可结合 body 流的读取超时。

## 任务17：退出登录逻辑（本轮）

- 抽取共享 hook `apps/web/src/hooks/use-sign-out.ts`，统一旧版 `UserMenu` 与 Stitch 新风格 `QianmoTopNav` 的退出行为：`authClient.signOut` → 成功 `queryClient.clear()` 清空 TanStack Query 缓存 + `router.replace("/login")`；失败走 `getAuthErrorMessage` + `toast.error`。
- `QianmoTopNav` 原 "Logout" 按钮与账户图标按钮均为**无 onClick 的静态 `<button>`**（设计稿还原阶段只搭了视觉）。为避免把整个 `qianmo-design-shell.tsx`（含 Footer/SideNav 等纯展示组件）标记 `"use client"`，新建独立 client 组件 `qianmo-logout-button.tsx` 承接交互，shell 其余部分保持可服务端渲染。
- 退出后受保护页面不可见性由既有 `proxy.ts`（Next.js 15 将 `middleware.ts` 更名为 `proxy.ts`，本仓库即采用该命名）保证：session cookie 清除后下次进入受保护路由会被重定向 `/login?redirect=`；`queryClient.clear()` 进一步消除内存中缓存的上一用户数据。
- **codex 评审采纳**：①双击竞态——`isSigningOut` 是异步 state，re-render 前可能重复进入，改用 `useRef` 同步锁保证 `signOut` 幂等；②去掉 `router.refresh()`——`replace("/login")` 后再 refresh 可能作用于尚未切换的路由树，且 `queryClient.clear()` 已足够，移除更稳。
- 质量门禁：`apps/web` 无 lint 配置（无 biome.json/eslint），按规则跳过 Lint；`tsc --noEmit` 通过。`apps/web` 尚未配置 vitest，本任务为退出/导航接线（side-effect 编排，无可独立测试的纯逻辑），按 CLAUDE.md「前端组件级测试非必须，按价值取舍」跳过单测。

## 后续待办（非阻断，codex 建议）

- **移动端退出入口缺失**：`QianmoLogoutButton` 为 `hidden sm:inline-flex`，移动端目前无退出入口；后续可在账户图标按钮（`UserCircle`）或移动抽屉菜单中复用同一个 `useSignOut()`。
- **本地 state 残留**：`queryClient.clear()` 不清组件本地 `useState`；若受保护页面把敏感数据复制进本地 state，退出到跳转完成前仍可能短暂展示。建议约束受保护数据由 query/session 驱动，不长期复制到本地 state。

## 任务18：退出登录补单测 + runSignOut 纯函数化（本轮）

- 把 `useSignOut` 里的退出编排抽成纯函数 `apps/web/src/hooks/sign-out-core.ts` 的 `runSignOut(deps)`（依赖注入 signOut/clearQueryCache/redirectToLogin/notifyError），hook 仅注入 React/Next 副作用 + `useRef` 防重入锁。这样核心「成功清缓存→跳转 / 失败提示」逻辑无需 jsdom/testing-library 即可用 vitest（node 环境）覆盖。
- `apps/web` 已装 vitest 但**无 jsdom / @testing-library/react**，且 `pnpm install` 属高风险联网操作不能自动跑——因此选择「纯函数化 + DI」而非直接测 React hook。新增最小 `apps/web/vitest.config.ts`（`vitest/config`，零新依赖）配置 `@ -> ./src` 别名与 node 环境。
- 重构顺带把退出从 better-auth `fetchOptions.onSuccess/onError` 回调改为对 `authClient.signOut()` 返回值 `{ error }` 的判定，等价且更易测。
- **codex 评审（阻断，已修复）**：`runSignOut` 初版只处理 resolve 后的 `{ error }`，**未捕获 `signOut()` 的 Promise reject**（网络层抛错）——旧 `fetchOptions.onError` 会覆盖请求失败，故非完全等价，且会产生未处理 rejection + 静默失败。修复为 `try/catch` 兜底，reject 也统一走 `notifyError` 且不跳转，并补 reject/message/statusText/调用次数等对抗分支测试（共 7 例全过）。
- codex 另指出 git diff 里 `UserMenu` 的 `push("/")→replace("/login")` 是可见行为变化——确认为**任务 17 既定变更**（已在任务17评审接受），非任务18引入，git diff 因尚未 commit 而一并显示。
