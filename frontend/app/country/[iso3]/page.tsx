import Link from "next/link";

import { AppShell } from "@/components/shell/AppShell";

export default async function CountryRoute({ params }: { params: Promise<{ iso3: string }> }) {
  const { iso3 } = await params;
  const code = iso3.toUpperCase();

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl py-10 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Country detail route</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">{code}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">
          The dedicated country-detail architecture is now addressable at this URL. During Frontend v2 Phase 1, the live Discover screen continues to use the compatibility modal; this route becomes the full country experience in Phase 5.
        </p>
        <Link href="/" className="mt-6 inline-flex rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/10">Back to Discover</Link>
      </div>
    </AppShell>
  );
}
