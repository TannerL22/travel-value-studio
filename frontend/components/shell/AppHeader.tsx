import Link from "next/link";

const navLinkClass = "flex min-h-11 items-center justify-center rounded-lg px-3 text-[13px] font-medium text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-zinc-950/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:px-6 lg:px-8">
        <Link href="/" className="min-w-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70">
          <p className="truncate text-sm font-semibold tracking-tight text-zinc-100">Travel Value Studio</p>
          <p className="mt-0.5 hidden text-xs text-zinc-500 sm:block">Global purchasing-power intelligence</p>
        </Link>
        <nav aria-label="Primary" className="grid grid-cols-3 gap-1 sm:flex sm:items-center">
          <Link href="/" className={navLinkClass}>Discover</Link>
          <Link href="/compare" className={navLinkClass}>Compare</Link>
          <Link href="/methodology" className={navLinkClass}>Methodology</Link>
        </nav>
      </div>
    </header>
  );
}
