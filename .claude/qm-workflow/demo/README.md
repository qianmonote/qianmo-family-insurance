# 🟡 DEMO · 演示样例（非真实项目）

> **这是 qm 工作流的演示样例，不是真实项目。** 下面的 `Specs/`、`.qm-status.json`、看板数据**全部为样例数据**，仅用于展示工作流跑完一轮后的产出形态，请勿当真实进度引用。

## 演示场景

**保单到期提醒（policy-expiry-reminder）** —— 一个最小需求，演示 `/qm:prd` → `/qm:ai` 的完整一轮：

- 5 个任务全部完成（`tasksSummary: 5/5, blocked 0`）
- 共享类型先行 → 后端接口与前端卡片**并行** → 安全审查**串行**介入
- 8 个 `agentKey` 工位齐全（orchestrator / product / design / frontend / backend / qa / cloud / security），本轮在岗 5 个、空闲 3 个

## 目录内容

| 路径 | 说明 |
|------|------|
| `Specs/policy-expiry-reminder/tasks.md` | 样例任务清单（含并行/串行编排说明） |
| `Specs/policy-expiry-reminder/.qm-status.json` | 样例实时状态文件（`/qm:status` 读取的对象） |
| `docs/workflow.html` · `office.html` | 样例可视化看板（双击在浏览器打开） |
| `docs/status.js` · `workflow.md` | 看板脚本与 Mermaid 源图 |

## 怎么看

直接用浏览器双击 `docs/office.html`（虚拟办公室 · 数字员工）或 `docs/workflow.html`（流水线看板），即可看到这一轮演示的工位状态与任务进展。
