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

describe("directory sales pitches", () => {
  it("strips 'Request upto top 1,000 … spreadsheet' from evidence", () => {
    const [c] = extractHeuristic({
      url: "https://creators.feedspot.com/x",
      markdown:
        "### 1. Bretman Rock\n\nBio legend Host of a radio show. TikTok Followers 19.9M Request upto top 1,000 Fashion TikTok Influencers with email contacts in a spreadsheet",
    });
    expect(c.evidence[0]).not.toMatch(/Request|spreadsheet/);
    expect(c.evidence[0]).toMatch(/legend Host/);
  });
});

describe("messy bios from live results", () => {
  const ev = (body: string, heading = "Test Creator") =>
    extractHeuristic({ url: "https://creators.feedspot.com/x", markdown: `### 1. ${heading}\n\n${body}` })[0];

  it("drops follower filler and stat runs", () => {
    const c = ev("Makeup and skincare I use - 4.7M - 3.9M - 3.8M TikTok Followers 1.6M");
    expect(c.evidence[0]).toBe("Makeup and skincare I use");
  });

  it("drops links, platform labels and contact asks", () => {
    const c = ev("skincare + lifestyle : DM 4 PAID PROMO ig: itss. moria fashion + sustainability youtube store.rajanimd.com");
    expect(c.evidence[0]).not.toMatch(/DM|PROMO|ig:|itss|rajanimd|\.com/i);
    expect(c.evidence[0]).toMatch(/skincare \+ lifestyle/);
  });

  it("collapses emoji spam and invisible fillers", () => {
    const c = ev("VIRGOAT 🧿🧿🧿🧿🧿🧿 makeup ⠀⠀⠀⠀ beauty skincare 👇👇");
    expect(c.evidence[0]).toBe("VIRGOAT 🧿 makeup beauty skincare");
  });

  it("skips brand accounts", () => {
    expect(ev("Nourish your glow with organic skincare. Trusted by 25,000+ customers. Shop now", "SKYNCARE")).toBeUndefined();
  });

  it("strips emoji from display names", () => {
    expect(ev("skincare and makeup tutorials every week", "✨Yandy✨").name).toBe("Yandy");
    expect(ev("skincare and grwm videos for everyone", "Geniee 👸🏻🤍").name).toBe("Geniee");
  });
});

describe("leftovers", () => {
  const ev = (body: string) =>
    extractHeuristic({ url: "https://creators.feedspot.com/x", markdown: `### 1. Someone\n\n${body}` })[0].evidence[0];
  it("removes a whole 'ig: itss. moria' label", () => {
    expect(ev("skincare + lifestyle : ig: itss. moria")).toBe("skincare + lifestyle");
  });
  it("leaves no orphan skin-tone marks", () => {
    expect(ev("Makeup and skincare I use👇🏼 every day")).toBe("Makeup and skincare I use every day");
  });
  it("drops decorative sparkle words", () => {
    expect(ev("⋆ ˚｡⋆୨୧˚ ˚୨୧⋆｡˚ ⋆ makeup tips skincare recs")).toBe("makeup tips skincare recs");
  });
});

describe("platform from the source page", () => {
  it("uses the page's platform when the bio doesn't say", () => {
    const [c] = extractHeuristic({
      url: "https://insense.pro/blog/tiktok-skincare-influencers",
      markdown: "### 1. @cherryblossom216\n\nCherry shares cozy skincare routines and product swaps.",
    });
    expect(c.platform).toBe("tiktok");
    expect(c.handle).toBe("@cherryblossom216");
  });
});

describe("handles from headings", () => {
  const first = (heading: string, body = "Twins making skincare and beauty videos together.") =>
    extractHeuristic({ url: "https://insense.pro/blog/tiktok-skincare-influencers", markdown: `### 1. ${heading}\n\n${body}` })[0];
  it("keeps a heading that is exactly a handle", () => {
    expect(first("@cherryblossom216").handle).toBe("@cherryblossom216");
  });
  it("doesn't invent a handle from a title with spaces", () => {
    expect(first("@aleksic twins").handle).toBeUndefined();
    expect(first("@aleksic twins", "Twins doing skincare. Follow @aleksictwins for more.").handle).toBe("@aleksictwins");
  });
});
