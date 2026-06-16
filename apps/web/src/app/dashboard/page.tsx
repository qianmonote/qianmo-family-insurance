import { redirect } from "next/navigation";

/**
 * 「Home」导航对应的 /dashboard 路由始终重定向至「一键总结」页。
 * 未登录时由 proxy 中间件再将 /summary 重定向到 /login（带 redirect 回跳）。
 */
export default function DashboardPage() {
  redirect("/summary");
}
