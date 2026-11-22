// Small display helpers shared by cards and the shortlist.

const norm = (s?: string) => (s ?? "").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

/** True when a handle just repeats the name ("DosenSkincare" vs "@dosenskincare"). */
export function handleRepeatsName(name: string, handle?: string) {
  return !!handle && norm(name) === norm(handle);
}
