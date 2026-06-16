#!/usr/bin/env node
// 释放被占用的端口：在 dev 启动前杀掉残留监听进程，避免 EADDRINUSE。
// 用法: node scripts/free-port.mjs <port> [port...]
import { execSync } from "node:child_process";

const ports = process.argv.slice(2).filter(Boolean);
if (ports.length === 0) {
  console.error("free-port: 未提供端口");
  process.exit(0);
}

for (const port of ports) {
  try {
    const out = execSync(`lsof -nP -tiTCP:${port} -sTCP:LISTEN`, {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    if (!out) continue;
    const pids = [...new Set(out.split(/\s+/))];
    for (const pid of pids) {
      try {
        process.kill(Number(pid), "SIGKILL");
        console.log(`free-port: 已释放端口 ${port}（kill PID ${pid}）`);
      } catch {
        /* 进程可能已退出 */
      }
    }
  } catch {
    // lsof 无匹配时返回非 0，视为端口空闲
  }
}
