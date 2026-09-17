"use client";

import { useEffect, useState } from "react";

import { fetchOrigins } from "@/lib/api";
import type { Origin } from "@/lib/types";

export function useOrigins() {
  const [origins, setOrigins] = useState<Origin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    fetchOrigins(controller.signal)
      .then((data) => {
        if (active) setOrigins(data);
      })
      .catch((err: unknown) => {
        if (!active || (err as { name?: string })?.name === "AbortError") return;
        setError(err instanceof Error ? err : new Error("Failed to load origins"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  return { origins, loading, error };
}
