import { describe, expect, it } from "vitest";
import { platformFromPage, profileLink, sourceLink } from "./links";
import type { CreatorCandidate } from "./types";

const base: CreatorCandidate = {
  id: "x",
  name: "@cherryblossom216",
  handle: "@cherryblossom216",
  platform: "tiktok",
  profileUrl: "https://insense.pro/blog/tiktok-skincare-influencers",
  portfolioUrls: [],
  nicheTags: [],
  contentStyleTags: [],
  evidenceSnippets: [],
  sourceUrls: ["https://insense.pro/blog/tiktok-skincare-influencers"],
  verificationStatus: "unverified",
  origin: "live-search",
};

describe("profileLink", () => {
  it("builds a TikTok profile URL from handle + platform", () => {
    expect(profileLink(base)).toEqual({ url: "https://www.tiktok.com/@cherryblossom216", kind: "built", label: "View on TikTok" });
  });

  it("prefers a profile URL the source page actually linked", () => {
    const c = { ...base, platform: "instagram", portfolioUrls: ["https://www.instagram.com/jackieaina/"] };
    expect(profileLink(c)).toEqual({ url: "https://www.instagram.com/jackieaina/", kind: "found", label: "View on Instagram" });
  });

  it("returns null without a platform or with a handle that isn't real", () => {
    expect(profileLink({ ...base, platform: undefined })).toBeNull();
    expect(profileLink({ ...base, handle: "@aleksic twins" })).toBeNull();
  });
});

describe("sourceLink", () => {
  it("adds a text fragment that jumps to the creator's mention", () => {
    expect(sourceLink(base.sourceUrls[0], base)).toBe(
      "https://insense.pro/blog/tiktok-skincare-influencers#:~:text=%40cherryblossom216",
    );
  });

  it("escapes dashes and replaces an existing hash", () => {
    expect(sourceLink("https://x.com/a#top", { name: "Mary-Kate Olsen" })).toBe("https://x.com/a#:~:text=Mary%2DKate%20Olsen");
  });
});

describe("platformFromPage", () => {
  it("reads the platform from the page URL or title when there is only one", () => {
    expect(platformFromPage("https://insense.pro/blog/tiktok-skincare-influencers")).toBe("tiktok");
    expect(platformFromPage("https://x.com/list", "Top 20 Skincare Instagram Influencers")).toBe("instagram");
    expect(platformFromPage("https://x.com/best-tiktok-and-instagram-creators")).toBeUndefined();
    expect(platformFromPage("https://x.com/skincare-influencers")).toBeUndefined();
  });
});
