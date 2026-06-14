# 产品 Bug 修复 · Requirements

来源：`/qm:prd` 命令参数（产品 bug 批次，2026-06-14）

增量补充：2026-06-14 新增需求

- GitHub 远程仓库的自动提交
- 自动发布代码至 AWS

## Future 功能模块

### F1 登录/注册默认落地页 → 一键总结（/summary）
**目标**：登录成功、注册成功后，默认落地到「链接一键总结」页 `/summary`，而非当前的 `/dashboard`。`/dashboard` 仍保留可访问。

**功能点**
- 登录成功（无 `redirect` 查询参数时）默认跳 `/summary`（PRD#1）
- 注册成功（无 `redirect` 查询参数时）默认跳 `/summary`（PRD#3）
- 已登录用户访问公开页（`/login`、`/register`）时由中间件兜底跳 `/summary`
- 携带合法 `redirect` 参数时仍优先跳该参数（保留开放重定向防护）

**验收标准（AC-F1）**
- AC-F1-1：未登录用户在 `/login` 用有效账号登录，**且 URL 无 `redirect` 参数** → 跳转至 `/summary`。
- AC-F1-2：未登录用户在 `/register` 完成注册，**且 URL 无 `redirect` 参数** → 跳转至 `/summary`。
- AC-F1-3：访问 `/summary` 被中间件拦截到 `/login?redirect=/summary` 后登录成功 → 回到 `/summary`（`redirect` 优先级高于默认值，回归不破坏）。
- AC-F1-4：已登录用户直接访问 `/login` 或 `/register` → 中间件重定向至 `/summary`。
- AC-F1-5：`resolveRedirectTarget(null)` 单测返回 `/summary`；非法/跨站 `redirect`（如 `//evil.com`）仍回落 `/summary`。

### F2 注册路由可达性修复（/register 不再被弹回登录）
**目标**：登录页点击「新用户？立即加入」能真正进入 `/register` 注册页，而不是被路由守卫弹回 `/login`。

**根因**：`apps/web/src/proxy.ts` 的 `PUBLIC_PATHS` 仅含 `/login`，未含 `/register`；未登录用户导航到 `/register` 时无 session cookie → 中间件判定为受保护路由 → 重定向回 `/login?redirect=/register`。

**功能点**
- 将 `/register` 加入公开路径白名单
- 保持已登录用户访问 `/register` 时被兜底重定向（与 `/login` 一致，跳 F1 的默认页）

**验收标准（AC-F2）**
- AC-F2-1：未登录用户在 `/login` 点击「新用户？立即加入」→ 停留在 `/register` 并渲染注册表单（不被弹回 `/login`）。
- AC-F2-2：未登录用户直接访问 `/register` → 正常渲染注册页（不重定向）。
- AC-F2-3：已登录用户访问 `/register` → 中间件重定向至 `/summary`。

### F3 qm-workflow 迁移至 .claude
**目标**：将工作区根目录的 `qm-workflow/`（项目 git 仓库之外）整体移动到 `.claude/qm-workflow/`，与 `.claude/commands`、`.claude/skills` 同级。

**功能点**
- 整体移动 `qm-workflow/`（含 `templates/`、`demo/`、`README.md`）到 `.claude/qm-workflow/`，保留子结构
- 删除原 `qm-workflow/` 目录
- 更新 `.claude/qm-workflow/README.md` 中对自身位置的描述（如有）

**验收标准（AC-F3）**
- AC-F3-1：`.claude/qm-workflow/{README.md,templates/,demo/}` 存在且内容与原目录一致。
- AC-F3-2：工作区根目录不再存在 `qm-workflow/`。
- AC-F3-3：迁移后 README 对路径的描述无错误指向。

### F4 更新可视化工作流
**目标**：刷新 `qianmo-family-insurance/docs/` 下的可视化工作流看板（`workflow.md` / `workflow.html` / `office.html`），使其反映当前全部需求（含本批 `product-bug-fixes`）的真实进度。

**功能点**
- 汇总 `Specs/*/` 各需求与任务状态，更新 `docs/workflow.md` 的「当前需求 / 进度」描述
- 同步 `docs/workflow.html`、`docs/office.html` 看板中的需求清单与进度数字
- 与各 `Specs/<主题>/.qm-status.json` 不冲突（只读引用其状态）

**验收标准（AC-F4）**
- AC-F4-1：`docs/workflow.md` 顶部「当前需求 / 任务进度」反映最新批次，不再停留在 link-summary 17/17 单一描述。
- AC-F4-2：`docs/workflow.html` / `docs/office.html` 中的需求列表包含 `product-bug-fixes`，进度数字与 `tasks.md` 一致。
- AC-F4-3：页面可正常打开（HTML 结构无破坏，mermaid/脚本不报错）。

### F5 GitHub 远程仓库自动提交
**目标**：为项目补齐 GitHub 远程仓库协作链路，使代码可以被规范地自动提交到远程仓库，至少覆盖远程仓库配置检查、分支触发策略和自动 push 所需的工作流约束。

**当前现状**
- 本地仓库已初始化 git，但 `git remote -v` 当前为空，尚未绑定 GitHub 远程仓库。
- 仓库内暂无自动 commit / push 的 GitHub workflow。

**功能点**
- 明确远程仓库接入前置条件：GitHub 仓库 URL、默认分支、Actions 权限策略
- 设计自动提交策略：限定触发来源、提交内容范围、提交用户身份，避免无限触发循环
- 补充自动 push 到 GitHub 的 workflow 或脚本方案文档，并约束仅对明确的生成产物生效（如 docs / workflow 状态文件），不对业务代码做无条件自动提交

**验收标准（AC-F5）**
- AC-F5-1：存在明确的 GitHub 远程仓库接入说明，覆盖 `origin` 配置方式和所需权限。
- AC-F5-2：存在自动提交/推送方案设计，包含触发条件、提交用户、分支范围和防循环策略。
- AC-F5-3：方案明确限制自动提交范围，不会对任意业务代码变更做无审查自动 push。

### F6 自动发布代码至 AWS
**目标**：将当前已有的 SST + GitHub Actions 部署能力纳入本批需求，补齐自动发布到 AWS 的实现约束、前置配置和验证标准。

**当前现状**
- 仓库已存在 `.github/workflows/deploy.yml`，支持 `push` 到 `main` 和 `workflow_dispatch` 触发部署。
- 仓库已存在 `sst.config.ts` 与 `docs/deployment-aws.md`，描述 AWS Serverless 部署方式。
- 当前仍需核实 CI 前置：GitHub Secrets、OIDC IAM 角色、测试脚本完整性、部署 stage 策略。

**功能点**
- 复核并完善现有 `deploy.yml` 的自动发布链路（安装依赖、类型检查、测试、OIDC、SST deploy）
- 补充 GitHub Secrets / AWS IAM / SST Secret 的必备清单与配置步骤
- 明确自动发布触发策略：`main` 分支自动发 production，其他 stage 手动触发

**验收标准（AC-F6）**
- AC-F6-1：存在面向本仓库的 AWS 自动发布方案说明，覆盖 GitHub Actions、OIDC、Secrets、SST stage。
- AC-F6-2：`deploy.yml` 的触发策略、依赖安装、质量门禁与部署步骤与文档描述一致。
- AC-F6-3：若存在阻塞项（如缺失 GitHub Secret 或 remote 未配置），在 proposal/design/tasks 中明确记录，不隐式跳过。

## 非功能需求
- 开放重定向防护（F1/F2）：所有跳转目标必须经 `isSafeRedirect` 校验，禁止跨站。
- 中间件改动不得放开任何受保护业务页（仅放开认证页 `/login`、`/register`）。
- GitHub / AWS 自动化仅允许在受控分支和受控文件范围内运行，避免形成自触发循环或未审核的生产变更。
