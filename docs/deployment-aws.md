# AWS Serverless 部署指南

阡陌家庭保通过 [SST v3](https://sst.dev/) 部署到 AWS，全栈 Serverless：

| 组件 | AWS 资源 | 说明 |
|---|---|---|
| 后端 API | Lambda + Function URL | Hono 应用（`apps/server/src/lambda.ts`）。用 Function URL 而非 API Gateway，规避 29s 超时；所有来源类型在请求内同步处理。**无 VPC**，Lambda 默认公网出口 |
| 数据库 | 外部 Serverless Postgres（Neon） | VPC 外，经公网 + SSL 连接；连接串以 Secret `DatabaseUrl` 注入。省去 VPC/NAT/bastion 固定成本 |
| 前端 | CloudFront + Lambda (OpenNext) | Next.js（`apps/web`） |
| 敏感配置 | SST Secret | `DatabaseUrl` / `BetterAuthSecret` / `AnthropicApiKey` |

## 架构要点

- **同步处理所有来源**：视频类来源当前为占位（mock）抓取，瞬时返回，与图文类逻辑一致，统一在 API 请求内同步处理（Lambda 5min 超时足够）。未接入真实长耗时视频解析前不引入 SQS + worker 异步设施；后续接入时再恢复异步队列（参见 git 历史中的 SQS 实现）。
- **数据库连接**：使用 Neon（外部 Serverless Postgres），连接串以 Secret `DatabaseUrl` 注入。**务必使用 Neon 的「Pooled connection」端点**（host 含 `-pooler`）并带 `?sslmode=require`，由 Neon 内置 PgBouncer 承接 Lambda 高并发短连接，避免连接数耗尽。`pg` + `drizzle-orm/node-postgres` 连接层无需改动。
- **无自定义域名**：CORS 与 Better-Auth `trustedOrigins` 在应用层按内置模式（`localhost` / `*.cloudfront.net` / `*.lambda-url.*.on.aws`）反射校验，`BETTER_AUTH_URL` 留空由请求推断。因此前后端无循环依赖。
  - ⚠️ **已知限制**：前端（CloudFront 域）与后端（Function URL 域）跨站，登录 Cookie 为第三方 Cookie（`SameSite=None`），部分浏览器可能拦截。**生产建议绑定自定义域名**（如 `app.example.com` + `api.example.com`），或用 CloudFront 行为把 `/api/*` 反代到 API，使前后端同域。

## 首次部署

前置：已配置 AWS 凭证（`aws sts get-caller-identity` 可用），Node 22 + pnpm。

```bash
# 1. 安装 SST providers（需官方 npm registry；若本地配了镜像源，临时切换）
#    npm registry 为镜像时：echo 'registry=https://registry.npmjs.org/' > .npmrc，install 后删除
pnpm sst install

# 2. 设置密钥（生产 stage）
#    DatabaseUrl 用 Neon 控制台的 Pooled connection 串（host 含 -pooler，带 ?sslmode=require）
pnpm sst secret set DatabaseUrl "postgresql://USER:PWD@EP-xxx-pooler.REGION.aws.neon.tech/DB?sslmode=require" --stage production
pnpm sst secret set BetterAuthSecret "$(openssl rand -base64 32)" --stage production
pnpm sst secret set AnthropicApiKey "sk-ant-..." --stage production

# 3. 预览将创建的资源（dry-run）
pnpm sst:diff

# 4. 部署
pnpm deploy            # = sst deploy --stage production
```

部署完成后输出 `api` / `web` 两个 URL。

## 数据库迁移

Neon 在公网可达，**无需 bastion 隧道**，本地直接对生产库执行 drizzle 迁移：

```bash
# 把 Neon 连接串（建议用 Direct connection，非 pooled）导出后迁移
export DATABASE_URL_PROD="postgresql://USER:PWD@EP-xxx.REGION.aws.neon.tech/DB?sslmode=require"
pnpm db:migrate:prod
```

> 迁移建议使用 Neon 的 **Direct connection**（host 不含 `-pooler`）；运行时 Lambda 用 **Pooled** 端点。

## 自动化部署（CI/CD）

`.github/workflows/deploy.yml`：push 到 `main` 自动部署生产，或手动 `workflow_dispatch` 指定 stage。

仓库还包含 `.github/workflows/sync-generated-artifacts.yml`，用于把 `docs/workflow.*`、`docs/office.html` 和 `Specs/*/.qm-status.json` 这类生成产物自动提交回远程仓库。为了避免 bot 回推这些文件时误触发生产部署，`deploy.yml` 已通过 `paths-ignore` 和 `github-actions[bot]` 条件跳过这类提交。

通过 GitHub OIDC 假设 IAM 角色（无需在 GitHub 存长期密钥），需在仓库 Secrets 配置：

- `AWS_DEPLOY_ROLE_ARN`：信任 GitHub OIDC provider 的部署角色 ARN

若要启用自动提交生成产物，还需在仓库 Settings > Actions > General 中允许 `GITHUB_TOKEN` 具备 `Read and write permissions`，并确保默认分支允许 GitHub Actions push 回仓库。

本地 `git remote -v` 当前为空，因此 GitHub 远程仓库地址仍需由项目维护者绑定为 `origin`。这不会影响 GitHub Actions 在远端仓库内运行，但会影响本地直接 push / 远端联调。

CI 中的密钥（`DatabaseUrl` / `BetterAuthSecret` / `AnthropicApiKey`）通过 `sst secret set` 预先写入各 stage，部署时自动读取。

## 移除环境

```bash
pnpm deploy:remove     # sst remove --stage production
```

> 数据库托管在 Neon，不由 SST 管理，`sst remove` 不会删除数据；如需销毁数据请在 Neon 控制台操作。
