import { describe, expect, it } from "vitest";
import { normalizeAddress, parseCusd } from "./stealth-config";

describe("StealthFund input normalization", () => {
  it("scales 1,000 cUSD to exactly 1,000e6", () => {
    expect(parseCusd("1000")).toBe(1_000_000_000n);
  });

  it("normalizes a lowercase address to its checksum counterpart", () => {
    expect(normalizeAddress("0x836ea41903ac2aee56c0a7afc403d83c951bdda6")).toBe("0x836EA41903AC2AeE56c0a7afC403d83C951BddA6");
  });

  it("rejects malformed campaign addresses", () => {
    expect(() => normalizeAddress("0x836Ea419")).toThrow(/invalid/i);
  });
});
