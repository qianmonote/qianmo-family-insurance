import { describe, expect, it } from "vitest";

import { PublicArticleFetcher } from "./content-fetcher";
import { UnsafeUrlError } from "./ssrf-guard";

describe("PublicArticleFetcher", () => {
  it("拒绝抓取内网/回环地址（SSRF 防护在实际抓取前生效）", async () => {
    const fetcher = new PublicArticleFetcher();

    await expect(fetcher.fetch("http://127.0.0.1/secret")).rejects.toThrow(UnsafeUrlError);
    await expect(fetcher.fetch("http://169.254.169.254/latest/meta-data")).rejects.toThrow(
      UnsafeUrlError,
    );
    await expect(fetcher.fetch("http://[::1]/secret")).rejects.toThrow(UnsafeUrlError);
  });
});
