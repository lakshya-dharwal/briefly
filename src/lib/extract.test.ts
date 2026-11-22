import { describe, expect, it } from "vitest";
import { cleanMarkdown, extractHeuristic, mergeCreators, quoteInPage } from "./extract";

const LISTICLE = `# Top skincare creators

3

[Jackie Aina](https://www.instagram.com/jackieaina/) Skincare / Beauty

Known for honest skincare reviews for deeper skin tones.

4

[Some Post](https://www.instagram.com/p/ABC123/) not a profile

> @spencer.barbosa just my opinion on skincare routines ♬ original sound
`;

describe("extractHeuristic", () => {
  const found = extractHeuristic({ url: "https://example.com/list", markdown: LISTICLE });

  it("picks up profile links and embedded post handles", () => {
    expect(found.map((f) => f.handle)).toEqual(["@jackieaina", "@spencer.barbosa"]);
  });

  it("skips post links that aren't profiles", () => {
    expect(found.find((f) => f.handle === "@p")).toBeUndefined();
  });

  it("keeps the source page and a profile URL that is in the page", () => {
    expect(found[0].sourceUrl).toBe("https://example.com/list");
    expect(found[0].profileUrl).toBe("https://www.instagram.com/jackieaina/");
    expect(found[0].evidence[0]).toMatch(/honest skincare reviews/);
  });
});

describe("mergeCreators", () => {
  it("merges the same creator across pages and keeps every source", () => {
    const merged = mergeCreators([
      { name: "Jackie Aina", handle: "@jackieaina", nicheTags: [], styleTags: [], evidence: ["a"], sourceUrl: "https://a.com" },
      { name: "@JackieAina", handle: "@JackieAina", nicheTags: ["skincare"], styleTags: [], evidence: ["b"], sourceUrl: "https://b.com" },
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0].name).toBe("Jackie Aina");
    expect(merged[0].sourceUrls).toEqual(["https://a.com", "https://b.com"]);
    expect(merged[0].verificationStatus).toBe("unverified");
  });
});

describe("guards", () => {
  it("only accepts quotes that are really in the page", () => {
    expect(quoteInPage("honest skincare   reviews for deeper", LISTICLE)).toBe(true);
    expect(quoteInPage("the best creator in the world", LISTICLE)).toBe(false);
  });

  it("drops emails and phone numbers from evidence", () => {
    const md = "### 1. Anna\n\nSkincare reviews and routines. CP: 0851-5897-3412 hi@anna.com";
    const [c] = extractHeuristic({ url: "https://example.com", markdown: md });
    expect(c.evidence[0]).toBe("Skincare reviews and routines.");
  });

  it("strips base64 junk", () => {
    expect(cleanMarkdown(`hi ${"A".repeat(500)} there`)).toBe("hi there");
  });
});

describe("directory pages", () => {
  const FEED = `### 59. Kelsey Kotzur

Bio NYC Travel + Fashion + Life \\ \\ \\ TikTok Account @kelseykotzur \\+ Follow TikTok Followers 242.2K Type Macro Get Email Contact 60. Bridget Brown Bio collecting vintage

### 60. Bridget Brown

Bio collecting vintage TikTok Account @bridgetbrown`;
  const found = extractHeuristic({ url: "https://creators.feedspot.com/x", markdown: FEED });

  it("never lets one creator's evidence run into the next", () => {
    const kelsey = found.find((f) => f.name === "Kelsey Kotzur")!;
    expect(kelsey.evidence[0]).not.toMatch(/Bridget|vintage/);
  });

  it("strips directory boilerplate and reads the platform label", () => {
    const kelsey = found.find((f) => f.name === "Kelsey Kotzur")!;
    expect(kelsey.evidence[0]).not.toMatch(/\+ ?Follow\b|Get Email|Type Macro|\\/);
    expect(kelsey.platform).toBe("tiktok");
    expect(kelsey.handle).toBe("@kelseykotzur");
  });
});

describe("names", () => {
  it("prefers the readable name in 'handle (Name - tagline)' headings", () => {
    const [c] = extractHeuristic({
      url: "https://x.io",
      markdown: "### 1. dixiedamelio (Dixie D'Amelio - Fashion Focus)\n\nOutfit styling and fashion hauls for everyday wardrobes.",
    });
    expect(c.name).toBe("Dixie D'Amelio");
  });
});
