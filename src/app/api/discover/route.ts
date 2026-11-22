import { NextResponse } from "next/server";
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

export async function POST(req: Request) {
  const { brief, includeSamples = true } = (await req.json()) as {
    brief: CampaignBrief;
    includeSamples?: boolean;
  };
  const steps: Step[] = [{ label: "Understanding your campaign", status: "done" }];
  let live: CreatorCandidate[] = [];

  if (!hasYouKey()) {
    steps.push({ label: "Searching the web for creators", status: "skipped", detail: "YOU_API_KEY not set" });
  } else {
    // 1. Search: find pages that talk about relevant creators.
    const queries = buildQueries(brief);
    const settled = await Promise.allSettled(queries.map((q) => youSearch(q, { count: 10 })));
    const hits = dedupe(settled.flatMap((s) => (s.status === "fulfilled" ? s.value : [])));
    const okSearches = settled.filter((s) => s.status === "fulfilled").length;
    steps.push({
      label: "Searching the web for creators",
      status: okSearches ? "done" : "failed",
      detail: `${okSearches}/${queries.length} You.com searches · ${hits.length} pages`,
    });

    // 2. Contents: read the most relevant pages in full.
    let pages: SourcePage[] = [];
    try {
      const toRead = rankPagesForReading(hits).slice(0, PAGES_TO_READ);
      const fetched = await youContents(toRead.map((h) => h.url));
      pages = fetched
        .filter((p) => p.url && p.markdown)
        .map((p) => ({ url: p.url, title: p.title, markdown: p.markdown! }));
      steps.push({
        label: "Reading creator pages",
        status: "done",
        detail: `${pages.length} pages read with You.com Contents`,
      });
    } catch (err) {
      console.error(err);
      steps.push({ label: "Reading creator pages", status: "failed" });
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
  }

  const pool = [...live, ...(includeSamples ? SAMPLE_CREATORS : [])];
  const ranked = rankCandidates(brief, pool);
  steps.push({ label: "Comparing creator styles", status: "done" });
  steps.push({ label: "Preparing your shortlist", status: "done" });

  return NextResponse.json({ steps, results: ranked });
}

function dedupe(hits: YouWebResult[]) {
  const seen = new Set<string>();
  return hits.filter((h) => h.url && !seen.has(h.url) && seen.add(h.url));
}
