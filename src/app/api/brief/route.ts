import { NextResponse } from "next/server";
import { z } from "zod";
import { buildBrief, hasAnthropicKey } from "@/lib/brief";
import { readiness } from "@/lib/readiness";
import { SAMPLE_BRIEF } from "@/data/sample-brief";

const Body = z.object({
  description: z.string().min(10).max(4000),
  brandName: z.string().max(200).optional(),
  product: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Describe your campaign in a sentence or two." }, { status: 400 });
  }

  if (!hasAnthropicKey()) {
    // No key: return the sample brief, clearly marked, so the demo still runs.
    return NextResponse.json({ brief: SAMPLE_BRIEF, readiness: readiness(SAMPLE_BRIEF), mode: "sample" });
  }

  try {
    const brief = await buildBrief(parsed.data);
    return NextResponse.json({ brief, readiness: readiness(brief), mode: "ai" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Brief builder failed. Try again." }, { status: 502 });
  }
}
