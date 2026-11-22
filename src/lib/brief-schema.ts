// One set of rules for a campaign brief, shared by the API routes,
// the saved-brief loader and the brief form, so they can never disagree.

import { z } from "zod";
import type { CampaignBrief } from "./types";

export const LIMITS = {
  description: { min: 10, max: 4000 },
  name: 120, // campaign / brand / product
  text: 300, // other free text
  tag: 60, // one niche/style/must-include item
  tags: 15, // items per list
  budgetUsd: { min: 1, max: 10_000_000 },
  videos: { min: 1, max: 50 },
  days: { min: 1, max: 365 },
} as const;

const FORMATS = ["product-demo", "testimonial", "skit", "unboxing", "talking-head", "tutorial", "other"] as const;
const PLATFORMS = ["tiktok", "instagram", "youtube"] as const;

const tagList = z
  .array(z.string().trim().min(1).max(LIMITS.tag, `Keep each item under ${LIMITS.tag} characters.`))
  .max(LIMITS.tags, `Use at most ${LIMITS.tags} items.`);

const intIn = (r: { min: number; max: number }, what: string) =>
  z
    .number()
    .int(`${what} must be a whole number.`)
    .min(r.min, `${what} must be at least ${r.min.toLocaleString()}.`)
    .max(r.max, `${what} can be at most ${r.max.toLocaleString()}.`);

export const BriefSchema = z.object({
  campaignName: z.string().trim().min(1, "Give the campaign a name.").max(LIMITS.name),
  brandName: z.string().trim().max(LIMITS.name),
  product: z.string().trim().max(LIMITS.name),
  category: z.string().trim().max(LIMITS.tag),
  targetCreator: z.string().trim().max(LIMITS.text),
  preferredStyle: tagList,
  nicheKeywords: tagList,
  budgetUsd: intIn(LIMITS.budgetUsd, "Budget").optional(),
  deliverableCount: intIn(LIMITS.videos, "Number of videos").optional(),
  deliverableFormats: z.array(z.enum(FORMATS)).max(FORMATS.length),
  platforms: z.array(z.enum(PLATFORMS)).max(PLATFORMS.length),
  targetAudience: z.string().trim().max(LIMITS.text).optional(),
  timelineDays: intIn(LIMITS.days, "Deadline").optional(),
  requiredContent: tagList,
  referenceUrls: z.array(z.string().url().max(500)).max(10),
});

/** A brief that's complete enough to search with. */
export const SearchableBriefSchema = BriefSchema.refine((b) => b.nicheKeywords.length > 0 || (b.category !== "" && b.category !== "general"), {
  message: "Add at least one creator niche to search for.",
  path: ["nicheKeywords"],
});

export type FieldErrors = Partial<Record<keyof CampaignBrief, string>>;

/** Field-by-field problems for the form (first message per field). */
export function briefErrors(brief: CampaignBrief): FieldErrors {
  const r = SearchableBriefSchema.safeParse(brief);
  if (r.success) return {};
  const out: FieldErrors = {};
  for (const issue of r.error.issues) {
    const key = issue.path[0] as keyof CampaignBrief | undefined;
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

/** The first human-readable problem, for API error responses. */
export function firstProblem(issues: { message: string }[]): string {
  const m = issues[0]?.message;
  return m && !/^(Invalid|Expected|Too)/.test(m) ? m : "That brief looks incomplete. Go back and rebuild it.";
}

const inRange = (n: number | undefined, r: { min: number; max: number }) =>
  n !== undefined && Number.isInteger(n) && n >= r.min && n <= r.max ? n : undefined;

const cleanTags = (xs: string[]) =>
  [...new Set(xs.map((x) => x.trim()).filter((x) => x && x.length <= LIMITS.tag))].slice(0, LIMITS.tags);

/**
 * Make a generated brief (from Claude or the rules parser) safe to show and edit:
 * out-of-range numbers become "unknown", lists are trimmed, unknown platforms dropped.
 */
export function sanitizeBrief(b: CampaignBrief): CampaignBrief {
  const cut = (s: string | undefined, n: number) => (s ?? "").trim().slice(0, n);
  return {
    ...b,
    campaignName: cut(b.campaignName, LIMITS.name) || "Creator campaign",
    brandName: cut(b.brandName, LIMITS.name),
    product: cut(b.product, LIMITS.name),
    category: cut(b.category, LIMITS.tag),
    targetCreator: cut(b.targetCreator, LIMITS.text),
    targetAudience: b.targetAudience ? cut(b.targetAudience, LIMITS.text) : undefined,
    preferredStyle: cleanTags(b.preferredStyle),
    nicheKeywords: cleanTags(b.nicheKeywords),
    requiredContent: cleanTags(b.requiredContent),
    budgetUsd: inRange(b.budgetUsd, LIMITS.budgetUsd),
    deliverableCount: inRange(b.deliverableCount, LIMITS.videos),
    timelineDays: inRange(b.timelineDays, LIMITS.days),
    deliverableFormats: b.deliverableFormats.filter((f) => (FORMATS as readonly string[]).includes(f)),
    platforms: b.platforms.filter((p) => (PLATFORMS as readonly string[]).includes(p)),
    referenceUrls: b.referenceUrls.filter((u) => z.string().url().safeParse(u).success).slice(0, 10),
  };
}
