import { describe, expect, it } from "vitest";
import { maskToken } from "./token-mask";

describe("maskToken", () => {
  it("keeps only a short prefix and suffix of a real token", () => {
    const token = "MTIzNDU2Nzg5MDEyMzQ1Njc4.ABCDEF.ghijklmnopqrstuvwxyz";
    const masked = maskToken(token);
    expect(masked.startsWith("MTIz")).toBe(true);
    expect(masked.endsWith("wxyz")).toBe(true);
    expect(masked).toContain("************");
    // The full secret must never survive masking.
    expect(masked).not.toContain(token);
    expect(masked.length).toBeLessThan(token.length);
  });

  it("never returns the original value for short inputs", () => {
    expect(maskToken("short")).toBe("*****");
    expect(maskToken("")).toBe("");
  });

  it("handles null and undefined without throwing", () => {
    expect(maskToken(null)).toBe("");
    expect(maskToken(undefined)).toBe("");
  });
});
