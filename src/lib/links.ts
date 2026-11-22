// Where a creator link should go, and how to label it honestly.

import type { CreatorCandidate } from "./types";

export const PLATFORM_NAME: Record<string, string> = { tiktok: "TikTok", instagram: "Instagram", youtube: "YouTube", x: "X" };

const PROFILE_BASE: Record<string, (h: string) => string> = {
  tiktok: (h) => `https://www.tiktok.com/@${h}`,
  instagram: (h) => `https://www.instagram.com/${h}/`,
  youtube: (h) => `https://www.youtube.com/@${h}`,
};

/** A real handle: letters, digits, dot, underscore. No spaces. */
const HANDLE = /^@?([A-Za-z0-9._]{2,30})$/;

export type ProfileLink = {
  url: string;
  /** "found": the source page linked it. "built": made from handle + platform. */
  kind: "found" | "built";
  label: string;
};

/** The creator's own profile, if we have it or can build it from handle + platform. */
export function profileLink(c: CreatorCandidate): ProfileLink | null {
  const platform = c.platform ? PLATFORM_NAME[c.platform] ?? c.platform : null;
  const found = c.portfolioUrls.find((u) => /^https?:\/\/(www\.)?(tiktok|instagram|youtube)\.com\//i.test(u));
  if (found) return { url: found, kind: "found", label: platform ? `View on ${platform}` : "View profile" };

  const h = c.handle?.match(HANDLE)?.[1];
  const build = c.platform ? PROFILE_BASE[c.platform] : undefined;
  if (h && build) return { url: build(h), kind: "built", label: `View on ${platform}` };
  return null;
}

/** Encode text for a URL text fragment (#:~:text=…). "-", "&" and "," must be escaped. */
function encodeFragmentText(s: string) {
  return encodeURIComponent(s).replace(/-/g, "%2D").replace(/,/g, "%2C").replace(/&/g, "%26");
}

/**
 * Link to the source page that scrolls to (and highlights) the creator's mention,
 * using a text fragment. Browsers without support just open the page normally.
 */
export function sourceLink(url: string, c: Pick<CreatorCandidate, "name" | "handle">): string {
  const term = (c.handle?.match(HANDLE)?.[0] ?? c.name).trim();
  if (!term || !/^https?:/i.test(url)) return url;
  const base = url.split("#")[0];
  return `${base}#:~:text=${encodeFragmentText(term)}`;
}

/** Guess a platform from the page itself, e.g. ".../tiktok-skincare-influencers". Only when unambiguous. */
export function platformFromPage(url: string, title = ""): string | undefined {
  const text = `${url} ${title}`.toLowerCase();
  const hits = [
    /tik ?tok/.test(text) && "tiktok",
    /instagram|insta\b|reels/.test(text) && "instagram",
    /youtube|youtuber/.test(text) && "youtube",
  ].filter(Boolean) as string[];
  return hits.length === 1 ? hits[0] : undefined;
}
