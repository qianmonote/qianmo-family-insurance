# 登录页修复 · Tasks

| 序号 | 模块 | 类型 | 描述 | 依赖 | 验收标准 | 状态 |
|---|---|---|---|---|---|---|
| 1 | F1 | 共享 | 新增 `apps/web/src/lib/demo-credentials.ts`，定义 `DEMO_CREDENTIALS` 常量 | - | AC-1.3 | 已完成 |
| 2 | F1 | 前端 | `sign-in-form.tsx` 用 `DEMO_CREDENTIALS` 预填 `defaultValues` | 1 | AC-1.1, AC-1.2 | 已完成 |
| 3 | F2 | 前端 | `sign-in-form.tsx`「新用户？立即加入」改为 `<Link>` 导航（Button render） | - | AC-2.1, AC-2.2, AC-2.3 | 已完成 |
| 4 | F2 | 前端 | `sign-up-form.tsx`「已有账号？返回登录」对称改为 `<Link>` 导航 | - | AC-2.4 | 已完成 |
| 5 | F1/F2 | 测试 | 新增 `demo-credentials.test.ts`（校验通过）；运行类型检查与全量测试 | 1-4 | AC-1.2 | 已完成 |

> 任务 1-4 改动集中且相互关联，作为一个最小执行单元一并实现与评审；任务 5 为验证。
