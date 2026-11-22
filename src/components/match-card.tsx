"use client";

// Landing hero: the real product card, showing the fictional sample profiles
// scored by the real matching engine against the sample brief. Loops a swipe.

import { AnimatePresence, motion } from "framer-motion";
import { Heart, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CreatorCard } from "@/components/creator-card";
import { SAMPLE_BRIEF } from "@/data/sample-brief";
import { SAMPLE_CREATORS } from "@/data/sample-creators";
import { rankCandidates } from "@/lib/matching";

export function MatchCard() {
  const ranked = useMemo(() => rankCandidates(SAMPLE_BRIEF, SAMPLE_CREATORS), []);
  const [idx, setIdx] = useState(0);
  const [leaving, setLeaving] = useState<0 | 1 | -1>(0);

  useEffect(() => {
    const t = setTimeout(
      () => {
        if (!leaving) {
          // Shortlist strong matches, pass weak ones — like a real user would.
          setLeaving(ranked[idx].match.score >= 60 ? 1 : -1);
        } else {
          setLeaving(0);
          setIdx((i) => (i + 1) % ranked.length);
        }
      },
      leaving ? 650 : 3800,
    );
    return () => clearTimeout(t);
  }, [leaving, idx, ranked]);

  const r = ranked[idx];
  const next = ranked[(idx + 1) % ranked.length];

  return (
    <div className="relative mx-auto w-full max-w-[440px]">
      <div className="relative h-[540px]">
        {/* next card waiting underneath */}
        <div className="absolute inset-0 translate-y-3 scale-[0.95] opacity-70">
          <CreatorCard r={next} index={(idx + 1) % ranked.length} total={ranked.length} brief={SAMPLE_BRIEF} />
        </div>

        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={r.creator.id}
            className="absolute inset-0"
            initial={{ scale: 0.95, y: 12 }}
            animate={
              leaving
                ? { x: leaving * 180, rotate: leaving * 8, opacity: 0 }
                : { scale: 1, y: 0, x: 0, rotate: 0, opacity: 1 }
            }
            transition={{ duration: leaving ? 0.55 : 0.4, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <CreatorCard r={r} index={idx} total={ranked.length} brief={SAMPLE_BRIEF} />
            {leaving !== 0 && (
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`label absolute top-24 rounded-[6px] border-2 border-ink px-2 py-1 !text-[13px] font-semibold text-ink ${
                  leaving === 1 ? "left-5 -rotate-12 bg-lime" : "right-5 rotate-12 bg-surface"
                }`}
              >
                {leaving === 1 ? "Shortlist" : "Pass"}
              </motion.span>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* decorative controls (the real ones live in the app) */}
      <div aria-hidden className="mt-6 flex items-center justify-center gap-4">
        <span
          className={`grid h-12 w-12 place-items-center rounded-full border bg-surface transition-colors ${
            leaving === -1 ? "border-ink" : "border-line-strong"
          }`}
        >
          <X size={20} />
        </span>
        <span
          className={`grid h-12 w-12 place-items-center rounded-full bg-ink text-lime transition-transform ${
            leaving === 1 ? "scale-110" : ""
          }`}
        >
          <Heart size={20} fill="currentColor" />
        </span>
      </div>
    </div>
  );
}
