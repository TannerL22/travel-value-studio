"use client";

import { useEffect, useState } from "react";

import { fetchCities } from "@/lib/api";
import type { CityResponse } from "@/lib/types";

export function useCities(countryIso3?: string | null, enabled = true) {
  const [data, setData] = useState<CityResponse>({ results: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !countryIso3) {
      setData({ results: [] });
      return;
    }

    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError(null);

    fetchCities(countryIso3, controller.signal)
      .then((response) => {
        if (active) setData(response);
      })
      .catch((err: unknown) => {
        if (!active || (err as { name?: string })?.name === "AbortError") return;
        setError(err instanceof Error ? err : new Error("Failed to load city intelligence"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [countryIso3, enabled]);

  return {
    cities: data.results ?? [],
    meta: data.meta ?? {},
    loading,
    error,
  };
}
