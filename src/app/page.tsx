import Link from "next/link";
import { HeroDeck } from "@/components/hero-deck";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 sm:px-8">
      <nav className="flex items-center justify-between py-6">
        <span className="font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight">
          briefly<span className="text-coral">.</span>
        </span>
        <span className="rounded-full border border-line px-3 py-1 text-xs text-muted">
          Hackathon demo · payments simulated
        </span>
      </nav>

      <section className="grid flex-1 items-center gap-12 py-10 md:grid-cols-2">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-7xl">
            Your next great creator is <span className="text-coral">one swipe</span> away.
          </h1>
          <p className="mt-6 max-w-md text-lg text-muted">
            Describe your campaign. Discover creators who match your vision. Hire, collaborate, and
            track everything in one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/brief"
              className="rounded-full bg-ink px-6 py-3 font-semibold text-cream transition hover:bg-violet"
            >
              Find My Creator
            </Link>
            <Link
              href="/discover"
              className="rounded-full border border-ink/15 px-6 py-3 font-semibold transition hover:border-violet hover:text-violet"
            >
              Explore Campaigns
            </Link>
          </div>
        </div>

        <HeroDeck />
      </section>

      <section className="grid gap-4 pb-16 sm:grid-cols-3">
        {[
          ["Brief", "AI turns “funny, authentic, Gen Z” into a real production brief."],
          ["Match", "Live You.com search finds creators by content fit, not follower count."],
          ["Deliver", "Clear deliverables, milestones, and a tracked path to paid."],
        ].map(([t, d]) => (
          <div key={t} className="rounded-2xl border border-line bg-card p-5">
            <h3 className="font-[family-name:var(--font-display)] text-lg font-bold">{t}</h3>
            <p className="mt-1 text-sm text-muted">{d}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
