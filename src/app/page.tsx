import Link from "next/link";
import { ArrowRight, FileText, Search, Wallet } from "lucide-react";
import { HeroDeck } from "@/components/hero-deck";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 sm:px-8">
      <nav className="flex items-center justify-between py-6">
        <span className="rounded-lg bg-lime px-2.5 py-1 font-[family-name:var(--font-display)] text-xl font-extrabold tracking-tight">
          briefly
        </span>
        <span className="flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-xs text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-orange" />
          Hackathon demo · payments simulated
        </span>
      </nav>

      <section className="grid flex-1 items-center gap-10 py-8 md:grid-cols-[1fr_1.05fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-lime">
            <Search size={12} /> Powered by You.com live search
          </span>
          <h1 className="mt-5 font-[family-name:var(--font-display)] text-[3.4rem] font-black leading-[0.92] tracking-[-0.03em] sm:text-7xl">
            Your next great creator is{" "}
            <span className="relative whitespace-nowrap">
              <span className="absolute inset-x-[-4px] bottom-1 top-[45%] -z-10 rounded-md bg-lime" />
              one swipe
            </span>{" "}
            away.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
            Describe your campaign. Discover creators who match your vision. Hire, collaborate, and
            track everything in one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/brief"
              className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 font-semibold text-white transition hover:bg-blue"
            >
              Find My Creator
              <ArrowRight size={18} className="transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/discover"
              className="rounded-full bg-surface px-6 py-3.5 font-semibold transition hover:bg-lime"
            >
              Explore Campaigns
            </Link>
          </div>
        </div>

        <HeroDeck />
      </section>

      <section className="grid gap-4 pb-16 pt-6 sm:grid-cols-3">
        <div className="rounded-[28px] bg-lime p-6">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-ink text-lime">
            <FileText size={20} />
          </span>
          <h3 className="mt-6 font-[family-name:var(--font-display)] text-2xl font-extrabold">Brief</h3>
          <p className="mt-1 text-sm text-ink/70">
            AI turns “funny, authentic, Gen Z” into a real production brief.
          </p>
        </div>
        <div className="rounded-[28px] bg-ink p-6 text-white">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue">
            <Search size={20} />
          </span>
          <h3 className="mt-6 font-[family-name:var(--font-display)] text-2xl font-extrabold">
            Match
          </h3>
          <p className="mt-1 text-sm text-white/65">
            Live You.com search finds creators by content fit, not follower count.
          </p>
        </div>
        <div className="rounded-[28px] bg-surface p-6">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-tile">
            <Wallet size={20} />
          </span>
          <h3 className="mt-6 flex items-center gap-2 font-[family-name:var(--font-display)] text-2xl font-extrabold">
            Deliver <span className="h-2 w-2 rounded-full bg-orange" />
          </h3>
          <p className="mt-1 text-sm text-muted">
            Clear deliverables, milestones, and a tracked path to paid.
          </p>
        </div>
      </section>
    </main>
  );
}
