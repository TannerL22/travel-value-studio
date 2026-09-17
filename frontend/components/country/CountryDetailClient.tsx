"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { CityShortlist } from "@/components/country/CityShortlist";
import { CountryHero } from "@/components/country/CountryHero";
import { EvidenceSummary } from "@/components/country/EvidenceSummary";
import { LivingFoundations } from "@/components/country/LivingFoundations";
import { RankingDrivers, SectionHeading } from "@/components/country/RankingDrivers";
import { ValueSummary } from "@/components/country/ValueSummary";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrigins } from "@/hooks/useOrigins";
import { useRankings } from "@/hooks/useRankings";
import { parsePreferences, preferenceLevel, preferencesToSearchParams } from "@/lib/preferences";

export function CountryDetailClient({ iso3, queryString }: { iso3: string; queryString: string }) {
  const filters = useMemo(() => parsePreferences(new URLSearchParams(queryString)), [queryString]);
  const { origins } = useOrigins();
  const { results, loading, error } = useRankings(filters, true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const country = useMemo(() => results.find((row) => row.iso3?.toUpperCase() === iso3.toUpperCase()) ?? null, [results, iso3]);
  const origin = origins.find((item) => item.code === filters.origin_iso3);
  const referenceLabel = origin ? `${origin.name} · ${origin.currency}` : filters.origin_iso3;
  const preferenceQuery = useMemo(() => preferencesToSearchParams(filters).toString(), [filters]);
  const backHref = `/?${preferenceQuery}`;
  const compareHref = `/compare?${preferenceQuery}&countries=${iso3.toUpperCase()}`;

  useEffect(() => {
    if (!country) return;
    const name = country.country ?? country.iso3 ?? "";
    if (!name) return;
    const controller = new AbortController();
    fetch(`/api/pexels?q=${encodeURIComponent(name)}%20travel`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { url?: string } | null) => {
        if (data?.url) setImageUrl(data.url);
      })
      .catch((fetchError: unknown) => {
        if ((fetchError as { name?: string })?.name === "AbortError") return;
      });
    return () => controller.abort();
  }, [country]);

  if ((loading || results.length === 0) && !error && !country) return <CountryDetailSkeleton />;

  if (error) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <p className="text-sm text-zinc-400">Country detail could not be loaded from the ranking service.</p>
        <Link href={backHref} className="mt-5 inline-flex items-center gap-2 text-sm text-cyan-300 hover:text-cyan-200"><ArrowLeft className="h-4 w-4" /> Back to Discover</Link>
      </div>
    );
  }

  if (!country) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Destination unavailable</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">{iso3.toUpperCase()}</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-500">This destination is not present in the current ranking universe for the selected model configuration.</p>
        <Link href={backHref} className="mt-5 inline-flex items-center gap-2 text-sm text-cyan-300 hover:text-cyan-200"><ArrowLeft className="h-4 w-4" /> Back to Discover</Link>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-10 sm:space-y-16">
      <CountryHero country={country} backHref={backHref} compareHref={compareHref} imageUrl={imageUrl} referenceLabel={referenceLabel} />

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-zinc-500">
          <span><strong className="font-medium text-zinc-300">Reference:</strong> {referenceLabel}</span>
          <span><strong className="font-medium text-zinc-300">Value:</strong> {preferenceLevel("budget_sens", filters.budget_sens)}</span>
          <span><strong className="font-medium text-zinc-300">Comfort:</strong> {preferenceLevel("comfort", filters.comfort)}</span>
          <span><strong className="font-medium text-zinc-300">Services:</strong> {preferenceLevel("supply_need", filters.supply_need)}</span>
          <span><strong className="font-medium text-zinc-300">Stability:</strong> {preferenceLevel("risk_pri", filters.risk_pri)}</span>
        </div>
      </div>

      <RankingDrivers country={country} />
      <ValueSummary country={country} referenceLabel={referenceLabel} />
      <LivingFoundations country={country} />

      <section>
        <SectionHeading
          eyebrow="City shortlist"
          title="Which major cities are worth investigating first"
          description="City Usability helps order the returned major-city candidates using observed amenity depth plus supporting national mobility and digital context. It does not alter the country value score."
        />
        <div className="mt-5"><CityShortlist iso3={country.iso3} /></div>
      </section>

      <EvidenceSummary country={country} />
    </div>
  );
}

function CountryDetailSkeleton() {
  return (
    <div className="space-y-8 pb-10">
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8"><Skeleton className="h-4 w-32 bg-white/10" /><Skeleton className="mt-6 h-12 w-64 bg-white/10" /><Skeleton className="mt-5 h-5 w-2/3 bg-white/10" /><div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-16 bg-white/10" />)}</div></div>
      {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-72 w-full rounded-2xl bg-white/5" />)}
    </div>
  );
}
