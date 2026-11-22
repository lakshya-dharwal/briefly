import type { CampaignBrief } from "@/lib/types";

/** The demo brief used across the app and tests. */
export const SAMPLE_BRIEF: CampaignBrief = {
  campaignName: "GlowUp Skincare Launch",
  brandName: "GlowUp",
  product: "GlowUp daily moisturizer",
  category: "skincare",
  targetCreator: "Gen Z skincare content creator",
  preferredStyle: ["funny", "authentic", "conversational"],
  nicheKeywords: ["skincare", "beauty"],
  budgetUsd: 500,
  deliverableCount: 3,
  deliverableFormats: ["product-demo", "testimonial", "skit"],
  platforms: ["tiktok", "instagram"],
  targetAudience: "Gen Z skincare buyers",
  timelineDays: 7,
  requiredContent: [
    "Product demonstration",
    "Personal experience",
    "Natural brand mention",
    "Clear opening hook",
  ],
  referenceUrls: [],
};

export const SAMPLE_BRIEF_PROMPT =
  "We're launching a skincare product and want three funny, authentic Gen Z UGC videos. Our budget is $500. We want creators who make relatable skincare content, not overly polished advertisements.";
