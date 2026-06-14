# 阡陌家庭保 · 工作流可视化

<!-- qm:summary:start -->
> 由 `/qm:prd` / `/qm:ai` 每轮执行后更新。当前需求批次：**product-bug-fixes**，任务进度 7/7；全部 Specs 汇总进度 36/36。

## 当前需求 / 任务进度

| 需求主题 | 任务进度 | 状态 |
|---|---:|---|
| create-account-page | 6/6 | 已完成 |
| link-summary | 18/18 | 已完成 |
| login-page-fixes | 5/5 | 已完成 |
| product-bug-fixes | 7/7 | 已完成 |
<!-- qm:summary:end -->

## 总览：命令链路与四大支柱

```mermaid
flowchart TD
    subgraph P1[动态工作流架构]
        A[/qm:init/] -->|生成 CLAUDE.md + 标准化目录\nagents/ cloud/ Specs/ docs/| B(项目骨架就绪)
    end
    subgraph P2[智能 PRD 解析]
        B --> C[/qm:prd PRD路径/]
        C -->|拆解为 Future 功能模块| D[requirements.md\n带验收标准]
        D --> E[design.md + tasks.md]
    end
    subgraph P3[多 Agent 协同开发]
        E --> F[/qm:ai /]
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

<!-- qm:current-round:start -->
## 本轮（product-bug-fixes）

```mermaid
flowchart LR
    CUR[product-bug-fixes] --> TASK[当前任务 7 刷新最终工作流看板]
    TASK --> PROG[当前批次 7/7]
    PROG --> ALL[全部 Specs 36/36]
    ALL --> TIME[更新时间 2026-06-14T11:59:07.315Z]
```
<!-- qm:current-round:end -->
