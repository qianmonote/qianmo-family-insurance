# qm-workflow · 工作流支撑文件集

本文件夹收纳 **qm 全栈 + 多 Agent 工作流**的支撑文件（可视化模板 + 演示样例）。

当前位置：项目内 `.claude/qm-workflow/`，与 `.claude/commands/`、`.claude/skills/` 同级归档。

> ⚠️ **命令本体不在这里**：`/qm:init`、`/qm:prd`、`/qm:ai`、`/qm:status` 四个命令必须放在 `.claude/commands/qm/` 才能被 Claude Code 发现，所以**没有**移到本目录。本目录只放它们的配套资产。

## 目录结构

| 路径 | 是什么 | 用途 |
|------|--------|------|
| `templates/` | 可视化**模板**（`workflow.html` / `office.html` / `workflow.md`） | `/qm:ai`、`/qm:status` 在目标项目里生成/刷新看板时，以此为「本仓库已生成的版本」参照模板 |
| `demo/` | **演示样例**（保单到期提醒场景，非真实项目，见 `demo/README.md`） | 展示 `/qm:prd` → `/qm:ai` 跑完一轮后的产出形态（`Specs/`、`.qm-status.json`、看板） |

## 命令本体位置（不在本目录）

```
.claude/commands/qm/
├── init.md     # /qm:init   — 技术栈访谈 + 脚手架 + 生成 CLAUDE.md / .claude/agents/ / .claude/skills/
├── prd.md      # /qm:prd    — PRD 拆解为 Specs（requirements/proposal/design/tasks）+ 单任务循环
├── ai.md       # /qm:ai     — 多 Agent 并行 + 三种 Code Review + 状态双写 + 可视化
└── status.md   # /qm:status — 只读查询状态 + 刷新看板
.claude/skills/ui-design-restore/   # 设计稿还原 skill（Tool Wrapper）
```

## 命令链路

`/qm:init`（建骨架与规范）→ `/qm:prd`（拆需求）→ `/qm:ai`（多 Agent 执行）→ `/qm:status`（随时看进度）
