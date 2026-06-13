# 阡陌家庭保 · 开发规范

## 项目背景

"阡陌家庭保"是面向家庭用户的保险产品销售与管理平台。核心业务实体：

- **User**：用户（C 端家庭用户主账号）
- **FamilyMember**：家庭成员（被保人，与 User 关联）
- **Policy**：保单
- **Product**：险种（保险产品定义）
- **Application**：投保单
- **Claim**：理赔
- **Payment**：保费缴纳记录

## 技术栈

基于 [Better-T-Stack](https://www.better-t-stack.dev/) 生成，monorepo 由 Turborepo + pnpm workspace 管理。

| 维度 | 选型 |
|---|---|
| 前端框架 | Next.js (App Router) |
| 后端框架 | Hono（运行于 Node.js） |
| 数据库 | PostgreSQL（本地通过 `packages/db/docker-compose.yml` 启动） |
| ORM | Drizzle ORM + drizzle-kit |
| 鉴权 | Better-Auth（email/password，预留手机号+短信验证码扩展） |
| 包管理器 | pnpm |
| Monorepo | Turborepo |
| API 风格 | RESTful（未使用 tRPC/oRPC，便于未来对接小程序/H5 等多端） |

### 目录结构

```
qianmo-family-insurance/
├── apps/
│   ├── web/        # Next.js 前端
│   └── server/     # Hono 后端 API
├── packages/
│   ├── auth/       # Better-Auth 配置与实例
│   ├── db/          # Drizzle schema、迁移、docker-compose
│   ├── env/         # 环境变量校验（@t3-oss/env-core / env-nextjs）
│   ├── ui/          # 共享 UI 组件（shadcn）
│   └── config/      # 共享 tsconfig 等配置
```

### 常用命令

```bash
pnpm install        # 安装依赖
pnpm dev            # 同时启动 web (3001) 与 server (3000)
pnpm db:start       # 启动本地 docker postgres
pnpm db:push        # 同步 drizzle schema 到数据库
pnpm db:studio      # 打开 Drizzle Studio
```

## 前端开发规则（apps/web）

- **目录约定**：
  - 路由放在 `src/app/`（App Router 约定，文件夹即路由）
  - 可复用组件放在 `src/components/`，跨应用共享的基础组件下沉到 `packages/ui`
  - 自定义 hooks 放在 `src/hooks/`，以 `use` 前缀命名
  - API 调用统一封装在 `src/api/` 下，**禁止在组件中直接 `fetch`**
- **状态管理**：服务端状态（保单列表、用户信息等）统一用 TanStack Query，不自造缓存/全局 store；纯前端 UI 状态（弹窗开关等）用 `useState`/`useReducer`
- **表单**：统一使用 `react-hook-form` + `zod`。校验 schema 优先复用后端 `packages/db` 或共享 schema 包中的定义，避免前后端校验规则漂移
- **命名规范**：
  - 组件：`PascalCase`（如 `PolicyCard.tsx`）
  - hooks：`useXxx`
  - 文件名：`kebab-case`
- **金额字段**：所有金额在网络层/存储层统一使用「分」（最小货币单位，整数），仅在展示层转换为「元」（除以 100，保留两位小数）

## 后端开发规则（apps/server）

- **目录约定**：
  - `src/routes/` 或 `src/handlers/`：按业务实体拆分路由（如 `policies.ts`、`claims.ts`）
  - `src/services/`：业务逻辑层，路由 handler 只做参数解析与调用 service
  - `src/middleware/`：鉴权、日志、错误处理等中间件
  - 数据库 schema 放在 `packages/db/src/schema/`，按实体拆分文件，迁移用 drizzle-kit（`pnpm db:generate` / `pnpm db:push`）
- **API 设计**：RESTful，统一响应格式：
  ```ts
  { code: number, data: T | null, message: string }
  ```
  - `code === 0` 表示成功，非 0 为业务错误码
  - 错误统一通过全局错误处理中间件捕获并格式化，不在各 handler 中重复 try/catch
- **输入校验**：所有接口入参使用 `zod` schema 校验；与前端共用的校验规则放在共享 schema 中，避免重复定义
- **鉴权**：
  - 受保护路由统一通过 `packages/auth` 提供的 auth middleware
  - 区分用户端（C 端家庭用户）与管理端权限，管理端路由需额外的角色校验
- **敏感信息**：身份证号、银行卡号、手机号等敏感字段**禁止明文写入日志**，日志中需脱敏（如身份证号仅保留前 6 位+后 4 位）

## 需求拆解与开发工作流（`/qm:prd`）

新需求通过 `/qm:prd <PRD文档路径>` 拆解并执行，所有产出物集中存放在项目根目录的 `Specs/` 目录下，按需求主题建子目录（kebab-case，如 `Specs/claim-process-optimization/`）：

```
Specs/
└── <需求主题>/
    ├── proposal.md   # 需求提案：背景目标、涉及实体、与现有系统的差异/复用点、范围边界、待澄清问题
    ├── design.md     # 技术方案设计：数据模型、API、前端页面/组件、关键业务逻辑、第三方集成、风险权衡
    ├── tasks.md      # 任务清单：序号/模块/描述/依赖/状态（待开始/进行中/已完成/阻塞/需复核）
    └── lessons.md    # 经验教训：codex 评审建议、踩坑点、关键决策、可复用模式
```

### 执行前置条件：git 仓库

`/qm:prd` 执行前检查项目根目录是否为 git 仓库（`git rev-parse --is-inside-work-tree`）：

- 若不是 → 先执行 `git init` 并提交一次基线 commit（包含当前所有现有文件），再开始拆解/执行。这样单任务循环中每一步改动都能通过 `git diff` 提交给 `codex` 评审。
- 若 `codex` CLI 仍不可用，按原规则向用户说明并询问是否跳过评审，不阻塞任务执行。

### 场景区分

- **初次新建**：`Specs/<主题>/` 不存在 → 完整执行"读取上下文 → 拆解提案/设计/任务 → 写入 Specs → 逐项执行"
- **续接执行**：已有未完成任务且 PRD 范围未变 → 直接从 `tasks.md` 中下一个未完成任务继续
- **增量修改**：PRD 较 `proposal.md` 有新增/调整 → 在 `proposal.md` 追加"变更记录"，在 `design.md` 补充对应设计，在 `tasks.md` 追加新任务，受影响的已完成任务标记为"需复核"

### 任务拆分为子任务

粒度超过"半天"的任务可在 `tasks.md` 中拆分为子任务（编号 `<父任务序号>.<子序号>`，如 `3.1`/`3.2`）。父任务不直接执行，仅作分组；最小执行单元是没有子任务的任务，或某个子任务；父任务状态由其子任务状态汇总（全部完成才算完成）。若实现过程中发现任务粒度过大，可随时按此规则拆分后继续。

### 单任务循环

每个最小执行单元（任务或子任务）按以下循环执行，全部完成后才进入下一个：

1. **实现**：依据 `design.md` 中对应的设计项，遵循本文件中的前后端开发规则；若实现中发现需调整设计，先更新 `design.md` 再继续；发现粒度过大时先拆分为子任务再继续
2. **自动化测试**：为本次改动补充/更新自动化测试（后端 service/路由的单元或集成测试，前端关键逻辑的单元测试），与实现一并提交；若该最小执行单元确实不适合写测试（如纯静态文案/导航调整），在 `lessons.md` 中说明原因后跳过
3. **codex 代码评审**：对本次改动的 `git diff`（含新增测试）调用 `codex` CLI 评审，阻断性问题修复后重审
4. **标记完成 + 总结 lessons**：更新 `tasks.md` 状态（含父任务汇总）、`TodoWrite`，将评审建议/踩坑记录写入 `lessons.md`
5. **评估是否继续**：检查 `proposal.md` 中是否有阻塞下一项的待澄清问题
6. **上下文管理**：状态已持久化到 `Specs/`，可执行 `/compact` 压缩或 `/clear` 后重新运行 `/qm:prd` 续接，从 `tasks.md` 的下一个未完成任务/子任务继续

## 测试规范

- 测试框架统一使用 [Vitest](https://vitest.dev/)；若目标 app/package 尚未配置，实现对应任务时按需添加 `vitest` devDependency 及最小配置
- 测试文件与被测文件同目录，命名为 `<file>.test.ts`（如 `detect-source-type.test.ts`）
- 后端：优先覆盖 `src/services/` 中的纯逻辑（如链接识别、SSRF 校验、计算规则）与 `src/routes/` 关键分支（鉴权失败、参数校验失败、业务错误码）；数据库依赖较重的路径可视情况 mock
- 前端：优先覆盖 `src/lib/`、`src/hooks/` 中的纯逻辑与格式化函数；组件级测试非必须，按价值取舍

## 共享约定

- 类型定义优先放在共享包（如 `packages/db` 导出的 Drizzle 推断类型、或独立的 `packages/shared`），前后端复用，避免重复定义保单/保费等核心实体类型
- 环境变量：
  - 每个 app 的 `.env.example`（`apps/server/.env.example`、`apps/web/.env.example`）列出所有必需变量及说明
  - 真实密钥（`.env`）禁止提交，已在 `.gitignore` 中排除
  - 新增环境变量时同步更新 `packages/env/src/server.ts` 或 `packages/env/src/web.ts` 中的 zod schema
