# 像素级验证闭环（verify-loop）

这是"完整度高"的关键。五个环节缺一不可，**未达标不退出**。

## ① /goal 定义验收目标（先量化退出条件）

在写任何验证脚本前，先把闭环的退出条件写死，建议落到任务记录 / `Specs/<feature>/design.md`：

- **像素 diff 阈值**：默认整页 `misMatchPercentage ≤ 1%`，关键组件（按钮、表单、卡片）`≤ 0.5%`。
- **断点覆盖**：至少 mobile（375）/ tablet（768）/ desktop（1440），如设计稿另有断点一并列入。
- **交互态覆盖**：default / hover / focus / active / disabled / loading / empty / error（按组件实际有的态）。
- **动画覆盖**：列出关键帧（起始 / 中间 / 结束）与缓动，作为人工/录屏校验点。
- **退出条件**：以上所有维度的 diff 均 ≤ 阈值，差异清单清零或仅剩"可接受"标注项。

> 阈值与覆盖维度是**这一条 feature 的契约**——后续每次迭代都对照它判断"是否可退出"。

## ② React + Tailwind 实现

按组件树落地，设计 token 入 `tailwind.config`。实现细节与提示词见 `restore-prompt.md`。

## ③ MCP 多模态视觉比对（语义层）

渲染组件并在**各断点 × 各交互态**截图，与原设计稿逐项比对：

- 工具：`mcp__zai-mcp-server__ui_diff_check`（首选，直接做 UI 差异检查）/ `mcp__zai-mcp-server__analyze_image`，或 GPT vision 模型。
- 输出**语义化差异清单**，而不是一个相似度数字。每条形如：
  - `[布局] header 右侧图标组水平偏移约 8px`
  - `[颜色] 主按钮背景 #2F6BFF vs 设计稿 #2D67F5，偏差可感知`
  - `[字体] 卡片标题字重 500 vs 设计稿 600`
  - `[间距] 列表项垂直 gap 12px vs 设计稿 16px`
  - `[圆角] 输入框 6px vs 设计稿 8px`
- 每条标注 `阻断 / 可接受`，阻断项进入 ⑤ 的修正清单。

## ④ BackstopJS 视觉回归（像素层）

- 用 `backstop.sample.json` 为模板生成项目 `backstop.json`，scenarios 覆盖**组件 × 断点 × 交互态**（hover/focus 等用 `hoverSelector` / `clickSelector` / `readySelector` 触发）。
- 以设计稿截图为 reference：先 `backstop reference`（或把设计稿切图放入 reference 目录），再 `backstop test`，生成可视 diff 报告。
- 设 `misMatchThreshold`（如 `0.1`），低于阈值视为通过；纳入 CI，后续改动自动回归。

常用命令：

```bash
npx backstop reference   # 生成/更新基准
npx backstop test        # 对比并产出 HTML diff 报告
npx backstop approve     # 人工确认后把 test 结果转为新基准
```

## ⑤ 闭环迭代（达标才退出）

- ③ 或 ④ 任一未达 ① 的目标 → 依据**差异清单**定向修正代码（优先调 token，再调结构）→ **回到 ③** 重新比对。
- 循环直到：所有断点 / 交互态 / 动画的 diff 均 ≤ 阈值，差异清单无阻断项。
- 退出后把验证报告归档到 `Specs/<feature>/`：
  - 最终各维度 diff 指标表
  - 差异清单的最终状态（已修 / 可接受）
  - BackstopJS HTML diff 报告路径
  - 关键交互/动画的录屏或截图序列

## 完整度自检清单（退出前逐项打勾）

- [ ] 每个断点都跑过比对，不止 desktop
- [ ] 每个交互态都截图比对，不止 default
- [ ] 动画关键帧逐帧/录屏校验过
- [ ] diff 指标全部 ≤ /goal 阈值
- [ ] 差异清单无阻断项
- [ ] token 已收敛到 tailwind.config，无残留魔法值
- [ ] 可访问性（焦点可见、aria、语义标签）已还原
- [ ] BackstopJS 已纳入 CI，基准已 approve
