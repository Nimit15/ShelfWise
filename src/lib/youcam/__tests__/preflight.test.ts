import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  checkRateLimit,
  clearRateLimit,
  setRateLimitConfig,
  validateSelfiePreflight,
} from "@/lib/youcam/preflight";

describe("Rate limiter", () => {
  beforeEach(() => {
    setRateLimitConfig({ maxRequests: 10, windowMs: 60 * 60 * 1000 });
    ["test-ip", "ip-1", "ip-2", "custom-ip"].forEach(clearRateLimit);
  });

  afterEach(() => {
    ["test-ip", "ip-1", "ip-2", "custom-ip"].forEach(clearRateLimit);
    setRateLimitConfig({ maxRequests: 10, windowMs: 60 * 60 * 1000 });
  });

  it("allows requests under the limit and reports the remaining allowance", () => {
    const result = checkRateLimit("test-ip");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it("blocks requests after the configured limit", () => {
    for (let index = 0; index < 10; index += 1) checkRateLimit("test-ip");
    const result = checkRateLimit("test-ip");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });

  it("keeps limits separate by IP", () => {
    for (let index = 0; index < 10; index += 1) checkRateLimit("ip-1");
    expect(checkRateLimit("ip-2").allowed).toBe(true);
  });

  it("respects a custom rate-limit configuration", () => {
    setRateLimitConfig({ maxRequests: 2, windowMs: 60 * 60 * 1000 });
    checkRateLimit("custom-ip");
    checkRateLimit("custom-ip");
    expect(checkRateLimit("custom-ip").allowed).toBe(false);
  });

  it("can clear an IP's rate-limit state", () => {
    for (let index = 0; index < 10; index += 1) checkRateLimit("test-ip");
    clearRateLimit("test-ip");
    expect(checkRateLimit("test-ip").allowed).toBe(true);
  });
});

describe("YouCam image preflight", () => {
  const createMockFile = (type = "image/jpeg", size = 1024 * 1024): File => {
    const file = new File(["sample image"], "selfie.jpg", { type });
    Object.defineProperty(file, "size", { value: size });
    return file;
  };

  it("accepts JPEG and PNG files", async () => {
    expect((await validateSelfiePreflight(createMockFile("image/jpeg"), "HD")).valid).toBe(true);
    expect((await validateSelfiePreflight(createMockFile("image/png"), "SD")).valid).toBe(true);
  });

  it("rejects unsupported formats such as WebP and GIF", async () => {
    expect((await validateSelfiePreflight(createMockFile("image/webp"), "HD")).valid).toBe(false);
    expect((await validateSelfiePreflight(createMockFile("image/gif"), "SD")).valid).toBe(false);
  });

  it("requires files to be smaller than 10 MB", async () => {
    const result = await validateSelfiePreflight(createMockFile("image/jpeg", 10 * 1024 * 1024), "HD");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("smaller than 10 MB");
  });

  it("accepts an SD image with a 480 px short side", async () => {
    const result = await validateSelfiePreflight({ width: 640, height: 480 }, "SD");
    expect(result.valid).toBe(true);
  });

  it("rejects an SD image below the 480 px short-side minimum", async () => {
    const result = await validateSelfiePreflight({ width: 640, height: 400 }, "SD");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("480px");
  });

  it("accepts an HD image with a 1080 px short side", async () => {
    const result = await validateSelfiePreflight({ width: 1440, height: 1080 }, "HD");
    expect(result.valid).toBe(true);
  });

  it("rejects an HD image below the 1080 px short-side minimum", async () => {
    const result = await validateSelfiePreflight({ width: 1440, height: 900 }, "HD");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("1080px");
  });

  it("warns when the long edge is above 2560 px", async () => {
    const result = await validateSelfiePreflight({ width: 3000, height: 1200 }, "HD");
    expect(result.valid).toBe(true);
    expect(result.warnings.some((warning) => warning.includes("automatically resizes"))).toBe(true);
  });

  it("rejects unreadable dimension metadata", async () => {
    const result = await validateSelfiePreflight({ width: 0, height: 0 }, "HD");
    expect(result.valid).toBe(false);
  });
});
