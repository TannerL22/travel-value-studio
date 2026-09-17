"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";

import { CityCard } from "@/components/country/CityCard";
import { useCities } from "@/hooks/useCities";
import type { CityRow } from "@/lib/types";

type CityShortlistProps = {
  iso3?: string | null;
};

const citySortValue = (city: CityRow) => {
  if (city.city_usability_rank_within_country != null) return city.city_usability_rank_within_country;
  return Number.POSITIVE_INFINITY;
};

export function CityShortlist({ iso3 }: CityShortlistProps) {
  const { cities, loading, error } = useCities(iso3);
  const [showAll, setShowAll] = useState(false);

  const sortedCities = useMemo(
    () => [...cities].sort((a, b) => {
      const rankDelta = citySortValue(a) - citySortValue(b);
      if (rankDelta !== 0) return rankDelta;
      return (b.city_usability ?? -Infinity) - (a.city_usability ?? -Infinity);
    }),
    [cities],
  );

  if (!iso3) return null;

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
        <div className="flex items-center gap-2 text-sm text-zinc-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading city candidates…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-sm leading-6 text-zinc-500">
        City evidence is currently unavailable. Missing city evidence does not reduce the country ranking.
      </div>
    );
  }

  if (sortedCities.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-sm leading-6 text-zinc-500">
        No harmonized city match is currently available for this country.
      </div>
    );
  }

  const visibleCities = showAll ? sortedCities : sortedCities.slice(0, 3);

  return (
    <div>
      <div className="space-y-3">
        {visibleCities.map((city, index) => (
          <CityCard key={city.city_id ?? city.city_name ?? index} city={city} fallbackRank={index + 1} />
        ))}
      </div>

      {sortedCities.length > 3 ? (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm text-zinc-400 transition hover:border-white/20 hover:text-zinc-200"
        >
          {showAll ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {showAll ? "Show top 3" : `Show all ${sortedCities.length} candidates`}
        </button>
      ) : null}

      <p className="mt-4 max-w-4xl text-xs leading-5 text-zinc-600">
        Candidate ordering is limited to the returned major-city set. It is designed to help choose where to investigate inside this country, not to claim a definitive ranking of every city or smaller destination.
      </p>
    </div>
  );
}
