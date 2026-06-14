import { describe, expect, it } from "vitest";

import { resolveSafeAddress, UnsafeUrlError } from "./ssrf-guard";

describe("resolveSafeAddress", () => {
  it("拒绝非 http(s) 协议", async () => {
    await expect(resolveSafeAddress(new URL("ftp://example.com/file"))).rejects.toThrow(
      UnsafeUrlError,
    );
  });

  it("拒绝 localhost", async () => {
    await expect(resolveSafeAddress(new URL("http://localhost/api"))).rejects.toThrow(
      UnsafeUrlError,
    );
  });

  it("拒绝 IPv4 回环地址", async () => {
    await expect(resolveSafeAddress(new URL("http://127.0.0.1/api"))).rejects.toThrow(
      UnsafeUrlError,
    );
  });

  it("拒绝私有网段地址", async () => {
    await expect(resolveSafeAddress(new URL("http://10.0.0.5/api"))).rejects.toThrow(
      UnsafeUrlError,
    );
    await expect(resolveSafeAddress(new URL("http://192.168.1.1/api"))).rejects.toThrow(
      UnsafeUrlError,
    );
    await expect(resolveSafeAddress(new URL("http://172.16.0.1/api"))).rejects.toThrow(
      UnsafeUrlError,
    );
  });

  it("拒绝链路本地地址", async () => {
    await expect(resolveSafeAddress(new URL("http://169.254.169.254/latest"))).rejects.toThrow(
      UnsafeUrlError,
    );
  });

  it("拒绝 IPv6 回环、未指定与本地地址", async () => {
    await expect(resolveSafeAddress(new URL("http://[::1]/api"))).rejects.toThrow(
      UnsafeUrlError,
    );
    await expect(resolveSafeAddress(new URL("http://[::]/api"))).rejects.toThrow(
      UnsafeUrlError,
    );
    await expect(resolveSafeAddress(new URL("http://[fe80::1]/api"))).rejects.toThrow(
      UnsafeUrlError,
    );
    await expect(resolveSafeAddress(new URL("http://[fd00::1]/api"))).rejects.toThrow(
      UnsafeUrlError,
    );
  });

  it("拒绝 IPv6 多播地址", async () => {
    await expect(resolveSafeAddress(new URL("http://[ff02::1]/api"))).rejects.toThrow(
      UnsafeUrlError,
    );
  });

  it("拒绝 IPv4-mapped IPv6 私网/回环地址", async () => {
    await expect(resolveSafeAddress(new URL("http://[::ffff:127.0.0.1]/api"))).rejects.toThrow(
      UnsafeUrlError,
    );
    await expect(resolveSafeAddress(new URL("http://[::ffff:10.0.0.1]/api"))).rejects.toThrow(
      UnsafeUrlError,
    );
    await expect(
      resolveSafeAddress(new URL("http://[::ffff:169.254.169.254]/api")),
    ).rejects.toThrow(UnsafeUrlError);
  });

  it("接受公开 IPv4/IPv6 地址，并返回该地址用于钉住连接", async () => {
    await expect(resolveSafeAddress(new URL("http://8.8.8.8/api"))).resolves.toEqual({
      address: "8.8.8.8",
      family: 4,
    });
    await expect(
      resolveSafeAddress(new URL("http://[2606:4700:4700::1111]/api")),
    ).resolves.toEqual({
      address: "2606:4700:4700::1111",
      family: 6,
    });
  });
});
