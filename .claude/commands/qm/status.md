---
description: 按需查询当前工作流执行状态，并刷新可视化看板（docs/workflow.html、docs/office.html）；只读查询，不改产出物
argument-hint: "(无参数)"
---

你是 `/qm:status`：按需查询当前工作流执行状态，并刷新可视化看板（`docs/workflow.html`、`docs/office.html`）。本命令为只读查询 + 看板刷新，不修改 `tasks.md`/`design.md`/`proposal.md`/`lessons.md` 等产出物本身。

## 第一步：定位状态文件

1. 在项目内查找所有 `Specs/*/.qm-status.json`（结构定义见 `/qm:ai` 的"工作流可视化 → 实时状态文件"一节）
2. 若不存在任何该文件：
   - 向用户说明"当前没有进行中的 `/qm:ai` 执行，无实时状态可展示"
   - 不修改 `docs/workflow.html`/`docs/office.html`，结束
3. 若存在多个：取 `updatedAt` 最新的一个作为当前状态来源，并在汇报中注明对应的 `<主题>`

## 第二步：读取并汇总

1. 读取选中的 `.qm-status.json`：`currentUnit`、`agents`、`tasksSummary`
2. 读取对应 `Specs/<主题>/tasks.md`，核对整体完成度（已完成/总数/阻塞）与 `tasksSummary` 是否一致；若不一致，以 `tasks.md` 的实际状态为准并在汇报中提示

## 第三步：向用户输出文字摘要

格式示例：

```
当前需求：<主题>
执行单元：<currentUnit.id> <currentUnit.name> · <currentUnit.stage>

各角色状态：
- [前端 Agent] <task> · <stage> · <status>
- [安全审查 Agent] — · 等待 · 空闲
...

任务进度：<done>/<total> 已完成（<blocked> 阻塞）
状态更新时间：<updatedAt>
```

仅 1~2 行即可，不必逐字复述上述模板。

## 第四步：刷新 `docs/workflow.html`

将 `id="live-status"`（`data-live-status`）区块内容替换为基于当前状态生成的简要面板，包含：

- 当前需求主题与执行单元（`currentUnit`）
- 各 `agents` 的角色/任务/阶段/状态（沿用现有 `.agent`/`.node` 风格的简单列表或卡片即可，不必新增大段样式）
- 任务整体进度（`done/total`，可用一个简单的进度条或文字）
- 数据来源与更新时间（`updatedAt`）

若 `docs/workflow.html` 不存在 `#live-status` 区块（旧版本），先按 `/qm:ai` 的"工作流可视化"一节补充该区块结构，再填充内容。

## 第五步：刷新 `docs/office.html`

对 `.qm-status.json` 中 `agents` 数组的每一项：

1. 通过 `data-agent="<agentKey>"` 定位对应 `.ws` 工位
2. 将该工位内 `[data-bubble]` 的文案替换为 `<task> · <stage>`（`status` 为"空闲"时显示"空闲 · 等待分派"）
3. 更新页面底部 `[data-live-updated]` 段落为：`最近一次 /qm:status 刷新：<updatedAt>（数据来源：Specs/<主题>/.qm-status.json）`
4. `[data-live-summary]` 段落可按本轮在岗角色数量更新统计文案（如"3 名数字员工在岗，其余空闲"）

未出现在 `agents` 数组中的角色保持原有文案不变。

## 完成后

向用户报告：已读取的状态来源（`Specs/<主题>/.qm-status.json`）、第三步的文字摘要、以及是否成功刷新了 `docs/workflow.html`/`docs/office.html`（或因文件不存在/结构缺失而未刷新的原因）。
