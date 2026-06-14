# 技术方案设计：Create Account 页面设计稿还原

## 数据模型设计

无新增/修改数据模型。注册沿用现有 better-auth `user` 表与 `signUp.email`（Name/Email/Password），不触碰 `packages/db` schema。

## API 设计

无新增后端接口。前端直接调用 better-auth client：

- `authClient.signUp.email({ name, email, password }, { onSuccess, onError })`
  - 成功：读取 `searchParams.get("redirect")`，`startsWith("/")` 时跳该地址，否则 `/dashboard`；toast「注册成功」。
  - 失败：`getAuthErrorMessage(error.error)` 转中文文案 toast。

鉴权要求：注册页为公开页（未登录可访问）；`apps/web/src/middleware.ts` 的路由保护需放行 `/register`（与 `/login` 同级，确认其不在受保护重定向范围内）。

## 前端页面/组件设计

### 路由
- 新增 `apps/web/src/app/register/page.tsx`
  - `"use client"`，`<Suspense fallback={<Loader />}>` 包裹（因使用 `useSearchParams`，与 `/login` 一致）。
  - 渲染 `<SignUpForm />`（品牌版）。

### 组件：`sign-up-form.tsx`（重做视觉层，保留逻辑）
- **设计稿**：`Specs/create-account-page/design-assets/stitch/create-account-new/index.html`（由 M1 codex 产出，派生自 login-new）。
- 结构镜像 `sign-in-form.tsx`：
  - 外层 `relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f8f9ff] p-6` + mesh 渐变背景层。
  - 左上固定品牌字「阡陌家庭保」。
  - 玻璃卡：`rounded-xl border border-[#c3c5d9]/70 bg-white/85 p-8 shadow-2xl backdrop-blur-xl`，顶部 `h-1.5` 三色渐变 accent。
  - header：盾牌图标徽标 + 标题「创建账户」+ 副标题「开启您的智能家庭保险管家」。
  - 字段：Name（person 图标）、Email（mail 图标）、Password（lock 图标 + 可见切换 eye）；沿用 `@qianmo-family-insurance/ui` 的 Input/Label/Button 或与 sign-in-form 相同的内联输入框样式（保持两页一致）。
  - 主按钮「立即注册」+ 箭头图标；次级入口「已有账号？登录」→ 跳 `/login`（保留 redirect）。
- **状态与交互**：沿用现有 `@tanstack/react-form` + zod 校验（name ≥ 2 / email 合法 / password ≥ 8）；`authClient.useSession().isPending` 时渲染 `<Loader />`。
- **Props 变更**：移除 `onSwitchToSignIn` 回调依赖，改为内部 `Link`/`router.push("/login")` 跳转；保留 redirect 透传。

### `sign-in-form.tsx` / `login` 页联动
- `sign-in-form.tsx`「新用户/立即加入」入口由 `onSwitchToSignUp()` 改为跳转 `/register`（保留当前 `?redirect=`）。
- `login/page.tsx` 不再需要 `showSignIn` toggle 承载注册分支；保留 SignInForm 渲染，去除 SignUpForm 分支（注册改由 `/register` 承载）。该调整在 M3 任务中执行。

## 关键业务逻辑

注册流程状态机（前端）：

```
idle → (submit) → validating → (zod 通过) → submitting
  submitting → onSuccess → redirect 跳转 + toast 成功
  submitting → onError   → toast 本地化错误 → 回到 idle
  validating → (zod 失败) → 字段错误展示 → 回到 idle
```

redirect 取值规则（与 sign-in-form 完全一致）：`const r = searchParams.get("redirect"); router.push(r && r.startsWith("/") ? r : "/dashboard")`。

## 存储 & 第三方集成

无新增存储/第三方。设计稿为本地 HTML，引用的 Tailwind CDN / Google Fonts / Material Symbols 仅用于设计稿预览，不进入项目构建产物（还原后的 React 组件使用项目内 Tailwind 与 lucide-react 图标）。

## 云资源

无。

## 风险与权衡

- **设计稿字体/图标**：设计稿用 IBM Plex Sans + Material Symbols；项目实际用系统字体栈 + lucide-react。还原时以「视觉等价」为准（图标语义对应：mail/lock/person/visibility → lucide 的 Mail/Lock/User/Eye），不强行引入新字体依赖，与已还原的 sign-in-form 保持同一取舍。
- **toggle vs 路由**：从同页 toggle 改为独立路由，需同步检查所有进入注册的入口（login 页按钮、可能的 header CTA），避免出现死链。已在 M3 覆盖 login 入口。
- **还原度验证**：无 stitch MCP 在线比对，按 CLAUDE.md 规则降级为结构/文案层面核对（Playwright/Testing Library 断言关键元素），结果记入 design-assets 与 lessons。
