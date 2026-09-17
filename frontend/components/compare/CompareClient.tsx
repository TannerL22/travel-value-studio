"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { CompareSelector } from "@/components/compare/CompareSelector";
import { ComparisonMatrix } from "@/components/compare/ComparisonMatrix";
import { TradeoffSummary } from "@/components/compare/TradeoffSummary";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrigins } from "@/hooks/useOrigins";
import { useRankings } from "@/hooks/useRankings";
import { parseComparedCountries } from "@/lib/comparison";
import { parsePreferences, preferenceLevel, preferencesToSearchParams } from "@/lib/preferences";
import type { RankingRow } from "@/lib/types";

const valueScore = (country: RankingRow) => country.quality_adjusted_value ?? country.Score ?? country.score ?? null;
const purchasingPower = (country: RankingRow) => country.structural_purchasing_power ?? country.value_multiplier_relative ?? null;

export function CompareClient({ queryString }: { queryString: string }) {
  const router = useRouter();
  const params = useMemo(() => new URLSearchParams(queryString), [queryString]);
  const filters = useMemo(() => parsePreferences(params), [params]);
  const selectedCodes = useMemo(() => parseComparedCountries(params.get("countries")), [params]);
  const preferenceQuery = useMemo(() => preferencesToSearchParams(filters).toString(), [filters]);

  const { origins } = useOrigins();
  const { results, loading, error } = useRankings(filters, true);
  const origin = origins.find((item) => item.code === filters.origin_iso3);
  const referenceLabel = origin ? `${origin.name} · ${origin.currency}` : filters.origin_iso3;

  const selectedCountries = useMemo(
    () => selectedCodes
      .map((code) => results.find((country) => country.iso3?.toUpperCase() === code))
      .filter((country): country is RankingRow => country != null),
    [results, selectedCodes],
  );

  const sortedOptions = useMemo(
    () => [...results].sort((a, b) => (a.rank ?? Number.POSITIVE_INFINITY) - (b.rank ?? Number.POSITIVE_INFINITY)),
    [results],
  );

  const navigateWithCountries = (codes: string[]) => {
    const next = preferencesToSearchParams(filters);
    if (codes.length > 0) next.set("countries", codes.join(","));
    router.replace(`/compare?${next.toString()}`, { scroll: false });
  };

  const addCountry = (iso3: string) => {
    const code = iso3.toUpperCase();
    if (!/^[A-Z]{3}$/.test(code) || selectedCodes.includes(code) || selectedCodes.length >= 3) return;
    navigateWithCountries([...selectedCodes, code]);
  };

  const removeCountry = (iso3: string) => {
    navigateWithCountries(selectedCodes.filter((code) => code !== iso3.toUpperCase()));
  };

  const backHref = `/?${preferenceQuery}`;

  return (
    <div className="space-y-10 pb-10 sm:space-y-12">
      <header>
        <Link href={backHref} className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-zinc-300 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70">
          <ArrowLeft className="h-4 w-4" /> Back to Discover
        </Link>
        <div className="mt-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Comparison</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Compare destination trade-offs</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
              Put up to three countries under the same reference market and preferences. The page describes differences in the underlying evidence without choosing a destination for you.
            </p>
          </div>
        </div>
      </header>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4 sm:px-6" aria-label="Active comparison preferences">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-zinc-400">
          <span><strong className="font-medium text-zinc-200">Reference:</strong> {referenceLabel}</span>
          <span><strong className="font-medium text-zinc-200">Value:</strong> {preferenceLevel("budget_sens", filters.budget_sens)}</span>
          <span><strong className="font-medium text-zinc-200">Comfort:</strong> {preferenceLevel("comfort", filters.comfort)}</span>
          <span><strong className="font-medium text-zinc-200">Services:</strong> {preferenceLevel("supply_need", filters.supply_need)}</span>
          <span><strong className="font-medium text-zinc-200">Stability:</strong> {preferenceLevel("risk_pri", filters.risk_pri)}</span>
        </div>
      </div>

      {loading && results.length === 0 ? (
        <CompareSkeleton />
      ) : error ? (
        <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.03] p-6 text-sm leading-6 text-zinc-300" role="alert">
          Comparison data could not be loaded from the ranking service.
        </div>
      ) : (
        <>
          <CompareSelector selected={selectedCountries} options={sortedOptions} onAdd={addCountry} onRemove={removeCountry} />

          {selectedCountries.length > 0 ? (
            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-label="Selected destinations">
              {selectedCountries.map((country) => {
                const code = country.iso3?.toUpperCase() ?? "";
                const detailHref = `/country/${code}?${preferenceQuery}`;
                const value = valueScore(country);
                const pp = purchasingPower(country);
                return (
                  <article key={code} className="rounded-2xl border border-white/10 bg-zinc-950/35 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">Global rank #{country.rank ?? "—"}</p>
                        <h2 className="mt-2 break-words text-xl font-semibold tracking-tight text-white">{country.country ?? code}</h2>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-zinc-500">{code}</p>
                      </div>
                      <p className="text-3xl font-semibold tabular-nums tracking-tight text-white">{value != null ? Math.round(value) : "N/A"}</p>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-3 border-y border-white/10 py-4">
                      <div><p className="text-lg font-semibold tabular-nums text-zinc-100">{pp != null ? `${pp.toFixed(2)}×` : "N/A"}</p><p className="mt-1 text-[9px] uppercase tracking-[0.1em] text-zinc-400">Purchasing power</p></div>
                      <div><p className="text-lg font-semibold text-zinc-100">{country.data_quality_grade ?? "N/A"}</p><p className="mt-1 text-[9px] uppercase tracking-[0.1em] text-zinc-400">Data quality</p></div>
                    </div>
                    <Link href={detailHref} className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm text-cyan-200 transition hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70">
                      Full country analysis <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </article>
                );
              })}
            </section>
          ) : null}

          {selectedCountries.length < 2 ? (
            <div className="rounded-2xl border border-dashed border-white/10 px-6 py-10 text-center" role="status">
              <p className="text-sm font-medium text-zinc-200">Add at least two destinations to compare.</p>
              <p className="mt-2 text-xs leading-5 text-zinc-400">The comparison URL will update automatically, so the exact country set and model settings can be bookmarked or shared.</p>
            </div>
          ) : (
            <>
              <TradeoffSummary countries={selectedCountries} />
              <ComparisonMatrix countries={selectedCountries} queryString={preferenceQuery} />
              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Scope</p>
                <p className="mt-2 max-w-4xl text-sm leading-6 text-zinc-400">
                  Comparison inherits the same limitations as the country model. Furnished 30–90 day housing, travel-to-destination cost, visa feasibility and comprehensive personal-safety risk are not included in the value score.
                </p>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}

function CompareSkeleton() {
  return (
    <div className="space-y-5" aria-live="polite" aria-busy="true" aria-label="Loading comparison data">
      <span className="sr-only">Loading comparison data…</span>
      <Skeleton className="h-40 w-full rounded-2xl bg-white/5" aria-hidden="true" />
      <div className="grid gap-3 md:grid-cols-2" aria-hidden="true"><Skeleton className="h-48 rounded-2xl bg-white/5" /><Skeleton className="h-48 rounded-2xl bg-white/5" /></div>
      <Skeleton className="h-80 w-full rounded-2xl bg-white/5" aria-hidden="true" />
    </div>
  );
}
