"use client";

import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { AlertTriangle, ArrowRight, Check, Heart, Info, Loader2, Minus, PencilLine, RotateCcw, SearchX, WifiOff, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { CreatorCard, type Ranked } from "@/components/creator-card";
import { CreatorDetail, type DetailMode } from "@/components/creator-detail";
import { ShortlistPanel } from "@/components/shortlist-panel";
import { SAMPLE_BRIEF } from "@/data/sample-brief";
import { loadBrief } from "@/lib/brief-store";
import type { CampaignBrief } from "@/lib/types";

type Step = { label: string; status: "done" | "skipped" | "failed"; detail?: string };
type Phase = "searching" | "steps" | "deck" | "error";
type LiveStatus = { kind: "ok"; creators: number } | { kind: "off" } | { kind: "failed"; reason: string } | { kind: "empty" };
type Failure = { title: string; message: string; kind: "network" | "timeout" | "input" | "server" };

const DECK_SIZE = 20;
const SWIPE_PX = 110;
const TIMEOUT_MS = 45_000;

function SwipeTop({
  r,
  index,
  total,
  brief,
  onDecide,
  onOpen,
}: {
  r: Ranked;
  index: number;
  total: number;
  brief?: CampaignBrief;
  onDecide: (dir: 1 | -1) => void;
  onOpen: () => void;
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
      // A tap (press + release without dragging) opens the details panel.
      onTap={(e) => {
        if ((e.target as HTMLElement).closest("a")) return;
        onOpen();
      }}
      whileHover={{ y: -3 }}
      initial={{ scale: 0.96, y: 10 }}
      animate={{ scale: 1, y: 0 }}
      variants={{
        exit: (dir: number) => ({ x: dir * 520, rotate: dir * 14, opacity: 0, transition: { duration: 0.35 } }),
      }}
      exit="exit"
    >
      <CreatorCard r={r} index={index} total={total} brief={brief} hint />
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

/** One-line banner explaining where the deck came from when live search isn't fully OK. */
function LiveNotice({ status, niche, onRetry }: { status: LiveStatus; niche: string; onRetry: () => void }) {
  if (status.kind === "ok") return null;
  const cfg = {
    off: {
      icon: <Info size={16} />,
      cls: "border-blue/30 bg-blue/5 text-ink",
      text: "Live search is off (no You.com key on the server). You’re seeing the 3 sample profiles only.",
      action: null as React.ReactNode,
    },
    failed: {
      icon: <WifiOff size={16} />,
      cls: "border-orange/40 bg-orange/5 text-ink",
      text: `${status.kind === "failed" ? status.reason : ""} Showing sample profiles for now.`,
      action: (
        <button onClick={onRetry} className="shrink-0 rounded-full bg-ink px-3 py-1.5 text-[13px] font-medium text-white hover:bg-ink-2">
          Try again
        </button>
      ),
    },
    empty: {
      icon: <SearchX size={16} />,
      cls: "border-dashed border-line-strong bg-surface text-ink",
      text: `We searched the web but found no creators named for “${niche}”. Try a broader niche.`,
      action: (
        <Link href="/brief" className="shrink-0 rounded-full border border-line-strong px-3 py-1.5 text-[13px] font-medium hover:border-ink">
          Edit brief
        </Link>
      ),
    },
  }[status.kind];

  return (
    <div role="status" className={`mb-4 flex items-start gap-3 rounded-[14px] border px-4 py-3 text-[14px] leading-snug ${cfg.cls}`}>
      <span className="mt-0.5 shrink-0">{cfg.icon}</span>
      <p className="flex-1">{cfg.text}</p>
      {cfg.action}
    </div>
  );
}

function ErrorCard({ failure, onRetry }: { failure: Failure; onRetry: () => void }) {
  return (
    <motion.div key="error" initial={{ y: 8 }} animate={{ y: 0 }} className="mx-auto max-w-[440px]">
      <div role="alert" className="overflow-hidden rounded-[24px] border border-line-strong bg-surface shadow-[0_28px_56px_-28px_rgba(17,17,19,0.35)]">
        <div className="relative overflow-hidden bg-orange px-6 pb-6 pt-5 text-white">
          <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:14px_14px] [mask-image:linear-gradient(to_left,black,transparent_70%)]" />
          <span className="relative grid h-12 w-12 place-items-center rounded-full bg-white text-orange">
            {failure.kind === "network" ? <WifiOff size={22} /> : <AlertTriangle size={22} />}
          </span>
          <h1 className="display relative mt-4 text-[30px] leading-[0.95]">{failure.title}</h1>
        </div>
        <div className="px-6 py-5">
          <p className="text-[15px] leading-relaxed text-ink-2">{failure.message}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {failure.kind !== "input" && (
              <button onClick={onRetry} className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[14px] font-medium text-white hover:bg-ink-2">
                <RotateCcw size={15} /> Try again
              </button>
            )}
            <Link href="/brief" className="inline-flex h-11 items-center gap-2 rounded-full border border-line-strong px-5 text-[14px] font-medium hover:border-ink">
              <PencilLine size={15} /> Edit brief
            </Link>
          </div>
        </div>
      </div>
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
  const [liveStatus, setLiveStatus] = useState<LiveStatus>({ kind: "ok", creators: 0 });
  const [failure, setFailure] = useState<Failure | null>(null);
  const [slow, setSlow] = useState(false);
  const [pos, setPos] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [shortlist, setShortlist] = useState<Ranked[]>([]);
  const [history, setHistory] = useState<{ r: Ranked; liked: boolean }[]>([]);
  const [detail, setDetail] = useState<{ r: Ranked; mode: DetailMode } | null>(null);

  const run = useCallback(async (b: CampaignBrief) => {
    setPhase("searching");
    setShownSteps(0);
    setFailure(null);
    setSlow(false);
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const slowTimer = setTimeout(() => setSlow(true), 15_000);
    try {
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: b, includeSamples: true }),
        signal: ctrl.signal,
      });
      const data = await res.json().catch(() => null);
      if (res.status === 400) {
        setFailure({ kind: "input", title: "This brief needs a bit more.", message: data?.error ?? "Go back and rebuild your brief." });
        setPhase("error");
        return;
      }
      if (!res.ok || !data) {
        setFailure({ kind: "server", title: "Something broke on our side.", message: "The search service returned an error. Try again in a moment." });
        setPhase("error");
        return;
      }
      const { steps: st, results, liveStatus: ls } = data as { steps: Step[]; results: Ranked[]; liveStatus?: LiveStatus };
      // Live web creators first; labeled samples only after them.
      const live = results.filter((r) => r.creator.origin !== "sample").slice(0, DECK_SIZE);
      const samples = results.filter((r) => r.creator.origin === "sample");
      setSteps(st);
      setDeck([...live, ...samples]);
      setLiveStatus(ls ?? { kind: "ok", creators: live.length });
      setPos(0);
      setShortlist([]);
      setHistory([]);
      setPhase("steps");
    } catch (e) {
      const aborted = e instanceof DOMException && e.name === "AbortError";
      setFailure(
        aborted
          ? { kind: "timeout", title: "That took too long.", message: "Live search didn’t finish in 45 seconds. Web search can be slow. Try again, or use a broader niche." }
          : { kind: "network", title: "You seem to be offline.", message: "We couldn’t reach Briefly. Check your connection and try again." },
      );
      setPhase("error");
    } finally {
      clearTimeout(timeout);
      clearTimeout(slowTimer);
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
      if (d === 1) setShortlist((s) => (s.some((x) => x.creator.id === r.creator.id) ? s : [...s, r]));
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

  const removeFromShortlist = (id: string) => setShortlist((s) => s.filter((x) => x.creator.id !== id));
  const closeDetail = useCallback(() => setDetail(null), []);

  useEffect(() => {
    if (phase !== "deck" || detail) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") decide(1);
      if (e.key === "ArrowLeft") decide(-1);
      if (e.key === "Enter" && deck[pos]) setDetail({ r: deck[pos], mode: "deck" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, decide, detail, deck, pos]);

  const liveCount = deck.filter((r) => r.creator.origin !== "sample").length;
  const current = deck[pos];
  const next = deck[pos + 1];
  const niche = brief?.nicheKeywords[0] ?? brief?.category ?? "your niche";

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-8">
      <AppHeader step="discover" />

      {/* Brief summary */}
      {brief && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-4">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[14px]">
            <span className="font-semibold">{brief.campaignName}</span>
            <span className="text-muted before:mr-3 before:text-faint before:content-['·'] empty:hidden">
              {[
                brief.nicheKeywords.join(", ") || brief.category,
                brief.preferredStyle.slice(0, 3).join(", "),
                brief.budgetUsd ? `$${brief.budgetUsd}` : null,
                brief.deliverableCount ? `${brief.deliverableCount} videos` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </div>
          <Link href="/brief" className="text-[13px] text-muted underline decoration-line-strong underline-offset-4 hover:text-ink">
            Edit brief
          </Link>
        </div>
      )}

      {usingSample && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-lime-soft px-4 py-3 text-[14px]">
          <p>
            <span className="font-semibold">You’re looking at a demo brief.</span>{" "}
            <span className="text-ink-2">Write your own to search for your campaign.</span>
          </p>
          <Link href="/brief" className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-[13px] font-medium text-white">
            Write a brief <ArrowRight size={13} />
          </Link>
        </div>
      )}

      <div className="grid gap-10 pt-10 lg:grid-cols-[1fr_340px]">
        <section className="min-w-0">
          <AnimatePresence mode="wait">
            {(phase === "searching" || phase === "steps") && (
              <motion.div key="progress" exit={{ opacity: 0 }} className="mx-auto max-w-[480px] pt-6">
                <p className="label text-muted">Step 02 · Match</p>
                <h1 className="display mt-4 text-[clamp(2.2rem,4.6vw,3.4rem)]">
                  {phase === "searching" ? "Searching the live web…" : "Here’s what we did."}
                </h1>
                {phase === "searching" ? (
                  <div className="mt-8" aria-live="polite">
                    <div className="h-1 overflow-hidden rounded-full bg-line">
                      <motion.div
                        className="h-full w-1/3 rounded-full bg-ink"
                        animate={{ x: ["-100%", "300%"] }}
                        transition={{ repeat: Infinity, duration: 1.3, ease: "easeInOut" }}
                      />
                    </div>
                    <p className="mt-4 flex items-center gap-2 text-[14px] text-muted">
                      <Loader2 size={14} className="animate-spin" />
                      {slow
                        ? "Still working. Some pages are slow to load. We’ll stop at 45 seconds."
                        : "You.com Search, then Contents, then extraction. Usually 5 to 15 seconds."}
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

            {phase === "error" && failure && <ErrorCard failure={failure} onRetry={() => brief && run(brief)} />}

            {phase === "deck" && (
              <motion.div key="deck" initial={{ y: 8 }} animate={{ y: 0 }}>
                <div className="mx-auto max-w-[440px]">
                  {brief && <LiveNotice status={liveStatus} niche={niche} onRetry={() => run(brief)} />}

                  <div className="mb-4 flex items-center justify-between">
                    <p className="label text-muted">
                      {liveCount} live {liveCount === 1 ? "creator" : "creators"}
                      {deck.length > liveCount ? ` · ${deck.length - liveCount} samples` : ""}
                    </p>
                    <p className="label hidden text-faint sm:block">← → swipe · ↵ details</p>
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
                          <SwipeTop
                            key={current.creator.id}
                            r={current}
                            index={pos}
                            total={deck.length}
                            brief={brief ?? undefined}
                            onDecide={decide}
                            onOpen={() => setDetail({ r: current, mode: "deck" })}
                          />
                        </AnimatePresence>
                      </>
                    ) : (
                      <DeckEnd
                        total={deck.length}
                        shortlisted={shortlist.length}
                        onRestart={() => {
                          setPos(0);
                          setShortlist([]);
                          setHistory([]);
                        }}
                      />
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
                    <button
                      aria-label="Details"
                      onClick={() => current && setDetail({ r: current, mode: "deck" })}
                      disabled={!current}
                      className="grid h-11 w-11 place-items-center rounded-full border border-line bg-surface text-muted transition hover:text-ink disabled:opacity-30"
                    >
                      <Info size={17} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Shortlist */}
        <aside id="shortlist" className="lg:sticky lg:top-8 lg:self-start">
          <ShortlistPanel
            items={shortlist}
            brief={brief ?? undefined}
            onRemove={removeFromShortlist}
            onOpen={(r) => setDetail({ r, mode: "shortlist" })}
          />
        </aside>
      </div>

      <CreatorDetail
        r={detail?.r ?? null}
        brief={brief ?? undefined}
        mode={detail?.mode ?? "deck"}
        onClose={closeDetail}
        onShortlist={() => {
          setDetail(null);
          decide(1);
        }}
        onPass={() => {
          setDetail(null);
          decide(-1);
        }}
        onRemove={() => {
          if (detail) removeFromShortlist(detail.r.creator.id);
          setDetail(null);
        }}
      />
    </main>
  );
}

function DeckEnd({ total, shortlisted, onRestart }: { total: number; shortlisted: number; onRestart: () => void }) {
  const none = total === 0;
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[24px] border border-line-strong bg-surface">
      <div className={`relative overflow-hidden px-6 pb-6 pt-5 ${none ? "bg-tile" : "bg-lime"} text-ink`}>
        <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:14px_14px] [mask-image:linear-gradient(to_left,black,transparent_70%)]" />
        <span className="relative grid h-12 w-12 place-items-center rounded-full bg-ink text-lime">
          {none ? <SearchX size={22} /> : <Check size={22} strokeWidth={3} />}
        </span>
        <h2 className="display relative mt-4 text-[34px] leading-[0.95]">{none ? "No creators to show." : "That’s everyone."}</h2>
        <p className="relative mt-2 text-[15px] text-ink/70">
          {none
            ? "Nothing matched this brief. Try a broader niche or fewer style words."
            : shortlisted
              ? `You shortlisted ${shortlisted} of ${total}. Review them on the right.`
              : `You passed on all ${total}. Go again, or loosen the brief.`}
        </p>
      </div>
      <div className="flex flex-1 flex-col justify-end gap-2 p-6">
        {!none && (
          <button onClick={onRestart} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink text-[14px] font-medium text-white hover:bg-ink-2">
            <RotateCcw size={15} /> Go through the deck again
          </button>
        )}
        <Link href="/brief" className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line-strong text-[14px] font-medium hover:border-ink">
          <PencilLine size={15} /> Edit brief
        </Link>
      </div>
    </div>
  );
}
