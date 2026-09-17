import type { FilterState } from "@/lib/types";

export const DEFAULT_FILTERS: FilterState = {
  year: 2025,
  origin_iso3: "USA",
  budget_sens: 0.7,
  comfort: 0.55,
  supply_need: 0.65,
  risk_pri: 0.75,
};

export type PreferenceKey = "budget_sens" | "comfort" | "supply_need" | "risk_pri";

export type PreferenceDefinition = {
  key: PreferenceKey;
  label: string;
  shortLabel: string;
  description: string;
  lowLabel: string;
  highLabel: string;
};

export const PREFERENCE_DEFINITIONS: PreferenceDefinition[] = [
  {
    key: "budget_sens",
    label: "Maximize purchasing power",
    shortLabel: "Value",
    description: "How strongly should cheap local prices influence the ranking? Higher settings make origin-relative purchasing power more decisive.",
    lowLabel: "Balanced",
    highLabel: "Maximum value",
  },
  {
    key: "comfort",
    label: "Basic living standards",
    shortLabel: "Comfort",
    description: "How strongly should destinations be penalized when water, sanitation, electricity, internet or health-service access falls below a modern baseline?",
    lowLabel: "Flexible",
    highLabel: "Very important",
  },
  {
    key: "supply_need",
    label: "Established services",
    shortLabel: "Services",
    description: "How strongly should the ranking penalize destinations with thin accommodation and visitor-service supply?",
    lowLabel: "Flexible",
    highLabel: "Very important",
  },
  {
    key: "risk_pri",
    label: "Political stability",
    shortLabel: "Stability",
    description: "How strongly should lower political stability reduce a destination's ranking? This is not a complete traveller crime or personal-safety measure.",
    lowLabel: "Ignore",
    highLabel: "Very important",
  },
];

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

export function preferenceLevel(key: PreferenceKey, value: number): string {
  const normalized = clamp01(value, 0);

  if (key === "risk_pri") {
    if (normalized <= 0.1) return "Ignore";
    if (normalized <= 0.35) return "Low";
    if (normalized <= 0.6) return "Balanced";
    if (normalized <= 0.85) return "High";
    return "Very high";
  }

  if (key === "comfort" || key === "supply_need") {
    if (normalized <= 0.15) return "Flexible";
    if (normalized <= 0.4) return "Low";
    if (normalized <= 0.65) return "Balanced";
    if (normalized <= 0.85) return "High";
    return "Very high";
  }

  if (normalized <= 0.2) return "Balanced";
  if (normalized <= 0.45) return "Moderate";
  if (normalized <= 0.7) return "High";
  if (normalized <= 0.9) return "Very high";
  return "Maximum";
}

export function resetPreferenceValues(filters: FilterState): FilterState {
  return {
    ...filters,
    budget_sens: DEFAULT_FILTERS.budget_sens,
    comfort: DEFAULT_FILTERS.comfort,
    supply_need: DEFAULT_FILTERS.supply_need,
    risk_pri: DEFAULT_FILTERS.risk_pri,
  };
}

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
