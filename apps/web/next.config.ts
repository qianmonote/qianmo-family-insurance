import "@qianmo-family-insurance/env/web";
import type { NextConfig } from "next";

// 后端真实地址（AWS Lambda Function URL）。前端同源请求 /api/* 由下方 rewrite 服务端代理到此，
// 使登录 Cookie 落在前端域上成为第一方，规避浏览器对第三方 Cookie 的拦截。
const BACKEND_ORIGIN = process.env.NEXT_PUBLIC_SERVER_URL;

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_ORIGIN}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
