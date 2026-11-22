"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Loader2, Plus, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { SAMPLE_BRIEF_PROMPT } from "@/data/sample-brief";
import { saveBrief } from "@/lib/brief-store";
import { readiness } from "@/lib/readiness";
import type { CampaignBrief, DeliverableFormat } from "@/lib/types";

const EXAMPLES = [
  SAMPLE_BRIEF_PROMPT,
  "5 TikTok unboxing videos for our sneaker drop. Energetic, Gen Z, $2k budget, due in 2 weeks.",
  "Calm, educational Instagram reels about our sleep tea. 3 posts, $800, within 10 days.",
];

const FORMAT_LABEL: Record<DeliverableFormat, string> = {
  "product-demo": "Product demo",
  testimonial: "Testimonial",
  skit: "Skit",
  unboxing: "Unboxing",
  "talking-head": "Talking head",
  tutorial: "Tutorial",
  other: "Other",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 border-t border-line py-4 sm:grid-cols-[150px_1fr] sm:items-start sm:gap-6">
      <p className="label pt-2 text-muted">{label}</p>
      <div>{children}</div>
    </div>
  );
}

const inputCls =
  "w-full rounded-[10px] border border-line bg-surface px-3 py-2 text-[15px] outline-none transition focus:border-ink";

function NumberInput({
  value,
  onChange,
  prefix,
  suffix,
  placeholder,
  label,
}: {
  value?: number;
  onChange: (v?: number) => void;
  prefix?: string;
  suffix?: string;
  placeholder: string;
  label: string;
}) {
  return (
    <label className="block">
    <span className="label mb-1.5 block !text-[9px] text-faint">{label}</span>
    <div className={`flex h-11 items-center rounded-[10px] border bg-surface px-3 focus-within:border-ink ${value === undefined ? "border-dashed border-line-strong" : "border-line"}`}>
      {prefix && <span className="text-muted">{prefix}</span>}
      <input
        inputMode="numeric"
        className="w-full bg-transparent px-1 py-2 text-[15px] tabular-nums outline-none"
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => {
          const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
          onChange(Number.isNaN(n) ? undefined : n);
        }}
      />
      {suffix && <span className="whitespace-nowrap text-sm text-muted">{suffix}</span>}
    </div>
    </label>
  );
}

const CHIP_TONE = {
  lime: "bg-lime text-ink",
  blue: "bg-blue text-white",
  tile: "bg-tile text-ink border border-line-strong",
} as const;

function Chips({
  values,
  onChange,
  placeholder,
  tone = "tile",
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  tone?: keyof typeof CHIP_TONE;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim().toLowerCase();
    if (v && !values.includes(v)) onChange([...values, v]);
    setDraft("");
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {values.map((v) => (
        <span key={v} className={`flex h-8 items-center gap-1 rounded-full pl-3 pr-1.5 text-[13px] font-medium ${CHIP_TONE[tone]}`}>
          {v}
          <button
            aria-label={`Remove ${v}`}
            onClick={() => onChange(values.filter((x) => x !== v))}
            className="grid h-5 w-5 place-items-center rounded-full opacity-60 hover:bg-black/10 hover:opacity-100"
          >
            <X size={11} />
          </button>
        </span>
      ))}
      <span className="flex h-8 items-center rounded-full border border-dashed border-line-strong pl-3 pr-1 focus-within:border-ink">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={placeholder}
          className="w-24 bg-transparent py-1 text-[13px] outline-none"
        />
        <button aria-label="Add" onClick={add} className="grid h-5 w-5 place-items-center text-muted hover:text-ink">
          <Plus size={12} />
        </button>
      </span>
    </div>
  );
}

function Toggle({
  options,
  selected,
  onChange,
  labels,
}: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  labels?: Record<string, string>;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <button
            key={o}
            onClick={() => onChange(on ? selected.filter((x) => x !== o) : [...selected, o])}
            aria-pressed={on}
            className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] transition ${
              on ? "border-ink bg-ink font-medium text-white" : "border-line bg-surface text-muted hover:border-ink hover:text-ink"
            }`}
          >
            {on && <Check size={13} strokeWidth={3} className="text-lime" />}
            {labels?.[o] ?? o}
          </button>
        );
      })}
    </div>
  );
}

export default function BriefPage() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [brandName, setBrandName] = useState("");
  const [brief, setBrief] = useState<CampaignBrief | null>(null);
  const [mode, setMode] = useState<"ai" | "rules" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = useMemo(() => (brief ? readiness(brief) : null), [brief]);
  const set = <K extends keyof CampaignBrief>(k: K, v: CampaignBrief[K]) =>
    setBrief((b) => (b ? { ...b, [k]: v } : b));

  async function build() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, brandName: brandName || undefined }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.brief) {
        setError(
          res.status === 400
            ? data?.error ?? "Add a little more detail about the campaign."
            : "The brief builder hit a problem on our side. Try again in a moment.",
        );
        return;
      }
      setBrief(data.brief);
      setMode(data.mode);
    } catch {
      setError("We couldn’t reach Briefly. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function findMatches() {
    if (!brief) return;
    saveBrief(brief);
    router.push("/discover");
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-8">
      <AppHeader step="brief" />

      <div className="grid gap-12 pt-12 lg:grid-cols-[1fr_1.15fr]">
        {/* Left: describe */}
        <section className="lg:sticky lg:top-8 lg:self-start">
          <p className="label text-muted">Step 01 · Brief</p>
          <h1 className="display mt-4 text-[clamp(2.4rem,5vw,3.8rem)]">Describe your campaign.</h1>
          <p className="mt-4 max-w-md text-muted">
            Write it the way you’d say it. We turn it into a brief you can edit before we search for creators.
          </p>

          <div className="mt-8 rounded-[16px] border border-line-strong bg-surface p-1.5 focus-within:border-ink">
            <input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Brand name (optional)"
              className="w-full border-b border-line bg-transparent px-3 py-2.5 text-[15px] outline-none"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="We're launching a skincare product and want three funny, authentic Gen Z UGC videos…"
              rows={5}
              className="w-full resize-none bg-transparent px-3 py-3 text-[16px] leading-relaxed outline-none"
            />
            <div className="flex items-center justify-between gap-3 px-2 pb-1">
              <span className="label !text-[10px] text-faint">{description.length}/4000</span>
              <button
                onClick={build}
                disabled={loading || description.trim().length < 10}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-ink-2 disabled:opacity-30"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                {brief ? "Rebuild brief" : "Build brief"}
              </button>
            </div>
          </div>
          {error ? (
            <div role="alert" className="mt-3 flex items-start gap-3 rounded-[14px] border border-orange/40 bg-orange/5 px-4 py-3 text-[14px]">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-orange text-[12px] font-bold text-white">!</span>
              <p className="flex-1 text-ink">{error}</p>
              <button onClick={build} disabled={loading} className="shrink-0 text-[13px] font-medium underline underline-offset-4">
                Retry
              </button>
            </div>
          ) : (
            description.trim().length > 0 &&
            description.trim().length < 10 && (
              <p className="mt-3 text-[13px] text-muted">Keep going. Write at least a short sentence about the campaign.</p>
            )
          )}

          <p className="label mt-8 text-faint">Try one</p>
          <div className="mt-3 space-y-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setDescription(ex)}
                className="block w-full rounded-[12px] border border-line px-4 py-3 text-left text-[14px] text-muted transition hover:border-ink hover:text-ink"
              >
                {ex}
              </button>
            ))}
          </div>
        </section>

        {/* Right: structured brief */}
        <section>
          <AnimatePresence mode="wait">
            {!brief ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="lattice grid min-h-[420px] place-items-center rounded-[20px] border border-dashed border-line-strong"
              >
                <div className="max-w-[260px] rounded-[14px] bg-bg/90 p-5 text-center">
                  <p className="label text-muted">Your brief appears here</p>
                  <p className="mt-2 text-sm text-faint">Budget, deliverables, style and must-haves, all editable.</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="brief"
                initial={{ y: 12 }}
                animate={{ y: 0 }}
                className="overflow-hidden rounded-[24px] border border-line-strong bg-surface shadow-[0_1px_0_rgba(0,0,0,0.04),0_28px_56px_-28px_rgba(17,17,19,0.35)]"
              >
                {/* Lime hero */}
                <div className="relative overflow-hidden bg-lime px-6 pb-6 pt-4 text-ink">
                  <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:14px_14px] [mask-image:linear-gradient(to_left,black,transparent_70%)]" />
                  <div className="relative flex items-center justify-between">
                    <span className="label !text-[10px] text-ink/60">Campaign brief</span>
                    <span className="label rounded-full bg-ink/10 px-2 py-1 !text-[9px]">
                      {mode === "ai" ? "Structured by Claude" : "Parsed from your words"}
                    </span>
                  </div>

                  <div className="relative mt-6 flex items-end justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <input
                        aria-label="Campaign name"
                        className="display -ml-1 w-full rounded-[8px] bg-transparent px-1 text-[clamp(1.8rem,3.4vw,2.4rem)] leading-tight outline-none transition hover:bg-ink/5 focus:bg-ink/5"
                        value={brief.campaignName}
                        onChange={(e) => set("campaignName", e.target.value)}
                      />
                      <p className="mt-1 text-[13px] text-ink/65">
                        {ready && ready.remaining.length === 0
                          ? "Everything we need. Ready to search."
                          : ready
                            ? `Next: ${ready.remaining[0].toLowerCase()}.`
                            : ""}
                      </p>
                    </div>
                    {ready && (
                      <div className="shrink-0 rounded-[16px] bg-ink px-3.5 py-2.5 text-center text-white">
                        <p className="display text-[34px] leading-none tabular-nums">
                          {ready.percent}
                          <span className="text-[16px] opacity-50">%</span>
                        </p>
                        <p className="label mt-1 !text-[8px] opacity-60">Ready</p>
                      </div>
                    )}
                  </div>

                  {ready && (
                    <div className="relative mt-5 flex gap-1">
                      {ready.items.map((it) => (
                        <span key={it.label} title={it.label} className={`h-1.5 flex-1 rounded-full ${it.done ? "bg-ink" : "bg-ink/15"}`} />
                      ))}
                    </div>
                  )}
                </div>

                <div className="px-6 pb-2">
                  <Field label="Brand / product">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input className={inputCls} aria-label="Brand name" placeholder="Brand name" value={brief.brandName} onChange={(e) => set("brandName", e.target.value)} />
                      <input className={inputCls} aria-label="Product" placeholder="Product" value={brief.product} onChange={(e) => set("product", e.target.value)} />
                    </div>
                  </Field>
                  <Field label="Creator niche">
                    <Chips tone="lime" values={brief.nicheKeywords} onChange={(v) => set("nicheKeywords", v)} placeholder="add niche" />
                  </Field>
                  <Field label="Style">
                    <Chips tone="blue" values={brief.preferredStyle} onChange={(v) => set("preferredStyle", v)} placeholder="add style" />
                  </Field>
                  <Field label="Formats">
                    <Toggle
                      options={Object.keys(FORMAT_LABEL).filter((f) => f !== "other")}
                      selected={brief.deliverableFormats}
                      labels={FORMAT_LABEL}
                      onChange={(v) => set("deliverableFormats", v as DeliverableFormat[])}
                    />
                  </Field>
                  <Field label="Platforms">
                    <Toggle
                      options={["tiktok", "instagram", "youtube"]}
                      selected={brief.platforms}
                      labels={{ tiktok: "TikTok", instagram: "Instagram", youtube: "YouTube" }}
                      onChange={(v) => set("platforms", v)}
                    />
                  </Field>
                  <Field label="Budget & timing">
                    <div className="grid grid-cols-3 gap-2">
                      <NumberInput label="Budget" value={brief.budgetUsd} onChange={(v) => set("budgetUsd", v)} prefix="$" placeholder="—" />
                      <NumberInput label="Videos" value={brief.deliverableCount} onChange={(v) => set("deliverableCount", v)} placeholder="—" />
                      <NumberInput label="Deadline" value={brief.timelineDays} onChange={(v) => set("timelineDays", v)} suffix="days" placeholder="—" />
                    </div>
                  </Field>
                  <Field label="Must include">
                    <Chips tone="tile" values={brief.requiredContent} onChange={(v) => set("requiredContent", v)} placeholder="add item" />
                  </Field>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-6 py-5">
                  <p className={`text-[13px] ${brief.nicheKeywords.length === 0 && brief.category === "general" ? "text-orange" : "text-muted"}`}>
                    {brief.nicheKeywords.length === 0 && brief.category === "general"
                      ? "Add a creator niche above so we know who to search for."
                      : "We\u2019ll search the live web for creators who fit this brief."}
                  </p>
                  <button
                    onClick={findMatches}
                    disabled={brief.nicheKeywords.length === 0 && brief.category === "general"}
                    className="group inline-flex items-center gap-3 rounded-full bg-ink py-3 pl-5 pr-3 font-medium text-white transition hover:bg-ink-2 disabled:opacity-30"
                  >
                    Find my matches
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-lime text-ink transition group-hover:translate-x-0.5">
                      <ArrowRight size={15} />
                    </span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </main>
  );
}
