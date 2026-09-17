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
      <div className="space-y-3">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <div key={`ranking-skeleton-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
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

  return (
    <div className="space-y-3">
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
