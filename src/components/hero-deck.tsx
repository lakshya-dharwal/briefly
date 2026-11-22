"use client";

// Landing animation: stacked cards -> top card swipes right -> "Shortlisted"
// -> card becomes a campaign tracker. Loops. Names are fictional.

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const CARDS = [
  { name: "Maya", niche: "Skincare · funny", hue: "from-coral to-[#ff9a5e]" },
  { name: "Priya", niche: "Beauty · tutorials", hue: "from-violet to-[#a68cff]" },
  { name: "Leo", niche: "Fitness · storytime", hue: "from-[#1fb88a] to-[#7be0b9]" },
];

type Phase = "stack" | "swipe" | "track";

export function HeroDeck() {
  const [phase, setPhase] = useState<Phase>("stack");

  useEffect(() => {
    const next: Record<Phase, [Phase, number]> = {
      stack: ["swipe", 1600],
      swipe: ["track", 1300],
      track: ["stack", 2600],
    };
    const [to, ms] = next[phase];
    const t = setTimeout(() => setPhase(to), ms);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <div className="relative mx-auto h-[420px] w-full max-w-[320px]">
      {CARDS.slice(1)
        .reverse()
        .map((c, i) => (
          <motion.div
            key={c.name}
            className="absolute inset-0 rounded-3xl border border-line bg-card shadow-sm"
            animate={{ scale: 0.92 + i * 0.04, y: 24 - i * 12, rotate: i === 0 ? -4 : 3 }}
          />
        ))}

      <AnimatePresence mode="wait">
        {phase !== "track" ? (
          <motion.div
            key="top"
            className="absolute inset-0 overflow-hidden rounded-3xl bg-card shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={
              phase === "swipe"
                ? { x: 380, rotate: 18, opacity: 0, transition: { duration: 0.9, ease: "easeIn" } }
                : { opacity: 1, y: 0, x: 0, rotate: 0 }
            }
            exit={{ opacity: 0 }}
          >
            <div className={`h-3/5 bg-gradient-to-br ${CARDS[0].hue}`} />
            <div className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold">
                  {CARDS[0].name}
                </h3>
                <span className="rounded-full bg-violet/10 px-2 py-1 text-xs font-semibold text-violet">
                  Strong fit
                </span>
              </div>
              <p className="text-sm text-muted">{CARDS[0].niche}</p>
              <p className="mt-3 text-xs text-muted">Portfolio shows conversational product demos.</p>
            </div>
            {phase === "swipe" && (
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute left-5 top-5 rotate-[-12deg] rounded-lg border-4 border-coral px-3 py-1 font-[family-name:var(--font-display)] text-xl font-extrabold text-coral"
              >
                SHORTLIST
              </motion.span>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="track"
            className="absolute inset-0 rounded-3xl bg-ink p-6 text-cream shadow-xl"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="text-xs uppercase tracking-widest text-cream/60">Campaign</p>
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold">
              GlowUp × Maya
            </h3>
            <ol className="mt-6 space-y-3 text-sm">
              {["Brief approved", "Creator accepted", "Agreement signed", "Videos in review", "Paid"].map(
                (s, i) => (
                  <motion.li
                    key={s}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0, transition: { delay: 0.25 * i } }}
                    className="flex items-center gap-3"
                  >
                    <span
                      className={`h-3 w-3 rounded-full ${i < 4 ? "bg-coral" : "border border-cream/40"}`}
                    />
                    {s}
                  </motion.li>
                ),
              )}
            </ol>
            <p className="absolute bottom-5 left-6 text-xs text-cream/50">Demo · payment simulated</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
