# 产品 Bug 修复 · Lessons

## 记录

- 2026-06-14：初始化 proposal/design/tasks，需求无阻塞澄清项。登录/注册修复优先合并为一个最小执行单元，因为二者共享跳转默认值和中间件公开页白名单。
- 2026-06-14：任务 1 完成。`DEFAULT_AUTH_REDIRECT` 改为 `/summary`，`/register` 加入 proxy 公开认证页；新增 `proxy.test.ts` 覆盖公开页白名单、已登录认证页跳转和受保护路径 redirect 构造。验证命令：`pnpm --filter web test -- auth-redirect proxy`，结果 4 个测试文件、19 个用例通过。
- 2026-06-14：任务 1 Codex CLI 评审未执行成功。`command -v codex` 返回 `/Users/lane/.local/bin/codex`，但执行时报错 `/Users/lane/.nvm/versions/node/system/bin/codex: No such file or directory`。按规则记录原因后继续，不阻塞本批 bug 修复。
- 2026-06-14：任务 2 完成。`../qm-workflow` 已迁移到项目内 `.claude/qm-workflow/`，原目录已不存在；README 补充当前位置说明。
- 2026-06-14：任务 3 完成。`docs/workflow.md`、`docs/workflow.html`、`docs/office.html` 已刷新为全部 Specs 多需求进度视图，当前汇总为 32/32 已完成。
- 2026-06-14：需求发生增量扩展，新增 GitHub 远程仓库自动提交与 AWS 自动发布范围。按 `/qm:prd` 规则已在 proposal/design/tasks 中追加，并将既有看板任务标记为 `需复核`。
- 2026-06-14：任务 4 完成。确认当前 `git remote -v` 为空，因此 GitHub 远程仓库绑定仍是外部前置；自动提交方案改为仅覆盖生成产物（`docs/workflow.*`、`docs/office.html`、`Specs/*/.qm-status.json`），避免业务代码被无审查自动 push。
- 2026-06-14：任务 5 完成。新增 `scripts/refresh-workflow-artifacts.mjs`、`scripts/commit-generated-artifacts.sh` 与 `.github/workflows/sync-generated-artifacts.yml`，形成“刷新看板 -> 提交限定生成文件 -> push”的 GitHub 自动化闭环；通过 `push.paths` + `github-actions[bot]` 条件避免自触发循环。
- 2026-06-14：任务 6 完成。`deploy.yml` 增加 `paths-ignore` 与 `github-actions[bot]` 条件，避免生成文件回推触发生产部署；`docs/deployment-aws.md` 补充了 `GITHUB_TOKEN` 写权限、`AWS_DEPLOY_ROLE_ARN`、SST secrets 和本地 remote 缺失的说明。
- 2026-06-14：任务 7 完成。工作流看板改为由 `pnpm workflow:refresh` 脚本回写汇总区块。验证命令：`pnpm workflow:refresh`、`bash -n scripts/commit-generated-artifacts.sh`。
