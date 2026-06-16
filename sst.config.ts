/// <reference path="./.sst/platform/config.d.ts" />

/**
 * 阡陌家庭保 · AWS Serverless 部署（SST v3 / ion）
 *
 * 架构（无 VPC，全按量）：
 *   API Function (Hono, Lambda Function URL)   同步 API（所有来源类型同步处理）
 *   Next.js (OpenNext on CloudFront + Lambda)  前端
 *   数据库：外部 Serverless Postgres（Neon），经公网 + SSL 连接，连接串以 Secret 注入
 *   Secret: DatabaseUrl / BetterAuthSecret / AnthropicApiKey
 *
 * 数据库为何用 Neon 而非 Aurora：Neon 在 VPC 外，Lambda 无需进 VPC，可省去 NAT 网关
 * 与 bastion 的固定月成本（约 $35–70/月），整体退化为近乎纯按量计费。Lambda 默认具备
 * 公网出口，可直连 Neon 与抓取公开文章；故不再创建 Vpc / Aurora。
 *
 * 注：视频类来源当前为占位（mock）抓取，瞬时返回，统一走同步 API（5min 超时足够），
 * 未接入真实视频解析前不引入 SQS + worker 异步设施。后续接入长耗时解析时再恢复。
 *
 * 无自定义域名：CORS 与 Better-Auth trustedOrigins 在应用层按内置模式
 * （localhost / *.cloudfront.net / *.lambda-url.*.on.aws）反射校验，
 * 故 API 不依赖前端 URL，避免前后端循环依赖。BETTER_AUTH_URL 留空，
 * 由 Better-Auth 从请求推断 baseURL。
 *
 * 部署：pnpm sst deploy --stage production
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
    // DatabaseUrl：Neon 的连接串，建议使用其「Pooled connection」端点并带 ?sslmode=require，
    //   形如 postgresql://<user>:<pwd>@<endpoint>-pooler.<region>.aws.neon.tech/<db>?sslmode=require
    const databaseUrl = new sst.Secret("DatabaseUrl");
    const betterAuthSecret = new sst.Secret("BetterAuthSecret");
    const anthropicApiKey = new sst.Secret("AnthropicApiKey");

    // ---- 后端 API（Hono on Lambda Function URL）----
    // 用 Function URL 而非 API Gateway，规避 29s 超时，让同步类总结也能在 Lambda 超时内完成。
    // 无 VPC：Lambda 默认公网出口，直连 Neon（SSL）并抓取公开文章。
    const api = new sst.aws.Function("Api", {
      handler: "apps/server/src/lambda.handler",
      url: true,
      link: [databaseUrl, betterAuthSecret, anthropicApiKey],
      timeout: "5 minutes",
      memory: "1024 MB",
      environment: {
        DATABASE_URL: databaseUrl.value,
        BETTER_AUTH_SECRET: betterAuthSecret.value,
        ANTHROPIC_API_KEY: anthropicApiKey.value,
        NODE_ENV: "production",
      },
      nodejs: { install: ["pg"] },
    });

    // ---- 前端（Next.js / OpenNext）----
    const web = new sst.aws.Nextjs("Web", {
      path: "apps/web",
      link: [api],
      environment: {
        NEXT_PUBLIC_SERVER_URL: api.url,
      },
    });

    return {
      api: api.url,
      web: web.url,
    };
  },
});
