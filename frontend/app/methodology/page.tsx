import Link from "next/link";

import { AppShell } from "@/components/shell/AppShell";

export default function MethodologyRoute() {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl py-10 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Methodology</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">How Travel Value Studio works</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">
          The dedicated methodology route is now part of the application architecture. During Phase 1, the detailed source-registry modal remains available on Discover; Phase 8 will turn this route into the two-level product explanation and advanced evidence view.
        </p>
        <Link href="/" className="mt-6 inline-flex rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/10">Back to Discover</Link>
      </div>
    </AppShell>
  );
}
