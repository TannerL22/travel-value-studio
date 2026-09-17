"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";

import { AdvancedMethodology } from "@/components/methodology/AdvancedMethodology";
import { HowItWorks } from "@/components/methodology/HowItWorks";
import { Skeleton } from "@/components/ui/skeleton";
import { apiUrl } from "@/lib/api";
import type { MethodologySummary, SourceField } from "@/lib/methodology";
import { parsePreferences, preferencesToSearchParams } from "@/lib/preferences";

export function MethodologyClient({ queryString }: { queryString: string }) {
  const filters = useMemo(() => parsePreferences(new URLSearchParams(queryString)), [queryString]);
  const backQuery = useMemo(() => preferencesToSearchParams(filters).toString(), [filters]);
  const [methodology, setMethodology] = useState<MethodologySummary | null>(null);
  const [sourceRegistry, setSourceRegistry] = useState<Record<string, SourceField>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    void Promise.resolve().then(() => {
      if (!active) return;
      setLoading(true);
      setError(null);
    });

    Promise.all([
      fetch(apiUrl("/api/methodology"), { signal: controller.signal }).then(async (response) => {
        if (!response.ok) throw new Error(`Methodology request failed (${response.status})`);
        return response.json() as Promise<MethodologySummary>;
      }),
      fetch(apiUrl("/api/source-registry"), { signal: controller.signal }).then(async (response) => {
        if (!response.ok) throw new Error(`Source registry request failed (${response.status})`);
        return response.json() as Promise<Record<string, SourceField>>;
      }),
    ])
      .then(([methodologyData, registryData]) => {
        if (!active) return;
        setMethodology(methodologyData);
        setSourceRegistry(registryData);
      })
      .catch((fetchError: unknown) => {
        if (!active || (fetchError as { name?: string })?.name === "AbortError") return;
        setError(fetchError instanceof Error ? fetchError : new Error("Failed to load methodology"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  return (
    <div className="space-y-12 pb-12 sm:space-y-16">
      <header className="max-w-4xl pt-3">
        <Link href={`/?${backQuery}`} className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-zinc-300 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70">
          <ArrowLeft className="h-4 w-4" /> Back to Discover
        </Link>
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Methodology</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Understand the result before trusting it</h1>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-300 sm:text-base">
          The first section explains Travel Value Studio in plain language. The advanced section exposes the backend model contract, source registry, caveats and known blind spots for anyone who wants to audit the result more deeply.
        </p>
      </header>

      <HowItWorks />

      <section className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.04] p-5 sm:p-6" aria-labelledby="housing-blind-spot-title">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
          <div>
            <p id="housing-blind-spot-title" className="text-sm font-medium text-amber-100">The biggest current blind spot is temporary housing.</p>
            <p className="mt-2 max-w-4xl text-xs leading-5 text-zinc-400">
              Furnished, move-in-ready housing for roughly 30–90 day stays is not included because the currently available free data are not globally consistent enough for an auditable comparison. Travel-to-destination cost, visa feasibility and comprehensive personal-safety risk are also outside the country score.
            </p>
          </div>
        </div>
      </section>

      {loading ? <MethodologySkeleton /> : error || !methodology ? (
        <section className="rounded-3xl border border-amber-300/15 bg-amber-300/[0.03] p-6 text-sm leading-6 text-zinc-300" role="alert">
          The advanced methodology data could not be loaded from the backend. The plain-language scoring explanation above remains valid, but the live source registry is unavailable right now.
        </section>
      ) : (
        <AdvancedMethodology methodology={methodology} sourceRegistry={sourceRegistry} />
      )}
    </div>
  );
}

function MethodologySkeleton() {
  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8" aria-live="polite" aria-busy="true" aria-label="Loading advanced methodology">
      <span className="sr-only">Loading advanced methodology and source registry…</span>
      <Skeleton className="h-5 w-48 bg-white/10" aria-hidden="true" />
      <Skeleton className="h-8 w-80 max-w-full bg-white/10" aria-hidden="true" />
      <div className="grid gap-3 md:grid-cols-3" aria-hidden="true">
        {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-xl bg-white/5" />)}
      </div>
      <Skeleton className="h-72 rounded-2xl bg-white/5" aria-hidden="true" />
    </div>
  );
}
