# 登录页修复 · Lessons

## 关键决策
- **导航修复方式**：「点击无反应」的根因定位为命令式 `router.push` 不够稳健；统一改为 Next `<Link>`（经 Base UI `Button` 的 `render` 属性渲染为真实 `<a href>`）。优点：原生导航、可预取、可右键新标签打开、不依赖 JS 事件，且更符合可访问性。地址计算仍复用 `buildAuthSwitchHref`（含开放重定向防护），redirect 透传不变。

## 踩坑点
- **`as const` 污染表单类型**：`DEMO_CREDENTIALS` 初版用 `as const`，使 `email`/`password` 收窄为字面量类型，导致 `@tanstack/react-form` 的 `defaultValues` 推断出字面量类型，`field.handleChange(string)` 与错误项类型全部报错。改为显式 `: { email: string; password: string }` 注解后解决。
- **`render` 渲染为锚点后移除 `type="button"`**：锚点无 `type` 属性语义，保留会无意义；移除后样式（`variant`/`className`）经 Base UI 合并到 Link 上不受影响。

## 非阻断评审建议
- **演示凭证全环境预填的安全性**：当前在所有环境预填 `demo@qianmo.family`/`Qianmo123456`。对外生产环境会暴露演示账号，建议后续按 `process.env.NODE_ENV !== "production"` 收敛预填。本次按 PRD 字面「默认填写」实现，未加环境开关。

## 工作流观察
- 评审阶段发现工作树存在大量**与本需求无关的预先未提交改动**（`link-summary-*`、`user-menu` 等）。`git diff` 全量评审会引入噪音，故将 Reviewer 范围限定到本次实际改动的 5 个文件。建议每个最小执行单元开工前确保工作树干净或先提交基线，便于 `git diff` 精确评审。

## 可复用模式
- **Base UI Button 作为链接**：`<Button render={<Link href={href} />} variant="outline" className="...">{children}</Button>` —— 项目内所有"按钮样式的导航"应统一采用此模式，替代 `onClick={() => router.push(...)}`。
