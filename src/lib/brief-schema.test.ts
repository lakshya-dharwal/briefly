import { describe, expect, it } from "vitest";
import { BriefSchema, briefErrors, sanitizeBrief } from "./brief-schema";
import { SAMPLE_BRIEF } from "@/data/sample-brief";

describe("brief validation", () => {
  it("accepts the sample brief", () => {
    expect(BriefSchema.safeParse(SAMPLE_BRIEF).success).toBe(true);
    expect(briefErrors(SAMPLE_BRIEF)).toEqual({});
  });

  it("explains out-of-range numbers per field", () => {
    const e = briefErrors({ ...SAMPLE_BRIEF, budgetUsd: 0, deliverableCount: 500, timelineDays: 1000 });
    expect(e.budgetUsd).toBe("Budget must be at least 1.");
    expect(e.deliverableCount).toBe("Number of videos can be at most 50.");
    expect(e.timelineDays).toBe("Deadline can be at most 365.");
  });

  it("requires a niche to search", () => {
    const e = briefErrors({ ...SAMPLE_BRIEF, nicheKeywords: [], category: "general" });
    expect(e.nicheKeywords).toBe("Add at least one creator niche to search for.");
  });

  it("rejects overlong tags and unknown platforms", () => {
    expect(briefErrors({ ...SAMPLE_BRIEF, preferredStyle: ["x".repeat(61)] }).preferredStyle).toMatch(/under 60/);
    expect(BriefSchema.safeParse({ ...SAMPLE_BRIEF, platforms: ["myspace"] }).success).toBe(false);
  });

  it("rejects an empty campaign name", () => {
    expect(briefErrors({ ...SAMPLE_BRIEF, campaignName: "  " }).campaignName).toBe("Give the campaign a name.");
  });
});


describe("sanitizeBrief", () => {
  it("turns impossible numbers into unknowns and trims lists", () => {
    const b = sanitizeBrief({
      ...SAMPLE_BRIEF,
      budgetUsd: 0,
      deliverableCount: 3,
      timelineDays: 9999,
      platforms: ["tiktok", "myspace"],
      preferredStyle: ["funny", " funny ", "", "x".repeat(80)],
    });
    expect(b.budgetUsd).toBeUndefined();
    expect(b.deliverableCount).toBe(3);
    expect(b.timelineDays).toBeUndefined();
    expect(b.platforms).toEqual(["tiktok"]);
    expect(b.preferredStyle).toEqual(["funny"]);
    expect(BriefSchema.safeParse(b).success).toBe(true);
  });
});
