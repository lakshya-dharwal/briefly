// iPhone-style frame used for hero mockups.

export function Phone({
  children,
  className = "",
  dark = false,
}: {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`relative aspect-[9/19] w-[270px] rounded-[46px] bg-ink p-[9px] shadow-[0_30px_60px_-20px_rgba(23,22,27,0.45)] ring-1 ring-black/40 ${className}`}
    >
      <div
        className={`relative h-full w-full overflow-hidden rounded-[38px] ${dark ? "bg-ink text-white" : "bg-surface"}`}
      >
        <div className="flex items-center justify-between px-6 pt-3 text-[11px] font-semibold">
          <span>9:41</span>
          <span className="flex gap-1">
            <span className="h-2 w-3 rounded-sm bg-current opacity-80" />
            <span className="h-2 w-4 rounded-sm bg-current" />
          </span>
        </div>
        <div className="absolute left-1/2 top-2 h-[22px] w-[86px] -translate-x-1/2 rounded-full bg-ink" />
        {children}
      </div>
    </div>
  );
}
