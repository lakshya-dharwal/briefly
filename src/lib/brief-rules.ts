// Rule-based brief builder, used when no Anthropic key is configured.
// It only reads what the brand actually wrote; anything not stated stays empty.

import type { CampaignBrief, DeliverableFormat } from "./types";

const NUMBER_WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, ten: 10 };

const NICHES: [RegExp, string][] = [
  [/skin ?care|skincare|moisturi[sz]er|serum|spf|sunscreen/i, "skincare"],
  [/make ?up|cosmetic|lipstick|mascara/i, "makeup"],
  [/beauty/i, "beauty"],
  [/fitness|gym|workout|protein/i, "fitness"],
  [/food|recipe|snack|drink|coffee|restaurant/i, "food"],
  [/fashion|clothing|apparel|streetwear|sneaker/i, "fashion"],
  [/tech|gadget|app\b|software|phone/i, "tech"],
  [/gaming|game|esports/i, "gaming"],
  [/travel|hotel|trip/i, "travel"],
  [/finance|money|investing|budgeting|fintech/i, "finance"],
  [/wellness|mental health|sleep|meditation/i, "wellness"],
  [/\bpets?\b|dog|cat\b/i, "pets"],
  [/home|decor|interior|furniture/i, "home"],
];

const STYLES: [RegExp, string][] = [
  [/funny|humou?r|comed|hilarious/i, "funny"],
  [/authentic|real\b|genuine|raw|not (?:too |overly )?(?:polished|salesy)/i, "authentic"],
  [/relatable/i, "relatable"],
  [/conversational|talking|chatty/i, "conversational"],
  [/aesthetic|clean look|minimal/i, "aesthetic"],
  [/educational|informative|explain/i, "educational"],
  [/polished|cinematic|high.?production/i, "polished"],
  [/energetic|hype|high.?energy/i, "energetic"],
  [/calm|soft|asmr/i, "calm"],
];

const FORMATS: [RegExp, DeliverableFormat][] = [
  [/demo|demonstrat|how (?:it|to use)/i, "product-demo"],
  [/testimonial|review|experience/i, "testimonial"],
  [/skit|funny|comed/i, "skit"],
  [/unbox/i, "unboxing"],
  [/tutorial|how.?to|step.?by.?step/i, "tutorial"],
  [/talking.?head|storytime|grwm/i, "talking-head"],
];

const PLATFORMS: [RegExp, string][] = [
  [/tik ?tok/i, "tiktok"],
  [/instagram|\bigs?\b|reels?/i, "instagram"],
  [/youtube|shorts/i, "youtube"],
];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const hits = <T,>(text: string, table: [RegExp, T][]) =>
  [...new Set(table.filter(([re]) => re.test(text)).map(([, v]) => v))];

export function buildBriefFromRules(input: {
  description: string;
  brandName?: string;
  product?: string;
}): CampaignBrief {
  const t = input.description;

  const budgetMatch = t.match(/\$\s?(\d[\d,]*(?:\.\d+)?)\s*(k)?/i) ?? t.match(/(\d[\d,]*)\s*(k)?\s*(?:usd|dollars)/i);
  const budgetUsd = budgetMatch
    ? Math.round(parseFloat(budgetMatch[1].replace(/,/g, "")) * (budgetMatch[2] ? 1000 : 1))
    : undefined;

  const countMatch = t.match(
    /\b(\d{1,2}|one|two|three|four|five|six|ten)\b(?:\s+[\w,'-]+){0,6}?\s+(?:videos?|posts?|reels?|tiktoks?|clips?|shorts|pieces)/i,
  );
  const deliverableCount = countMatch
    ? NUMBER_WORDS[countMatch[1].toLowerCase()] ?? parseInt(countMatch[1], 10)
    : undefined;

  const timeMatch = t.match(/(\d{1,3}|one|two|three)\s*(day|week)s?/i);
  const timelineDays = timeMatch
    ? (NUMBER_WORDS[timeMatch[1].toLowerCase()] ?? parseInt(timeMatch[1], 10)) * (/week/i.test(timeMatch[2]) ? 7 : 1)
    : undefined;

  const niches = hits(t, NICHES);
  const styles = hits(t, STYLES);
  const formats = hits(t, FORMATS);
  const platforms = hits(t, PLATFORMS);
  const category = niches[0] ?? "general";
  const audience = /gen ?z/i.test(t) ? "Gen Z" : /millennial/i.test(t) ? "Millennials" : undefined;
  const isUgc = /\bugc\b/i.test(t);

  const brandName = input.brandName?.trim() || "Your brand";
  const product = input.product?.trim() || `${cap(category)} product`;

  const required = [
    ...(formats.includes("product-demo") ? ["Product demonstration"] : []),
    ...(formats.includes("testimonial") ? ["Personal experience"] : []),
    "Natural brand mention",
    "Clear opening hook",
  ];

  return {
    campaignName: `${brandName} ${cap(category)} campaign`,
    brandName,
    product,
    category,
    targetCreator: [audience, category === "general" ? "" : category, isUgc ? "UGC creator" : "content creator"]
      .filter(Boolean)
      .join(" "),
    preferredStyle: styles,
    nicheKeywords: niches.length ? niches.slice(0, 3) : [],
    budgetUsd,
    deliverableCount,
    deliverableFormats: formats,
    platforms,
    targetAudience: audience,
    timelineDays,
    requiredContent: required,
    referenceUrls: [...t.matchAll(/https?:\/\/\S+/g)].map((m) => m[0]),
  };
}
