// You.com Search API client (server-only).
// Docs: https://you.com/docs/api-reference/search/v1-search
// POST https://ydc-index.io/v1/search, header X-API-Key, JSON body.

import "server-only";
import type { CampaignBrief } from "./types";

const ENDPOINT = "https://ydc-index.io/v1/search";

export type YouWebResult = {
  url: string;
  title: string;
  description?: string;
  snippets?: string[];
  thumbnail_url?: string;
  page_age?: string;
  favicon_url?: string;
  contents?: { highlights?: string[]; markdown?: string };
};

type YouSearchResponse = {
  results?: { web?: YouWebResult[] };
  metadata?: { search_uuid?: string; query?: string; latency?: number };
};

export function hasYouKey() {
  return Boolean(process.env.YOU_API_KEY);
}

export async function youSearch(
  query: string,
  opts: { count?: number; freshness?: "day" | "week" | "month" | "year" } = {},
): Promise<YouWebResult[]> {
  const key = process.env.YOU_API_KEY;
  if (!key) throw new Error("YOU_API_KEY is not set");

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "X-API-Key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      count: opts.count ?? 10,
      freshness: opts.freshness,
      // Reddit blocks the Contents crawler, so its threads can't be read for creators.
      exclude_domains: ["reddit.com"],
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`You.com search failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as YouSearchResponse;
  return data.results?.web ?? [];
}

export type YouPage = { url: string; title?: string; markdown?: string | null };

/**
 * Contents API: full-page markdown for URLs we already found via search.
 * POST https://ydc-index.io/v1/contents. Returns a top-level array; pages that
 * fail are simply missing from it.
 */
export async function youContents(urls: string[], crawlTimeout = 15): Promise<YouPage[]> {
  const key = process.env.YOU_API_KEY;
  if (!key) throw new Error("YOU_API_KEY is not set");
  if (urls.length === 0) return [];

  const res = await fetch("https://ydc-index.io/v1/contents", {
    method: "POST",
    headers: { "X-API-Key": key, "Content-Type": "application/json" },
    body: JSON.stringify({ urls, formats: ["markdown"], crawl_timeout: crawlTimeout }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`You.com contents failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as YouPage[];
  return Array.isArray(data) ? data : [];
}

/**
 * Turn a brief into discovery queries. We search for pages that NAME creators
 * (roundups, "top X" lists, brand-partner lists), then read them in full.
 */
export function buildQueries(brief: CampaignBrief): string[] {
  const niche = brief.nicheKeywords[0] ?? brief.category;
  const style = brief.preferredStyle[0] ?? "";
  const platform = brief.platforms[0] ?? "tiktok";
  return [
    `top ${niche} creators on ${platform}`,
    `best ${style} ${niche} influencers`.replace(/\s+/g, " "),
    `${niche} influencers brands are partnering with`,
    `${niche} UGC creators to work with`,
  ];
}

const LIST_TITLE = /\b(top|best|\d{1,3})\b/i;
const CREATOR_WORDS = /(creator|influencer|tiktoker|youtuber|skinfluencer|instagrammer|to follow)/i;

/** Pages most likely to name many creators go first (e.g. "Top 45 Skincare TikTok Influencers"). */
export function rankPagesForReading(hits: YouWebResult[]): YouWebResult[] {
  const score = (h: YouWebResult) =>
    (CREATOR_WORDS.test(h.title) ? 2 : 0) + (LIST_TITLE.test(h.title) ? 1 : 0);
  return [...hits].sort((a, b) => score(b) - score(a));
}
