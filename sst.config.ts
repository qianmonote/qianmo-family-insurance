/// <reference path="./.sst/platform/config.d.ts" />

/**
 * 阡陌家庭保 · AWS Serverless 部署（SST v4 / ion）
 *
 * 架构（全 AWS 原生 Serverless，个人项目演示）：
 *   VPC                                          私有网络（含 EC2 NAT，给 Lambda 出公网）
 *   Aurora Serverless v2 (Postgres)              AWS 原生 Serverless 数据库，可缩容到 0 ACU
 *   API Function (Hono, Lambda Function URL)     后端 API，接入 VPC 直连 Aurora
 *   Next.js (OpenNext on CloudFront + Lambda)    前端
 *   Secret: BetterAuthSecret / AnthropicApiKey
 *
 * 数据库选型：从外部 Neon 改为 AWS 原生 Aurora Serverless v2（Postgres 引擎），
 * 全栈一站式留在 AWS 内。Aurora 在 VPC 内，故后端 Lambda 需接入同一 VPC 才能直连；
 * 又因 Lambda 仍需出公网（抓取公开文章 / 调 Anthropic API），VPC 启用 NAT。
 * 为控制演示成本，NAT 用 `ec2` 模式（单台 t4g.nano，约 $3/月）而非托管 NAT 网关。
 * 数据库 scaling 最小 0 ACU，空闲时自动缩容到零，近乎纯按量。
 *
 * 注：视频类来源当前为占位（mock）抓取，瞬时返回，统一走同步 API（5min 超时足够），
 * 未接入真实视频解析前不引入 SQS + worker 异步设施。
 *
 * 无自定义域名：CORS 与 Better-Auth trustedOrigins 在应用层按内置模式
 * （localhost / *.cloudfront.net / *.lambda-url.*.on.aws）反射校验。
 *
 * 部署：pnpm sst deploy --stage production
 * 迁移：Aurora 在私有子网，本地需经 SST 隧道连接后再跑 drizzle 迁移，见 README。
 */
export default $config({
  app(input) {
    return {
      name: "qianmo-family-insurance",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage ?? ""),
      home: "aws",
      providers: {
        aws: { region: "us-east-1" },
      },
    };
  },
  async run() {
    // ---- 敏感配置（通过 `pnpm sst secret set <Name> <value>` 写入，不入库）----
    const betterAuthSecret = new sst.Secret("BetterAuthSecret");
    const anthropicApiKey = new sst.Secret("AnthropicApiKey");

    // ---- 网络：VPC（无 NAT）----
    // 演示仅含注册/登录/数据管理，后端不需要公网出口；Lambda 留在 VPC 私有子网内仅连 Aurora。
    // 故不创建 NAT（省去 2×EC2 NAT 实例 + EIP 的固定成本，约 $6/月）。
    // 若日后要启用「链接总结」（抓取外链 + 调 Anthropic）等需出公网的功能，改回 { nat: "ec2" } 重新部署。
    const vpc = new sst.aws.Vpc("Vpc");

    // ---- 数据库：Aurora Serverless v2（Postgres），可缩容到 0 ACU ----
    const database = new sst.aws.Aurora("Database", {
      engine: "postgres",
      vpc,
      scaling: { min: "0 ACU", max: "1 ACU" },
    });

    // node-postgres / drizzle 用的连接串，由 Aurora 输出拼装。
    // Aurora 强制 SSL（rds.force_ssl=1）；RDS 证书不在系统信任链，用 no-verify 跳过校验。
    const databaseUrl = $interpolate`postgresql://${database.username}:${database.password}@${database.host}:${database.port}/${database.database}?sslmode=no-verify`;

    // ---- 后端 API（Hono on Lambda Function URL，接入 VPC 直连 Aurora）----
    // 用 Function URL 而非 API Gateway，规避 29s 超时，让同步类总结也能在 Lambda 超时内完成。
    const api = new sst.aws.Function("Api", {
      handler: "apps/server/src/lambda.handler",
      // 关掉 Function URL 自带 CORS（默认 allowOrigins:["*"]，与 credentials 冲突）。
      // 改由 Hono 应用层处理：按来源反射具体 origin 并允许携带 Cookie 凭证。
      url: { cors: false },
      vpc,
      link: [database, betterAuthSecret, anthropicApiKey],
      timeout: "5 minutes",
      memory: "1024 MB",
      environment: {
        DATABASE_URL: databaseUrl,
        BETTER_AUTH_SECRET: betterAuthSecret.value,
        ANTHROPIC_API_KEY: anthropicApiKey.value,
        NODE_ENV: "production",
      },
      nodejs: { install: ["pg"] },
    });

    // ---- 前端（Next.js / OpenNext）----
    // 注：CloudFront「分发」创建仍被账号验证门禁（缓存策略等辅助资源不卡，唯独 Distribution
    // 报 "Your account must be verified before you can add new CloudFront resources"）。
    // 需联系 AWS Support 完成账号验证后，取消下方注释重新部署即可拉起前端。
    // const web = new sst.aws.Nextjs("Web", {
    //   path: "apps/web",
    //   link: [api],
    //   environment: {
    //     NEXT_PUBLIC_SERVER_URL: api.url,
    //   },
    // });

    return {
      api: api.url,
      // web: web.url,
    };
  },
});
