/**
 * 将 Better-Auth 错误码映射为统一的中文文案，避免暴露过多敏感信息（PRD L-6）。
 */
const ERROR_MESSAGES: Record<string, string> = {
  USER_ALREADY_EXISTS: "该邮箱已注册",
  INVALID_EMAIL_OR_PASSWORD: "邮箱或密码不正确",
  EMAIL_NOT_VERIFIED: "邮箱未验证，请先完成验证",
};

export function getAuthErrorMessage(error: { code?: string | undefined; message?: string; statusText?: string }) {
  if (error.code && ERROR_MESSAGES[error.code]) {
    return ERROR_MESSAGES[error.code];
  }
  return error.message || error.statusText || "操作失败，请稍后重试";
}
