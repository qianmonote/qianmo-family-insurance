# 登录页修复 · Design

## 数据模型
无变更。

## API
无变更。

## 前端页面/组件设计

### 共享常量：`apps/web/src/lib/demo-credentials.ts`（新增）
```ts
/** 演示/测试用账号，与 packages/db/src/seed.ts 的 mock 账号保持一致 */
export const DEMO_CREDENTIALS = {
  email: "demo@qianmo.family",
  password: "Qianmo123456",
} as const;
```
- 单一来源，供登录表单 `defaultValues` 引用；测试断言其满足校验规则（AC-1.2/1.3）。

### `sign-in-form.tsx`（修改）
- **F1**：`defaultValues` 改为 `{ email: DEMO_CREDENTIALS.email, password: DEMO_CREDENTIALS.password }`。
- **F2**：「新用户？立即加入」按钮由 `onClick={() => router.push(registerHref)}` 改为
  `<Button render={<Link href={registerHref} />} variant="outline" ...>`，渲染为真实 `<a href>`。
  - `registerHref` 仍由 `buildAuthSwitchHref("/register", redirectParam)` 计算（保留 redirect 透传）。
  - 若 `router` 不再被其它逻辑使用则移除其导入（登录成功仍用 `router.push`，保留）。

### `sign-up-form.tsx`（修改，AC-2.4 对称）
- 「已有账号？返回登录」同样改为 `<Button render={<Link href={loginHref} />} ...>`。

## 关键业务逻辑
- 导航地址计算逻辑不变，沿用 `buildAuthSwitchHref`（含开放重定向防护）。
- Base UI `Button` 的 `render` 属性会把样式与 props 合并到传入的 `<Link>` 元素上，最终输出带样式的锚点。

## 存储 & 第三方集成
无。

## 云资源
无。

## 风险与权衡
- 全环境预填演示账号：生产对外暴露时为安全弱点；本次按需求字面实现，建议后续按环境开关收敛（lessons 记录）。
- `render` 渲染为锚点后，原 `type="button"` 不再适用（锚点无 type），点击即原生导航；保留 `variant`/`className` 样式。
