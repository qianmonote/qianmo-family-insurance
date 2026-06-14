/// <reference path="./.sst/platform/config.d.ts" />

/**
 * 阡陌家庭保 · AWS Serverless 部署（SST v3 / ion）
 *
 * 架构：
 *   VPC ─┬─ Aurora Serverless v2 (PostgreSQL)         数据库
 *        ├─ API Function (Hono, Lambda Function URL)   同步 API + 同步类总结
 *        └─ Worker Function (SQS 消费)                 异步视频类总结
 *   SQS Queue  视频总结任务队列（worker 串行消费，batch=1 避免 AI 并发超限）
 *   Next.js (OpenNext on CloudFront + Lambda)          前端
 *   Secret: BetterAuthSecret / AnthropicApiKey         敏感配置
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
    const betterAuthSecret = new sst.Secret("BetterAuthSecret");
    const anthropicApiKey = new sst.Secret("AnthropicApiKey");

    // ---- 网络与数据库 ----
    // Aurora 需置于 VPC 内；bastion 便于本地通过 `sst tunnel` 连库做迁移/调试。
    const vpc = new sst.aws.Vpc("Vpc", { bastion: true, nat: "managed" });

    const database = new sst.aws.Aurora("Database", {
      engine: "postgres",
      vpc,
      scaling: {
        min: $app.stage === "production" ? "0.5 ACU" : "0 ACU",
        max: $app.stage === "production" ? "4 ACU" : "1 ACU",
      },
    });

    // Drizzle / Better-Auth 使用的标准连接串。
    const databaseUrl = $interpolate`postgresql://${database.username}:${database.password}@${database.host}:${database.port}/${database.database}`;

    // ---- 视频总结异步队列 + worker ----
    const videoQueue = new sst.aws.Queue("VideoQueue", {
      visibilityTimeout: "15 minutes",
    });

    videoQueue.subscribe(
      {
        handler: "apps/server/src/worker.handler",
        vpc,
        link: [database, anthropicApiKey],
        timeout: "15 minutes",
        memory: "1024 MB",
        environment: {
          DATABASE_URL: databaseUrl,
          ANTHROPIC_API_KEY: anthropicApiKey.value,
        },
        nodejs: { install: ["pg"] },
      },
      {
        batch: { size: 1, partialResponses: true },
      },
    );

    // ---- 后端 API（Hono on Lambda Function URL）----
    // 用 Function URL 而非 API Gateway，规避 29s 超时，让同步类总结也能在 Lambda 超时内完成。
    const api = new sst.aws.Function("Api", {
      handler: "apps/server/src/lambda.handler",
      vpc,
      url: true,
      link: [database, videoQueue, betterAuthSecret, anthropicApiKey],
      timeout: "5 minutes",
      memory: "1024 MB",
      environment: {
        DATABASE_URL: databaseUrl,
        VIDEO_QUEUE_URL: videoQueue.url,
        BETTER_AUTH_SECRET: betterAuthSecret.value,
        ANTHROPIC_API_KEY: anthropicApiKey.value,
        NODE_ENV: "production",
      },
      nodejs: { install: ["@aws-sdk/client-sqs", "pg"] },
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
      queue: videoQueue.url,
    };
  },
});
