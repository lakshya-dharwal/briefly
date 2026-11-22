// Hands the approved brief from /brief to /discover within this browser tab.

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
    return raw ? (JSON.parse(raw) as CampaignBrief) : null;
  } catch {
    return null;
  }
}
