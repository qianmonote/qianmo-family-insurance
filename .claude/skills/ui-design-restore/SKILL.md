---
name: ui-design-restore
description: 把 HTML+CSS 设计稿高保真还原为 React + Tailwind CSS，并执行像素级验证闭环（/goal 目标 → MCP 多模态视觉比对 → BackstopJS 视觉回归 → 迭代至达标）。当任务涉及"按设计稿还原 UI""设计稿转 React""HTML+CSS 转组件""像素级还原""UI 验收 / 视觉回归"时加载。
---

# 设计稿还原：HTML+CSS → React + Tailwind（含像素级验证闭环）

让前端 Sub-Agent 成为"设计稿高保真还原 + 自验证"专家。核心不是"还原一次就交付"，而是一条**目标驱动的闭环**：实现 → 多模态视觉比对 → 视觉回归 → 按差异修正 → 直到达标退出。专治"只验证一次、完整度不高"。

## 还原准则（每次都遵守）

1. **结构与层次**：先解析设计稿的 DOM 层次与布局结构，语义化拆分为可复用组件，确保还原布局与样式层次。先搭骨架，再填样式，最后接交互。
2. **Tailwind 实用类 + token 化**：用 Tailwind 实用类实现样式；颜色 / 间距 / 字号 / 行高 / 圆角 / 阴影等设计 token 统一映射到 `tailwind.config`，**禁止散落魔法值**（如 `text-[#3a3a3a]`、`mt-[13px]` 仅在 token 暂缺时临时用，最终须收敛到 config），保证一致性与可维护性。
3. **细节与交互**：还原 hover / focus / active / disabled / loading / empty 等状态，确保体验与设计稿一致；可访问性（语义标签、`aria-*`、焦点可见）一并还原。
4. **动态与动画**：动态交互或动画用 React 状态管理与生命周期（`useState` / `useEffect` / 过渡库如 framer-motion 或 Tailwind `transition`）实现，关键帧与缓动尽量贴合设计稿。

## 工作流（务必按序）

1. **解析设计稿** → 提取 DOM 层次、布局策略（flex/grid）、设计 token、断点、交互态、动画。产出组件树草图。
2. **`/goal` 定义验收目标** → 量化闭环退出条件，写进任务记录。见 `references/verify-loop.md`。
3. **实现** → 按组件树落地 React + Tailwind，token 入 `tailwind.config`。
4. **跑像素级验证闭环** → 严格执行 `references/verify-loop.md` 的五个环节，未达标不退出。
5. **归档** → 把验证报告（差异清单 + BackstopJS diff 报告 + 最终 diff 指标）写入对应 `Specs/<feature>/`。

## 何时加载哪个 reference

- 写实现的提示词模板 → `references/restore-prompt.md`
- 像素级验证闭环的完整步骤与判据 → `references/verify-loop.md`
- BackstopJS 配置样板 → `references/backstop.sample.json`

## 红线

- **不得只截一张图就判通过**。验收必须覆盖所有断点 × 交互态 × 动画关键帧，且 diff ≤ `/goal` 设定的阈值。
- 视觉比对要输出**语义化差异清单**（哪里偏移、偏色、字重不对），不是一个相似度数字了事。
- 闭环未达标时，依据差异清单**定向修正再回到比对环节**，禁止跳过迭代直接交付。
