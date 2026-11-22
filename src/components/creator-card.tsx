"use client";

import { ArrowUpRight } from "lucide-react";
import { WEIGHTS } from "@/lib/matching";
import type { CreatorCandidate, MatchDimension, MatchResult, MatchSignals } from "@/lib/types";

export type Ranked = { creator: CreatorCandidate; match: MatchResult; signals: MatchSignals };

const DIM_LABEL: Record<MatchDimension, string> = {
  niche: "Niche",
  style: "Style",
  portfolio: "Portfolio",
  format: "Format",
  budget: "Budget",
  availability: "Availability",
};

const PLATFORM_NAME: Record<string, string> = { tiktok: "TikTok", instagram: "Instagram", youtube: "YouTube", x: "X" };

export const domainOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

function ScoreBar({ signals }: { signals: MatchSignals }) {
  const dims = Object.keys(WEIGHTS) as MatchDimension[];
  return (
    <div>
      <div className="flex h-2.5 gap-[3px]">
        {dims.map((d) => {
          const v = signals[d];
          return (
            <div
              key={d}
              style={{ flexBasis: `${WEIGHTS[d] * 100}%` }}
              className={`relative overflow-hidden rounded-[2px] ${v === null ? "hatch" : "bg-line"}`}
            >
              {v !== null && <div className="absolute inset-y-0 left-0 bg-ink" style={{ width: `${v * 100}%` }} />}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-[3px]">
        {dims.map((d) => (
          <span key={d} style={{ flexBasis: `${WEIGHTS[d] * 100}%` }} className="label overflow-hidden whitespace-nowrap !text-[9px] text-faint">
            {WEIGHTS[d] >= 0.15 ? DIM_LABEL[d] : DIM_LABEL[d][0]}
          </span>
        ))}
      </div>
    </div>
  );
}

export function CreatorCard({ r, index, total }: { r: Ranked; index: number; total: number }) {
  const { creator: c, match: m, signals } = r;
  const isSample = c.origin === "sample";
  const unknown = m.unknown.map((d) => DIM_LABEL[d].toLowerCase());
  const evidence = c.evidenceSnippets.slice(0, 2);

  return (
    <article className="flex h-full flex-col rounded-[20px] border border-line-strong bg-surface shadow-[0_1px_0_rgba(0,0,0,0.04),0_24px_48px_-24px_rgba(17,17,19,0.25)]">
      <header className="flex items-center justify-between border-b border-line px-5 py-3">
        <span className="label text-muted">
          Match {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        <span
          className={`label rounded-[4px] px-1.5 py-0.5 !text-[9px] ${
            isSample ? "border border-line text-muted" : "bg-lime-soft text-ink"
          }`}
        >
          {isSample ? "Sample profile" : "Live web · unverified"}
        </span>
      </header>

      <div className="grid grid-cols-[1fr_auto] items-end gap-4 px-5 pt-5">
        <div className="min-w-0">
          <h3 className="display truncate text-[28px] leading-none">{c.name}</h3>
          <p className="mt-2 truncate text-[13px] text-muted">
            {[c.handle, c.platform && (PLATFORM_NAME[c.platform] ?? c.platform)].filter(Boolean).join(" · ") ||
              domainOf(c.profileUrl)}
          </p>
        </div>
        <div className="text-right">
          {m.showPreciseScore ? (
            <p className="display text-[56px] leading-none tabular-nums">
              {m.score}
              <span className="text-[24px] text-faint">%</span>
            </p>
          ) : (
            <p className="display max-w-[150px] text-[18px] leading-tight">{m.label.split(" — ")[0]}</p>
          )}
          <p className="label mt-1 !text-[9px] text-faint">
            {m.showPreciseScore ? "Estimated match" : `${Math.round(m.coverage * 100)}% of signals known`}
          </p>
        </div>
      </div>

      <div className="px-5 pt-5">
        <ScoreBar signals={signals} />
      </div>

      <div className="mt-5 flex-1 overflow-hidden border-t border-line px-5 py-4">
        <p className="label text-muted">Why this match</p>
        {evidence.length ? (
          <ul className="mt-3 space-y-3">
            {evidence.map((e) => (
              <li key={e} className="line-clamp-3 text-[14px] leading-snug">
                “{e}”
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-[14px] text-muted">No description found on the source page.</p>
        )}
        {unknown.length > 0 && (
          <p className="mt-4 flex items-start gap-2 text-[12px] text-muted">
            <span className="hatch mt-1 h-2.5 w-4 shrink-0 rounded-[2px]" />
            {unknown.join(", ")} unknown. Lowers confidence, never counts as a match.
          </p>
        )}
      </div>

      <footer className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line px-5 py-3">
        {c.sourceUrls.length ? (
          c.sourceUrls.slice(0, 2).map((u) => (
            <a
              key={u}
              href={u}
              target="_blank"
              rel="noreferrer"
              onPointerDown={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-[12px] text-blue hover:underline"
            >
              <ArrowUpRight size={12} /> {domainOf(u)}
            </a>
          ))
        ) : (
          <span className="text-[12px] text-faint">Fictional demo profile, no sources</span>
        )}
        {c.sourceUrls.length > 2 && <span className="text-[12px] text-faint">+{c.sourceUrls.length - 2} more</span>}
      </footer>
    </article>
  );
}
