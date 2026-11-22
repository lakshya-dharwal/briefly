import { NextResponse } from "next/server";
import type { CampaignBrief, CreatorCandidate } from "@/lib/types";
import { buildQueries, hasYouKey, normalizeResults, youSearch } from "@/lib/you";
import { rankCandidates } from "@/lib/matching";
import { SAMPLE_CREATORS } from "@/data/sample-creators";

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

  if (hasYouKey()) {
    const queries = buildQueries(brief);
    const settled = await Promise.allSettled(queries.map((q) => youSearch(q, { count: 10 })));
    const ok = settled.filter((s) => s.status === "fulfilled");
    live = normalizeResults(ok.flatMap((s) => s.value));
    steps.push({
      label: "Searching relevant creator portfolios",
      status: ok.length ? "done" : "failed",
      detail: `${ok.length}/${queries.length} You.com searches, ${live.length} pages`,
    });
  } else {
    steps.push({ label: "Searching relevant creator portfolios", status: "skipped", detail: "YOU_API_KEY not set" });
  }

  const pool = [...live, ...(includeSamples ? SAMPLE_CREATORS : [])];
  const ranked = rankCandidates(brief, pool);
  steps.push({ label: "Comparing creator styles", status: "done" });
  steps.push({ label: "Preparing your shortlist", status: "done" });

  return NextResponse.json({ steps, results: ranked });
}
