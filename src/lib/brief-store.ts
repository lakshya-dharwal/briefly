// Hands the approved brief from /brief to /discover within this browser tab.

import { BriefSchema } from "./brief-schema";
import type { CampaignBrief } from "./types";

const KEY = "briefly:brief";

export function saveBrief(b: CampaignBrief) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(b));
  } catch {
    /* storage unavailable: /discover falls back to the sample brief */
  }
}

export function loadBrief(): CampaignBrief | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = BriefSchema.safeParse(JSON.parse(raw));
    if (parsed.success) return parsed.data as CampaignBrief;
    sessionStorage.removeItem(KEY); // corrupted or from an older version: start fresh
    return null;
  } catch {
    return null;
  }
}
