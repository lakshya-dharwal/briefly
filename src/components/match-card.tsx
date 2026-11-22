"use client";

// Hero object: one match card that shows the product's core idea —
// a score built from weighted, evidence-backed dimensions, where unknown
// dimensions are visibly hatched instead of counted as a match.
// All profiles are fictional samples.

import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "framer-motion";
import { ArrowUpRight, Play } from "lucide-react";
import { useEffect, useState } from "react";

type Dim = { key: string; weight: number; value: number | null };

type Sample = {
  name: string;
  handle: string;
  platform: string;
  niche: string;
  score: number;
  dims: Dim[];
  why: { text: string; source: string }[];
  tiles: ("ink" | "lime" | "tile")[];
};

const SAMPLES: Sample[] = [
  {
    name: "Maya R.",
    handle: "@maya.sample",
    platform: "TikTok",
    niche: "Skincare · comedy",
    score: 89,
    dims: [
      { key: "Niche", weight: 25, value: 1 },
      { key: "Style", weight: 25, value: 0.9 },
      { key: "Portfolio", weight: 20, value: 0.8 },
      { key: "Format", weight: 15, value: 0.85 },
      { key: "Budget", weight: 10, value: 1 },
      { key: "Avail.", weight: 5, value: null },
    ],
    why: [
      { text: "Conversational product demos with a comedic hook", source: "roundup page" },
      { text: "Reviews skincare for acne-prone, oily skin", source: "creator bio" },
    ],
    tiles: ["ink", "lime", "tile"],
  },
  {
    name: "Priya K.",
    handle: "@priya.sample",
    platform: "Instagram",
    niche: "Beauty · tutorials",
    score: 71,
    dims: [
      { key: "Niche", weight: 25, value: 0.9 },
      { key: "Style", weight: 25, value: 0.4 },
      { key: "Portfolio", weight: 20, value: 0.7 },
      { key: "Format", weight: 15, value: 0.8 },
      { key: "Budget", weight: 10, value: null },
      { key: "Avail.", weight: 5, value: null },
    ],
    why: [
      { text: "Step-by-step routines with product close-ups", source: "roundup page" },
      { text: "Calmer tone than the brief asks for", source: "creator bio" },
    ],
    tiles: ["tile", "ink", "tile"],
  },
];

function Score({ value }: { value: number }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v));
  const [n, setN] = useState(0);
  useEffect(() => rounded.on("change", setN), [rounded]);
  useEffect(() => {
    mv.set(0);
    const c = animate(mv, value, { duration: 1.1, ease: [0.2, 0.8, 0.2, 1], delay: 0.2 });
    return c.stop;
  }, [value, mv]);
  return (
    <span className="display text-[64px] leading-none tabular-nums">
      {n}
      <span className="text-[28px] text-faint">%</span>
    </span>
  );
}

function ScoreBar({ dims }: { dims: Dim[] }) {
  return (
    <div>
      <div className="flex h-2.5 gap-[3px]">
        {dims.map((d, i) => (
          <div
            key={d.key}
            style={{ flexBasis: `${d.weight}%` }}
            className={`relative overflow-hidden rounded-[2px] ${d.value === null ? "hatch" : "bg-line"}`}
          >
            {d.value !== null && (
              <motion.div
                className="absolute inset-y-0 left-0 bg-ink"
                initial={{ width: 0 }}
                animate={{ width: `${d.value * 100}%` }}
                transition={{ delay: 0.25 + i * 0.08, duration: 0.6, ease: "easeOut" }}
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-[3px]">
        {dims.map((d) => (
          <span key={d.key} style={{ flexBasis: `${d.weight}%` }} className="label overflow-hidden whitespace-nowrap !text-[9px] text-faint">
            {d.weight >= 15 ? d.key : d.key[0]}
          </span>
        ))}
      </div>
    </div>
  );
}

function Tile({ tone, i }: { tone: "ink" | "lime" | "tile"; i: number }) {
  const bg = tone === "ink" ? "bg-ink text-white" : tone === "lime" ? "bg-lime text-ink" : "bg-tile text-ink";
  return (
    <div className={`relative aspect-[9/14] overflow-hidden rounded-[10px] ${bg}`}>
      <span className="absolute left-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-current/15">
        <Play size={9} className="fill-current" />
      </span>
      <span className="label absolute bottom-2 left-2 !text-[9px] opacity-70">0:{[28, 24, 31][i]}</span>
    </div>
  );
}

export function MatchCard() {
  const [idx, setIdx] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(
      () => {
        if (!leaving) setLeaving(true);
        else {
          setLeaving(false);
          setIdx((i) => (i + 1) % SAMPLES.length);
        }
      },
      leaving ? 700 : 4200,
    );
    return () => clearTimeout(t);
  }, [leaving]);

  const s = SAMPLES[idx];
  const unknown = s.dims.filter((d) => d.value === null).map((d) => d.key.replace(".", "ability"));

  return (
    <div className="relative mx-auto w-full max-w-[440px]">
      {/* stack behind */}
      <div className="absolute inset-x-6 -bottom-3 top-6 rounded-[20px] border border-line bg-surface/70" />
      <div className="absolute inset-x-3 -bottom-1.5 top-3 rounded-[20px] border border-line bg-surface/85" />

      <AnimatePresence mode="wait">
        <motion.article
          key={s.handle}
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          animate={leaving ? { x: 140, rotate: 6, opacity: 0 } : { opacity: 1, y: 0, x: 0, rotate: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: leaving ? 0.6 : 0.45, ease: [0.2, 0.8, 0.2, 1] }}
          className="relative rounded-[20px] border border-line-strong bg-surface shadow-[0_1px_0_rgba(0,0,0,0.04),0_24px_48px_-24px_rgba(17,17,19,0.25)]"
        >
          <header className="flex items-center justify-between border-b border-line px-5 py-3">
            <span className="label text-muted">Match {String(idx + 1).padStart(2, "0")} / 24</span>
            <span className="label text-faint">GlowUp · Skincare launch</span>
          </header>

          <div className="grid grid-cols-[1fr_auto] items-end gap-4 px-5 pt-5">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="display text-[26px] leading-none">{s.name}</h3>
                <span className="label rounded-[4px] border border-line px-1.5 py-0.5 !text-[9px] text-muted">
                  Sample
                </span>
              </div>
              <p className="mt-1.5 text-[13px] text-muted">
                {s.handle} · {s.platform} · {s.niche}
              </p>
            </div>
            <div className="text-right">
              <Score value={s.score} />
              <p className="label -mt-1 !text-[9px] text-faint">Estimated match</p>
            </div>
          </div>

          <div className="px-5 pt-5">
            <ScoreBar dims={s.dims} />
          </div>

          <div className="mt-5 grid grid-cols-[112px_1fr] gap-4 border-t border-line px-5 py-5">
            <div className="grid grid-cols-2 gap-1.5">
              <div className="col-span-2">
                <Tile tone={s.tiles[0]} i={0} />
              </div>
              <Tile tone={s.tiles[1]} i={1} />
              <Tile tone={s.tiles[2]} i={2} />
            </div>
            <div>
              <p className="label text-muted">Why this match</p>
              <ul className="mt-3 space-y-3">
                {s.why.map((w, i) => (
                  <motion.li
                    key={w.text}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.12 }}
                    className="text-[13px] leading-snug"
                  >
                    “{w.text}”
                    <span className="mt-1 flex items-center gap-1 text-[11px] text-blue">
                      <ArrowUpRight size={11} /> {w.source}
                    </span>
                  </motion.li>
                ))}
              </ul>
              {unknown.length > 0 && (
                <p className="mt-4 flex items-start gap-2 text-[12px] text-muted">
                  <span className="hatch mt-1 h-2.5 w-4 shrink-0 rounded-[2px]" />
                  {unknown.join(" and ")} {unknown.length > 1 ? "are" : "is"} unknown. It lowers confidence instead of counting as a match.
                </p>
              )}
            </div>
          </div>

          <footer className="grid grid-cols-2 overflow-hidden rounded-b-[19px] border-t border-line">
            <span className="py-3.5 text-center text-sm font-medium text-muted">Pass</span>
            <span
              className={`border-l border-line py-3.5 text-center text-sm font-semibold transition-colors ${
                leaving ? "bg-lime text-ink" : "text-ink"
              }`}
            >
              {leaving ? "Shortlisted" : "Shortlist"}
            </span>
          </footer>
        </motion.article>
      </AnimatePresence>
    </div>
  );
}
