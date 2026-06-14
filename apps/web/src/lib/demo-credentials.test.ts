import { describe, expect, it } from "vitest";
import { z } from "zod";

import { DEMO_CREDENTIALS } from "./demo-credentials";

// 与 sign-in-form.tsx 中登录表单一致的校验规则
const signInSchema = z.object({
  email: z.email("请输入有效的邮箱地址"),
  password: z.string().min(8, "密码至少 8 位字符"),
});

describe("DEMO_CREDENTIALS", () => {
  // AC-1.2：预填值需满足登录表单校验，保证「立即登录」初始可点击、提交不报校验错误
  it("满足登录表单的校验规则", () => {
    const result = signInSchema.safeParse(DEMO_CREDENTIALS);
    expect(result.success).toBe(true);
  });

  // AC-1.3：与 seed mock 账号一致（packages/db/src/seed.ts）
  it("与 seed 中的演示账号保持一致", () => {
    expect(DEMO_CREDENTIALS.email).toBe("demo@qianmo.family");
    expect(DEMO_CREDENTIALS.password).toBe("Qianmo123456");
  });
});
