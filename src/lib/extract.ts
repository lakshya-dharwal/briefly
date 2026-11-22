// Creator extraction: pages ABOUT creators (listicles, roundups, threads)
// -> the individual creators those pages actually name.
//
// Honesty guardrails:
// - Every creator must be named in the page text we fetched.
// - Every evidence quote must appear verbatim in that page, or it is dropped.
// - A profile URL is kept only if it literally appears in the page.
// - Every creator keeps a link back to the page it came from.

import { platformFromPage } from "./links";
import type { CreatorCandidate } from "./types";

export type SourcePage = { url: string; title?: string; markdown: string };

export type ExtractedCreator = {
  name: string;
  handle?: string;
  platform?: string;
  profileUrl?: string;
  nicheTags: string[];
  styleTags: string[];
  evidence: string[];
  sourceUrl: string;
};

// ---------- cleaning ----------

/** Strip images, data URIs and long base64/garbage runs so pages are readable text. */
export function cleanMarkdown(md: string): string {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/data:[a-z]+\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+/gi, "")
    .replace(/\S{200,}/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const squash = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

/** True if `quote` appears in `page` (whitespace and case insensitive). */
export function quoteInPage(quote: string, page: string): boolean {
  const q = squash(quote);
  return q.length >= 12 && squash(page).includes(q);
}

// ---------- platform helpers ----------

const PROFILE_RE =
  /\[([^\]]{1,80})\]\((https?:\/\/(?:www\.)?(tiktok|instagram|youtube)\.com\/(@?[A-Za-z0-9._-]+)\/?(?:\?[^)\s]*)?)\)/g;

const NOT_HANDLES = new Set(["p", "reel", "reels", "watch", "video", "explore", "shorts", "channel", "c", "tag", "music", "discover"]);

const PROFILE_RE_ONE = /\((https?:\/\/(?:www\.)?(?:tiktok|instagram|youtube)\.com\/@?[A-Za-z0-9._-]+\/?)\)/;
const GENERIC_LINK = /^(view|follow|visit|see|open|watch|profile|tiktok|instagram|youtube|link|here)\b/i;

function siteRootOf(url: string) {
  try {
    const parts = new URL(url).hostname.replace(/^www\./, "").split(".");
    return parts.length >= 2 ? parts[parts.length - 2] : "";
  } catch {
    return "";
  }
}

/** Remove markdown links/emphasis/heading marks, keep the visible text. */
function stripMd(s: string) {
  return s
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`#>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Drop contact details (emails, phone numbers) that creator bios often include. */
const noEmails = (s: string) =>
  s
    .replace(/\S*@\S+\.\S+/g, "")
    .replace(/(?:\b(?:CP|WA|Tel|Phone|Contact)\s*:?\s*)?\+?\d[\d\s().-]{7,}\d/gi, "")
    .replace(/\s+/g, " ")
    .trim();

function firstHandle(s: string) {
  return s.match(/(?<![\w.*@])@[A-Za-z0-9._]{3,30}(?![\w]*\.(?:com|net|org|io|co)\b)/)?.[0];
}

function platformMentioned(s: string) {
  const m =
    s.match(/\b(tiktok|instagram|youtube)\s+account\b/i) ??
    s.match(/(tiktok|instagram|youtube)\.com\//i) ??
    s.match(/\b(tiktok|instagram|youtube)\b/i);
  return m ? m[1].toLowerCase() : undefined;
}

/** The listing site's own social account, e.g. @influencerintelligence on influencerintelligence.com. */
function isSiteAccount(key: string, siteRoot: string) {
  return siteRoot.length >= 4 && (key === siteRoot || key.startsWith(siteRoot));
}

/** "dixiedamelio (Dixie D'Amelio - Fashion Focus)" -> "Dixie D'Amelio". */
function cleanName(raw: string) {
  const m = raw.match(/^\S+\s*\(([^()]+?)(?:\s+[-–—|]\s+[^()]*)?\)$/);
  return (m ? m[1] : raw.replace(/\s+[-–—|]\s+.*$/, "")).trim();
}

/** Where the next roundup entry starts: a link, a heading, or "60. Name". */
const NEXT_HEAD = /#{1,4}\s|\n\s*\d{1,3}\s*\n|\s\d{1,3}\.\s+(?=[A-Z@])/;
const NEXT_ENTRY = new RegExp(`\\[|${NEXT_HEAD.source}`);

/** Remove directory-site boilerplate and contact details from a snippet. */
function tidy(s: string) {
  return noEmails(
    s
      .replace(/\S*@\S+\.\S+/g, "") // emails first, before the domain stripper sees them
      .replace(/\\+/g, " ")
      .replace(/\+\s*Follow\b/gi, "")
      .replace(/Get Email Contact/gi, "")
      .replace(/\bType\s+(?:Mega|Macro|Micro|Nano|Mid)\b/gi, "")
      .replace(/\bGender\s+(?:Male|Female)\b/gi, "")
      .replace(/\b(?:TikTok|Instagram|YouTube)\s+Account\s+@[\w.]+/gi, "")
      .replace(/^\s*Bio\s+/i, "")
      // directory-site sales pitches, e.g. "Request upto top 1,000 … with email contacts in a spreadsheet"
      .replace(/\bRequest up ?to\b.*?(?:spreadsheet\S*|$)/gi, "")
      .replace(/\b(?:Download|Export) (?:the )?(?:full )?list\b.*$/i, "")
      // links and handles-as-labels: "store.x.com", "ig: itss. moria", "Snap:banel", "Instagram Handle @nikki"
      .replace(/https?:\/\/\S+/g, "")
      .replace(/\b[\w-]+(?:\.[\w-]+)*\.(?:com|co|io|to|me|ly|link|bio|net|org|shop|store|tv)\b(?:\/\S*)?/gi, "")
      .replace(/\bInstagram Handle\s*@[\w.]+/gi, "")
      .replace(/\b(?:ig|insta|snap(?:chat)?|yt)\b(?:\s*\+\s*\w+)?\s*:\s*@?\w+(?:[._]\w+)*(?:\.\s?[a-z]+)?/gi, "")
      .replace(/\b(?:LinkedIn|Role)\s*:\s*/gi, "")
      .replace(/\bE-?mail\b\s*\S{0,3}\s*:?/gi, "")
      // follower filler and stat runs: "TikTok Followers 1.6M", "- 4.7M - 3.9M - 3.8M"
      .replace(/\b(?:(?:TikTok|Instagram|YouTube)\s+)?Followers\s+[\d.,]+\s*[KkMm]?\b/g, "")
      .replace(/(?:\s[-–]\s*\d[\d.,]*\s*[KkMm]?\b){2,}/g, "")
      // contact asks: "DM 4 PAID PROMO"
      .replace(/\bDM\s*(?:4|for|me)?\s*(?:paid\s*)?(?:promos?|collabs?|business)\b/gi, "")
      // invisible fillers, link arrows, envelope/mail emoji, emoji spam
      .replace(/[\u2800\u200B\u3164\u00AD]/g, "")
      .replace(/[⬇👇↓🔗📧💌]\uFE0F?/gu, "")
      // orphaned skin-tone marks left behind by removed emoji (e.g. 👇🏼 -> 🏼)
      .replace(/(^|[^\p{Extended_Pictographic}️‍])[\u{1F3FB}-\u{1F3FF}]/gu, "$1")
      // decorative sparkle "words" like "⋆ ˚｡⋆୨୧˚"
      .split(/\s+/)
      .filter((w) => !/[˚₊‧⋆✧✦｡ﾟ゜⁺˖]/u.test(w))
      .join(" ")
      .replace(/(\p{Extended_Pictographic}\uFE0F?)\1{2,}/gu, "$1")
      // tidy leftover separators
      .replace(/(?:\s*[-–|•:]\s*){2,}/g, " · ")
      .replace(/^[\s\-–|•:·]+|[\s\-–|•:·]+$/g, ""),
  );
}

/** Accounts that read like a brand or shop, not a person. */
const BRAND_COPY = /\bshop now\b|trusted by [\d,]+\+?\s*customers|\bour (?:products|store|shop)\b|\buse code\s+\w+/i;

/** Display name without emoji or decorative symbols ("✨Yandy✨" -> "Yandy"). */
export function displayName(raw: string) {
  const t = raw
    .replace(/[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\uFE0F\u200D♡♥★☆✿❀•·˚₊‧]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  return t || raw.trim();
}

/** Split markdown into "N. Name" heading entries with the text under each. */
function numberedBlocks(md: string) {
  const re = /^#{1,4}\s*(?:\*\*)?\s*\d{1,3}[.)]\s+(.+?)\s*$/gm;
  const heads = [...md.matchAll(re)];
  return heads.map((h, i) => {
    const start = (h.index ?? 0) + h[0].length;
    const end = i + 1 < heads.length ? (heads[i + 1].index ?? md.length) : Math.min(md.length, start + 1200);
    return { heading: h[1], body: md.slice(start, end).slice(0, 1200) };
  });
}

function clip(s: string, n = 280) {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n).replace(/\s\S*$/, "")}…` : t;
}

// ---------- heuristic extraction (no LLM) ----------

/**
 * Pattern-based fallback: markdown links to social profiles, and embedded
 * TikTok post captions ("> @handle ..."). Brand accounts can slip through here;
 * the Claude path filters those out.
 */
export function extractHeuristic(page: SourcePage): ExtractedCreator[] {
  const md = cleanMarkdown(page.markdown);
  const siteRoot = siteRootOf(page.url);
  const out: ExtractedCreator[] = [];
  const seen = new Set<string>();
  const push = (c: ExtractedCreator) => {
    const k = (c.handle ?? c.name).toLowerCase().replace(/^@/, "");
    if (!k || seen.has(k) || isSiteAccount(k, siteRoot)) return;
    seen.add(k);
    out.push(c);
  };

  // 1. Numbered roundup entries: "### 9. @handle" / "### 17. Lisa Baisl" + the paragraph under it.
  for (const block of numberedBlocks(md)) {
    const name = displayName(cleanName(stripMd(block.heading)));
    if (BRAND_COPY.test(block.body)) continue;
    if (name.length < 2 || name.length > 60) continue;
    // "@cherryblossom216" is a handle; "@aleksic twins" is a title, not a handle — don't guess one from it.
    const handle = /^@[\w.]+$/.test(name) ? name : firstHandle(block.body);
    const evidence = clip(tidy(stripMd(block.body.split(NEXT_HEAD)[0])));
    push({
      name,
      handle,
      platform: platformMentioned(block.body) ?? platformFromPage(page.url, page.title),
      profileUrl: block.body.match(PROFILE_RE_ONE)?.[1],
      nicheTags: [],
      styleTags: [],
      evidence: evidence.length >= 12 ? [evidence] : [],
      sourceUrl: page.url,
    });
  }

  // 2. Bare links to social profiles. Evidence is the text after the link up to
  //    the next link or list number, so it never runs into the next creator.
  for (const m of md.matchAll(PROFILE_RE)) {
    const [whole, text, url, platform, rawHandle] = m;
    const h = rawHandle.replace("@", "");
    if (NOT_HANDLES.has(h.toLowerCase())) continue;
    const after = md.slice((m.index ?? 0) + whole.length, (m.index ?? 0) + whole.length + 800);
    const rawAfter = after.split(NEXT_ENTRY)[0];
    if (BRAND_COPY.test(rawAfter)) continue;
    const rest = clip(tidy(stripMd(rawAfter)));
    push({
      name: GENERIC_LINK.test(text) ? `@${h}` : stripMd(text).replace(/\bverified\b/gi, "").trim(),
      handle: `@${h}`,
      platform,
      profileUrl: url,
      nicheTags: [],
      styleTags: [],
      evidence: rest.length >= 25 ? [rest] : [],
      sourceUrl: page.url,
    });
  }

  for (const m of md.matchAll(/^>\s*(@[A-Za-z0-9._]{3,30})\s+(.{12,})$/gm)) {
    const [, handle, caption] = m;
    push({
      name: handle,
      handle,
      platform: "tiktok",
      nicheTags: [],
      styleTags: [],
      evidence: [clip(`${handle} ${caption}`)],
      sourceUrl: page.url,
    });
  }

  return out;
}

// ---------- merge across pages ----------

const keyOf = (c: ExtractedCreator) =>
  (c.handle ?? c.name).toLowerCase().replace(/^@/, "").replace(/[^a-z0-9]/g, "");

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

const uniq = <T,>(xs: T[]) => [...new Set(xs)];

/** Merge mentions of the same creator across pages. More independent sources = more evidence. */
export function mergeCreators(found: ExtractedCreator[]): CreatorCandidate[] {
  const byKey = new Map<string, ExtractedCreator[]>();
  for (const c of found) {
    const k = keyOf(c);
    if (!k) continue;
    byKey.set(k, [...(byKey.get(k) ?? []), c]);
  }

  return [...byKey.entries()].map(([k, group]) => {
    const best = group.find((g) => g.name && !g.name.startsWith("@")) ?? group[0];
    const profileUrl = group.find((g) => g.profileUrl)?.profileUrl;
    const sourceUrls = uniq(group.map((g) => g.sourceUrl));
    return {
      id: `you-${hash(k)}`,
      name: displayName(best.name),
      handle: group.find((g) => g.handle)?.handle,
      platform: group.find((g) => g.platform)?.platform,
      profileUrl: profileUrl ?? sourceUrls[0],
      portfolioUrls: profileUrl ? [profileUrl] : [],
      nicheTags: uniq(group.flatMap((g) => g.nicheTags)),
      contentStyleTags: uniq(group.flatMap((g) => g.styleTags)),
      evidenceSnippets: uniq(group.flatMap((g) => g.evidence)).slice(0, 4),
      sourceUrls,
      budgetFit: "unknown",
      availability: "unknown",
      verificationStatus: "unverified",
      origin: "live-search",
    } satisfies CreatorCandidate;
  });
}
