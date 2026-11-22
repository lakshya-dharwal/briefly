// Claude-powered creator extraction (server-only).
// Claude reads a page and lists the individual creators it names, each with a
// verbatim quote. We then verify every quote and URL against the page text.

import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { MODEL } from "./brief";
import { cleanMarkdown, quoteInPage, type ExtractedCreator, type SourcePage } from "./extract";
import { platformFromPage } from "./links";
import type { CampaignBrief } from "./types";

const Schema = z.object({
  creators: z.array(
    z.object({
      name: z.string(),
      handle: z.string().nullable(),
      platform: z.enum(["tiktok", "instagram", "youtube", "x", "other"]).nullable(),
      profileUrl: z.string().nullable(),
      isIndividualCreator: z.boolean(),
      nicheTags: z.array(z.string()),
      styleTags: z.array(z.string()),
      evidenceQuote: z.string(),
    }),
  ),
});

const SYSTEM = `You read a web page and list the individual content creators it names.
Rules:
- Only list people or creator accounts the page itself names. Never add anyone from your own knowledge.
- Set isIndividualCreator=false for brands, companies, agencies, platforms and publications.
- evidenceQuote must be copied VERBATIM from the page (one or two sentences about that creator's content). If the page says nothing about their content, use the sentence that names them.
- profileUrl only if that exact URL appears in the page; otherwise null.
- nicheTags and styleTags: short lowercase words describing their content, based only on what the page says. Empty if the page doesn't say.
- If the page names no creators (e.g. it's an error page or a generic guide), return an empty list.`;

export async function extractWithClaude(
  page: SourcePage,
  brief: CampaignBrief,
): Promise<ExtractedCreator[]> {
  const text = cleanMarkdown(page.markdown);
  if (text.length < 200) return [];

  const client = new Anthropic();
  const res = await client.beta.messages.parse({
    model: MODEL,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    max_tokens: 16000,
    system: SYSTEM,
    output_config: { effort: "low", format: betaZodOutputFormat(Schema) },
    messages: [
      {
        role: "user",
        content: `Campaign context (for tagging only, do not invent matches): ${brief.category}, ${brief.preferredStyle.join(", ")}.

Page URL: ${page.url}
Page title: ${page.title ?? ""}

<page>
${text}
</page>`,
      },
    ],
  });

  if (res.stop_reason === "refusal" || !res.parsed_output) return [];

  return res.parsed_output.creators
    .filter((c) => c.isIndividualCreator)
    .filter((c) => squashIncludes(text, c.name) || (c.handle && squashIncludes(text, c.handle)))
    .map((c) => ({
      name: c.name,
      handle: c.handle ? `@${c.handle.replace(/^@/, "")}` : undefined,
      platform: c.platform && c.platform !== "other" ? c.platform : platformFromPage(page.url, page.title),
      profileUrl: c.profileUrl && page.markdown.includes(c.profileUrl) ? c.profileUrl : undefined,
      nicheTags: c.nicheTags.map((t) => t.toLowerCase()),
      styleTags: c.styleTags.map((t) => t.toLowerCase()),
      evidence: quoteInPage(c.evidenceQuote, text) ? [c.evidenceQuote.trim()] : [],
      sourceUrl: page.url,
    }));
}

function squashIncludes(hay: string, needle: string) {
  return hay.toLowerCase().includes(needle.toLowerCase().trim());
}
