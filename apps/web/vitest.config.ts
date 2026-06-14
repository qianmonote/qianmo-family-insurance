import { resolve } from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // 与 tsconfig 的 "@/*" -> "./src/*" 对齐，使测试可按别名导入源码。
    alias: { "@": resolve(__dirname, "./src") },
  },
  test: {
    environment: "node",
  },
});
