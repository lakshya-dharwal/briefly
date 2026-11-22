// Campaign readiness meter for the brief builder.
// This is a UX progress indicator, not a quality score.

import type { CampaignBrief } from "./types";

type Check = { label: string; done: (b: CampaignBrief) => boolean };

const CHECKS: Check[] = [
  { label: "Name the brand", done: (b) => !!b.brandName.trim() },
  { label: "Describe the product", done: (b) => !!b.product.trim() },
  { label: "Pick a creator niche", done: (b) => b.nicheKeywords.length > 0 },
  { label: "Choose a content style", done: (b) => b.preferredStyle.length > 0 },
  { label: "Set a budget", done: (b) => b.budgetUsd !== undefined },
  { label: "Set number of deliverables", done: (b) => b.deliverableCount !== undefined },
  { label: "Choose platforms", done: (b) => b.platforms.length > 0 },
  { label: "Confirm delivery deadline", done: (b) => b.timelineDays !== undefined },
  { label: "List must-have content", done: (b) => b.requiredContent.length > 0 },
];

export function readiness(brief: CampaignBrief) {
  const remaining = CHECKS.filter((c) => !c.done(brief)).map((c) => c.label);
  const percent = Math.round(((CHECKS.length - remaining.length) / CHECKS.length) * 100);
  return { percent, remaining };
}
