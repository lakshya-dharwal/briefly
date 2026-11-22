import Link from "next/link";

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-8">
      <Link href="/" className="text-sm text-muted hover:text-blue">← Briefly</Link>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-extrabold">Discover Creators</h1>
      <p className="mt-2 text-muted">Screens 3–4 — You.com discovery + swipe deck. Wires to POST /api/discover.</p>
    </main>
  );
}
