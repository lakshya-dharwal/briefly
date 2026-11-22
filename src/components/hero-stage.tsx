"use client";

// Hero visual: the live swipe card, with a fan of coloured cards behind it
// and a few floating chips that point at what makes a Briefly match different.

import { motion, useReducedMotion } from "framer-motion";
import { Check, HelpCircle, Quote } from "lucide-react";
import { MatchCard } from "@/components/match-card";

function CardBack({ tone, initials, className }: { tone: string; initials: string; className: string }) {
  return (
    <div aria-hidden className={`absolute top-6 h-[500px] w-full max-w-[400px] overflow-hidden rounded-[24px] shadow-[0_24px_48px_-28px_rgba(17,17,19,0.35)] ${tone} ${className}`}>
      <div className="absolute inset-0 opacity-[0.18] [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:14px_14px]" />
      <span className="display absolute -bottom-8 -right-3 text-[180px] leading-none opacity-[0.16]">{initials}</span>
    </div>
  );
}

function Chip({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      aria-hidden
      initial={{ y: 8 }}
      animate={reduce ? { y: 0 } : { y: [0, -6, 0] }}
      transition={reduce ? undefined : { duration: 4.5, repeat: Infinity, ease: "easeInOut", delay }}
      className={`absolute z-20 hidden items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-medium shadow-[0_12px_24px_-12px_rgba(17,17,19,0.35)] lg:flex ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function HeroStage() {
  return (
    <div className="relative mx-auto w-full max-w-[520px] px-6">
      <div className="lattice absolute -inset-10 -z-10 [mask-image:radial-gradient(closest-side,black,transparent)]" />

      {/* fan of coloured cards */}
      <div className="absolute inset-x-6 top-0 flex justify-center">
        <CardBack tone="bg-blue text-white" initials="PR" className="-translate-x-14 -rotate-[9deg]" />
        <CardBack tone="bg-lime text-ink" initials="JO" className="translate-x-14 rotate-[8deg]" />
      </div>

      <div className="relative z-10">
        <MatchCard />
      </div>

      <Chip className="-left-16 -top-3 bg-lime text-ink" delay={0}>
        <span className="grid h-5 w-5 place-items-center rounded-full bg-ink text-lime">
          <Check size={12} strokeWidth={3} />
        </span>
        Matched on content, not followers
      </Chip>
      <Chip className="-right-20 top-[58%] bg-surface text-ink" delay={1.2}>
        <Quote size={14} className="fill-blue text-blue" />
        Every reason has a source
      </Chip>
      <Chip className="-left-20 bottom-2 border border-dashed border-line-strong bg-surface text-muted" delay={2.1}>
        <HelpCircle size={14} />
        Unknown rate? We say so.
      </Chip>
    </div>
  );
}
