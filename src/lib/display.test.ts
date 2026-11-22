import { describe, expect, it } from "vitest";
import { handleRepeatsName } from "./display";

describe("handleRepeatsName", () => {
  it("ignores @, case and punctuation", () => {
    expect(handleRepeatsName("DosenSkincare", "@dosenskincare")).toBe(true);
    expect(handleRepeatsName("@the.navarose", "@the.navarose")).toBe(true);
    expect(handleRepeatsName("Nava Rose", "@the.navarose")).toBe(false);
    expect(handleRepeatsName("Nava Rose", undefined)).toBe(false);
  });
});
