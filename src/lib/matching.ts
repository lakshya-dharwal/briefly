// Compatibility engine.
// These weights are MVP heuristics, not validated predictors of campaign success.
// The output is an estimated compatibility score, never a probability of delivery.

import type {
  CampaignBrief,
  CreatorCandidate,
  MatchDimension,
  MatchResult,
  MatchSignals,
} from "./types";

export const WEIGHTS: Record<MatchDimension, number> = {
  niche: 0.25,
  style: 0.25,
  portfolio: 0.2,
  format: 0.15,
  budget: 0.1,
  availability: 0.05,
};

/** Below this share of known weight we show a band ("Promising") instead of a %. */
export const PRECISE_SCORE_MIN_COVERAGE = 0.7;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function scoreMatch(signals: MatchSignals): MatchResult {
  let known = 0;
  let weighted = 0;
  const unknown: MatchDimension[] = [];

  for (const dim of Object.keys(WEIGHTS) as MatchDimension[]) {
    const v = signals[dim];
    if (v === null || Number.isNaN(v)) {
      unknown.push(dim);
      continue;
    }
    known += WEIGHTS[dim];
    weighted += WEIGHTS[dim] * clamp01(v);
  }

  const score = known === 0 ? 0 : Math.round((100 * weighted) / known);
  const coverage = Math.round(known * 100) / 100;
  const confidence = coverage >= 0.85 ? "high" : coverage >= 0.6 ? "medium" : "low";
  const showPreciseScore = coverage >= PRECISE_SCORE_MIN_COVERAGE;

  return {
    score,
    coverage,
    confidence,
    showPreciseScore,
    label: showPreciseScore ? `${score}% estimated match` : bandLabel(score),
    unknown,
  };
}

function bandLabel(score: number): string {
  if (score >= 80) return "Strong signals — needs confirmation";
  if (score >= 60) return "Promising — needs confirmation";
  return "Weak signals";
}

// ---------- signal extraction ----------

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ");

/** Fraction of `wanted` terms that appear anywhere in `haystack`. null if nothing wanted. */
export function termOverlap(wanted: string[], haystack: string): number | null {
  const terms = wanted.map(norm).map((t) => t.trim()).filter(Boolean);
  if (terms.length === 0) return null;
  const hay = norm(haystack);
  const hits = terms.filter((t) => hay.includes(t)).length;
  return hits / terms.length;
}

const FORMAT_KEYWORDS: Record<string, string[]> = {
  "product-demo": ["demo", "how to use", "routine", "trying", "test"],
  testimonial: ["review", "honest", "my experience", "testimonial"],
  skit: ["skit", "funny", "comedy", "pov"],
  unboxing: ["unboxing", "haul", "unbox"],
  "talking-head": ["talking", "storytime", "chat", "grwm"],
  tutorial: ["tutorial", "how to", "step by step", "guide"],
};

export function deriveSignals(
  brief: CampaignBrief,
  c: CreatorCandidate,
): MatchSignals {
  const text = [
    c.name,
    c.bio ?? "",
    ...c.nicheTags,
    ...c.contentStyleTags,
    ...c.evidenceSnippets,
  ].join(" ");

  const niche = termOverlap([brief.category, ...brief.nicheKeywords], text);
  const style = termOverlap(brief.preferredStyle, text);

  // Portfolio evidence: how much real, linkable material we found.
  const evidenceCount = c.portfolioUrls.length + c.evidenceSnippets.length;
  const portfolio = evidenceCount === 0 ? null : clamp01(evidenceCount / 6);

  const formatTerms = brief.deliverableFormats.flatMap((f) => FORMAT_KEYWORDS[f] ?? []);
  const format = termOverlap(formatTerms, text);

  let budget: number | null = null;
  if (brief.budgetUsd !== undefined && c.rateUsd !== undefined) {
    budget = c.rateUsd <= brief.budgetUsd ? 1 : clamp01(brief.budgetUsd / c.rateUsd);
  }

  const availability =
    c.availability === "available" ? 1 : c.availability === "unavailable" ? 0 : null;

  return { niche, style, portfolio, format, budget, availability };
}

/** Plain-language reasons, each tied to a signal we actually have. */
export function explain(signals: MatchSignals, result: MatchResult): string[] {
  const out: string[] = [];
  const say = (v: number | null, strong: string, some: string) => {
    if (v === null) return;
    if (v >= 0.6) out.push(strong);
    else if (v > 0) out.push(some);
  };
  say(signals.niche, "Strong niche overlap with the brief.", "Some niche overlap.");
  say(signals.style, "Public content matches the requested tone.", "Partial style match.");
  say(signals.portfolio, "Multiple portfolio examples found.", "Limited portfolio evidence.");
  say(signals.format, "Existing work resembles the requested format.", "Some format overlap.");
  if (signals.budget === 1) out.push("Listed rate fits the budget.");
  if (result.unknown.includes("budget") || result.unknown.includes("availability")) {
    out.push("Pricing and availability need confirmation.");
  }
  return out;
}

export function rankCandidates(brief: CampaignBrief, candidates: CreatorCandidate[]) {
  return candidates
    .map((c) => {
      const signals = deriveSignals(brief, c);
      const match = scoreMatch(signals);
      return {
        creator: {
          ...c,
          matchScore: match.score,
          matchExplanation: explain(signals, match).join(" "),
        },
        match,
        signals,
      };
    })
    .sort((a, b) => b.match.score * b.match.coverage - a.match.score * a.match.coverage);
}
