import { serve } from "@hono/node-server";

import { app } from "./app";
import { recoverPendingLinkSummaryTasks } from "./services/link-summary/task-queue";

/**
 * 本地开发入口：使用 node-server 长驻监听。
 * 生产环境（AWS Lambda）使用 src/lambda.ts，不经过此文件。
 */
serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);

// 仅本地单进程场景下，启动时重新处理仍处于 processing 的任务。
// Lambda 环境为同步处理（每个请求内完成），不经过此文件，无需启动恢复。
void recoverPendingLinkSummaryTasks();
