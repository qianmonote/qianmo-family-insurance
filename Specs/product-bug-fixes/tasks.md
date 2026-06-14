# 产品 Bug 修复 · Tasks

| 序号 | 模块 | 描述 | 依赖 | 状态 |
|---|---|---|---|---|
| 1 | 前端认证 | 修复登录/注册默认落地页为 `/summary`，放开 `/register` 公开访问，并补充 Vitest 覆盖 | 无 | 已完成 |
| 2 | 工作流资产 | 将仓库同级 `qm-workflow/` 迁移到 `.claude/qm-workflow/` 并更新 README 路径描述 | 无 | 已完成 |
| 3 | 工作流看板 | 汇总 Specs 进度并刷新 `docs/workflow.md`、`docs/workflow.html`、`docs/office.html` | 1、2 | 已完成 |
| 4 | GitHub 自动化 | 盘点现有 Git 远程 / GitHub Actions 状态，设计 GitHub 远程仓库自动提交策略，限定自动提交范围、防循环策略与所需权限 | 无 | 已完成 |
| 5 | GitHub 自动化 | 实现或补齐自动提交 workflow / 脚本与说明文档，覆盖 remote 配置前置、bot 身份、触发分支与生成文件范围 | 4 | 已完成 |
| 6 | AWS 自动化 | 复核并完善 `.github/workflows/deploy.yml`、`docs/deployment-aws.md` 与 `sst.config.ts` 的自动发布闭环，明确 Secrets / OIDC / stage 策略 | 4 | 已完成 |
| 7 | 工作流看板 | 在新增自动化任务落地后，再次刷新 `docs/workflow.md`、`docs/workflow.html`、`docs/office.html` 以反映最终进度 | 5、6 | 已完成 |
