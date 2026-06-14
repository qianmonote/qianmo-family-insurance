# 产品 Bug 修复 · Proposal

## 背景与目标

本批需求聚焦登录/注册链路、工作流资产归档和可视化看板刷新，目标是修复当前产品体验与项目协作资产中的明显偏差：

- 登录/注册成功后的默认落地页应进入链接一键总结 `/summary`，而不是历史默认 `/dashboard`。
- 注册页应作为公开认证页可直接访问，避免未登录用户从登录页跳注册时被中间件弹回登录页。
- 将仓库同级的 `qm-workflow/` 归入项目 `.claude/qm-workflow/`，与 Claude 工作流资产同层管理。
- 刷新 `docs/workflow.md`、`docs/workflow.html`、`docs/office.html`，体现当前所有 Specs 的进度。
- 补齐 GitHub 远程仓库自动提交与 AWS 自动发布的仓库级自动化方案。

## 变更记录

### 2026-06-14 · 增量需求补充

- 新增 F5：GitHub 远程仓库自动提交
- 新增 F6：自动发布代码至 AWS
- 受影响已完成项：任务 3「工作流看板」需复核，因为任务总数与当前批次状态发生变化，文档看板需反映新增自动化需求进度

## 涉及实体与模块

- 前端认证跳转：`apps/web/src/lib/auth-redirect.ts`
- 前端路由守卫：`apps/web/src/proxy.ts`
- 登录/注册表单：`apps/web/src/components/sign-in-form.tsx`、`apps/web/src/components/sign-up-form.tsx`
- 工作流资产：项目根目录 `.claude/qm-workflow/`
- 工作流看板：`docs/workflow.md`、`docs/workflow.html`、`docs/office.html`
- GitHub 自动化：`.github/workflows/`
- AWS 发布配置：`sst.config.ts`、`docs/deployment-aws.md`

## 差异与复用点

- 复用现有 `resolveRedirectTarget` / `isSafeRedirect` 作为开放重定向防护的唯一入口。
- 复用 Next.js proxy 中间件结构，只扩大公开认证页白名单到 `/login`、`/register`。
- 复用现有 Vitest 配置与同目录测试命名规范。
- 工作流看板仅汇总 Specs 状态，不改变各需求目录内既有状态文件。
- 复用现有 `.github/workflows/deploy.yml`、`sst.config.ts` 与 `docs/deployment-aws.md`，优先做复核、补齐和收口，而不是另起一套部署体系。

## 范围边界

本批不重构登录/注册 UI，不新增真实短信/手机号认证能力，不改变 `/dashboard` 页面可访问性，也不修改 link-summary 业务逻辑。自动提交范围限定为仓库级自动化资产与明确的生成文件，不把任意业务代码自动推送到远端。

## 待澄清问题

- 当前 `git remote -v` 为空，实施 F5 之前需要用户提供 GitHub 远程仓库 URL，或确认稍后由用户手动绑定。
- F6 依赖 GitHub `AWS_DEPLOY_ROLE_ARN` 和 SST Secrets 已预先配置；若缺失，将阻塞真实部署验证，但不阻塞需求拆解与本地文档/工作流实现。
