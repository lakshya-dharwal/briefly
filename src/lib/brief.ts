// AI Brief Builder: messy campaign description -> structured, editable CampaignBrief.
// Uses Claude structured outputs so the result always matches the schema.

import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { CampaignBrief } from "./types";

export const MODEL = "claude-opus-5-5";

const BriefSchema = z.object({
  campaignName: z.string(),
  brandName: z.string(),
  product: z.string(),
  category: z.string(),
  targetCreator: z.string(),
  preferredStyle: z.array(z.string()),
  nicheKeywords: z.array(z.string()),
  budgetUsd: z.number().nullable(),
  deliverableCount: z.number().int().nullable(),
  deliverableFormats: z.array(
    z.enum(["product-demo", "testimonial", "skit", "unboxing", "talking-head", "tutorial", "other"]),
  ),
  platforms: z.array(z.string()),
  targetAudience: z.string().nullable(),
  timelineDays: z.number().int().nullable(),
  requiredContent: z.array(z.string()),
  referenceUrls: z.array(z.string()),
});

const SYSTEM = `You turn a brand's rough campaign description into a structured creator brief.
Only fill a field from what the brand actually said or clearly implied.
If budget, deliverable count, timeline or audience were not stated, return null for them — do not guess.
Keep style words short and lowercase (e.g. "funny", "authentic"). Keep nicheKeywords to 1-4 short search terms.
requiredContent lists concrete things each video must include.`;

export function hasAnthropicKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

export async function buildBrief(input: {
  description: string;
  brandName?: string;
  product?: string;
}): Promise<CampaignBrief> {
  const client = new Anthropic();

  const response = await client.beta.messages.parse({
    model: MODEL,
    // If Opus declines, the API retries on a fallback model inside the same call.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    max_tokens: 16000,
    system: SYSTEM,
    // Simple extraction — low effort keeps the demo snappy.
    output_config: { effort: "low", format: betaZodOutputFormat(BriefSchema) },
    messages: [
      {
        role: "user",
        content: [
          input.brandName ? `Brand: ${input.brandName}` : "",
          input.product ? `Product: ${input.product}` : "",
          `Campaign description:\n${input.description}`,
        ]
          .filter(Boolean)
          .join("\n"),
      },
    ],
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error("Could not structure this brief. Try rephrasing the description.");
  }

  const b = response.parsed_output;
  return {
    ...b,
    budgetUsd: b.budgetUsd ?? undefined,
    deliverableCount: b.deliverableCount ?? undefined,
    targetAudience: b.targetAudience ?? undefined,
    timelineDays: b.timelineDays ?? undefined,
  };
}
