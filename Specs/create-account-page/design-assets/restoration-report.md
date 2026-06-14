# 还原度对比报告：Create Account 页面

> 验证方式：结构/文案层面核对（无 stitch MCP 在线视觉比对环境，且无 Playwright e2e 装置，按 CLAUDE.md 规则降级为结构/文案核对 + 关键逻辑单测）。

## 设计稿 vs 实现组件

| 维度 | 设计稿 `create-account-new/index.html` | 实现 `sign-up-form.tsx` | 结论 |
|---|---|---|---|
| 背景 | mesh-bg 多点径向渐变（蓝/绿调） | `bg-[#f8f9ff]` + radial 渐变层 | 一致（等价还原） |
| 卡片 | glass-effect 玻璃卡 + 顶部三色渐变 accent | `bg-white/85 backdrop-blur-xl` + `from-[#003ec7] via-[#25fea8] to-[#620bd3]` accent | 一致 |
| 徽标图标 | Material Symbols `person_add` | lucide `UserPlus` | 语义等价 |
| 标题/副标题 | 创建账户 / 开启您的智能家庭保险管家 | 完全相同 | 一致 |
| 字段 1 姓名 | `person` 图标 + 「姓名」 | lucide `User` + 「姓名」 | 一致 |
| 字段 2 邮箱 | `mail` 图标 + 「注册邮箱」 placeholder hello@family.com | lucide `Mail` + 同文案/placeholder | 一致 |
| 字段 3 密码 | `lock` + 右侧 `visibility` 切换 + 「至少 8 位字符」 | lucide `Lock` + `Eye/EyeOff` 切换 + 「至少 8 位字符」 | 一致 |
| 主按钮 | 「立即注册」+ `arrow_forward` | 「立即注册」/「注册中...」+ `ArrowRight` | 一致（补充 loading 态） |
| 分隔线 | 「或者」 | 「或者」 | 一致 |
| 次级入口 | 「已有账号？返回登录」→ `/login` | 「已有账号？返回登录」→ `router.push(/login)` | 一致 |

## 合理差异（设计稿 vs 实现，可接受）

- **右侧营销面板**：实现复用了既有 `sign-in-form.tsx` 的深色营销面板（`xl:` 双栏），而设计稿用的是右侧大屏配图。决策：以 in-app 的 `/login` 实际版式为准保持登录/注册两页一致，营销面板是配图的功能等价物。
- **字体/图标库**：设计稿用 IBM Plex Sans + Material Symbols（仅预览用 CDN）；实现用项目系统字体栈 + lucide-react，避免引入新依赖，与已还原的 sign-in-form 取舍一致。
- **Trust Footer / 隐私政策链接**：设计稿底部的信任徽标与政策链接未在本次注册组件中逐一还原（沿用 sign-in-form 现状，未在登录页还原）；如需统一补充可在后续设计系统任务中处理。

## 逻辑验证（Vitest）

`src/lib/auth-redirect.test.ts` 7 项断言全部通过，覆盖：
- AC-M2.3：`resolveRedirectTarget` 合法 redirect 优先、非法/缺省回落 `/dashboard`。
- AC-M3.3：`buildAuthSwitchHref` 在 login↔register 间透传并编码合法 redirect、丢弃非法 redirect。
- 安全：`isSafeRedirect` 拒绝外部地址、协议相对地址（`//evil.com`、`/\evil.com`）。

类型检查 `tsc --noEmit` 通过（exit 0）。
