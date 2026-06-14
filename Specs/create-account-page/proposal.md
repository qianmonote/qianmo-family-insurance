# 需求提案：Create Account 页面设计稿还原

## 需求背景与目标

现有认证体系中，登录页（`login-new`）已有完整品牌设计稿并已还原为 `sign-in-form.tsx`（玻璃拟态卡片、Material Design 3 配色、IBM Plex Sans、中文文案）。但**注册（Create Account）页存在两处缺口**：

1. **设计系统缺口**：`product-page-design-system` 的设计稿清单（manifest）只有 登录 / 一键总结 / 总结记录 / 总结详情 四张，**没有 Create Account 设计稿**。
2. **实现缺口**：`sign-up-form.tsx` 仍是早期无品牌样式版本（英文标题 `Create Account`、纯 Tailwind、无玻璃卡），且只能通过 `/login` 内 toggle 进入，**没有独立路由**；而 `login-new` 设计稿里「新用户？立即加入」按钮已指向尚不存在的 `/register`。

目标：补齐 Create Account 设计稿并将其还原为品牌组件，落在独立 `/register` 路由，消除上述两处缺口，让登录/注册视觉与跳转闭环一致。

## Future 功能模块清单及优先级

| 优先级 | 模块 | 说明 |
|---|---|---|
| P0 | M1 设计稿产出 | codex 生成 create-account-new 设计稿并登记 manifest |
| P0 | M2 /register 路由与还原 | 新路由 + 品牌化 SignUpForm |
| P1 | M3 导航联通 | login ↔ register 跳转闭环，保留 redirect |

## 与现有系统的差异点 / 复用点

**复用：**
- 品牌基准：`Specs/product-page-design-system/design-assets/stitch/login-new/index.html`（设计 token 与版式直接派生）。
- 还原模式：`apps/web/src/components/sign-in-form.tsx`（已落地的品牌玻璃卡结构，Create Account 镜像其布局）。
- 业务逻辑：`@/lib/auth-client`（`authClient.signUp.email`）、`@/lib/auth-error`（`getAuthErrorMessage`）、`react`/`next/navigation` 的 `redirect` 处理，均已存在，直接复用。

**差异/新增：**
- 新增 `apps/web/src/app/register/page.tsx` 路由。
- 重写 `sign-up-form.tsx` 视觉层（逻辑保持）。
- 调整 `sign-in-form.tsx` / `login` 页的「新用户」入口为跳转 `/register`（而非现有的 `onSwitchToSignUp` 同页 toggle）。

## 范围边界

**本次包含：**
- Create Account 品牌设计稿（HTML）+ manifest 登记。
- `/register` 路由 + 品牌化注册表单（Name/Email/Password 三字段）。
- login ↔ register 跳转联通与 redirect 透传。
- 结构/文案层面的还原度核对 + 关键前端逻辑测试。

**本次不包含：**
- 后端 better-auth 配置变更、新增注册字段（手机号/验证码等）。
- 确认密码、服务条款勾选等新表单字段（本次明确沿用现有三字段）。
- 邮箱验证、注册风控等新业务流程。
- `/login` 页是否彻底移除 toggle 的产品决策（默认保留 SignInForm，仅把「去注册」入口改为路由跳转）。

## 待澄清问题列表

> 三个关键问题已与用户确认（2026-06-14）：

1. **设计稿产出方式**（stitch MCP 不可用）→ ✅ 采用 **codex 生成** create-account-new 设计稿（派生自 login-new 品牌）。
2. **还原落点路由** → ✅ **新建独立 `/register` 页**（与设计稿中 login 的跳转链接一致）。
3. **表单字段范围** → ✅ **沿用现有 Name / Email / Password 三字段**，不引入确认密码/条款勾选。

当前无阻塞性未决问题，可进入执行。

## 变更记录

- 2026-06-14：初次建立提案，确认设计稿产出方式（codex）、路由（/register）、字段（三字段）三项关键决策。
