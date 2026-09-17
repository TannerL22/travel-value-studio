import Link from "next/link";

const navLinkClass = "min-h-11 rounded-md px-3 py-2 text-center text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70";

export function AppHeader() {
  return (
    <header className="border-b border-white/10 bg-zinc-950/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
        <Link href="/" className="min-w-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70">
          <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-zinc-300">Travel Value Studio</p>
          <p className="mt-1 hidden text-sm text-zinc-400 sm:block">Quality-adjusted purchasing power</p>
        </Link>
        <nav aria-label="Primary" className="grid grid-cols-3 gap-1 sm:flex sm:items-center sm:gap-2">
          <Link href="/" className={navLinkClass}>Discover</Link>
          <Link href="/compare" className={navLinkClass}>Compare</Link>
          <Link href="/methodology" className={navLinkClass}>Methodology</Link>
        </nav>
      </div>
    </header>
  );
}
