# 产品 Bug 修复 · Design

## 1. 登录/注册默认落地页与注册路由可达性

### 数据模型

不涉及数据库变更。

### 前端页面/组件设计

- 页面：`/login`
  - 设计稿：未提供，按现有 UI 保持不变。
  - 行为：无合法 `redirect` 参数时，登录成功跳转 `/summary`；合法 `redirect` 优先；非法/跨站 `redirect` 回落 `/summary`。
- 页面：`/register`
  - 设计稿：未提供，按现有 UI 保持不变。
  - 行为：未登录用户可直接访问；注册成功跳转规则与登录一致。

### 路由守卫

- `PUBLIC_PATHS` 包含 `/login`、`/register`。
- 未登录用户访问非公开路径时仍跳 `/login?redirect=<pathname>`。
- 已登录用户访问公开认证页时统一跳 `/summary`。
- `/dashboard` 保留为受保护且可访问页面。

### 测试设计

- 更新 `auth-redirect.test.ts`，覆盖默认落地页为 `/summary`、非法 redirect 回落 `/summary`。
- 新增 `proxy.test.ts`，覆盖 `/register` 公开可达、已登录用户访问 `/login`/`/register` 的默认跳转目标、受保护路径的登录重定向构造。

## 2. qm-workflow 迁移至 .claude

### 文件迁移

- 源目录：项目同级 `../qm-workflow/`
- 目标目录：项目内 `.claude/qm-workflow/`
- 保留 `README.md`、`templates/`、`demo/` 子结构。
- 迁移后删除源目录。

### README 更新

如 README 中存在“项目同级”“根目录 qm-workflow”等旧路径描述，更新为 `.claude/qm-workflow/`。

## 3. 可视化工作流刷新

### 数据来源

- 扫描 `Specs/*/tasks.md` 获取各需求任务总数与完成数。
- 若存在 `Specs/*/.qm-status.json`，仅作为状态参考，不覆盖 `tasks.md`。

### 输出

- `docs/workflow.md`：更新顶部当前需求/任务进度描述，补充当前批次。
- `docs/workflow.html`：当前工作状态包含 `product-bug-fixes` 和整体进度。
- `docs/office.html`：虚拟办公室展示当前批次执行状态。

## 4. GitHub 远程仓库自动提交

### 现状判断

- 当前仓库无 `origin` 远程配置。
- 当前仓库存在 GitHub Actions 部署 workflow，但无专门的自动提交 workflow。

### 方案约束

- 自动提交仅针对明确的生成产物，例如 `docs/workflow.*`、`Specs/*/.qm-status.json` 这类状态/看板文件。
- 业务代码、数据库 schema、基础设施代码仍保持人工审查和人工 push，不纳入无条件自动提交。
- workflow 需要加入防循环策略，例如：
  - 提交信息前缀标记为 `[skip ci]` 或约定的 bot message
  - 仅在指定分支触发
  - 跳过由 GitHub Actions bot 自身触发的二次运行

### 配置项

- GitHub remote：`origin`
- GitHub Actions 权限：`contents: write`
- 提交身份：bot 用户名 / bot 邮箱

### 验证设计

- 校验仓库是否配置远程：`git remote -v`
- 校验 workflow 触发条件、写权限和路径过滤
- 若未绑定 remote，则在文档中显式记录为阻塞项

## 5. AWS 自动发布

### 现状判断

- 已存在 [deploy.yml](/Users/lane/Documents/claude/qianmo-family-insurance/.github/workflows/deploy.yml:1)。
- 已存在 [deployment-aws.md](/Users/lane/Documents/claude/qianmo-family-insurance/docs/deployment-aws.md:1) 和 [sst.config.ts](/Users/lane/Documents/claude/qianmo-family-insurance/sst.config.ts:1)。
- 当前需要补齐的是“是否可用于当前仓库落地”的实施前置与验证闭环，而不是从零搭建部署架构。

### 方案约束

- `main` 自动发布 production，其他 stage 通过 `workflow_dispatch` 手动触发。
- 部署前必须通过类型检查和测试。
- GitHub Actions 不存长期 AWS AK/SK，统一走 OIDC `aws-actions/configure-aws-credentials`。

### 必备配置

- GitHub Secret：`AWS_DEPLOY_ROLE_ARN`
- AWS IAM：信任 GitHub OIDC provider 的部署角色
- SST Secrets：`BetterAuthSecret`、`AnthropicApiKey`

### 验证设计

- 复核 workflow 的触发器、quality gates 与文档一致性。
- 若 server package 缺少可执行测试脚本，需在实现任务中补齐或调整 workflow。
- 如当前环境无法访问 GitHub / AWS，则至少完成静态配置校验与文档闭环。

## 风险与权衡

- 中间件必须只放开认证页，不扩大业务页面公开范围。
- `redirect` 继续只接受站内绝对路径，避免开放重定向。
- 迁移 `../qm-workflow/` 涉及仓库外目录删除，执行时需确认文件权限并保留内容一致性。
- GitHub 自动提交若放宽到业务代码，会绕过正常评审流，因此范围必须严格限制。
- AWS 自动部署依赖外部 Secrets 与 IAM 配置；本地可完成 workflow 和文档实现，但真实部署验证可能受外部环境阻塞。
