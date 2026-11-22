import Link from "next/link";

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <span className="grid h-6 w-6 place-items-center rounded-[6px] bg-ink">
        <span className="h-2 w-2 rounded-full bg-lime" />
      </span>
      <span className="display text-[19px] tracking-[-0.03em]">briefly</span>
    </span>
  );
}

const STEPS = [
  { key: "brief", label: "Brief", href: "/brief" },
  { key: "discover", label: "Match", href: "/discover" },
  { key: "deliver", label: "Deliver", href: null },
] as const;

/** App header with the three-step progress (Brief → Match → Deliver). */
export function AppHeader({ step }: { step: "brief" | "discover" | "deliver" }) {
  const active = STEPS.findIndex((s) => s.key === step);
  return (
    <header className="flex items-center justify-between border-b border-line py-4">
      <Link href="/">
        <Logo />
      </Link>
      <ol className="flex items-center gap-1 sm:gap-2">
        {STEPS.map((s, i) => {
          const cls = `label flex items-center gap-2 rounded-full px-2.5 py-1 !text-[10px] ${
            i === active ? "bg-ink text-white" : i < active ? "text-ink" : "text-faint"
          }`;
          const inner = (
            <>
              <span className={`h-1.5 w-1.5 rounded-full ${i <= active ? "bg-lime" : "bg-line-strong"}`} />
              <span className="hidden sm:inline">{String(i + 1).padStart(2, "0")} · </span>
              {s.label}
            </>
          );
          return (
            <li key={s.key}>
              {s.href && i < active ? (
                <Link href={s.href} className={cls}>
                  {inner}
                </Link>
              ) : (
                <span className={cls}>{inner}</span>
              )}
            </li>
          );
        })}
      </ol>
    </header>
  );
}
