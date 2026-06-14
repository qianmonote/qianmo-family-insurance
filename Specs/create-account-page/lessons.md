# Lessons：Create Account 页面设计稿还原

## 关键决策

- **设计稿产出走 codex**（stitch MCP 不可用）：以现有 `login-new/index.html` 为品牌基准，让 codex 派生 `create-account-new`。实测效果好——codex 完整保留了同一套 tailwind.config token、glass-effect、mesh-bg、渐变 accent，仅按需替换标题/字段/图标，风格与登录页高度统一。经验：有同体系的基准稿时，"派生"比"从零生成"更稳，应在 prompt 里显式要求复用基准稿的 config 与版式骨架。
- **还原以 in-app 既有页为准，而非设计稿像素**：设计稿是单栏+右侧配图，但实际 `/login` 已还原为"左表单卡 + 右深色营销面板"双栏。选择镜像 `sign-in-form.tsx` 的版式，保证登录/注册两页在真实应用里视觉一致，营销面板视为配图的功能等价物。记入 restoration-report 的"合理差异"。
- **路由保护现状**：项目当前**没有** `apps/web/src/middleware.ts`（link-summary 任务 8 描述过但实际未落盘/未提交）。路由保护由 `dashboard/page.tsx` 自行 `getSession` 实现。故 `/register` 默认公开，无需额外放行；但这也意味着全局中间件保护是个待补的缺口。

## 代码评审（codex）发现 — 已修复

- **[阻断] 开放重定向**：初版 `isSafeRedirect` 只判 `startsWith("/")`，会放行协议相对地址 `//evil.com`（浏览器解析为跨站）。`router.push("//evil.com")` 即跳出站。**修复**：额外拒绝第二字符为 `/` 或 `\` 的情况，并补 `//evil.com`、`/\evil.com` 的回落测试。
  - **教训**：站内 redirect 校验不能只看首字符 `/`，协议相对地址（`//`、`/\`）是经典开放重定向绕过点。可复用模式：抽 `isSafeRedirect` 纯函数集中校验 + 单测固化反例。
- **[阻断] 测试固化了漏洞**：初版测试把 `isSafeRedirect("//evil.com")` 断言成 `true` 并写了误导性注释。**教训**：测试断言要表达"期望的安全行为"，不能照抄当前实现输出；写到"看起来反直觉"的断言时应停下来质疑实现而非迁就它。

## 非阻断建议处理

- **校验错误文案英文 → 已统一为中文**：顺手把 `sign-up-form` 与 `sign-in-form` 的 zod 文案本地化（姓名/邮箱/密码），与中文页面一致。
- **「忘记密码」「记住登录」为静态控件**：sign-in-form 里这两个控件尚未接入真实逻辑（属既有还原现状，非本次引入）。暂保留，留待后续认证增强任务接入或禁用，避免误导。记此处为已知技术债。

## 可复用模式

- `src/lib/auth-redirect.ts`：登录/注册共享的 `isSafeRedirect` / `resolveRedirectTarget` / `buildAuthSwitchHref` 纯函数，集中 redirect 规则，两个表单复用、便于单测。后续任何"成功后跳转 + 跨页透传 redirect"的认证页都应复用它，避免规则漂移。
- **web 应用首次接入 Vitest**：web 此前无测试装置。本次按 server 同款（`vitest ^4.1.8` + `"test": "vitest run"`，无 config 文件、默认 node 环境）最小接入，仅测纯逻辑、不引 jsdom/Testing Library，符合 CLAUDE.md"前端优先覆盖 lib/hooks 纯逻辑"的取舍。
