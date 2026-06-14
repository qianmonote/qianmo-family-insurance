# QM 工作流可视化 · Mermaid 源图（模板）

> 本文件是 `/qm:init` → `/qm:prd` → `/qm:ai` 工作流可视化的 **Mermaid 源图模板**，与同目录的 `workflow.html`（2D 动画看板）、`office.html`（虚拟办公室 · 数字员工）**同源**。
>
> - 在 GitHub / IDE / 任何支持 Mermaid 的 Markdown 渲染器中可直接查看下面的图。
> - 在浏览器中双击 `workflow.html` / `office.html` 可查看动画看板版本。
> - `/qm:ai` 每轮执行后会更新本文件（追加/刷新"本轮"小节，反映当前需求的模块名与任务进度）；若本文件不存在则参照此模板重新创建。
> - `/qm:status` 只读刷新 `workflow.html` 的 `#live-status` 区块与 `office.html` 的工位气泡，不改本文件。

## 总览：命令链路与四大支柱

```mermaid
flowchart TD
    subgraph P1[动态工作流架构]
        A[/qm:init/] -->|生成 CLAUDE.md + 标准化目录\n.claude/agents/ .claude/skills/ cloud/ Specs/ docs/| B(项目骨架就绪)
    end
    subgraph P2[智能 PRD 解析]
        B --> C[/qm:prd PRD路径/]
        C -->|拆解为 Future 功能模块| D[requirements.md\n带验收标准]
        D --> E[design.md + tasks.md]
    end
    subgraph P3[多 Agent 协同开发]
        E --> F[/qm:ai $1/]
        F --> G{按角色分派 Sub-Agents}
        G -->|前端 Agent| H1[页面/组件]
        G -->|后端 Agent| H2[接口/数据模型]
        G -->|云资源 Agent\nMCP 配置 AWS| H3[云资源]
        H1 & H2 & H3 -->|并行汇合| I
    end
    subgraph P4[自动化质量保障]
        I[质量门禁 tsc/lint/test] --> J[三种 Code Review\n基础/对抗/Git差异]
        J -->|串行 安全审查 Agent| K[标记完成\n更新 tasks.md + lessons.md]
        K -->|Jira 拉取 Bug| F
        K -->|上下文压缩 /compact| L{还有未完成项?}
    end
    L -->|是| F
    L -->|否| M[汇总报告 + 更新文档/可视化]
    F -->|歧义/高风险| N[暂停, 询问用户\n记录到 proposal.md]
    N --> F
    M -.->|新需求/增量修改| C
```

## 单个最小执行单元（多 Agent 协同）时序

```mermaid
sequenceDiagram
    participant Orch as 编排(/qm:ai)
    participant Dev as 实现 Agent(前端/后端/云)
    participant QA as QA Agent
    participant Sec as 安全审查 Agent(串行)
    Orch->>Dev: 读取 design.md + 验收标准, 分派任务(并行)
    Dev->>Dev: 实现 + 自动加载对应 Skills
    Dev->>QA: 移交质量门禁(tsc/lint/test)
    QA->>QA: 按 requirements 验收标准断言
    QA->>Sec: 基础/对抗/Git差异 Code Review
    Sec-->>Dev: 阻断性问题(逻辑漏洞/未消费必填字段) 回修
    Dev->>Sec: 修复后重审
    Sec->>Orch: 通过, 标记完成 + 写 lessons
    Orch->>Orch: 更新 tasks.md + docs/workflow.md + 上下文压缩
    Orch->>Orch: 进入下一最小执行单元
```

## 实时状态映射（`.qm-status.json` → 看板）

`/qm:ai` 在派发/执行任务前后双写 `Specs/<主题>/.qm-status.json`（覆盖写"当前"状态）；`/qm:status` 据此刷新两张看板：

```mermaid
flowchart LR
    S[(Specs/&lt;主题&gt;/.qm-status.json\ncurrentUnit · agents · tasksSummary)]
    S -->|/qm:status 第四步| W[workflow.html\n#live-status 区块]
    S -->|/qm:status 第五步| O[office.html\n各工位 data-bubble 气泡]
    S -.->|每轮结束 /qm:ai 刷新| MD[workflow.md\n本轮 Mermaid 小节]
```

8 个工位（`agentKey`）与 `.qm-status.json` 的 `agents[].agentKey`、`office.html` 的 `data-agent` 一一对应：

| agentKey | 角色 | 编排/并行/串行 |
|----------|------|----------------|
| `orchestrator` | 编排者（/qm:ai 本体） | 主循环，非被委派 subagent |
| `product` | 产品 Agent | 并行 |
| `design` | 设计 Agent | 并行 |
| `frontend` | 前端 Agent | 并行 |
| `backend` | 后端 Agent | 并行 |
| `qa` | QA Agent | 并行 |
| `cloud` | 云资源 Agent | 并行（实际变更需确认） |
| `security` | 安全审查 Agent | **串行**（合并前介入） |

## 本轮（模板占位 · 由 /qm:ai 每轮替换）

> 下图为占位示例。`/qm:ai` 每轮执行后用当前最小执行单元的真实链路替换本小节（任务编号、承担角色、阶段、完成度）。

```mermaid
flowchart LR
    T[任务&lt;编号&gt; &lt;任务名&gt;] --> DEV[实现 Agent\n&lt;前端/后端/云&gt;]
    DEV --> QA[QA Agent\n质量门禁 tsc/lint/test]
    QA --> SEC[安全审查 Agent\n三种 Code Review · 串行]
    SEC --> DONE[已完成 &lt;done&gt;/&lt;total&gt;]
```
