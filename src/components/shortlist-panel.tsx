"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Check, Heart, HelpCircle, Minus, Send, X } from "lucide-react";
import { handleRepeatsName } from "@/lib/display";
import { PLATFORM_NAME, domainOf, initials, reasons, toneFor, type Ranked } from "@/components/creator-card";
import type { CampaignBrief } from "@/lib/types";

function subline(r: Ranked) {
  const c = r.creator;
  if (c.origin === "sample") return "Sample profile";
  const platform = c.platform ? PLATFORM_NAME[c.platform] ?? c.platform : null;
  const handle = c.handle && !handleRepeatsName(c.name, c.handle) ? c.handle : null;
  return [handle, platform].filter(Boolean).join(" · ") || `via ${domainOf(c.sourceUrls[0] ?? c.profileUrl)}`;
}

function MiniCard({
  r,
  brief,
  onOpen,
  onRemove,
}: {
  r: Ranked;
  brief?: CampaignBrief;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const c = r.creator;
  const tone = toneFor(c.id);
  const top = reasons(r.signals, c, brief)[0];
  const link = c.portfolioUrls.find((u) => u.startsWith("http")) ?? c.sourceUrls[0];
  const strong = r.match.showPreciseScore && r.match.score >= 60;

  return (
    <motion.li
      layout
      initial={{ y: 8 }}
      animate={{ y: 0 }}
      exit={{ x: 40, opacity: 0, transition: { duration: 0.18 } }}
      onClick={onOpen}
      className="group relative cursor-pointer overflow-hidden rounded-[16px] border border-line bg-surface transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[0_12px_24px_-16px_rgba(17,17,19,0.35)]"
    >
      {/* colour stripe matching the creator's card */}
      <span aria-hidden className={`absolute inset-y-0 left-0 w-1.5 ${tone.bg}`} />

      <div className="flex items-center gap-3 py-3 pl-5 pr-3">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-[12px] text-[14px] font-bold ${tone.bg} ${tone.text}`}>
          {initials(c.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold leading-tight">{c.name}</p>
          <p className="truncate text-[12px] text-muted">{subline(r)}</p>
        </div>
        <span
          className={`shrink-0 rounded-[10px] px-2 py-1 text-center ${strong ? "bg-lime text-ink" : "bg-tile text-ink-2"}`}
          title={r.match.label}
        >
          <span className="display block text-[18px] leading-none tabular-nums">
            {r.match.showPreciseScore ? r.match.score : "—"}
            {r.match.showPreciseScore && <span className="text-[11px] opacity-50">%</span>}
          </span>
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-line py-2 pl-5 pr-2">
        {top ? (
          <p className="flex min-w-0 items-center gap-1.5 text-[12px] text-ink-2">
            <span
              className={`grid h-4 w-4 shrink-0 place-items-center rounded-full ${
                top.kind === "yes" ? "bg-lime text-ink" : top.kind === "partial" ? "bg-lime-soft text-ink" : "border border-line-strong text-muted"
              }`}
            >
              {top.kind === "yes" ? <Check size={10} strokeWidth={3} /> : top.kind === "partial" ? <Minus size={10} strokeWidth={3} /> : <HelpCircle size={10} />}
            </span>
            <span className="truncate">{top.text}</span>
          </p>
        ) : (
          <span />
        )}
        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className="h-8 rounded-full px-2.5 text-[12px] font-medium text-ink-2 hover:bg-tile"
          >
            Details
          </button>
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              aria-label={`Open ${c.name}'s source`}
              className="grid h-8 w-8 place-items-center rounded-full text-blue hover:bg-tile"
            >
              <ArrowUpRight size={15} />
            </a>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            aria-label={`Remove ${c.name} from shortlist`}
            className="grid h-8 w-8 place-items-center rounded-full text-faint hover:bg-tile hover:text-ink"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </motion.li>
  );
}

export function ShortlistPanel({
  items,
  brief,
  onRemove,
  onOpen,
}: {
  items: Ranked[];
  brief?: CampaignBrief;
  onRemove: (id: string) => void;
  onOpen: (r: Ranked) => void;
}) {
  const scored = items.filter((r) => r.match.showPreciseScore);
  const avg = scored.length ? Math.round(scored.reduce((a, r) => a + r.match.score, 0) / scored.length) : null;
  const sorted = [...items].sort((a, b) => b.match.score - a.match.score);

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
          {avg !== null && <span className="rounded-full bg-lime px-2.5 py-1 text-[12px] font-semibold text-ink">avg {avg}% match</span>}
        </div>
        {items.length > 0 && (
          <div aria-hidden className="relative mt-4 flex -space-x-2">
            {sorted.slice(0, 6).map((r) => {
              const t = toneFor(r.creator.id);
              return (
                <span key={r.creator.id} className={`grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold ring-2 ring-ink ${t.bg} ${t.text}`}>
                  {initials(r.creator.name)}
                </span>
              );
            })}
            {items.length > 6 && (
              <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15 text-[10px] font-semibold ring-2 ring-ink">+{items.length - 6}</span>
            )}
          </div>
        )}
      </div>

      {/* Mini cards */}
      {items.length === 0 ? (
        <div className="px-5 py-6">
          <div className="flex -space-x-2">
            {["bg-lime", "bg-blue", "bg-orange"].map((c) => (
              <span key={c} className={`h-9 w-9 rounded-full border-2 border-surface ${c} opacity-30`} />
            ))}
          </div>
          <p className="mt-3 text-[14px] font-medium">No one yet</p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">
            Swipe right or press → on creators you like. A shortlist isn’t a booking. It’s a match once they accept.
          </p>
        </div>
      ) : (
        <ul className="max-h-[440px] space-y-2.5 overflow-y-auto bg-bg/50 p-3">
          <AnimatePresence initial={false}>
            {sorted.map((r) => (
              <MiniCard key={r.creator.id} r={r} brief={brief} onOpen={() => onOpen(r)} onRemove={() => onRemove(r.creator.id)} />
            ))}
          </AnimatePresence>
        </ul>
      )}

      {/* Next step */}
      <div className="border-t border-line p-4">
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
