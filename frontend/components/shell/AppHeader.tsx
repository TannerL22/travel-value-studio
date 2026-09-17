import Link from "next/link";

export function AppHeader() {
  return (
    <header className="border-b border-white/10 bg-zinc-950/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Travel Value Studio</p>
          <p className="mt-1 hidden text-sm text-zinc-300 sm:block">Quality-adjusted purchasing power</p>
        </Link>
        <nav className="flex items-center gap-1 text-sm text-zinc-400 sm:gap-2">
          <Link href="/" className="rounded-md px-3 py-2 transition hover:bg-white/5 hover:text-white">Discover</Link>
          <Link href="/compare" className="rounded-md px-3 py-2 transition hover:bg-white/5 hover:text-white">Compare</Link>
          <Link href="/methodology" className="rounded-md px-3 py-2 transition hover:bg-white/5 hover:text-white">Methodology</Link>
        </nav>
      </div>
    </header>
  );
}
