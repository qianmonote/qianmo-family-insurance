# AWS Serverless 部署指南

阡陌家庭保通过 [SST v3](https://sst.dev/) 部署到 AWS，全栈 Serverless：

| 组件 | AWS 资源 | 说明 |
|---|---|---|
| 后端 API | Lambda + Function URL | Hono 应用（`apps/server/src/lambda.ts`）。用 Function URL 而非 API Gateway，规避 29s 超时 |
| 异步视频总结 | SQS + Worker Lambda | `apps/server/src/worker.ts` 串行消费（batch=1），避免并发调用 AI 超限 |
| 数据库 | Aurora Serverless v2 (PostgreSQL) | 置于 VPC 内，按需伸缩 |
| 前端 | CloudFront + Lambda (OpenNext) | Next.js（`apps/web`） |
| 敏感配置 | SST Secret | `BetterAuthSecret` / `AnthropicApiKey` |

## 架构要点

- **为什么改造任务队列**：原内存队列（`task-queue.ts`）依赖进程常驻后台处理，而 Lambda 返回响应后会冻结执行环境，后台任务不会执行。生产环境通过 `VIDEO_QUEUE_URL` 环境变量切换为 SQS 投递，由独立 worker Lambda 消费。本地开发未设置该变量时回退到内存队列，行为不变。
- **数据库连接**：Aurora 在 VPC 内，Lambda 同 VPC 访问。高并发下注意连接数，必要时引入 RDS Proxy。
- **无自定义域名**：CORS 与 Better-Auth `trustedOrigins` 在应用层按内置模式（`localhost` / `*.cloudfront.net` / `*.lambda-url.*.on.aws`）反射校验，`BETTER_AUTH_URL` 留空由请求推断。因此前后端无循环依赖。
  - ⚠️ **已知限制**：前端（CloudFront 域）与后端（Function URL 域）跨站，登录 Cookie 为第三方 Cookie（`SameSite=None`），部分浏览器可能拦截。**生产建议绑定自定义域名**（如 `app.example.com` + `api.example.com`），或用 CloudFront 行为把 `/api/*` 反代到 API，使前后端同域。

## 首次部署

前置：已配置 AWS 凭证（`aws sts get-caller-identity` 可用），Node 22 + pnpm。

```bash
# 1. 安装 SST providers（需官方 npm registry；若本地配了镜像源，临时切换）
#    npm registry 为镜像时：echo 'registry=https://registry.npmjs.org/' > .npmrc，install 后删除
pnpm sst install

# 2. 设置密钥（生产 stage）
pnpm sst secret set BetterAuthSecret "$(openssl rand -base64 32)" --stage production
pnpm sst secret set AnthropicApiKey "sk-ant-..." --stage production

# 3. 预览将创建的资源（dry-run）
pnpm sst:diff

# 4. 部署
pnpm deploy            # = sst deploy --stage production
```

部署完成后输出 `api` / `web` / `queue` 三个 URL。

## 数据库迁移

Aurora 在 VPC 内，本地需通过 bastion 隧道连接后再迁移（两个终端）：

```bash
# 终端 A：开隧道（保持运行）
pnpm sst tunnel --stage production

# 终端 B：注入生产连接串并执行 drizzle 迁移
pnpm db:migrate:prod
```

## 自动化部署（CI/CD）

`.github/workflows/deploy.yml`：push 到 `main` 自动部署生产，或手动 `workflow_dispatch` 指定 stage。

仓库还包含 `.github/workflows/sync-generated-artifacts.yml`，用于把 `docs/workflow.*`、`docs/office.html` 和 `Specs/*/.qm-status.json` 这类生成产物自动提交回远程仓库。为了避免 bot 回推这些文件时误触发生产部署，`deploy.yml` 已通过 `paths-ignore` 和 `github-actions[bot]` 条件跳过这类提交。

通过 GitHub OIDC 假设 IAM 角色（无需在 GitHub 存长期密钥），需在仓库 Secrets 配置：

- `AWS_DEPLOY_ROLE_ARN`：信任 GitHub OIDC provider 的部署角色 ARN

若要启用自动提交生成产物，还需在仓库 Settings > Actions > General 中允许 `GITHUB_TOKEN` 具备 `Read and write permissions`，并确保默认分支允许 GitHub Actions push 回仓库。

本地 `git remote -v` 当前为空，因此 GitHub 远程仓库地址仍需由项目维护者绑定为 `origin`。这不会影响 GitHub Actions 在远端仓库内运行，但会影响本地直接 push / 远端联调。

CI 中的密钥（`BetterAuthSecret` / `AnthropicApiKey`）通过 `sst secret set` 预先写入各 stage，部署时自动读取。

## 移除环境

```bash
pnpm deploy:remove     # sst remove --stage production（production 默认 retain 数据库）
```
