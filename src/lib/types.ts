// Core domain types for Briefly.
// Rule of thumb: anything we don't actually know stays `undefined` / "unknown".
// Never fill a gap with a plausible-looking guess.

export type Tri = "yes" | "no" | "unknown";

export type CreatorCandidate = {
  id: string;
  name: string;
  handle?: string;
  platform?: string;
  profileUrl: string;
  portfolioUrls: string[];
  nicheTags: string[];
  contentStyleTags: string[];
  bio?: string;
  evidenceSnippets: string[];
  sourceUrls: string[];
  matchScore?: number;
  matchExplanation?: string;
  budgetFit?: Tri;
  availability?: "available" | "unavailable" | "unknown";
  verificationStatus: "verified" | "unverified";
  /** Self-reported or verified rate in USD, if we actually have one. */
  rateUsd?: number;
  rateSource?: "verified" | "self-reported";
  /** Where this profile came from. Sample profiles are always labeled in the UI. */
  origin: "live-search" | "sample";
};

export type DeliverableFormat =
  | "product-demo"
  | "testimonial"
  | "skit"
  | "unboxing"
  | "talking-head"
  | "tutorial"
  | "other";

export type CampaignBrief = {
  campaignName: string;
  brandName: string;
  product: string;
  category: string;
  targetCreator: string;
  preferredStyle: string[];
  nicheKeywords: string[];
  budgetUsd?: number;
  deliverableCount?: number;
  deliverableFormats: DeliverableFormat[];
  platforms: string[];
  targetAudience?: string;
  timelineDays?: number;
  requiredContent: string[];
  referenceUrls: string[];
};

export type MatchDimension =
  | "niche"
  | "style"
  | "portfolio"
  | "format"
  | "budget"
  | "availability";

/** 0..1 per dimension, or null when we have no signal for it. */
export type MatchSignals = Record<MatchDimension, number | null>;

export type MatchResult = {
  /** 0..100, computed only over the dimensions we have signal for. */
  score: number;
  /** Share of total weight backed by real signal, 0..1. */
  coverage: number;
  confidence: "high" | "medium" | "low";
  /** Whether the UI should show a precise % or just a band label. */
  showPreciseScore: boolean;
  label: string;
  unknown: MatchDimension[];
};

// ---- Collaboration lifecycle (all payment states are SIMULATED in the MVP) ----

export type CampaignStage =
  | "draft"
  | "shortlisting"
  | "invited"
  | "matched" // creator accepted (simulated in demo)
  | "agreement"
  | "in-production"
  | "in-review"
  | "approved"
  | "paid-simulated";

export type PaymentMilestone = {
  label: string;
  amountUsd: number;
  trigger: string;
  status: "pending" | "released-simulated";
};

export type CollaborationAgreement = {
  title: string;
  brand: string;
  creator: string;
  campaignName: string;
  deliverables: string[];
  specs: string[];
  deadline: string;
  totalUsd: number;
  milestones: PaymentMilestone[];
  revisionRounds: number;
  approvalProcess: string;
  cancellation: string;
  usageRights: string;
  licenseDuration: string;
  paidAdsRights: string;
  exclusivity: string;
  disclosure: string;
  disputeResolution: string;
};
