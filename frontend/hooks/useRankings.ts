"use client";

import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";

import { fetchRankings } from "@/lib/api";
import type { FilterState, RankingRow } from "@/lib/types";

export function useRankings(filters: FilterState, enabled = true) {
  const [results, setResults] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [debouncedFilters] = useDebounce(filters, 500);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let active = true;

    void Promise.resolve().then(() => {
      if (!active) return;
      setLoading(true);
      setError(null);
    });

    fetchRankings(debouncedFilters, controller.signal)
      .then((data) => {
        if (active) setResults(data);
      })
      .catch((err: unknown) => {
        if (!active || (err as { name?: string })?.name === "AbortError") return;
        setError(err instanceof Error ? err : new Error("Failed to load rankings"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [debouncedFilters, enabled]);

  return { results, loading, error };
}
