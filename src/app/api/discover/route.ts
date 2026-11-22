import { NextResponse } from "next/server";
import { z } from "zod";
import type { CampaignBrief, CreatorCandidate } from "@/lib/types";
import { buildQueries, hasYouKey, rankPagesForReading, youContents, youSearch, type YouWebResult } from "@/lib/you";
import { extractHeuristic, mergeCreators, type ExtractedCreator, type SourcePage } from "@/lib/extract";
import { extractWithClaude } from "@/lib/extract-ai";
import { hasAnthropicKey } from "@/lib/brief";
import { rankCandidates } from "@/lib/matching";
import { SAMPLE_CREATORS } from "@/data/sample-creators";

export const maxDuration = 60;

/** How many search hits we read in full with the Contents API. */
const PAGES_TO_READ = 8;

// Each step reported back to the UI is one that actually ran,
// so the discovery animation never claims work we didn't do.
type Step = { label: string; status: "done" | "skipped" | "failed"; detail?: string };

/** What happened with live search, so the page can explain it in plain words. */
export type LiveStatus =
  | { kind: "ok"; creators: number }
  | { kind: "off" } // no YOU_API_KEY
  | { kind: "failed"; reason: string }
  | { kind: "empty" }; // search worked but no creators were named on the pages

const str = z.string().max(500);
const list = z.array(str).max(30);
const Body = z.object({
  includeSamples: z.boolean().optional(),
  brief: z
    .object({
      campaignName: str,
      brandName: z.string().max(200),
      product: z.string().max(200),
      category: str,
      targetCreator: str,
      preferredStyle: list,
      nicheKeywords: list,
      budgetUsd: z.number().nonnegative().optional(),
      deliverableCount: z.number().int().nonnegative().optional(),
      deliverableFormats: list,
      platforms: list,
      targetAudience: str.optional(),
      timelineDays: z.number().int().nonnegative().optional(),
      requiredContent: list,
      referenceUrls: list,
    })
    .refine((b) => b.nicheKeywords.length > 0 || b.category.trim() !== "", {
      message: "Add at least one creator niche to search for.",
    }),
});

/** Turn a You.com error into something a person can act on. */
function explain(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const code = msg.match(/\b(401|402|403|429|5\d\d)\b/)?.[1];
  if (code === "401" || code === "403") return "You.com rejected the API key.";
  if (code === "402") return "The You.com account is out of credits.";
  if (code === "429") return "You.com is rate-limiting us. Wait a few seconds.";
  if (code?.startsWith("5")) return "You.com is having trouble right now.";
  if (/fetch failed|ENOTFOUND|ECONN|network/i.test(msg)) return "Couldn’t reach You.com from the server.";
  return "Live search didn’t respond.";
}

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message && !first.message.startsWith("Invalid") ? first.message : "That brief looks incomplete. Go back and rebuild it." },
      { status: 400 },
    );
  }
  const brief = parsed.data.brief as CampaignBrief;
  const includeSamples = parsed.data.includeSamples ?? true;

  const steps: Step[] = [{ label: "Understanding your campaign", status: "done" }];
  let live: CreatorCandidate[] = [];
  let liveStatus: LiveStatus;

  if (!hasYouKey()) {
    steps.push({ label: "Searching the web for creators", status: "skipped", detail: "YOU_API_KEY not set" });
    liveStatus = { kind: "off" };
  } else {
    // 1. Search: find pages that talk about relevant creators.
    const queries = buildQueries(brief);
    const settled = await Promise.allSettled(queries.map((q) => youSearch(q, { count: 10 })));
    const hits = dedupe(settled.flatMap((s) => (s.status === "fulfilled" ? s.value : [])));
    const okSearches = settled.filter((s) => s.status === "fulfilled").length;
    const firstErr = settled.find((s) => s.status === "rejected") as PromiseRejectedResult | undefined;
    steps.push({
      label: "Searching the web for creators",
      status: okSearches ? "done" : "failed",
      detail: okSearches ? `${okSearches}/${queries.length} You.com searches · ${hits.length} pages` : explain(firstErr?.reason),
    });

    if (!okSearches) {
      if (firstErr) console.error(firstErr.reason);
      liveStatus = { kind: "failed", reason: explain(firstErr?.reason) };
    } else {
      // 2. Contents: read the most relevant pages in full.
      let pages: SourcePage[] = [];
      let contentsError: string | null = null;
      try {
        const toRead = rankPagesForReading(hits).slice(0, PAGES_TO_READ);
        const fetched = await youContents(toRead.map((h) => h.url));
        pages = fetched.filter((p) => p.url && p.markdown).map((p) => ({ url: p.url, title: p.title, markdown: p.markdown! }));
        steps.push({ label: "Reading creator pages", status: "done", detail: `${pages.length} pages read with You.com Contents` });
      } catch (err) {
        console.error(err);
        contentsError = explain(err);
        steps.push({ label: "Reading creator pages", status: "failed", detail: contentsError });
      }

      // 3. Extract: pull out the individual creators each page names.
      if (pages.length) {
        const useClaude = hasAnthropicKey();
        const results = await Promise.allSettled(
          pages.map((p) => (useClaude ? extractWithClaude(p, brief) : Promise.resolve(extractHeuristic(p)))),
        );
        const found: ExtractedCreator[] = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
        live = mergeCreators(found);
        steps.push({
          label: "Finding the creators behind each page",
          status: "done",
          detail: `${live.length} creators · ${useClaude ? "Claude, quotes verified against page" : "pattern match (add ANTHROPIC_API_KEY for AI extraction)"}`,
        });
      }

      liveStatus = contentsError
        ? { kind: "failed", reason: contentsError }
        : live.length
          ? { kind: "ok", creators: live.length }
          : { kind: "empty" };
    }
  }

  // If none of the live creators relate to the niche at all (e.g. a niche the web
  // doesn't know), the pages were generic influencer lists: report "empty"
  // instead of passing off unrelated people as matches.
  if (liveStatus.kind === "ok") {
    const relevant = rankCandidates(brief, live).filter((r) => (r.signals.niche ?? 0) > 0);
    if (relevant.length === 0) {
      live = [];
      liveStatus = { kind: "empty" };
      steps.push({ label: "Checking relevance", status: "done", detail: "No creators on those pages relate to this niche" });
    }
  }

  const pool = [...live, ...(includeSamples ? SAMPLE_CREATORS : [])];
  const ranked = rankCandidates(brief, pool);
  steps.push({ label: "Comparing creator styles", status: "done" });
  steps.push({ label: "Preparing your shortlist", status: "done" });

  return NextResponse.json({ steps, results: ranked, liveStatus });
}

function dedupe(hits: YouWebResult[]) {
  const seen = new Set<string>();
  return hits.filter((h) => h.url && !seen.has(h.url) && seen.add(h.url));
}
