import { describe, expect, it } from "vitest";
import { buildBriefFromRules } from "./brief-rules";
import { SAMPLE_BRIEF_PROMPT } from "@/data/sample-brief";

describe("buildBriefFromRules", () => {
  it("reads the spec's example brief", () => {
    const b = buildBriefFromRules({ description: SAMPLE_BRIEF_PROMPT, brandName: "GlowUp" });
    expect(b.budgetUsd).toBe(500);
    expect(b.deliverableCount).toBe(3);
    expect(b.category).toBe("skincare");
    expect(b.preferredStyle).toEqual(expect.arrayContaining(["funny", "authentic", "relatable"]));
    expect(b.targetAudience).toBe("Gen Z");
    expect(b.campaignName).toBe("GlowUp Skincare campaign");
  });

  it("leaves unstated fields empty instead of guessing", () => {
    const b = buildBriefFromRules({ description: "We sell protein bars and want some creators" });
    expect(b.category).toBe("fitness");
    expect(b.budgetUsd).toBeUndefined();
    expect(b.deliverableCount).toBeUndefined();
    expect(b.timelineDays).toBeUndefined();
    expect(b.platforms).toEqual([]);
  });

  it("parses $2k, weeks and platforms", () => {
    const b = buildBriefFromRules({ description: "5 TikTok unboxing videos for our sneaker drop, $2k, due in 2 weeks" });
    expect(b.budgetUsd).toBe(2000);
    expect(b.deliverableCount).toBe(5);
    expect(b.timelineDays).toBe(14);
    expect(b.platforms).toEqual(["tiktok"]);
    expect(b.deliverableFormats).toContain("unboxing");
  });
});
