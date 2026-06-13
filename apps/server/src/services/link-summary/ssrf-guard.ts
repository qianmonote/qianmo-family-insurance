import dns from "node:dns/promises";
import net from "node:net";

/**
 * 校验给定 IP 是否落在内网/特殊用途地址段（SSRF 防护）。
 */
function isPrivateOrReservedIp(ip: string): boolean {
  const version = net.isIP(ip);

  if (version === 4) {
    const parts = ip.split(".").map(Number);
    const [a = 0, b = 0] = parts;
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 127) return true; // 127.0.0.0/8 loopback
    if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 0) return true; // 0.0.0.0/8
    return false;
  }

  if (version === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::1" || lower === "::") return true; // loopback / unspecified
    if (/^fe[89ab][0-9a-f]:/.test(lower)) return true; // link-local fe80::/10
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local fc00::/7
    if (lower.startsWith("ff")) return true; // multicast ff00::/8

    // IPv4-mapped 地址（::ffff:a.b.c.d），还原为 IPv4 后递归校验
    const mapped = lower.match(/^::ffff:([\da-f]{1,4}):([\da-f]{1,4})$/);
    if (mapped) {
      const high = Number.parseInt(mapped[1] ?? "0", 16);
      const low = Number.parseInt(mapped[2] ?? "0", 16);
      const ipv4 = `${(high >> 8) & 0xff}.${high & 0xff}.${(low >> 8) & 0xff}.${low & 0xff}`;
      return isPrivateOrReservedIp(ipv4);
    }

    return false;
  }

  return true; // 无法识别的格式，保守拒绝
}

export class UnsafeUrlError extends Error {
  constructor(message = "链接指向的地址不允许访问") {
    super(message);
    this.name = "UnsafeUrlError";
  }
}

/**
 * 校验目标 URL 是否安全可抓取：协议必须是 http/https，且解析出的所有 IP 均不在内网/保留地址段内。
 * 抛出 UnsafeUrlError 表示不安全，调用方应将其作为抓取失败处理。
 */
export async function assertUrlIsSafeToFetch(url: URL): Promise<void> {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeUrlError();
  }

  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost") {
    throw new UnsafeUrlError();
  }

  // 若 hostname 本身就是 IP，直接校验（IPv6 字面量在 URL 中带方括号，需先去除）
  const bareHostname =
    hostname.startsWith("[") && hostname.endsWith("]") ? hostname.slice(1, -1) : hostname;
  if (net.isIP(bareHostname)) {
    if (isPrivateOrReservedIp(bareHostname)) {
      throw new UnsafeUrlError();
    }
    return;
  }

  let addresses: string[];
  try {
    const records = await dns.lookup(hostname, { all: true });
    addresses = records.map((r) => r.address);
  } catch {
    throw new UnsafeUrlError("链接域名无法解析");
  }

  if (addresses.length === 0 || addresses.some(isPrivateOrReservedIp)) {
    throw new UnsafeUrlError();
  }
}
