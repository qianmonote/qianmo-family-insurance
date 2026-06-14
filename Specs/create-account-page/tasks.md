# 任务清单：Create Account 页面设计稿还原

状态枚举：待开始 / 进行中 / 已完成 / 阻塞 / 需复核

| 编号 | 模块 | 类型 | 任务描述 | 依赖 | 验收标准 | 状态 |
|---|---|---|---|---|---|---|
| 1 | M1 设计稿产出 | 设计 | 用 codex 生成 `design-assets/stitch/create-account-new/index.html`：派生自 login-new 品牌（glass-effect/mesh-bg/MD3 token/IBM Plex Sans/Material Symbols），含 Name/Email/Password 三字段 + 「立即注册」主按钮 + 「已有账号？登录」次级入口 | - | AC-M1.1~M1.3 | 已完成 |
| 2 | M1 设计稿产出 | 设计 | 在 `design-assets/stitch/manifest.json` 的 `screens` 追加 create-account 记录，`localFiles.html` 指向 create-account-new/index.html | 1 | AC-M1.4 | 已完成 |
| 3 | M2 路由与还原 | 前端 | 新建 `apps/web/src/app/register/page.tsx`：`"use client"` + `<Suspense fallback={<Loader/>}>` 包裹品牌版 `<SignUpForm/>`；确认无 `middleware.ts` 路由保护拦截 `/register`（项目当前无 Next middleware，注册页默认公开） | 2 | AC-M2.1, AC-M2.5 | 已完成 |
| 4 | M2 路由与还原 | 前端 | 重做 `sign-up-form.tsx` 视觉层为品牌风格（镜像 sign-in-form：玻璃卡/品牌配色/中文文案/图标输入框/密码可见切换/「创建账户」标题/「立即注册」按钮）；保留 react-form+zod 校验与 `authClient.signUp.email`、redirect、错误 toast 逻辑；将 props 切换入口改为跳转 `/login` | 3 | AC-M2.1~M2.5 | 已完成 |
| 5 | M3 导航联通 | 前端 | 联通跳转：`sign-in-form.tsx` 「新用户/立即加入」改为跳 `/register`（保留 redirect）；`login/page.tsx` 去除 SignUpForm toggle 分支仅留 SignInForm；`/register` 内「已有账号？登录」跳 `/login` | 4 | AC-M3.1~M3.3 | 已完成 |
| 6 | M2/M3 验证 | 测试 | 还原度（结构/文案）+ 关键逻辑测试：注册成功 redirect 规则、错误文案映射、跳转入口存在性断言（Vitest + Testing Library，必要时 mock authClient）；结果记入 design-assets/ 与 lessons.md | 5 | AC-M2.2~M2.4, AC-M3.1~M3.3 | 已完成 |

## 父任务/子任务说明

当前所有任务粒度均控制在半天内，暂无需拆分子任务。任务 4（视觉还原）若实际工作量超出预期，可拆为 `4.1 布局骨架` / `4.2 字段与交互` / `4.3 文案与跳转`。
