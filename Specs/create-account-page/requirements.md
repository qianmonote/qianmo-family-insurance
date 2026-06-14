# Requirements：Create Account 页面设计稿还原

> 需求主题：`create-account-page`
> 目标：为「Create Account（注册）」页补齐缺失的品牌设计稿，并将其还原为项目内的真实 React 组件，承载在独立的 `/register` 路由上，与现有 `login-new` 品牌设计体系保持一致。

## Future 功能模块

本需求为一个内聚的前端 + 设计交付，拆为 3 个子模块：

### M1 · Create Account 设计稿产出

- **目标**：补齐设计系统中缺失的「Create Account」品牌设计稿。
- **关键能力**：
  - 参照现有 `login-new`（glassmorphism 玻璃卡 + Material Design 3 配色 token + IBM Plex Sans + Material Symbols）品牌语言，由 codex 生成 `create-account-new` 设计稿（自包含 `index.html`）。
  - 登记到 `design-assets/stitch/manifest.json`，与既有 4 张设计稿并列。
- **依赖**：现有 `login-new/index.html`（品牌基准）。

### M2 · /register 路由与页面还原

- **目标**：新建独立 `/register` 路由承载 Create Account，并把 M1 设计稿还原为品牌风格的注册表单组件。
- **关键能力**：
  - 新增 `apps/web/src/app/register/page.tsx` 路由。
  - 将 `sign-up-form.tsx` 由当前无品牌样式重做为品牌风格，复用 `sign-in-form.tsx` 已建立的还原模式（玻璃卡、品牌配色、中文文案、图标输入框、密码可见切换）。
  - 表单字段沿用现有 **Name / Email / Password** 三字段，复用 better-auth `signUp.email`、`getAuthErrorMessage`、`redirect` 跳转逻辑。
- **依赖**：M1 设计稿；现有 `authClient`、`auth-error`、`sign-in-form.tsx` 模式。

### M3 · 导航联通与一致性

- **目标**：让登录/注册两页互相联通，跳转链接与设计稿一致。
- **关键能力**：
  - `login-new` 设计中「新用户？立即加入」按钮已指向 `/register`，将 `sign-in-form.tsx` 的切换入口改为跳转 `/register`。
  - `/register` 页内「已有账号？登录」跳回 `/login`。
  - 保留 `redirect` 查询参数在两页之间传递。
- **依赖**：M2。

## 验收标准（Acceptance Criteria）

### AC-M1（设计稿产出）
- AC-M1.1：`Specs/create-account-page/design-assets/stitch/create-account-new/index.html` 存在，可双击在浏览器打开、零外部构建依赖。
- AC-M1.2：设计稿复用 login-new 的品牌 token（`primary #003ec7`、secondary 绿、tertiary 紫、IBM Plex Sans、glass-effect、mesh-bg、顶部渐变 accent），视觉与 login 同属一套系统。
- AC-M1.3：设计稿包含 Name / Email / Password 三个字段、主行动按钮「立即注册」、以及「已有账号？登录」次级入口。
- AC-M1.4：`manifest.json` 的 `screens` 数组新增一条 create-account 记录，`localFiles.html` 指向该文件。

### AC-M2（路由与还原）
- AC-M2.1：访问 `/register` 渲染品牌风格的 Create Account 页（玻璃卡 + 品牌配色），与 `sign-in-form` 视觉一致。
- AC-M2.2：表单含 Name / Email / Password 三字段，前端校验规则不变（name ≥ 2、email 合法、password ≥ 8）。
- AC-M2.3：提交成功调用 `authClient.signUp.email`，成功后按 `redirect` 参数跳转（缺省 `/dashboard`），并 toast「注册成功」。
- AC-M2.4：提交失败通过 `getAuthErrorMessage` 给出本地化错误文案 toast，沿用 link-summary 既有错误文案约定（如邮箱已注册）。
- AC-M2.5：页面遵循 CLAUDE.md 前端规则——不在组件内直接 `fetch`，表单走既有 auth client 封装。

### AC-M3（导航联通）
- AC-M3.1：`/login` 页「新用户/立即加入」入口点击后跳转 `/register`。
- AC-M3.2：`/register` 页「已有账号？登录」点击后跳转 `/login`。
- AC-M3.3：从带 `?redirect=` 的 `/login` 进入 `/register` 再注册成功，仍跳回原 `redirect` 目标。

## 非功能需求
- 安全：密码输入框 `type="password"`，可见切换为纯前端展示态，不记录明文日志。
- 一致性：所有可见文案以中文为主，与 login-new 设计稿语气一致。
- 还原度：结构/文案层面与设计稿一致（无可交互真实视觉比对环境时降级为结构/文案核对）。
