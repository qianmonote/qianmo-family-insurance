# 部署技术方案（精简版）· 后端 Lambda + 移除未用功能

> 目标：把后端部署到 AWS Lambda，同时砍掉当前架构里为"尚未实现的功能"预留的冗余基础设施，降低成本与运维复杂度。
> 本文档是 [deployment-aws.md](deployment-aws.md) 的"瘦身版"，落地前需确认第 3 节的决策项。

## 1. 项目实际架构与功能盘点

CLAUDE.md 描述为"家庭保险平台"，但代码实现的是一个 **「链接/视频内容 AI 总结工具」**，数据模型只有两张表：

- `user`（Better-Auth：邮箱+密码，session 7 天）
- `link_summary`（总结任务记录）

核心链路：用户提交链接 → `detectSourceType` 识别来源 → 抓取内容 → Claude (`claude-sonnet-4-6`) 生成 Markdown 要点。

| 来源类型 | 抓取实现 | 是否真实可用 |
|---|---|---|
| `public_article` 公开文章 | `PublicArticleFetcher`（真实 fetch + SSRF 防护 + HTML 解析） | ✅ 真实 |
| `wechat_article` 微信文章 | `MockPlatformFetcher` 占位文本 | ❌ mock |
| `xiaohongshu_image/video` 小红书 | `MockPlatformFetcher` 占位文本 | ❌ mock |
| `douyin_video` 抖音 | `MockPlatformFetcher` 占位文本 | ❌ mock |
| `bilibili_video` B站 | `MockPlatformFetcher` 占位文本 | ❌ mock |

**结论**：当前真正能产出有效总结的只有"公开网页文章"一条路径，其余平台均为占位实现。

## 2. 当前部署架构中的冗余

| 资源 | 现状 | 评估 |
|---|---|---|
| **SQS Queue + Worker Lambda** | 处理"视频类"异步总结，15min 超时、batch=1 串行 | ⚠️ **冗余**：视频抓取全是 mock，瞬时返回；worker 逻辑与同步 API 完全相同；同步 API 已有 5min 超时足够。为不存在的长耗时负载预留的重型设施 |
| VPC + NAT(managed) | Lambda 同 VPC 访问 Aurora，NAT 出公网调用 Anthropic / 抓取文章 | 保留（DB 在私有子网必需；NAT 是主要固定成本项） |
| Aurora Serverless v2 | prod 最小 0.5 ACU | 保留（auth + 记录持久化必需） |
| Bastion 主机 | 本地 `sst tunnel` 连库做迁移 | 保留（迁移需要；t4g.nano 成本极低） |
| CloudFront + Lambda (OpenNext) | Next.js 前端 | 保留 |

## 3. 决策项（落地前需确认）

### 决策 A：如何处理"视频异步队列"
- **A1（推荐）移除 SQS + Worker，所有来源走同步 API**
  视频类也走 5min 超时的同步 Function，mock 瞬时完成，行为对用户无差异。后续真正接入视频解析时再恢复异步架构。
- A2 保留 SQS + Worker（维持现状，为未来视频解析预留）。

### 决策 B：是否同时移除 mock 平台来源（微信/小红书/抖音/B站）
- **B1（推荐）保留来源识别，仅保留 mock 总结**
  改动最小，前端入口不变，避免误删未来要接的功能。
- B2 暂时下线这些来源，`detectSourceType` 只认 `public_article`，UI 提示"暂仅支持公开网页文章"。

> 推荐组合 **A1 + B1**：删掉空转的异步基础设施，保留全部产品功能面。下文按此组合编写。

## 4. 目标架构（A1 + B1 + Neon，无 VPC）

```
                 CloudFront ── Lambda (OpenNext / Next.js)   前端
                      │
用户 ── 浏览器 ───────┤
                      │
                 Lambda Function URL ── Hono API (apps/server/src/lambda.ts)
                      │   timeout 5min, memory 1024MB, 无 VPC（默认公网出口）
                      ├──→ Neon (Serverless Postgres, 公网 + SSL, Pooled 端点)
                      └──→ 公网（Anthropic API / 抓取公开文章）

Secret: DatabaseUrl / BetterAuthSecret / AnthropicApiKey
（移除：SQS VideoQueue + Worker Lambda；VPC + Aurora + NAT + bastion）
```

## 5. 代码改动清单（A1 + B1）

1. **sst.config.ts**
   - 删除 `videoQueue`（`sst.aws.Queue`）及其 `.subscribe(worker...)` 块（[sst.config.ts:54-75](../sst.config.ts#L54-L75)）。
   - 从 `api` 的 `link` 中移除 `videoQueue`，删除 `environment.VIDEO_QUEUE_URL` 与 `nodejs.install` 中的 `@aws-sdk/client-sqs`（[sst.config.ts:79-94](../sst.config.ts#L79-L94)）。
   - 移除 `run()` 返回值里的 `queue`。
2. **apps/server/src/services/link-summary/task-queue.ts**
   - 删除 SQS 分支（`enqueueToSqs` / `queueUrl` 判断），`enqueueLinkSummaryTask` 统一走（同步直接 `await processLinkSummaryTask`，或保留内存队列用于本地多任务串行）。
   - 简化后视频/图文都直接调用 `processLinkSummaryTask`，路由层 [link-summaries.ts:47-55](../apps/server/src/routes/link-summaries.ts#L47-L55) 的分支可合并。
3. **apps/server/src/worker.ts**：删除（不再有 SQS worker）。
4. **apps/server/package.json**：移除 `@aws-sdk/client-sqs`、`@types/aws-lambda` 依赖。
5. **文档**：更新 [deployment-aws.md](deployment-aws.md) 移除 SQS/worker 段落与输出中的 `queue`。
6. **测试**：`task-queue` / 路由相关测试随改动更新；`pnpm test` 全绿。
7. **数据库改用 Neon（删 VPC）**：
   - sst.config.ts 删除 `Vpc` / `Aurora` / `$interpolate` 连接串；新增 Secret `DatabaseUrl`，`api` 去掉 `vpc` 与 `database` link，`DATABASE_URL` 改取 `databaseUrl.value`。
   - 连接层无需改动（`pg` + `drizzle-orm/node-postgres` 直连 Neon SSL）。
   - 迁移脚本去掉 bastion 隧道，改 `db:migrate:prod` 直连 Neon Direct 端点（package.json）。

## 6. 部署步骤

前置：AWS 凭证可用（`aws sts get-caller-identity`）、Node 22 + pnpm、Anthropic API Key。

```bash
# 0. 安装 SST providers（如本地配了 npm 镜像源需临时切官方源）
pnpm sst install

# 1. 写入密钥（production stage）。DatabaseUrl 用 Neon 的 Pooled connection 串
pnpm sst secret set DatabaseUrl      "postgresql://USER:PWD@EP-xxx-pooler.REGION.aws.neon.tech/DB?sslmode=require" --stage production
pnpm sst secret set BetterAuthSecret "$(openssl rand -base64 32)" --stage production
pnpm sst secret set AnthropicApiKey  "sk-ant-..."                 --stage production

# 2. 预览将创建/变更的资源
pnpm sst:diff

# 3. 部署
pnpm deploy            # = sst deploy --stage production

# 4. 数据库迁移（Neon 公网可达，无需 bastion 隧道）
export DATABASE_URL_PROD="postgresql://USER:PWD@EP-xxx.REGION.aws.neon.tech/DB?sslmode=require"  # Direct 端点
pnpm db:migrate:prod
```

部署输出：`api`（Function URL）、`web`（CloudFront URL）。

## 7. 成本与风险（Neon 方案）

成本对比（us-east-1，零/轻流量）：

| 项 | 原 Aurora+VPC 方案 | **现 Neon 无 VPC 方案** |
|---|---|---|
| 固定月成本（空跑） | ~$82–122（Aurora+NAT+bastion） | **~$0**（Neon 免费档 + 资源全按量） |
| AWS 按量（Lambda/CloudFront） | 小流量 ≈ $0（免费额度内） | 小流量 ≈ $0 |
| Anthropic API | 按用量（~$0.01–0.03/次总结） | 同左 |
| 数据库扩展 | Aurora 0.5–4 ACU | Neon 免费档（0.5GB 存储 / 自动暂停）；超出按 Neon 计费 |

- **核心收益**：删掉 VPC + NAT + bastion，固定成本从约 $100/月降到近乎 $0，整体退化为纯按量 + Anthropic 用量。
- **Neon 注意**：运行时用 **Pooled**（`-pooler`）端点防连接耗尽；免费档有空闲自动暂停（首次访问几百 ms 冷启动）、存储与算力上限，量大时升 Neon 付费档。
- **跨站 Cookie 限制**：前端（CloudFront 域）与 API（Function URL 域）跨站，登录 Cookie 为第三方 Cookie（`SameSite=None`），部分浏览器可能拦截。**生产建议绑定自定义域名**或用 CloudFront 把 `/api/*` 反代到 API 实现同域。
- **数据归属**：数据库托管在 Neon，不由 SST/`sst remove` 管理，销毁数据需在 Neon 控制台操作。

## 8. 待确认 / 待提供

1. **Neon 连接串**：在 [neon.tech](https://neon.tech) 建项目（选 us-east-1 就近 Lambda），取 Pooled + Direct 两个连接串。
2. Secret 值：`AnthropicApiKey` 需你提供；`BetterAuthSecret` 可自动生成。
3. AWS 凭证如何注入（环境变量 / `aws configure` / 现有 profile）。
