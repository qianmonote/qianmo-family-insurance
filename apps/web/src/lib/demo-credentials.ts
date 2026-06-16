/**
 * 演示/测试用账号，与 packages/db/src/seed.ts 中的 mock 账号保持一致。
 * 用于登录表单默认预填，方便开发与演示快速登录。
 *
 * 注意：如部署到对外生产环境，建议按环境开关收敛预填行为，避免暴露演示凭证。
 */
export const DEMO_CREDENTIALS: { email: string; password: string } = {
  email: "demo@qianmo.com",
  password: "Qianmo123456",
};
