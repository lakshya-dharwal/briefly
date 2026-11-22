"use client";

// Side panel with everything we know about one creator: every quote, every
// source, the full weighted breakdown. Opened by tapping a card or a shortlist entry.

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Check, Globe, Heart, HelpCircle, Info, Minus, Quote, Trash2, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { PLATFORM_NAME, domainOf, initials, reasons, tidyQuote, toneFor, type Ranked } from "@/components/creator-card";
import { handleRepeatsName } from "@/lib/display";
import { WEIGHTS } from "@/lib/matching";
import type { CampaignBrief, MatchDimension } from "@/lib/types";

const DIM: { key: MatchDimension; label: string; what: string }[] = [
  { key: "niche", label: "Niche", what: "Their content is about your topic" },
  { key: "style", label: "Style", what: "Tone matches what you asked for" },
  { key: "portfolio", label: "Portfolio", what: "How much real evidence we found" },
  { key: "format", label: "Format", what: "They’ve made the video types you want" },
  { key: "budget", label: "Budget", what: "Their rate fits your budget" },
  { key: "availability", label: "Availability", what: "They can take the job now" },
];

export type DetailMode = "deck" | "shortlist";

export function CreatorDetail({
  r,
  brief,
  mode,
  onClose,
  onShortlist,
  onPass,
  onRemove,
}: {
  r: Ranked | null;
  brief?: CampaignBrief;
  mode: DetailMode;
  onClose: () => void;
  onShortlist?: () => void;
  onPass?: () => void;
  onRemove?: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!r) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [r, onClose]);

  return (
    <AnimatePresence>
      {r && (
        <>
          <motion.div
            key="scrim"
            className="fixed inset-0 z-40 bg-ink/35 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-label={`${r.creator.name} details`}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col overflow-hidden bg-surface shadow-[-24px_0_48px_-24px_rgba(17,17,19,0.35)]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
          >
            <Body r={r} brief={brief} closeRef={closeRef} onClose={onClose} />
            <Actions mode={mode} onShortlist={onShortlist} onPass={onPass} onRemove={onRemove} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Body({
  r,
  brief,
  closeRef,
  onClose,
}: {
  r: Ranked;
  brief?: CampaignBrief;
  closeRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  const { creator: c, match: m, signals } = r;
  const tone = toneFor(c.id);
  const isSample = c.origin === "sample";
  const platform = c.platform ? PLATFORM_NAME[c.platform] ?? c.platform : null;
  const handle = c.handle && !handleRepeatsName(c.name, c.handle) ? c.handle : null;
  const whys = reasons(signals, c, brief);
  const quotes = c.evidenceSnippets.map(tidyQuote).filter((q) => q.length > 3);
  const profile = c.portfolioUrls.find((u) => u.startsWith("http"));

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      {/* Colour hero (same tone as the card) */}
      <div className={`relative overflow-hidden px-6 pb-6 pt-4 ${tone.bg} ${tone.text}`}>
        <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:14px_14px] [mask-image:linear-gradient(to_left,black,transparent_70%)]" />
        <span className="display pointer-events-none absolute -bottom-8 -right-2 select-none text-[170px] leading-none opacity-[0.12]">
          {initials(c.name)}
        </span>
        <div className="relative flex items-center justify-between">
          <span className={`label inline-flex items-center gap-1.5 rounded-full px-2 py-1 !text-[9px] ${tone.chip}`}>
            {isSample ? <Info size={11} /> : <Globe size={11} />}
            {isSample ? "Sample profile · fictional" : "Live web · unverified"}
          </span>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close details"
            className={`grid h-9 w-9 place-items-center rounded-full ${tone.chip} hover:opacity-80`}
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative mt-8 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <span className={`grid h-16 w-16 place-items-center rounded-full text-[20px] font-bold ring-4 ring-white/25 ${tone.avatar}`}>
              {initials(c.name)}
            </span>
            <h2 className="display mt-3 text-[34px] leading-[0.95]">{c.name}</h2>
            <p className={`mt-1.5 text-[14px] ${tone.sub}`}>{[handle, platform].filter(Boolean).join(" · ") || (c.sourceUrls[0] ? `via ${domainOf(c.sourceUrls[0])}` : "Creator")}</p>
          </div>
          <div className={`shrink-0 rounded-[16px] px-4 py-3 text-center ${tone.badge}`}>
            {m.showPreciseScore ? (
              <p className="display text-[40px] leading-none tabular-nums">
                {m.score}
                <span className="text-[18px] opacity-50">%</span>
              </p>
            ) : (
              <p className="max-w-[110px] text-[14px] font-semibold leading-tight">{m.label.split(" — ")[0]}</p>
            )}
            <p className="label mt-1 !text-[8px] opacity-60">Estimated match</p>
          </div>
        </div>
      </div>

      {/* Why it fits */}
      <section className="border-b border-line px-6 py-5">
        <p className="label text-muted">Why it fits</p>
        <ul className="mt-3 space-y-2">
          {whys.map((w) => (
            <li key={w.text} className="flex items-center gap-2.5 text-[15px]">
              <span
                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                  w.kind === "yes" ? "bg-lime text-ink" : w.kind === "partial" ? "bg-lime-soft text-ink" : "border border-line-strong text-muted"
                }`}
              >
                {w.kind === "yes" ? <Check size={12} strokeWidth={3} /> : w.kind === "partial" ? <Minus size={12} strokeWidth={3} /> : <HelpCircle size={12} />}
              </span>
              <span className={w.kind === "unknown" ? "text-muted" : ""}>{w.text}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Breakdown */}
      <section className="border-b border-line px-6 py-5">
        <div className="flex items-baseline justify-between">
          <p className="label text-muted">Score breakdown</p>
          <p className="text-[12px] text-faint">{Math.round(m.coverage * 100)}% of signals known</p>
        </div>
        <ul className="mt-4 space-y-3.5">
          {DIM.map(({ key, label, what }) => {
            const v = signals[key];
            return (
              <li key={key}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[14px] font-medium">
                    {label} <span className="font-normal text-faint">· {Math.round(WEIGHTS[key] * 100)}% weight</span>
                  </p>
                  <p className={`text-[13px] font-semibold tabular-nums ${v === null ? "text-faint" : ""}`}>
                    {v === null ? "Unknown" : Math.round(v * 100)}
                  </p>
                </div>
                <div className={`mt-1.5 h-2 overflow-hidden rounded-full ${v === null ? "hatch" : "bg-tile"}`}>
                  {v !== null && (
                    <div className={`h-full rounded-full ${v >= 0.6 ? "bg-lime-deep" : "bg-ink"}`} style={{ width: `${Math.max(v * 100, 2)}%` }} />
                  )}
                </div>
                <p className="mt-1 text-[12px] text-muted">{v === null ? `${what}: not stated anywhere we looked.` : what}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Evidence */}
      <section className="border-b border-line px-6 py-5">
        <p className="label text-muted">What sources say</p>
        {quotes.length ? (
          <ul className="mt-3 space-y-3">
            {quotes.map((q, i) => (
              <li key={q} className="relative rounded-[14px] bg-tile px-4 pb-3 pt-3.5">
                <Quote size={15} className="absolute -top-2 left-3 fill-blue text-blue" />
                <p className="text-[14px] leading-relaxed text-ink-2">{q}</p>
                {c.sourceUrls[Math.min(i, c.sourceUrls.length - 1)] && (
                  <p className="label mt-2 !text-[9px] text-faint">— {domainOf(c.sourceUrls[Math.min(i, c.sourceUrls.length - 1)])}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[14px] text-muted">The sources name this creator but don’t describe their content.</p>
        )}
      </section>

      {/* Sources */}
      <section className="px-6 py-5">
        <p className="label text-muted">Sources</p>
        {c.sourceUrls.length ? (
          <ul className="mt-3 space-y-2">
            {profile && (
              <li>
                <a href={profile} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-[12px] border border-line px-4 py-3 text-[14px] font-medium hover:border-ink">
                  <span>{platform ? `Profile on ${platform}` : "Profile"}</span>
                  <ArrowUpRight size={15} className="text-blue" />
                </a>
              </li>
            )}
            {c.sourceUrls.map((u) => (
              <li key={u}>
                <a href={u} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-[12px] border border-line px-4 py-3 text-[14px] hover:border-ink">
                  <span className="min-w-0 truncate">
                    <span className="font-medium">{domainOf(u)}</span>
                    <span className="text-faint"> · where we found them</span>
                  </span>
                  <ArrowUpRight size={15} className="shrink-0 text-blue" />
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[14px] text-muted">Fictional demo profile. No real sources.</p>
        )}
        <p className="mt-4 text-[12px] leading-relaxed text-faint">
          Rates, availability and follower numbers aren’t verified. Confirm them with the creator before booking.
        </p>
      </section>
    </div>
  );
}

function Actions({
  mode,
  onShortlist,
  onPass,
  onRemove,
}: {
  mode: DetailMode;
  onShortlist?: () => void;
  onPass?: () => void;
  onRemove?: () => void;
}) {
  return (
    <div className="flex gap-3 border-t border-line bg-bg/70 p-4">
      {mode === "deck" ? (
        <>
          <button onClick={onPass} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-line-strong bg-surface text-[15px] font-medium hover:border-ink">
            <X size={17} /> Pass
          </button>
          <button onClick={onShortlist} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-ink text-[15px] font-medium text-white hover:bg-ink-2">
            <Heart size={17} className="fill-lime text-lime" /> Shortlist
          </button>
        </>
      ) : (
        <button onClick={onRemove} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-line-strong bg-surface text-[15px] font-medium hover:border-ink">
          <Trash2 size={16} /> Remove from shortlist
        </button>
      )}
    </div>
  );
}
