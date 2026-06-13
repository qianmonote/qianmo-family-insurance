# 需求提案：登录模块 + 链接一键总结

来源 PRD：`docs/prd-link-summary.md` (v1.1)

## 1. 背景与目标

- 建立用户账号体系（邮箱+密码），为后续家庭成员/保单/总结等个性化数据打下基础。
- 新增"链接一键总结"功能：用户粘贴外部链接（公众号文章、小红书图文/视频、抖音、B站视频、公开网站文章），系统抓取内容并通过 AI 生成结构化总结。
- 本期（v1）仅交付 PC 端网页（≥1280px），不做移动端适配。

## 2. 涉及的核心业务实体及变更点

- **User**：复用 Better-Auth 已生成的 `user`/`session`/`account`/`verification` 表，无需新增字段（手机号登录走预留扩展位，本期不实现）。
- **LinkSummary**（新增）：归属 User，记录一次链接总结任务，字段见 `design.md` 数据模型部分。

## 3. 与现有系统的差异点 / 复用点

已有脚手架（Better-T-Stack 生成）：

- `packages/auth`：Better-Auth 已配置 email/password，`packages/db/src/schema/auth.ts` 已有 user/session/account/verification 表 → **直接复用**，无需重新设计注册/登录后端逻辑。
- `apps/web/src/app/login/page.tsx` + `sign-in-form.tsx` / `sign-up-form.tsx`：已有基础注册/登录表单（使用 tanstack/react-form + zod + better-auth client）→ **复用并按 PRD 错误文案要求微调**。
- `apps/web/src/app/dashboard/page.tsx`：已有 session 校验 + 重定向逻辑，但仅做了首页一处保护，**未做全局路由保护**（PRD L-5 要求所有受保护页面统一处理）→ 需新增全局中间件/布局级校验。
- `apps/server/src/index.ts`：仅有 auth handler，无业务路由 → 需新增 `LinkSummary` 相关 REST 路由、service 层、鉴权 middleware。
- 前端缺少 TanStack Query Provider → 需新增（用于总结记录列表轮询、详情查询）。
- 无 AI SDK 依赖 → 需新增 `@anthropic-ai/sdk`（或等价 fetch 调用）用于 AI 总结生成。

无需新增的：登录态保持 7 天为 Better-Auth 默认/可配置 session 过期时间，复用其 session 机制。

## 4. 范围边界

### 4.1 本次包含

- L-1 ~ L-6：注册、登录、登出、7天登录态、全局路由保护、统一错误文案
- S-1 ~ S-10：链接输入、类型识别、补充要求、图文/视频抓取（**Mock/占位实现**）、AI 总结（Claude）、异步任务（内存队列+DB状态轮询）、记录列表与重试、异常处理

### 4.2 本次不包含（遵循 PRD 第6节）

- 手机号+验证码登录（L-7，预留扩展位）
- 第三方账号登录、分享导出、多语言、二次编辑/笔记
- 移动端适配
- 真实的公众号/小红书/抖音/B站内容抓取第三方服务接入（本期用 mock/占位抓取器，模块化设计以便后续替换为真实服务）

## 5. 关键技术决策（已与用户确认）

| 决策项 | 选择 |
|---|---|
| 内容抓取 | 公开网站文章走真实 fetch+HTML 解析；公众号/小红书/抖音/B站走 mock 抓取器（返回占位标题+正文/字幕），抓取层按 `ContentFetcher` 接口模块化，便于后续替换为真实第三方服务 |
| AI 总结 | Anthropic Claude API（`@anthropic-ai/sdk`，模型 `claude-sonnet-4-6`），需新增 `ANTHROPIC_API_KEY` 环境变量 |
| 异步任务 | 进程内内存队列 + DB 状态字段（pending/processing/success/failed），前端轮询任务详情接口获取状态 |
| 记录保留策略 | 本期不限制数量与保留期限 |

## 6. 待澄清问题

无阻塞性待澄清问题（PRD 中 Q-1/Q-2/Q-3 已通过上述技术决策达成一致：Q-2 抓取依赖第三方服务问题，本期以 mock 占位回避，留待后续接入真实服务时单独评估成本）。
