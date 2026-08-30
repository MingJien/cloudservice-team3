import { normalizeAffiliateCode } from "./tracking";

describe("normalizeAffiliateCode", () => {
  it("canonicalizes safe partner codes", () => {
    expect(normalizeAffiliateCode("  kol_2026 ")).toBe("KOL_2026");
  });

  it("rejects spoofable or oversized values", () => {
    expect(normalizeAffiliateCode("a/b")).toBeNull();
    expect(normalizeAffiliateCode("ab")).toBeNull();
    expect(normalizeAffiliateCode("A".repeat(51))).toBeNull();
  });
});
