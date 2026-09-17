import type { FilterState } from "@/lib/types";

export const DEFAULT_FILTERS: FilterState = {
  year: 2025,
  origin_iso3: "USA",
  budget_sens: 0.7,
  comfort: 0.55,
  supply_need: 0.65,
  risk_pri: 0.75,
};

const clamp01 = (value: number, fallback: number) => {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(1, Math.max(0, value));
};

const readNumber = (params: URLSearchParams, key: string, fallback: number) => {
  const raw = params.get(key);
  if (raw == null || raw === "") return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function parsePreferences(params: URLSearchParams): FilterState {
  const yearRaw = Math.round(readNumber(params, "year", DEFAULT_FILTERS.year));
  const year = Math.min(2035, Math.max(2000, yearRaw));
  const origin = (params.get("origin") ?? DEFAULT_FILTERS.origin_iso3).toUpperCase().trim();

  return {
    year,
    origin_iso3: /^[A-Z]{3}$/.test(origin) ? origin : DEFAULT_FILTERS.origin_iso3,
    budget_sens: clamp01(readNumber(params, "value", DEFAULT_FILTERS.budget_sens), DEFAULT_FILTERS.budget_sens),
    comfort: clamp01(readNumber(params, "comfort", DEFAULT_FILTERS.comfort), DEFAULT_FILTERS.comfort),
    supply_need: clamp01(readNumber(params, "services", DEFAULT_FILTERS.supply_need), DEFAULT_FILTERS.supply_need),
    risk_pri: clamp01(readNumber(params, "stability", DEFAULT_FILTERS.risk_pri), DEFAULT_FILTERS.risk_pri),
  };
}

export function preferencesToSearchParams(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();
  params.set("origin", filters.origin_iso3);
  params.set("value", filters.budget_sens.toFixed(2));
  params.set("comfort", filters.comfort.toFixed(2));
  params.set("services", filters.supply_need.toFixed(2));
  params.set("stability", filters.risk_pri.toFixed(2));
  if (filters.year !== DEFAULT_FILTERS.year) params.set("year", String(filters.year));
  return params;
}
