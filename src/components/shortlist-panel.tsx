"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Heart, Send, X } from "lucide-react";
import { handleRepeatsName } from "@/lib/display";
import { domainOf, initials, toneFor, type Ranked } from "@/components/creator-card";

const PLATFORM_NAME: Record<string, string> = { tiktok: "TikTok", instagram: "Instagram", youtube: "YouTube", x: "X" };

function subline(r: Ranked) {
  const c = r.creator;
  if (c.origin === "sample") return "Sample profile";
  const platform = c.platform ? PLATFORM_NAME[c.platform] ?? c.platform : null;
  const handle = c.handle && !handleRepeatsName(c.name, c.handle) ? c.handle : null;
  return [handle, platform].filter(Boolean).join(" · ") || `via ${domainOf(c.sourceUrls[0] ?? c.profileUrl)}`;
}

export function ShortlistPanel({ items, onRemove }: { items: Ranked[]; onRemove: (id: string) => void }) {
  const scored = items.filter((r) => r.match.showPreciseScore);
  const avg = scored.length ? Math.round(scored.reduce((a, r) => a + r.match.score, 0) / scored.length) : null;

  return (
    <div className="overflow-hidden rounded-[24px] border border-line-strong bg-surface shadow-[0_1px_0_rgba(0,0,0,0.04),0_24px_48px_-32px_rgba(17,17,19,0.3)]">
      {/* Header band */}
      <div className="relative overflow-hidden bg-ink px-5 pb-5 pt-4 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-[0.14] [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:14px_14px] [mask-image:linear-gradient(to_left,black,transparent_75%)]" />
        <div className="relative flex items-center justify-between">
          <p className="label !text-[10px] text-white/55">Shortlist</p>
          <Heart size={14} className="fill-lime text-lime" />
        </div>
        <div className="relative mt-4 flex items-end justify-between">
          <p className="display text-[44px] leading-none tabular-nums">
            {items.length}
            <span className="ml-2 text-[15px] font-medium tracking-normal text-white/55">
              {items.length === 1 ? "creator" : "creators"}
            </span>
          </p>
          {avg !== null && (
            <span className="rounded-full bg-lime px-2.5 py-1 text-[12px] font-semibold text-ink">avg {avg}% match</span>
          )}
        </div>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div className="px-5 py-6">
          <div className="flex -space-x-2">
            {["bg-lime", "bg-blue", "bg-orange"].map((c) => (
              <span key={c} className={`h-9 w-9 rounded-full border-2 border-surface ${c} opacity-30`} />
            ))}
          </div>
          <p className="mt-3 text-[14px] font-medium">No one yet</p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">
            Swipe right on creators you like. A shortlist isn’t a booking. It’s a match once they accept.
          </p>
        </div>
      ) : (
        <ul className="max-h-[420px] overflow-y-auto">
          <AnimatePresence initial={false}>
            {items.map((r) => {
              const tone = toneFor(r.creator.id);
              return (
                <motion.li
                  key={r.creator.id}
                  initial={{ x: -10 }}
                  animate={{ x: 0 }}
                  className="group flex items-center gap-3 border-b border-line px-4 py-3 last:border-0"
                >
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-[13px] font-bold ${tone.bg} ${tone.text}`}>
                    {initials(r.creator.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold">{r.creator.name}</p>
                    <p className="truncate text-[12px] text-muted">{subline(r)}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[12px] font-semibold tabular-nums ${
                      r.match.showPreciseScore && r.match.score >= 60 ? "bg-lime text-ink" : "bg-tile text-ink-2"
                    }`}
                  >
                    {r.match.showPreciseScore ? `${r.match.score}%` : "—"}
                  </span>
                  <div className="flex shrink-0 items-center">
                    {r.creator.sourceUrls[0] && (
                      <a
                        href={r.creator.profileUrl.startsWith("http") ? r.creator.profileUrl : r.creator.sourceUrls[0]}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${r.creator.name}`}
                        className="grid h-8 w-8 place-items-center rounded-full text-blue hover:bg-tile"
                      >
                        <ArrowUpRight size={15} />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemove(r.creator.id)}
                      aria-label={`Remove ${r.creator.name} from shortlist`}
                      className="grid h-8 w-8 place-items-center rounded-full text-faint hover:bg-tile hover:text-ink"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      {/* Next step */}
      <div className="border-t border-line bg-bg/60 p-4">
        <button
          disabled
          title="Coming next: invites and the AI collaboration agreement"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-ink text-[14px] font-medium text-white opacity-40"
        >
          <Send size={15} /> Invite to campaign
        </button>
        <p className="label mt-2 text-center !text-[9px] text-faint">Invites · coming next</p>
      </div>
    </div>
  );
}
