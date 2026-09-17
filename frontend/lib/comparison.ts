import type { RankingRow } from "@/lib/types";

export type ComparisonMetric = {
  key: string;
  label: string;
  shortLabel: string;
  description: string;
  getValue: (country: RankingRow) => number | null;
  format: (value: number | null) => string;
  differenceFormat: (difference: number) => string;
};

const finite = (value: number | null | undefined) =>
  value != null && Number.isFinite(value) ? value : null;

const score = (country: RankingRow) =>
  finite(country.quality_adjusted_value ?? country.Score ?? country.score);

const purchasingPower = (country: RankingRow) =>
  finite(country.structural_purchasing_power ?? country.value_multiplier_relative);

const fxEffect = (country: RankingRow) => {
  const multiplier = finite(country.fx_opportunity_multiplier);
  return multiplier == null ? null : (multiplier - 1) * 100;
};

const integer = (value: number | null) => (value == null ? "N/A" : Math.round(value).toString());
const multiplier = (value: number | null) => (value == null ? "N/A" : `${value.toFixed(2)}×`);
const percentage = (value: number | null) => {
  if (value == null) return "N/A";
  const rounded = Math.abs(value) < 0.05 ? 0 : value;
  return `${rounded > 0 ? "+" : ""}${rounded.toFixed(1)}%`;
};

export const COMPARISON_METRICS: ComparisonMetric[] = [
  {
    key: "value",
    label: "Quality-Adjusted Value",
    shortLabel: "Value score",
    description: "The final country score for the active reference market and preference settings.",
    getValue: score,
    format: integer,
    differenceFormat: (difference) => `${Math.abs(difference).toFixed(0)} points`,
  },
  {
    key: "purchasing_power",
    label: "Purchasing power",
    shortLabel: "Purchasing power",
    description: "Broad destination consumption purchasing power relative to the selected reference market.",
    getValue: purchasingPower,
    format: multiplier,
    differenceFormat: (difference) => `${Math.abs(difference).toFixed(2)}×`,
  },
  {
    key: "fx",
    label: "Current FX rank effect",
    shortLabel: "FX effect",
    description: "The bounded effect of current bilateral currency timing on the final country rank.",
    getValue: fxEffect,
    format: percentage,
    differenceFormat: (difference) => `${Math.abs(difference).toFixed(1)} percentage points`,
  },
  {
    key: "comfort",
    label: "Basic comfort",
    shortLabel: "Comfort",
    description: "Water, sanitation, electricity, internet and health-service baseline.",
    getValue: (country) => finite(country.basic_comfort),
    format: integer,
    differenceFormat: (difference) => `${Math.abs(difference).toFixed(0)} points`,
  },
  {
    key: "services",
    label: "Service depth",
    shortLabel: "Services",
    description: "Established accommodation and visitor-service supply at country level.",
    getValue: (country) => finite(country.service_depth),
    format: integer,
    differenceFormat: (difference) => `${Math.abs(difference).toFixed(0)} points`,
  },
  {
    key: "stability",
    label: "Political stability",
    shortLabel: "Stability",
    description: "WGI-led political-stability evidence; not a complete personal-safety measure.",
    getValue: (country) => finite(country.stability),
    format: integer,
    differenceFormat: (difference) => `${Math.abs(difference).toFixed(0)} points`,
  },
];

export type ComparisonInsight = {
  metricKey: string;
  text: string;
};

export function comparisonInsights(countries: RankingRow[]): ComparisonInsight[] {
  if (countries.length < 2) return [];

  return COMPARISON_METRICS.filter((metric) => metric.key !== "value")
    .map((metric) => {
      const observations = countries
        .map((country) => ({
          name: country.country ?? country.iso3 ?? "Unknown destination",
          value: metric.getValue(country),
        }))
        .filter((item): item is { name: string; value: number } => item.value != null);

      if (observations.length < 2) return null;
      const ordered = [...observations].sort((a, b) => b.value - a.value);
      const highest = ordered[0];
      const lowest = ordered[ordered.length - 1];
      const difference = highest.value - lowest.value;

      if (Math.abs(difference) < 0.01) {
        return {
          metricKey: metric.key,
          text: `${metric.label} is effectively the same across the selected destinations (${metric.format(highest.value)}).`,
        };
      }

      return {
        metricKey: metric.key,
        text: `${highest.name} is higher on ${metric.shortLabel.toLowerCase()} at ${metric.format(highest.value)}, compared with ${metric.format(lowest.value)} in ${lowest.name} — a spread of ${metric.differenceFormat(difference)}.`,
      };
    })
    .filter((item): item is ComparisonInsight => item != null);
}

export function parseComparedCountries(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const values: string[] = [];
  raw.split(",").forEach((item) => {
    const code = item.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(code) || seen.has(code) || values.length >= 3) return;
    seen.add(code);
    values.push(code);
  });
  return values;
}
