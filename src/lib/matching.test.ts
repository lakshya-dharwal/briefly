import { describe, expect, it } from "vitest";
import { rankCandidates, scoreMatch, termOverlap } from "./matching";
import { SAMPLE_BRIEF } from "@/data/sample-brief";
import { SAMPLE_CREATORS } from "@/data/sample-creators";

describe("scoreMatch", () => {
  it("matches the spec formula when every signal is known", () => {
    const r = scoreMatch({
      niche: 1,
      style: 1,
      portfolio: 1,
      format: 1,
      budget: 1,
      availability: 1,
    });
    expect(r.score).toBe(100);
    expect(r.coverage).toBe(1);
    expect(r.showPreciseScore).toBe(true);
  });

  it("does not treat unknown as a match — it lowers coverage instead", () => {
    const r = scoreMatch({
      niche: 0.9,
      style: 0.9,
      portfolio: null,
      format: null,
      budget: null,
      availability: null,
    });
    expect(r.coverage).toBe(0.5);
    expect(r.confidence).toBe("low");
    expect(r.showPreciseScore).toBe(false);
    expect(r.label).not.toMatch(/%/);
    expect(r.unknown).toEqual(["portfolio", "format", "budget", "availability"]);
  });

  it("returns 0 with no signal at all", () => {
    const r = scoreMatch({
      niche: null,
      style: null,
      portfolio: null,
      format: null,
      budget: null,
      availability: null,
    });
    expect(r.score).toBe(0);
    expect(r.coverage).toBe(0);
  });
});

describe("termOverlap", () => {
  it("is null when nothing is wanted", () => {
    expect(termOverlap([], "anything")).toBeNull();
  });
  it("is case and punctuation insensitive", () => {
    expect(termOverlap(["Skincare", "funny"], "FUNNY skincare-routine!")).toBe(1);
  });
});

describe("rankCandidates", () => {
  it("puts the on-brief sample creator above the off-brief one", () => {
    const ranked = rankCandidates(SAMPLE_BRIEF, SAMPLE_CREATORS);
    const ids = ranked.map((r) => r.creator.id);
    expect(ids.indexOf("sample-maya")).toBeLessThan(ids.indexOf("sample-jordan"));
  });
});
