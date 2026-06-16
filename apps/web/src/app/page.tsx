import { redirect } from "next/navigation";

/**
 * 根路由默认指向「一键总结」页。
 * 未登录时由 proxy 中间件再将 /summary 重定向到 /login（带 redirect 回跳）。
 */
export default function Home() {
  redirect("/summary");
}
