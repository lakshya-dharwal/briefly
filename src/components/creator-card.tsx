"use client";

import { ArrowUpRight, Check, HelpCircle, Minus, Quote } from "lucide-react";
import type { CampaignBrief, CreatorCandidate, MatchDimension, MatchResult, MatchSignals } from "@/lib/types";

export type Ranked = { creator: CreatorCandidate; match: MatchResult; signals: MatchSignals };

const DIM_LABEL: Record<MatchDimension, string> = {
  niche: "Niche",
  style: "Style",
  portfolio: "Portfolio",
  format: "Format",
  budget: "Budget",
  availability: "Avail.",
};

const PLATFORM_NAME: Record<string, string> = { tiktok: "TikTok", instagram: "Instagram", youtube: "YouTube", x: "X" };

const FORMAT_WORD: Record<string, string> = {
  "product-demo": "product demos",
  testimonial: "reviews",
  skit: "skits",
  unboxing: "unboxings",
  tutorial: "tutorials",
  "talking-head": "talking-head videos",
};

export const domainOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

// One bold colour per creator, stable across renders.
const TONES = [
  { bg: "bg-lime", text: "text-ink", sub: "text-ink/60", chip: "bg-ink/10 text-ink", avatar: "bg-ink text-lime", badge: "bg-ink text-white" },
  { bg: "bg-blue", text: "text-white", sub: "text-white/70", chip: "bg-white/15 text-white", avatar: "bg-white text-blue", badge: "bg-white text-ink" },
  { bg: "bg-ink", text: "text-white", sub: "text-white/55", chip: "bg-white/10 text-white", avatar: "bg-lime text-ink", badge: "bg-lime text-ink" },
  { bg: "bg-orange", text: "text-white", sub: "text-white/75", chip: "bg-white/15 text-white", avatar: "bg-white text-orange", badge: "bg-white text-ink" },
] as const;

export function toneFor(key: string) {
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return TONES[Math.abs(h) % TONES.length];
}

export function initials(name: string) {
  const parts = name.replace(/^@/, "").replace(/[^\p{L}\p{N} ._-]/gu, "").split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}

/** Turn the match signals into short, plain-English reasons. */
function reasons(signals: MatchSignals, c: CreatorCandidate, brief?: CampaignBrief) {
  const out: { kind: "yes" | "partial" | "unknown"; text: string }[] = [];
  const niche = brief?.nicheKeywords[0] ?? brief?.category;
  const styles = brief?.preferredStyle.slice(0, 2).join(" & ");
  const format = brief?.deliverableFormats.map((f) => FORMAT_WORD[f]).find(Boolean);

  if (signals.niche !== null && signals.niche >= 0.5) out.push({ kind: "yes", text: niche ? `Makes ${niche} content` : "Right niche for the brief" });
  else if (signals.niche) out.push({ kind: "partial", text: niche ? `Some ${niche} content` : "Partly in your niche" });

  if (signals.style !== null && signals.style >= 0.5) out.push({ kind: "yes", text: styles ? `${cap(styles)} tone` : "Tone matches the brief" });
  else if (signals.style) out.push({ kind: "partial", text: styles ? `Partly ${styles}` : "Tone partly matches" });

  if (signals.format !== null && signals.format >= 0.5) out.push({ kind: "yes", text: format ? `Has done ${format}` : "Has done this format" });

  const sources = c.sourceUrls.length;
  if (sources > 1) out.push({ kind: "yes", text: `Mentioned on ${sources} different sites` });

  if (signals.budget === null || signals.availability === null) {
    out.push({ kind: "unknown", text: "Rate and availability: ask them" });
  }
  return out.slice(0, 4);
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Clean a source snippet into one readable quote. */
function tidyQuote(s: string) {
  const t = s
    // drop "words" built from decorative sparkle characters, e.g. "·˚₊‧୨୧‧₊˚·"
    .split(/\s+/)
    .filter((w) => !/[˚₊‧⋆✧✦｡ﾟ゜⁺₊˖°]/u.test(w))
    .join(" ")
    .replace(/\s+/g, " ")
    .replace(/^["“]|["”]$/g, "")
    .replace(/^[\s·•.,;:-]+/, "")
    .trim();
  return t.length > 180 ? `${t.slice(0, 180).replace(/\s\S*$/, "")}…` : t;
}

function SignalChips({ signals }: { signals: MatchSignals }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {(Object.keys(DIM_LABEL) as MatchDimension[]).map((d) => {
        const v = signals[d];
        const cls =
          v === null
            ? "border border-dashed border-line-strong text-muted"
            : v >= 0.6
              ? "bg-lime text-ink"
              : v > 0
                ? "bg-lime-soft text-ink"
                : "bg-tile text-faint";
        return (
          <span key={d} className={`label inline-flex h-6 items-center gap-1 rounded-full px-2 !text-[10px] ${cls}`}>
            {DIM_LABEL[d]}
            <span className="font-semibold">{v === null ? "?" : Math.round(v * 100)}</span>
          </span>
        );
      })}
    </div>
  );
}

export function CreatorCard({
  r,
  index,
  total,
  brief,
}: {
  r: Ranked;
  index: number;
  total: number;
  brief?: CampaignBrief;
}) {
  const { creator: c, match: m, signals } = r;
  const isSample = c.origin === "sample";
  const tone = toneFor(c.id);
  const quote = c.evidenceSnippets[0] ? tidyQuote(c.evidenceSnippets[0]) : null;
  const whys = reasons(signals, c, brief);
  const platform = c.platform ? PLATFORM_NAME[c.platform] ?? c.platform : null;
  const primarySource = c.sourceUrls[0] ? domainOf(c.sourceUrls[0]) : null;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[24px] border border-line-strong bg-surface shadow-[0_1px_0_rgba(0,0,0,0.04),0_28px_56px_-28px_rgba(17,17,19,0.35)]">
      {/* ---------- Colour hero ---------- */}
      <div className={`relative overflow-hidden px-5 pb-5 pt-4 ${tone.bg} ${tone.text}`}>
        {/* texture: dot lattice + oversized initials */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:14px_14px] [mask-image:linear-gradient(to_left,black,transparent_70%)]" />
        <span className="display pointer-events-none absolute -bottom-6 -right-2 select-none text-[150px] leading-none opacity-[0.12]">
          {initials(c.name)}
        </span>

        <div className="relative flex items-center justify-between">
          <span className={`label !text-[10px] ${tone.sub}`}>
            Match {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
          <span className={`label rounded-full px-2 py-1 !text-[9px] ${tone.chip}`}>
            {isSample ? "Sample profile" : "Live web · unverified"}
          </span>
        </div>

        <div className="relative mt-8 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <span className={`grid h-14 w-14 place-items-center rounded-full text-[18px] font-bold ring-4 ring-white/25 ${tone.avatar}`}>
              {initials(c.name)}
            </span>
            <h3 className="display mt-3 line-clamp-2 text-[30px] leading-[0.95]">{c.name}</h3>
            <p className={`mt-1.5 truncate text-[13px] ${tone.sub}`}>
              {[c.handle && c.handle !== c.name ? c.handle : null, platform, !platform && primarySource ? `via ${primarySource}` : null]
                .filter(Boolean)
                .join(" · ") || "Creator"}
            </p>
          </div>

          <div className={`shrink-0 rounded-[16px] px-3.5 py-2.5 text-center ${tone.badge}`}>
            {m.showPreciseScore ? (
              <p className="display text-[34px] leading-none tabular-nums">
                {m.score}
                <span className="text-[16px] opacity-50">%</span>
              </p>
            ) : (
              <p className="max-w-[92px] text-[13px] font-semibold leading-tight">{m.label.split(" — ")[0]}</p>
            )}
            <p className="label mt-1 !text-[8px] opacity-60">Match</p>
          </div>
        </div>
      </div>

      {/* ---------- Why it fits ---------- */}
      <div className="px-5 pt-5">
        <p className="label text-muted">Why it fits</p>
        <ul className="mt-3 space-y-2">
          {whys.map((w) => (
            <li key={w.text} className="flex items-center gap-2.5 text-[15px] leading-snug">
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
      </div>

      {/* ---------- Pull quote ---------- */}
      <div className="min-h-0 flex-1 px-5 pt-4">
        {quote ? (
          <figure className="relative rounded-[14px] bg-tile px-4 pb-3 pt-3.5">
            <Quote size={16} className="absolute -top-2 left-3 fill-blue text-blue" />
            <blockquote className="line-clamp-3 text-[14px] leading-relaxed text-ink-2">{quote}</blockquote>
            {primarySource && <figcaption className="label mt-2 !text-[9px] text-faint">— {primarySource}</figcaption>}
          </figure>
        ) : (
          <p className="text-[13px] text-muted">The source names this creator but doesn’t describe their content yet.</p>
        )}
      </div>

      {/* ---------- Signals + source ---------- */}
      <div className="mt-4 border-t border-line px-5 py-3.5">
        <SignalChips signals={signals} />
        <div className="mt-3 flex items-center justify-between">
          {c.sourceUrls.length ? (
            <a
              href={c.profileUrl.startsWith("http") ? c.profileUrl : c.sourceUrls[0]}
              target="_blank"
              rel="noreferrer"
              onPointerDown={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[13px] font-medium text-blue hover:underline"
            >
              {c.portfolioUrls.length && platform ? `View on ${platform}` : "View source"} <ArrowUpRight size={13} />
            </a>
          ) : (
            <span className="text-[12px] text-faint">Fictional demo profile</span>
          )}
          {c.sourceUrls.length > 1 && <span className="text-[12px] text-faint">{c.sourceUrls.length} sources</span>}
        </div>
      </div>
    </article>
  );
}
