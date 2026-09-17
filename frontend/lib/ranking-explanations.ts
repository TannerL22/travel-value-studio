import type { RankingRow } from "@/lib/types";

export type RankingDriverKey =
  | "purchasing_power"
  | "comfort"
  | "services"
  | "stability"
  | "fx";

export type RankingDriver = {
  key: RankingDriverKey;
  label: string;
  direction: "help" | "limit";
  effectPct: number;
};

type FactorDefinition = {
  key: RankingDriverKey;
  label: string;
  value: number | null | undefined;
};

const numericFactor = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;

export function rankingDrivers(row: RankingRow): RankingDriver[] {
  const factors: FactorDefinition[] = [
    {
      key: "purchasing_power",
      label: "Purchasing power",
      value: row.structural_value_factor,
    },
    {
      key: "comfort",
      label: "Comfort floor",
      value: row.basic_comfort_penalty,
    },
    {
      key: "services",
      label: "Service depth",
      value: row.service_depth_penalty,
    },
    {
      key: "stability",
      label: "Stability",
      value: row.stability_penalty,
    },
    {
      key: "fx",
      label: "FX timing",
      value: row.fx_opportunity_multiplier,
    },
  ];

  return factors
    .flatMap((factor): RankingDriver[] => {
      const value = numericFactor(factor.value);
      if (value == null) return [];
      const effectPct = (value - 1) * 100;
      if (Math.abs(effectPct) < 0.5) return [];
      return [
        {
          key: factor.key,
          label: factor.label,
          direction: effectPct > 0 ? "help" : "limit",
          effectPct,
        },
      ];
    })
    .sort((a, b) => Math.abs(b.effectPct) - Math.abs(a.effectPct));
}

export function primaryRankingDrivers(row: RankingRow): RankingDriver[] {
  const drivers = rankingDrivers(row);
  const strongestHelp = drivers.find((driver) => driver.direction === "help");
  const strongestLimit = drivers.find((driver) => driver.direction === "limit");

  if (strongestHelp && strongestLimit) return [strongestHelp, strongestLimit];
  return drivers.slice(0, 2);
}

export function rankingExplanation(row: RankingRow): string {
  const drivers = primaryRankingDrivers(row);
  const help = drivers.find((driver) => driver.direction === "help");
  const limit = drivers.find((driver) => driver.direction === "limit");

  if (help && limit) {
    return `${help.label} is the main tailwind; ${limit.label.toLowerCase()} is the largest drag.`;
  }
  if (help) return `${help.label} is the clearest positive ranking driver.`;
  if (limit) return `${limit.label} is the clearest constraint under your current preferences.`;
  return "No single ranking adjustment dominates under your current preferences.";
}

export function formatDriverEffect(effectPct: number): string {
  const rounded = Math.round(effectPct);
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
}

export function formatFxRankingEffect(row: RankingRow): string {
  const multiplier = numericFactor(row.fx_opportunity_multiplier);
  if (multiplier == null) return "N/A";
  return formatDriverEffect((multiplier - 1) * 100);
}
