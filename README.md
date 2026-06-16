# qianmo-family-insurance

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines Next.js, Hono, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **Next.js** - Full-stack React framework
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **Shared UI package** - shadcn/ui primitives live in `packages/ui`
- **Hono** - Lightweight, performant server framework
- **Node.js** - Runtime environment
- **Drizzle** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Authentication** - Better-Auth
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
pnpm install
```

## Database Setup

This project uses PostgreSQL with Drizzle ORM.

1. Make sure you have a PostgreSQL database set up.
2. Update your `apps/server/.env` file with your PostgreSQL connection details.

3. Apply the schema to your database:

```bash
pnpm run db:push
```

Then, run the development server:

```bash
pnpm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
The API is running at [http://localhost:3000](http://localhost:3000).

## AWS 部署（SST v4 / Serverless）

全 AWS 原生 Serverless 架构，编排在 [`sst.config.ts`](sst.config.ts)：

| 组件 | 说明 |
|---|---|
| `sst.aws.Vpc`（NAT `ec2`） | 私有网络 + 廉价 EC2 NAT，给 Lambda 提供公网出口 |
| `sst.aws.Aurora` | Aurora Serverless v2（Postgres），`scaling` 0–1 ACU，空闲缩容到 0 |
| `sst.aws.Function` Api | Hono 后端跑在 Lambda（Function URL，5min 超时），接入 VPC 直连 Aurora |
| `sst.aws.Nextjs` Web | 前端（当前因账号 CloudFront 未验证已注释，验证后取消注释重部署） |

### 前置

```bash
aws configure                 # 配置有效 AWS 凭证
aws sts get-caller-identity   # 确认账号无误

# 写入 secret（按账号隔离，换账号需重设）
pnpm sst secret set BetterAuthSecret "<32位以上随机串>" --stage production
pnpm sst secret set AnthropicApiKey  "<你的 key>"       --stage production
```

> 账号限制：全新 AWS 账号常对 EC2 / CloudFront 有验证门禁（报 `account must be verified`）。
> 需到 AWS Support 完成账号验证后相关资源才能创建。

### 部署

```bash
pnpm deploy        # = sst deploy --stage production
```

输出里的 `Api` 即后端 Lambda Function URL。

### 数据库迁移

Aurora 在 VPC 私有子网。本环境实测：`sst tunnel` / SSH 端口转发因 NAT(fck-nat)实例
sshd 在 kex 阶段拒连而无法建立；RDS Data API 在 PostgreSQL 17.x 上不受支持。因此迁移
**由 VPC 内的一次性 Lambda 直连 Aurora 执行**（无公网 URL，仅 IAM 可调用），用完即删。

操作步骤：

1. 临时在 `sst.config.ts` 加一个 Migrator Function（与 `Api` 同样接入 `vpc` / `link` /
   `DATABASE_URL`，但不设 `url`），handler 里用 `db.execute(sql.raw(...))` 跑迁移 SQL
   （或 drizzle 的 `migrate()`，需 `copyFiles` 带上 `packages/db/src/migrations`）。
2. `pnpm deploy` 部署。
3. 用 IAM 调用执行迁移：
   ```bash
   aws lambda invoke --region us-east-1 \
     --function-name <MigratorFunction 名称> --cli-read-timeout 300 /tmp/out.json
   cat /tmp/out.json   # 应返回 ok:true 及已建的表
   ```
   函数名可用 `aws lambda list-functions --query "Functions[?contains(FunctionName,'Migrator')].FunctionName"` 查。
4. 删除 Migrator Function 与对应 handler，`pnpm deploy` 收尾。

> 该方式直接执行 DDL，不写 drizzle 迁移记录表；演示库一次性建好即可。后续若要 drizzle-kit
> 增量迁移，需先在库中 baseline `__drizzle_migrations`。

### 清理旧账号遗留资源

若曾在某账号部署失败留下资源（`removal: retain` 不会自删，持续计费），用对应账号凭证执行：

```bash
export AWS_ACCESS_KEY_ID=<旧账号 key>
export AWS_SECRET_ACCESS_KEY=<旧账号 secret>
bash scripts/cleanup-old-account.sh   # 断言账号 → 临时放开 protect → sst remove → 自动恢复 config
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY
```

> `scripts/cleanup-old-account.sh` 内的目标账号 ID 需按实际改。Aurora 删除后可能残留最终快照，需到 RDS 控制台手动确认删除。

## UI Customization

React web apps in this stack share shadcn/ui primitives through `packages/ui`.

- Change design tokens and global styles in `packages/ui/src/styles/globals.css`
- Update shared primitives in `packages/ui/src/components/*`
- Adjust shadcn aliases or style config in `packages/ui/components.json` and `apps/web/components.json`

### Add more shared components

Run this from the project root to add more primitives to the shared UI package:

```bash
npx shadcn@latest add accordion dialog popover sheet table -c packages/ui
```

Import shared components like this:

```tsx
import { Button } from "@qianmo-family-insurance/ui/components/button";
```

### Add app-specific blocks

If you want to add app-specific blocks instead of shared primitives, run the shadcn CLI from `apps/web`.

## Project Structure

```
qianmo-family-insurance/
├── apps/
│   ├── web/         # Frontend application (Next.js)
│   └── server/      # Backend API (Hono)
├── packages/
│   ├── ui/          # Shared shadcn/ui components and styles
│   ├── auth/        # Authentication configuration & logic
│   └── db/          # Database schema & queries
```

## Available Scripts

- `pnpm run dev`: Start all applications in development mode
- `pnpm run build`: Build all applications
- `pnpm run dev:web`: Start only the web application
- `pnpm run dev:server`: Start only the server
- `pnpm run check-types`: Check TypeScript types across all apps
- `pnpm run db:push`: Push schema changes to database
- `pnpm run db:generate`: Generate database client/types
- `pnpm run db:migrate`: Run database migrations
- `pnpm run db:studio`: Open database studio UI
- `pnpm run deploy`: Deploy to AWS (`sst deploy --stage production`)
- `pnpm run sst:diff`: Preview infrastructure changes before deploy
- `pnpm run deploy:remove`: Tear down the production stack
- `bash scripts/cleanup-old-account.sh`: Remove leftover resources on an old AWS account
- 数据库迁移：见上文「数据库迁移」（经一次性 Migrator Lambda 执行，不用本地脚本）
