"use client";

import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { Check, Heart, Loader2, Minus, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { CreatorCard, type Ranked } from "@/components/creator-card";
import { ShortlistPanel } from "@/components/shortlist-panel";
import { SAMPLE_BRIEF } from "@/data/sample-brief";
import { loadBrief } from "@/lib/brief-store";
import type { CampaignBrief } from "@/lib/types";

type Step = { label: string; status: "done" | "skipped" | "failed"; detail?: string };
type Phase = "searching" | "steps" | "deck" | "error";

const DECK_SIZE = 20;
const SWIPE_PX = 110;

function SwipeTop({
  r,
  index,
  total,
  brief,
  onDecide,
}: {
  r: Ranked;
  index: number;
  total: number;
  brief?: CampaignBrief;
  onDecide: (dir: 1 | -1) => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-240, 240], [-10, 10]);
  const likeOpacity = useTransform(x, [30, SWIPE_PX], [0, 1]);
  const passOpacity = useTransform(x, [-SWIPE_PX, -30], [1, 0]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > SWIPE_PX || info.velocity.x > 600) onDecide(1);
    else if (info.offset.x < -SWIPE_PX || info.velocity.x < -600) onDecide(-1);
  };

  return (
    <motion.div
      className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing"
      style={{ x, rotate }}
      drag="x"
      dragSnapToOrigin
      dragElastic={0.9}
      onDragEnd={onDragEnd}
      initial={{ scale: 0.96, y: 10 }}
      animate={{ scale: 1, y: 0 }}
      variants={{
        exit: (dir: number) => ({ x: dir * 520, rotate: dir * 14, opacity: 0, transition: { duration: 0.35 } }),
      }}
      exit="exit"
    >
      <CreatorCard r={r} index={index} total={total} brief={brief} />
      <motion.span
        style={{ opacity: likeOpacity }}
        className="label pointer-events-none absolute left-5 top-14 -rotate-12 rounded-[6px] border-2 border-ink bg-lime px-2 py-1 !text-[13px] font-semibold text-ink"
      >
        Shortlist
      </motion.span>
      <motion.span
        style={{ opacity: passOpacity }}
        className="label pointer-events-none absolute right-5 top-14 rotate-12 rounded-[6px] border-2 border-ink bg-surface px-2 py-1 !text-[13px] font-semibold text-ink"
      >
        Pass
      </motion.span>
    </motion.div>
  );
}

export default function DiscoverPage() {
  const [brief, setBrief] = useState<CampaignBrief | null>(null);
  const [usingSample, setUsingSample] = useState(false);
  const [phase, setPhase] = useState<Phase>("searching");
  const [steps, setSteps] = useState<Step[]>([]);
  const [shownSteps, setShownSteps] = useState(0);
  const [deck, setDeck] = useState<Ranked[]>([]);
  const [pos, setPos] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [shortlist, setShortlist] = useState<Ranked[]>([]);
  const [history, setHistory] = useState<{ r: Ranked; liked: boolean }[]>([]);

  const run = useCallback(async (b: CampaignBrief) => {
    setPhase("searching");
    setShownSteps(0);
    try {
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: b, includeSamples: true }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { steps: Step[]; results: Ranked[] };
      // Live web creators first; labeled samples only after them.
      const live = data.results.filter((r) => r.creator.origin !== "sample").slice(0, DECK_SIZE);
      const samples = data.results.filter((r) => r.creator.origin === "sample");
      setSteps(data.steps);
      setDeck([...live, ...samples]);
      setPos(0);
      setShortlist([]);
      setHistory([]);
      setPhase("steps");
    } catch {
      setPhase("error");
    }
  }, []);

  useEffect(() => {
    const saved = loadBrief();
    setUsingSample(!saved);
    const b = saved ?? SAMPLE_BRIEF;
    setBrief(b);
    run(b);
  }, [run]);

  // Reveal the steps that actually ran, one by one, then show the deck.
  useEffect(() => {
    if (phase !== "steps") return;
    if (shownSteps < steps.length) {
      const t = setTimeout(() => setShownSteps((n) => n + 1), 260);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setPhase("deck"), 700);
    return () => clearTimeout(t);
  }, [phase, shownSteps, steps.length]);

  const decide = useCallback(
    (d: 1 | -1) => {
      const r = deck[pos];
      if (!r) return;
      setDir(d);
      setHistory((h) => [...h, { r, liked: d === 1 }]);
      if (d === 1) setShortlist((s) => [...s, r]);
      setPos((p) => p + 1);
    },
    [deck, pos],
  );

  const undo = () => {
    const last = history[history.length - 1];
    if (!last) return;
    setHistory((h) => h.slice(0, -1));
    if (last.liked) setShortlist((s) => s.filter((x) => x.creator.id !== last.r.creator.id));
    setDir(last.liked ? 1 : -1);
    setPos((p) => p - 1);
  };

  useEffect(() => {
    if (phase !== "deck") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") decide(1);
      if (e.key === "ArrowLeft") decide(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, decide]);

  const liveCount = deck.filter((r) => r.creator.origin !== "sample").length;
  const current = deck[pos];
  const next = deck[pos + 1];

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-8">
      <AppHeader step="discover" />

      {/* Brief summary */}
      {brief && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-4">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[14px]">
            <span className="font-semibold">{brief.campaignName}</span>
            <span className="text-faint">·</span>
            <span className="text-muted">
              {[
                brief.nicheKeywords.join(", ") || brief.category,
                brief.preferredStyle.slice(0, 3).join(", "),
                brief.budgetUsd ? `$${brief.budgetUsd}` : null,
                brief.deliverableCount ? `${brief.deliverableCount} videos` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
            {usingSample && <span className="label rounded-[4px] border border-line px-1.5 py-0.5 !text-[9px] text-muted">Sample brief</span>}
          </div>
          <Link href="/brief" className="text-[13px] text-muted underline decoration-line-strong underline-offset-4 hover:text-ink">
            Edit brief
          </Link>
        </div>
      )}

      <div className="grid gap-10 pt-10 lg:grid-cols-[1fr_320px]">
        <section className="min-w-0">
          <AnimatePresence mode="wait">
            {(phase === "searching" || phase === "steps") && (
              <motion.div key="progress" exit={{ opacity: 0 }} className="mx-auto max-w-[480px] pt-6">
                <p className="label text-muted">Step 02 · Match</p>
                <h1 className="display mt-4 text-[clamp(2.2rem,4.6vw,3.4rem)]">
                  {phase === "searching" ? "Searching the live web…" : "Here’s what we did."}
                </h1>
                {phase === "searching" ? (
                  <div className="mt-8">
                    <div className="h-1 overflow-hidden rounded-full bg-line">
                      <motion.div
                        className="h-full w-1/3 rounded-full bg-ink"
                        animate={{ x: ["-100%", "300%"] }}
                        transition={{ repeat: Infinity, duration: 1.3, ease: "easeInOut" }}
                      />
                    </div>
                    <p className="mt-4 flex items-center gap-2 text-[14px] text-muted">
                      <Loader2 size={14} className="animate-spin" /> You.com Search, then Contents, then extraction. Usually 5 to 15 seconds.
                    </p>
                  </div>
                ) : (
                  <ol className="mt-8 border-t border-line">
                    {steps.slice(0, shownSteps).map((s) => (
                      <motion.li
                        key={s.label}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-3 border-b border-line py-3"
                      >
                        <span
                          className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                            s.status === "done" ? "bg-ink text-lime" : s.status === "failed" ? "bg-orange text-white" : "border border-line-strong text-faint"
                          }`}
                        >
                          {s.status === "done" ? <Check size={11} strokeWidth={3} /> : s.status === "failed" ? <X size={11} /> : <Minus size={11} />}
                        </span>
                        <div>
                          <p className="text-[15px]">{s.label}</p>
                          {s.detail && <p className="mt-0.5 text-[13px] text-muted">{s.detail}</p>}
                        </div>
                      </motion.li>
                    ))}
                  </ol>
                )}
              </motion.div>
            )}

            {phase === "error" && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-[480px] pt-6">
                <h1 className="display text-[40px]">Search didn’t go through.</h1>
                <p className="mt-3 text-muted">Check your connection or API key, then try again.</p>
                <button onClick={() => brief && run(brief)} className="mt-6 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white">
                  Try again
                </button>
              </motion.div>
            )}

            {phase === "deck" && (
              <motion.div key="deck" initial={{ y: 8 }} animate={{ y: 0 }}>
                <div className="mx-auto max-w-[440px]">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="label text-muted">
                      {liveCount} live {liveCount === 1 ? "creator" : "creators"}
                      {deck.length > liveCount ? ` · ${deck.length - liveCount} samples` : ""}
                    </p>
                    <p className="label text-faint">← pass · shortlist →</p>
                  </div>

                  <div className="relative h-[560px]">
                    {current ? (
                      <>
                        {next && (
                          <div className="absolute inset-0 translate-y-3 scale-[0.96] opacity-60">
                            <CreatorCard r={next} index={pos + 1} total={deck.length} brief={brief ?? undefined} />
                          </div>
                        )}
                        <AnimatePresence custom={dir}>
                          <SwipeTop key={current.creator.id} r={current} index={pos} total={deck.length} brief={brief ?? undefined} onDecide={decide} />
                        </AnimatePresence>
                      </>
                    ) : (
                      <div className="grid h-full place-items-center rounded-[20px] border border-dashed border-line-strong text-center">
                        <div className="max-w-[280px]">
                          <p className="display text-[32px]">That’s everyone.</p>
                          <p className="mt-2 text-muted">
                            You shortlisted {shortlist.length} of {deck.length}. Next up: invite them and agree on terms.
                          </p>
                          <button
                            onClick={() => {
                              setPos(0);
                              setShortlist([]);
                              setHistory([]);
                            }}
                            className="mt-5 inline-flex items-center gap-2 text-sm font-medium underline decoration-line-strong underline-offset-4"
                          >
                            <RotateCcw size={13} /> Start over
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex items-center justify-center gap-4">
                    <button
                      aria-label="Undo"
                      onClick={undo}
                      disabled={!history.length}
                      className="grid h-11 w-11 place-items-center rounded-full border border-line bg-surface text-muted transition hover:text-ink disabled:opacity-30"
                    >
                      <RotateCcw size={16} />
                    </button>
                    <button
                      aria-label="Pass"
                      onClick={() => decide(-1)}
                      disabled={!current}
                      className="grid h-14 w-14 place-items-center rounded-full border border-line-strong bg-surface transition hover:border-ink disabled:opacity-30"
                    >
                      <X size={22} />
                    </button>
                    <button
                      aria-label="Shortlist"
                      onClick={() => decide(1)}
                      disabled={!current}
                      className="grid h-14 w-14 place-items-center rounded-full bg-ink text-lime transition hover:bg-ink-2 disabled:opacity-30"
                    >
                      <Heart size={22} fill="currentColor" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Shortlist */}
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <ShortlistPanel items={shortlist} onRemove={(id) => setShortlist((s) => s.filter((x) => x.creator.id !== id))} />
        </aside>
      </div>
    </main>
  );
}
