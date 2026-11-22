import { NextResponse } from "next/server";
import { z } from "zod";
import { buildBrief, hasAnthropicKey } from "@/lib/brief";
import { readiness } from "@/lib/readiness";
import { buildBriefFromRules } from "@/lib/brief-rules";

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
    // No key: parse the brand's own words with rules. Unstated fields stay empty.
    const brief = buildBriefFromRules(parsed.data);
    return NextResponse.json({ brief, readiness: readiness(brief), mode: "rules" });
  }

  try {
    const brief = await buildBrief(parsed.data);
    return NextResponse.json({ brief, readiness: readiness(brief), mode: "ai" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Brief builder failed. Try again." }, { status: 502 });
  }
}
