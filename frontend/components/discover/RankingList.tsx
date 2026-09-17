"use client";

import { DestinationResult } from "@/components/discover/DestinationResult";
import { Skeleton } from "@/components/ui/skeleton";
import type { RankingRow } from "@/lib/types";

type RankingListProps = {
  results: RankingRow[];
  loading: boolean;
  activeCountryKey?: string | null;
  onCountryHover: (country: RankingRow | null) => void;
  onCountrySelect: (country: RankingRow) => void;
  compact?: boolean;
  skeletonCount?: number;
};

const countryKey = (country: RankingRow) => (country.iso3 ?? country.country ?? "unknown").toUpperCase();

export function RankingList({
  results,
  loading,
  activeCountryKey = null,
  onCountryHover,
  onCountrySelect,
  compact = false,
  skeletonCount = 8,
}: RankingListProps) {
  if (loading) {
    return (
      <div className="space-y-3" aria-live="polite" aria-busy="true" aria-label="Loading destination rankings">
        <span className="sr-only">Loading destination rankings…</span>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <div key={`ranking-skeleton-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5" aria-hidden="true">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2"><Skeleton className="h-3 w-8 bg-white/10" /><Skeleton className="h-6 w-32 bg-white/10" /></div>
              <Skeleton className="h-9 w-12 bg-white/10" />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 border-y border-white/10 py-4"><Skeleton className="h-9 bg-white/10" /><Skeleton className="h-9 bg-white/10" /></div>
            <Skeleton className="mt-5 h-14 w-full bg-white/10" />
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-10 text-center" role="status">
        <p className="text-sm font-medium text-zinc-200">No destinations are available for this configuration.</p>
        <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-zinc-400">Try adjusting your preferences or reference market. Missing results are not interpreted as low-value destinations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" aria-label="Ranked destinations">
      {results.map((row, index) => (
        <DestinationResult
          key={countryKey(row)}
          country={row}
          index={index}
          compact={compact}
          isActive={countryKey(row) === activeCountryKey?.toUpperCase()}
          onHoverChange={onCountryHover}
          onClick={() => onCountrySelect(row)}
        />
      ))}
    </div>
  );
}
