---
description: 初始化全栈 + 多 Agent 开发平台——交互式技术栈选型（基于 Better-T-Stack）+ 动态工作流架构 + 生成开发规范
argument-hint: [project-name]
---

你将初始化一个**全栈 + 多 Agent 协同开发平台**。本命令体现"动态工作流架构"：工作流具备自构建能力，可根据选型与需求动态生成后续执行流程；通过插件化方式实现增量式项目初始化；用 Skills 机制封装技术栈规范，标准化目录中预置 `.claude/agents/`（真正的 Claude Code subagent 人格文件）、`cloud/` 等模块。

## 设计模式

本命令遵循 [Google ADK · 5 种 Agent Skill 设计模式](https://x.com/GoogleCloudTech/status/2033953579824758855) 中的 **Inversion（倒置访谈）** 模式，并组合 **Generator** 与 **Tool Wrapper**：

- **Inversion（主）**：动手之前先以**分阶段的结构化提问"访谈"用户**，收集技术栈与项目意图，避免基于假设搭建错误的脚手架。**所有访谈阶段完成并经用户确认前，不得进入脚手架生成**（见第一步末尾的门禁）。
- **Generator（组合）**：`CLAUDE.md` 由**固定模板**生成——强制章节（项目背景 / 技术栈 / 工作流架构 / 前后端规则 / 共享约定）保证每次输出结构一致（见第三步）。
- **Tool Wrapper（组合）**：把技术栈规范（Hono 后端约定、Drizzle schema 约定等）封装进 `.claude/skills/`，作为**按需加载的参考知识**，供 `/qm:prd`、`/qm:ai` 阶段引用（见第二步 2.2）。

## 第〇步：项目名与现有目录检查

1. **项目名**：
   - 若提供了 `$1`，直接使用
   - 若未提供，根据当前上下文自动生成一个合理的项目名（kebab-case，体现项目业务语义），向用户展示生成的名称并征求一次确认/修改机会，不要用空白问题阻塞流程

2. **检查当前目录是否已是项目目录**（即当前目录下已存在 `.claude/` 目录）：
   - **不存在 `.claude/`** → 视为全新初始化，按下文第一~三步完整执行（技术栈选型 + 脚手架生成 + 标准化目录 + 生成 `CLAUDE.md`）
   - **已存在 `.claude/`** → 视为**增量更新**模式（体现"增量式项目初始化"），跳过脚手架生成，仅执行：
     - 读取现有 `CLAUDE.md`（若存在），展示当前已记录的技术栈选型与工作流架构
     - 仅询问用户本次需要新增/调整的部分（例如新增某个 Sub-Agent 角色、补充某条开发规范、追加一个标准化模块），不要重新走完整的选型问询
     - 对 `CLAUDE.md` 做**增量编辑**：新增的章节/规则追加或合并到已有章节，已有内容不删除、不重写，除非用户明确要求修改某条已有规则
     - 不重新生成项目骨架文件，若用户要求新增某个模块/包，再针对性创建

## 第一步：技术栈访谈（Inversion · 访谈阶段，仅全新初始化时执行）

> **Inversion 模式**：倒置常规流程——先访谈、后产出。把下列维度按**分阶段提问**收集齐全，每个阶段是一组聚焦的问题；上一阶段答完再进入下一阶段。

参考 [Better-T-Stack](https://www.better-t-stack.dev/) 的选项，使用 `AskUserQuestion` 逐组询问用户（可合并为 2-3 轮，每轮 1-4 个问题），覆盖以下维度。每个问题给出推荐项并标注"(推荐)"，推荐项需结合项目实际场景（表单密集、用户中心化、需要后台管理、对数据一致性要求高的通用业务）：

1. **前端框架**：Next.js（推荐，SSR 利于落地页+SEO）/ TanStack Router + Vite / Vue 3 + Vite
2. **后端框架**：Hono（推荐，轻量、边缘部署友好，可用 Skills 封装其规范）/ Express / Fastify / Next.js API Routes（若前端选 Next 可合并）
3. **数据库 + ORM**：PostgreSQL + Drizzle（推荐，强一致性）/ SQLite + Drizzle（本地开发/小规模）/ MySQL + Prisma
4. **鉴权方案**：Better-Auth（推荐，自托管、支持手机号+短信验证码）/ Clerk / 不需要
5. **包管理器 & Runtime**：pnpm + Node.js（推荐，生态成熟）/ bun
6. **云资源 & 部署**：AWS（推荐，可通过 MCP 协议在 `/qm:ai` 阶段自动配置）/ Cloudflare / Vercel / 暂不接入
7. **附加项**：是否需要 Turborepo monorepo（推荐，前后端 + 管理后台共享类型）/ Biome（代码规范）/ Husky（提交前检查）/ BackstopJS（视觉回归，配合前端设计稿还原的像素级验证）

将用户的选择汇总成一份选型表，向用户确认无误后再继续。

> **门禁（Inversion Gate）**：在上述访谈维度全部收集完毕、且用户确认选型表之前，**不得进入第二步脚手架生成**——这是 Inversion 模式的核心约束，宁可多问一句也不基于假设搭建错误的技术栈。

## 第二步：脚手架生成 + 标准化目录（Generator 落地 + Tool Wrapper 封装，仅全新初始化时执行）

### 2.1 脚手架

根据选型，构造 `create-better-t-stack` 命令并执行（需用户确认后才能联网执行 `npx`/`bunx`）：

```bash
npx create-better-t-stack@latest <project-name> \
  --frontend <...> --backend <...> --database <...> --orm <...> \
  --auth <...> --package-manager <...> --addons <...> --no-git --yes
```

若用户不希望联网安装，则手写一个等价的最小目录骨架（frontend/、backend/、packages/shared 等），并在 README 中说明后续可用上述命令补全依赖。

### 2.2 标准化目录模块（动态工作流架构）

在脚手架之上补充以下标准化模块（不存在则创建），作为多 Agent 协同与云资源管理的载体：

- `.claude/agents/`（**Subagent 模式**）：把每个角色封装成**独立的 Claude Code subagent**——一份带 frontmatter 的 `.md` 人格文件，定义该专家「怎么想 / 懂什么 / 不该干什么」，由 Claude Code 自动发现，供 `/qm:ai` 阶段通过 `Task` 工具按 `subagent_type=<agentKey>` **真正委派、并行执行**。文件格式与默认角色见 2.2.1（参考 [wshobson/agents](https://github.com/wshobson/agents) 的写法）
- `cloud/`：存放云资源声明（IaC 片段、MCP 可识别的资源描述，如 AWS 服务清单），供 `/qm:ai` 阶段通过 MCP 协议自动配置
- `Specs/`：存放各需求的 `requirements.md` / `proposal.md` / `design.md` / `tasks.md`（由 `/qm:prd` 生成）
- `docs/workflow.md`：工作流可视化（Mermaid），由 `/qm:ai` 维护
- `.claude/skills/`（**Tool Wrapper 模式**）：用 Skills 机制把技术栈规范封装为**按需加载的参考知识**。每个 skill 以 `SKILL.md` + `references/` 组织，执行任务时按需加载，让对应 Sub-Agent 即刻成为该技术栈的专家——这正是 `/qm:ai` 阶段各角色"自动加载对应 Skills"的来源。至少生成以下 skills（按选型裁剪）：
  - `backend-conventions`：Hono 后端约定、统一响应格式 `{ code, data, message }`、zod 入参校验约定
  - `db-conventions`：Drizzle schema 约定、迁移流程、PII 脱敏约定
  - `ui-design-restore`（**前端设计稿还原**，仅当前端选型为 React 系——Next.js / TanStack Router 时生成）：把"HTML+CSS 设计稿 → React + Tailwind CSS"的还原规范与**像素级验证闭环**封装为按需加载知识，详见 2.3

### 2.2.1 Subagent 人格文件格式（多 Agent 的真正载体）

> 参考 [wshobson/agents](https://github.com/wshobson/agents)：每个 subagent 是 `.claude/agents/<agentKey>.md`，Claude Code 自动发现，`/qm:ai` 用 `Task` 工具按 `subagent_type=<agentKey>` 委派。一份文件就是一位专家的完整人格——封装它**怎么想、懂什么、不该干什么**，而不是把所有规范塞进一条 prompt。`Subagent`（角色人格/边界）与 `.claude/skills/`（`Tool Wrapper` 技术栈知识）是两层：subagent 在正文里**引用**它该加载的 skills。

每个文件结构：

````markdown
---
name: <agentKey>                # 如 backend、frontend，与 .qm-status.json 的 agentKey 一致
description: <一句话说明何时该委派给它，可含 "Use PROACTIVELY when ...">
model: inherit                  # inherit / opus / sonnet / haiku
tools: Read, Write, Edit, Bash  # 可选；省略则继承全部工具（security / cloud 角色建议收紧）
---

You are a <角色> ...（开场点明专长）

## Purpose / 职责
该角色在本项目里负责什么。

## 怎么想（Core Philosophy / Approach）
决策时的优先级与方法论（如后端：契约先行、边界清晰、可观测优先）。

## 懂什么（Capabilities）
该领域专长清单，并显式引用本项目 `.claude/skills/` 里对应的 Tool Wrapper（如 backend → backend-conventions、db-conventions）。

## 不该干什么（Boundaries / Constraints）
明确的禁区与上交点，对齐 `/qm:ai` 全局规则：如「不实际执行数据库迁移，只生成迁移文件」「歧义不猜，反向访谈用户」「不放行 Code Review 阻断项」。

## 输出（Output）
交付物形态与必须满足的门禁（质量门禁全绿、按 `requirements.md` 验收标准断言、Code Review 阻断项清零）。
````

按选型生成以下默认 subagent（与 `/qm:ai` §1.1 的 `agentKey` 一一对应；`orchestrator` 即 `/qm:ai` 本体，是编排者而非被委派的 subagent，**不单独建文件**）：

| 文件 | 角色 | 懂什么（重点） | 不该干什么（边界） |
|------|------|----------------|--------------------|
| `product.md` | 产品 Agent | 需求澄清、验收标准核对 | 不擅自定业务规则——歧义反向访谈 |
| `design.md` | 设计 Agent | 设计稿还原 + 像素级验证（加载 ui-design-restore） | 不改后端/共享契约 |
| `frontend.md` | 前端 Agent | 页面/组件/状态/表单 | 不直写 fetch、不碰 DB schema |
| `backend.md` | 后端 Agent | 数据模型/接口/服务/鉴权（加载 backend-conventions、db-conventions） | 不实际执行迁移，只生成迁移文件 |
| `qa.md` | QA Agent | 按 `requirements.md` 验收标准断言（Vitest/Playwright） | 不放宽验收标准 |
| `cloud.md` | 云资源 Agent | 云资源声明与 MCP 配置 | 不擅自创建/变更真实云资源——需用户确认 |
| `security.md` | 安全审查 Agent（**串行**） | PII/鉴权/SSRF/逻辑漏洞、三种 Code Review | 不放行阻断项；高风险操作一律上交确认 |

### 2.3 设计稿还原 Skill：HTML+CSS → React + Tailwind + 像素级验证闭环（前端 UI 还原）

> 当前端选型为 React 系时生成 `.claude/skills/ui-design-restore/`（`SKILL.md` + `references/`）。该 skill 在 `/qm:ai` 的前端任务中按需加载，让前端 Sub-Agent 成为"设计稿高保真还原 + 自验证"专家。它的核心是一条**目标驱动的闭环**：实现 → 多模态视觉比对 → 视觉回归 → 按差异修正 → 直到达标退出，专治"只验证一次、完整度不高"的问题。

`SKILL.md` 至少固化以下还原准则：

1. **结构与层次**：先解析设计稿的 DOM 层次与布局结构，语义化拆分为可复用组件，确保还原布局与样式层次。
2. **Tailwind 实用类**：用 Tailwind 实用类实现样式，设计 token（颜色 / 间距 / 字号 / 圆角 / 阴影）统一映射到 `tailwind.config`，禁止散落魔法值，保证一致性与可维护性。
3. **细节与交互**：还原 hover / focus / active / disabled / loading 等交互态，确保体验与设计稿一致。
4. **动态与动画**：设计稿中的动态交互或动画，用 React 状态管理与生命周期（含 `useEffect` / 过渡库）实现。

**像素级验证闭环（`references/verify-loop.md`）**——这是"完整度高"的关键，五个环节缺一不可：

- **① /goal 定义验收目标**：先把闭环退出条件量化——像素 diff 阈值（如 ≤ 1%）、必须覆盖的断点（mobile / tablet / desktop）、必须覆盖的交互态、动画关键帧。目标未达成不退出闭环。
- **② React + Tailwind 实现**：按组件树落地，token 入 `tailwind.config`。
- **③ MCP 多模态视觉比对**：渲染组件并在各断点 / 各交互态截图，用 MCP 视觉工具（`mcp__zai-mcp-server__ui_diff_check` / `analyze_image`，或 GPT vision 模型）将实现截图与原设计稿逐项比对，输出**语义化差异清单**（布局偏移、颜色偏差、间距、字重、圆角等），而不只给一个相似度数字。
- **④ BackstopJS 视觉回归**：配置 `backstop.json`，scenarios 覆盖各组件 × 断点 × 交互态，以设计稿截图为 reference 跑 `reference → test`，设定 `misMatchThreshold`（如 0.1%），生成可视 diff 报告并纳入 CI。
- **⑤ 闭环迭代**：③④ 任一项未达 ① 的目标 → 依据差异清单修正代码 → 回到 ③，直到所有断点 / 交互态 / 动画全部达标才退出，并把验证报告归档到对应 `Specs/<feature>/`。

> **可复用提示词模板**固化在 `references/restore-prompt.md`，供 `/qm:ai` 前端任务直接引用：
> "请根据 HTML+CSS 设计稿，使用 React 和 Tailwind CSS 还原 UI 界面：① 注意组件结构与层次，还原布局与样式；② 用 Tailwind 实用类实现样式，保证一致性与可维护性；③ 注意细节与交互，体验与设计稿一致；④ 动态交互/动画用 React 状态管理与生命周期实现。完成后**必须**走像素级验证闭环（/goal → MCP 视觉比对 → BackstopJS 回归 → 迭代至达标），不得只截一张图就判通过。"

## 第三步：生成开发规范文档（Generator · 模板生成；全新初始化时完整生成，增量更新时按第〇步规则合并）

> **Generator 模式**：以下章节即本模式的固定**模板（asset）**——每次生成都必须包含且顺序一致；各章节内的规则为质量/风格**参考（references）**，保证规范文档结构稳定、可被 `/qm:prd`、`/qm:ai` 可靠引用。

在项目根目录创建/更新 `CLAUDE.md`，内容包括：

### 项目背景
- 项目定位与目标业务领域（由用户/上下文确定，初始化时填写）
- 核心业务实体（占位，待 `/qm:prd` 解析 PRD 后补全；示例：User、以及各业务领域实体）

### 技术栈
- 列出第一步确定的选型及版本，以及选定的云资源/部署方案

### 工作流架构（动态工作流）
- 工作流具备自构建能力：`/qm:prd` 按 PRD 动态拆解功能模块与任务，`/qm:ai` 按任务动态加载对应 Sub-Agent 与 Skills
- 标准化目录：`.claude/agents/`（Subagent 人格文件）、`cloud/`（云资源声明）、`Specs/`（需求产出）、`docs/workflow.md`（可视化）
- 命令链路：`/qm:init` → `/qm:prd` → `/qm:ai`

### 前端开发规则
- 目录结构约定（pages/routes、components、hooks、api 封装位置）
- 状态管理方案（如 TanStack Query 处理服务端状态，避免自造缓存）
- 表单：统一使用 react-hook-form + zod（校验规则需与后端共享 schema）
- API 调用：统一通过 `src/api/` 下的封装函数，禁止在组件中直写 fetch
- 命名规范：组件 PascalCase，hooks use 前缀，文件名 kebab-case
- 金额字段统一用最小货币单位（如分）存储和传输，展示层转换
- 设计稿还原：以 HTML+CSS 设计稿为输入时，加载 `ui-design-restore` skill，按"组件化拆分 + Tailwind token 化 + 像素级验证闭环（/goal → MCP 多模态视觉比对 → BackstopJS 视觉回归 → 迭代至达标）"还原；UI 任务的验收以**闭环达标**（覆盖各断点与交互态、diff ≤ 阈值）为准，不得只截一张图就判通过

### 后端开发规则
- 目录结构约定（routes/handlers、services、db/schema、middleware）
- API 设计：RESTful，统一响应格式 `{ code, data, message }`
- 输入校验：所有接口入参用 zod schema 校验（与前端共享 packages/shared 中的 schema）
- 数据库：Drizzle schema 放在 `packages/db` 或 `backend/src/db/schema`，迁移用 drizzle-kit
- 鉴权：受保护路由统一走 auth middleware，区分用户端/管理端权限
- 敏感信息（身份证号、银行卡号等 PII）禁止明文日志输出，需脱敏

### 共享约定
- 类型定义放在共享包，前后端复用
- 环境变量：`.env.example` 列出所有必需变量，禁止提交真实密钥

> **规范源唯一（避免 CLAUDE.md / AGENTS.md 双份漂移）**：`CLAUDE.md` 是唯一权威规范源，`/qm:prd`、`/qm:ai` 只读写它。若需兼容读 `AGENTS.md` 的其他工具（Codex / Cursor 等），把 `AGENTS.md` 建成指向 `CLAUDE.md` 的**符号链接**（`ln -s CLAUDE.md AGENTS.md`），**绝不拷贝成两份**——拷贝会随迭代漂移。若发现项目里已存在 `AGENTS.md` 与 `CLAUDE.md` 内容重复，提示用户改为符号链接。

## 完成后

- 输出最终的项目文件树（含 `.claude/agents/`、`.claude/skills/`、`cloud/` 等标准化模块）
- 输出 `CLAUDE.md` 摘要
- 提示用户：技术栈和规范确定后，可使用 `/qm:prd` 拆解需求文档（PRD → Future 功能模块 + 带验收标准的 Requirements）并开始开发
