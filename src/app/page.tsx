import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { MatchCard } from "@/components/match-card";

function Logo() {
  return (
    <span className="flex items-center gap-2">
      <span className="grid h-6 w-6 place-items-center rounded-[6px] bg-ink">
        <span className="h-2 w-2 rounded-full bg-lime" />
      </span>
      <span className="display text-[19px] tracking-[-0.03em]">briefly</span>
    </span>
  );
}

function Nav() {
  return (
    <nav className="flex items-center justify-between py-5">
      <Logo />
      <div className="hidden items-center gap-8 text-sm text-muted md:flex">
        <a href="#how" className="hover:text-ink">How it works</a>
        <a href="#principles" className="hover:text-ink">Principles</a>
        <a href="https://github.com/lakshya-dharwal/briefly" className="hover:text-ink">GitHub</a>
      </div>
      <Link
        href="/brief"
        className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-ink-2"
      >
        Start a brief
      </Link>
    </nav>
  );
}

function Hero() {
  return (
    <section className="grid items-center gap-14 pb-24 pt-10 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
      <div>
        <p className="label flex items-center gap-2 text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-lime-deep" />
          Creator marketplace · search by You.com
        </p>
        <h1 className="display mt-6 text-[clamp(3rem,7.2vw,6.4rem)]">
          Hire creators
          <br />
          for the work,
          <br />
          <span className="text-faint">not the followers.</span>
        </h1>
        <p className="mt-8 max-w-[440px] text-[17px] leading-relaxed text-muted">
          Describe your campaign in a sentence. Briefly searches the live web for creators whose
          content fits it, shows you the evidence, and runs the deal from brief to paid.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-6">
          <Link
            href="/brief"
            className="group inline-flex items-center gap-3 rounded-full bg-ink py-3.5 pl-6 pr-4 font-medium text-white transition hover:bg-ink-2"
          >
            Find my creator
            <span className="grid h-7 w-7 place-items-center rounded-full bg-lime text-ink transition group-hover:translate-x-0.5">
              <ArrowRight size={15} />
            </span>
          </Link>
          <a href="#how" className="text-sm font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
            See how matching works
          </a>
        </div>
      </div>

      <div className="relative">
        <div className="lattice absolute -inset-10 -z-10 [mask-image:radial-gradient(closest-side,black,transparent)]" />
        <MatchCard />
      </div>
    </section>
  );
}

function StepFrame({ children }: { children: React.ReactNode }) {
  return <div className="mt-8 rounded-[14px] border border-line bg-surface p-4">{children}</div>;
}

function How() {
  return (
    <section id="how" className="border-t border-line py-24">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <h2 className="display max-w-[14ch] text-[clamp(2.2rem,4.4vw,3.8rem)]">From one sentence to a paid deal.</h2>
        <p className="max-w-sm text-muted">
          Three steps, one place. No DMs, spreadsheets or chasing invoices.
        </p>
      </div>

      <div className="mt-16 grid gap-px overflow-hidden rounded-[18px] border border-line bg-line md:grid-cols-3">
        {/* 01 Brief */}
        <div className="bg-bg p-7">
          <p className="label text-faint">01 · Brief</p>
          <h3 className="display mt-4 text-[26px] tracking-[-0.03em]">Say it messy.</h3>
          <p className="mt-2 text-[15px] text-muted">AI turns it into a brief both sides can sign off on.</p>
          <StepFrame>
            <p className="text-[13px] italic text-muted">“3 funny, authentic Gen Z skincare videos, ~$500”</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["$500", "3 videos", "9:16", "7 days", "Funny"].map((t) => (
                <span key={t} className="rounded-[6px] bg-tile px-2 py-1 text-[12px] font-medium">{t}</span>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                <div className="h-full w-[85%] rounded-full bg-ink" />
              </div>
              <span className="label !text-[10px] text-muted">85% ready</span>
            </div>
          </StepFrame>
        </div>

        {/* 02 Match */}
        <div className="bg-bg p-7">
          <p className="label text-faint">02 · Match</p>
          <h3 className="display mt-4 text-[26px] tracking-[-0.03em]">See why, then swipe.</h3>
          <p className="mt-2 text-[15px] text-muted">Every score comes with quotes and sources from the web.</p>
          <StepFrame>
            {[
              ["@maya.sample", 89],
              ["@priya.sample", 71],
              ["@leo.sample", 48],
            ].map(([h, v]) => (
              <div key={h} className="flex items-center gap-3 py-1.5">
                <span className="w-[104px] truncate text-[13px]">{h}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-ink" style={{ width: `${v}%` }} />
                </div>
                <span className="w-8 text-right text-[12px] tabular-nums text-muted">{v}%</span>
              </div>
            ))}
            <p className="mt-2 flex items-center gap-1 text-[11px] text-blue">
              <ArrowUpRight size={11} /> 8 pages read · You.com Contents
            </p>
          </StepFrame>
        </div>

        {/* 03 Deliver */}
        <div className="bg-bg p-7">
          <p className="label text-faint">03 · Deliver</p>
          <h3 className="display mt-4 text-[26px] tracking-[-0.03em]">Track it to paid.</h3>
          <p className="mt-2 text-[15px] text-muted">Clear deliverables, milestones and approvals.</p>
          <StepFrame>
            {[
              ["Agreement signed", "done"],
              ["Kickoff · $150", "done"],
              ["3 videos in review", "now"],
              ["Final approval · $300", "next"],
            ].map(([t, s]) => (
              <div key={t} className="flex items-center gap-3 py-1.5">
                <span
                  className={`grid h-4 w-4 place-items-center rounded-full ${
                    s === "done" ? "bg-ink text-lime" : s === "now" ? "bg-lime ring-4 ring-lime-soft" : "border border-line-strong"
                  }`}
                >
                  {s === "done" && <Check size={10} strokeWidth={3} />}
                </span>
                <span className={`text-[13px] ${s === "next" ? "text-muted" : ""}`}>{t}</span>
              </div>
            ))}
            <p className="label mt-2 !text-[9px] text-faint">Payments simulated in this demo</p>
          </StepFrame>
        </div>
      </div>
    </section>
  );
}

function Principles() {
  const items = [
    ["Unknown stays unknown", "No rate or availability on file? It lowers confidence. It never counts as a match."],
    ["Every claim has a source", "Evidence is quoted word for word from a page we actually read, with a link back."],
    ["A swipe is not a booking", "Swiping right shortlists. It's only a match once the creator accepts."],
  ];
  return (
    <section id="principles" className="bg-ink px-4 py-28 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="label text-white/40">Principles</p>
        <h2 className="display mt-5 max-w-[16ch] text-[clamp(2.4rem,5vw,4.4rem)]">
          Follower counts don’t make <span className="text-lime">content</span>.
        </h2>
        <div className="mt-16 grid gap-10 border-t border-white/10 pt-10 md:grid-cols-3">
          {items.map(([t, d], i) => (
            <div key={t}>
              <p className="label text-white/35">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-3 text-lg font-semibold">{t}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-white/55">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Closing() {
  return (
    <section className="py-24 text-center">
      <h2 className="display mx-auto max-w-[18ch] text-[clamp(2.2rem,4.6vw,4rem)]">
        Your next great creator is one swipe away.
      </h2>
      <Link
        href="/brief"
        className="group mt-10 inline-flex items-center gap-3 rounded-full bg-ink py-3.5 pl-6 pr-4 font-medium text-white transition hover:bg-ink-2"
      >
        Start a brief
        <span className="grid h-7 w-7 place-items-center rounded-full bg-lime text-ink transition group-hover:translate-x-0.5">
          <ArrowRight size={15} />
        </span>
      </Link>
    </section>
  );
}

export default function Home() {
  return (
    <main>
      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        <Nav />
        <Hero />
        <How />
      </div>
      <Principles />
      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        <Closing />
        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-line py-8 text-sm text-muted">
          <Logo />
          <p>Built at the GenZtea × localhost:nyc Creator Economy Hack · Search by You.com</p>
        </footer>
      </div>
    </main>
  );
}
