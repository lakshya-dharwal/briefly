import { NextResponse } from "next/server";
import { z } from "zod";
import { buildBrief, hasAnthropicKey } from "@/lib/brief";
import { readiness } from "@/lib/readiness";
import { buildBriefFromRules } from "@/lib/brief-rules";
import { LIMITS, sanitizeBrief } from "@/lib/brief-schema";

const Body = z.object({
  description: z
    .string()
    .trim()
    .min(LIMITS.description.min, "Describe your campaign in a sentence or two.")
    .max(LIMITS.description.max, `Keep the description under ${LIMITS.description.max.toLocaleString()} characters.`),
  brandName: z.string().trim().max(LIMITS.name, `Keep the brand name under ${LIMITS.name} characters.`).optional(),
  product: z.string().trim().max(LIMITS.name).optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.success ? "" : parsed.error.issues[0]?.message ?? "Describe your campaign in a sentence or two." },
      { status: 400 },
    );
  }

  if (!hasAnthropicKey()) {
    // No key: parse the brand's own words with rules. Unstated fields stay empty.
    const brief = sanitizeBrief(buildBriefFromRules(parsed.data));
    return NextResponse.json({ brief, readiness: readiness(brief), mode: "rules" });
  }

  try {
    const brief = sanitizeBrief(await buildBrief(parsed.data));
    return NextResponse.json({ brief, readiness: readiness(brief), mode: "ai" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Brief builder failed. Try again." }, { status: 502 });
  }
}
