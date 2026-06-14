import { handle } from "hono/aws-lambda";

import { app } from "./app";

/**
 * AWS Lambda 入口（通过 Lambda Function URL 暴露）。
 * 使用 Function URL 而非 API Gateway，规避 API Gateway 29s 超时限制，
 * 让同步类（网页/图文）总结任务可在 Lambda 超时内完成。
 */
export const handler = handle(app);
