import type { CreatorCandidate } from "@/lib/types";

// FICTIONAL sample profiles for the demo. They are not real people.
// The UI must label every one of these as "Sample profile".
// Live You.com results are always shown as unverified and never mixed in silently.

export const SAMPLE_CREATORS: CreatorCandidate[] = [
  {
    id: "sample-maya",
    name: "Maya (sample)",
    handle: "@maya.sample",
    platform: "tiktok",
    profileUrl: "#",
    portfolioUrls: ["#demo-1", "#demo-2", "#demo-3"],
    nicheTags: ["skincare", "beauty"],
    contentStyleTags: ["funny", "conversational", "authentic"],
    bio: "Relatable skincare routines, honest review videos, and the occasional skit.",
    evidenceSnippets: [
      "Sample: 30s product demo of a moisturizer with a comedic hook.",
      "Sample: honest review format, talking to camera.",
    ],
    sourceUrls: [],
    availability: "available",
    rateUsd: 450,
    rateSource: "self-reported",
    verificationStatus: "unverified",
    origin: "sample",
  },
  {
    id: "sample-priya",
    name: "Priya (sample)",
    handle: "@priya.sample",
    platform: "instagram",
    profileUrl: "#",
    portfolioUrls: ["#demo-1", "#demo-2"],
    nicheTags: ["beauty", "skincare", "wellness"],
    contentStyleTags: ["calm", "aesthetic", "tutorial"],
    bio: "Step by step skincare tutorial content with soft lighting.",
    evidenceSnippets: ["Sample: GRWM-style tutorial with product close-ups."],
    sourceUrls: [],
    availability: "unknown",
    verificationStatus: "unverified",
    origin: "sample",
  },
  {
    id: "sample-jordan",
    name: "Jordan (sample)",
    handle: "@jordan.sample",
    platform: "youtube",
    profileUrl: "#",
    portfolioUrls: ["#demo-1"],
    nicheTags: ["tech", "gadgets"],
    contentStyleTags: ["polished", "cinematic"],
    bio: "Cinematic gadget unboxing videos.",
    evidenceSnippets: ["Sample: unboxing of a phone accessory."],
    sourceUrls: [],
    availability: "available",
    rateUsd: 1200,
    rateSource: "self-reported",
    verificationStatus: "unverified",
    origin: "sample",
  },
];
