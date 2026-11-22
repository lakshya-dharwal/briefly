"use client";

// Landing hero: two phone mockups.
// Left: swipe deck that loops (shortlist on right swipe).
// Right: campaign tracker in the courier-dashboard style.
// All names are fictional; payments are labeled as simulated.

import { AnimatePresence, motion } from "framer-motion";
import { Check, Clapperboard, FileText, Heart, Menu, Receipt, Sparkles, Wallet, X, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Phone } from "./phone";

const CREATORS = [
  { name: "Maya", initials: "MA", niche: "Skincare", tags: ["Funny", "Demos"], fit: "Strong fit", swatch: "bg-lime" },
  { name: "Priya", initials: "PR", niche: "Beauty", tags: ["Tutorials", "Calm"], fit: "Promising", swatch: "bg-blue" },
  { name: "Leo", initials: "LE", niche: "Fitness", tags: ["Storytime", "POV"], fit: "Promising", swatch: "bg-orange" },
];

function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`rounded-md bg-lime px-2 py-0.5 font-[family-name:var(--font-display)] text-sm font-extrabold text-ink ${className}`}>
      briefly
    </span>
  );
}

function AppBar({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 pt-5">
      <span className={`grid h-9 w-9 place-items-center rounded-full ${dark ? "border border-white/20" : "bg-tile"}`}>
        <Menu size={16} />
      </span>
      <Logo />
      <span className="grid h-9 w-9 place-items-center rounded-full bg-blue text-[11px] font-bold text-white">GU</span>
    </div>
  );
}

function CreatorCard({ c, stamp }: { c: (typeof CREATORS)[number]; stamp?: boolean }) {
  return (
    <div className="relative h-full overflow-hidden rounded-[28px] border border-line bg-surface shadow-sm">
      <div className={`relative h-[58%] ${c.swatch}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.55),transparent_55%)]" />
        <span className="absolute bottom-3 left-3 grid h-12 w-12 place-items-center rounded-full bg-ink font-[family-name:var(--font-display)] text-sm font-bold text-white ring-4 ring-white">
          {c.initials}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-ink px-2.5 py-1 text-[10px] font-semibold text-lime">
          {c.fit}
        </span>
      </div>
      <div className="p-3.5">
        <p className="font-[family-name:var(--font-display)] text-lg font-extrabold leading-tight">{c.name}</p>
        <p className="text-[11px] text-muted">{c.niche} · sample profile</p>
        <div className="mt-2 flex gap-1.5">
          {c.tags.map((t) => (
            <span key={t} className="rounded-full bg-tile px-2 py-0.5 text-[10px] font-medium">
              {t}
            </span>
          ))}
        </div>
      </div>
      {stamp && (
        <motion.span
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute left-3 top-3 -rotate-12 rounded-lg border-[3px] border-ink bg-lime px-2 py-0.5 font-[family-name:var(--font-display)] text-sm font-black"
        >
          SHORTLIST
        </motion.span>
      )}
    </div>
  );
}

function SwipePhone() {
  const [i, setI] = useState(0);
  const [swiping, setSwiping] = useState(false);

  useEffect(() => {
    const t = setTimeout(
      () => {
        if (!swiping) setSwiping(true);
        else {
          setSwiping(false);
          setI((n) => (n + 1) % CREATORS.length);
        }
      },
      swiping ? 900 : 1700,
    );
    return () => clearTimeout(t);
  }, [swiping]);

  const top = CREATORS[i];
  const next = CREATORS[(i + 1) % CREATORS.length];

  return (
    <Phone>
      <AppBar />
      <div className="px-4 pt-4">
        <p className="text-[11px] text-muted">GlowUp Skincare Launch</p>
        <p className="font-[family-name:var(--font-display)] text-xl font-extrabold leading-tight">Your matches</p>
      </div>
      <div className="relative mx-4 mt-3 h-[300px]">
        <div className="absolute inset-0 translate-y-3 scale-[0.94] opacity-90">
          <CreatorCard c={next} />
        </div>
        <AnimatePresence initial={false}>
          <motion.div
            key={top.name}
            className="absolute inset-0"
            initial={{ scale: 0.94, y: 12 }}
            animate={swiping ? { x: 300, rotate: 16, opacity: 0 } : { scale: 1, y: 0, x: 0, rotate: 0, opacity: 1 }}
            transition={{ duration: swiping ? 0.8 : 0.35, ease: swiping ? "easeIn" : "easeOut" }}
          >
            <CreatorCard c={top} stamp={swiping} />
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="mt-5 flex items-center justify-center gap-4">
        <span className="grid h-12 w-12 place-items-center rounded-full border border-line bg-surface shadow-sm">
          <X size={20} />
        </span>
        <motion.span
          animate={swiping ? { scale: [1, 1.18, 1] } : { scale: 1 }}
          className="grid h-14 w-14 place-items-center rounded-full bg-ink text-lime shadow-lg"
        >
          <Heart size={22} fill="currentColor" />
        </motion.span>
        <span className="grid h-12 w-12 place-items-center rounded-full border border-line bg-surface shadow-sm">
          <Sparkles size={18} className="text-blue" />
        </span>
      </div>
    </Phone>
  );
}

const STEPS = ["Brief", "Match", "Shoot", "Paid"];

function TrackerPhone() {
  const [step, setStep] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s >= 3 ? 1 : s + 1)), 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <Phone dark>
      <AppBar dark />
      <div className="mt-4 rounded-t-[28px] bg-lime px-4 pb-5 pt-4 text-ink">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] text-ink/60">Current campaign · In production</p>
            <p className="font-[family-name:var(--font-display)] text-2xl font-extrabold leading-tight">GlowUp × Maya</p>
          </div>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-surface">
            <ArrowUpRight size={16} />
          </span>
        </div>
        <div className="mt-3 flex justify-between text-[10px] text-ink/60">
          <span>Kickoff 18 Nov</span>
          <span>Due 25 Nov</span>
        </div>
        <div className="mt-2 flex items-center">
          {STEPS.map((s, idx) => (
            <div key={s} className="flex flex-1 items-center last:flex-none">
              <motion.span
                animate={{ scale: idx === step ? [1, 1.15, 1] : 1 }}
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                  idx < step ? "bg-ink text-lime" : idx === step ? "bg-blue text-white" : "border-2 border-ink/30"
                }`}
              >
                {idx < step ? <Check size={13} strokeWidth={3} /> : idx === step ? <Clapperboard size={12} /> : null}
              </motion.span>
              {idx < STEPS.length - 1 && (
                <span className="mx-1 h-0 flex-1 border-t-2 border-dotted border-ink/40" />
              )}
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-[9px] font-semibold uppercase tracking-wide text-ink/70">
          {STEPS.map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
      </div>

      <div className="h-full rounded-t-[28px] bg-surface px-4 pt-4 text-ink">
        <div className="grid grid-cols-3 gap-2">
          {[
            [FileText, "Agreement"],
            [Receipt, "Deliverables"],
            [Wallet, "Payouts"],
          ].map(([Icon, label]) => {
            const I = Icon as typeof FileText;
            return (
              <div key={label as string} className="flex flex-col items-center gap-1.5 rounded-2xl bg-tile py-3">
                <I size={20} />
                <span className="text-[10px] text-muted">{label as string}</span>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-sm font-semibold">Milestones</p>
        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-between rounded-2xl border border-line px-3 py-2.5">
            <div>
              <p className="text-xs font-semibold">Kickoff</p>
              <p className="text-[10px] text-muted">$150 · simulated</p>
            </div>
            <span className="rounded-full bg-lime-soft px-2 py-0.5 text-[10px] font-semibold">Released</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-line px-3 py-2.5">
            <div>
              <p className="text-xs font-semibold">Final approval</p>
              <p className="text-[10px] text-muted">$300 · simulated</p>
            </div>
            <span className="rounded-full bg-orange/10 px-2 py-0.5 text-[10px] font-semibold text-orange">Pending</span>
          </div>
        </div>
      </div>
    </Phone>
  );
}

export function HeroDeck() {
  return (
    <div className="relative mx-auto flex h-[620px] w-full max-w-[540px] justify-center lg:justify-start">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
        <SwipePhone />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 40 }}
        transition={{ delay: 0.15 }}
        className="absolute right-0 top-0 hidden lg:block"
      >
        <TrackerPhone />
      </motion.div>
    </div>
  );
}
