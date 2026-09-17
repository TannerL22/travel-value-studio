"use client";

import { memo } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";

import {
  formatDriverEffect,
  formatFxRankingEffect,
  primaryRankingDrivers,
  rankingExplanation,
} from "@/lib/ranking-explanations";
import type { RankingRow } from "@/lib/types";

type DestinationResultProps = {
  country: RankingRow;
  index: number;
  onSelect?: (country: RankingRow) => void;
  onHoverChange?: (country: RankingRow | null) => void;
  isActive?: boolean;
  compact?: boolean;
};

const formatScore = (value: number | null | undefined) => {
  if (value == null || !Number.isFinite(value)) return "N/A";
  return Math.round(value).toString();
};

const formatMultiplier = (value: number | null | undefined) => {
  if (value == null || !Number.isFinite(value)) return "N/A";
  return `${value.toFixed(2)}×`;
};

function DestinationResultComponent({
  country,
  index,
  onSelect,
  onHoverChange,
  isActive = false,
  compact = false,
}: DestinationResultProps) {
  const name = country.country ?? country.iso3 ?? "Unknown";
  const rank = country.rank ?? index + 1;
  const valueScore = country.quality_adjusted_value ?? country.Score ?? country.score ?? null;
  const purchasingPower = country.structural_purchasing_power ?? country.value_multiplier_relative ?? null;
  const drivers = primaryRankingDrivers(country);
  const conditions = [
    country.basic_comfort != null ? `Comfort ${Math.round(country.basic_comfort)}` : null,
    country.service_depth != null ? `Services ${Math.round(country.service_depth)}` : null,
    country.stability != null ? `Stability ${Math.round(country.stability)}` : null,
  ].filter(Boolean);

  return (
    <button
      type="button"
      onClick={() => onSelect?.(country)}
      onMouseEnter={() => onHoverChange?.(country)}
      onMouseLeave={() => onHoverChange?.(null)}
      onFocus={() => onHoverChange?.(country)}
      onBlur={() => onHoverChange?.(null)}
      className={`group flex min-h-11 w-full flex-col rounded-xl border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 ${compact ? "p-4" : "p-5"} ${
        isActive
          ? "border-cyan-300/35 bg-cyan-300/[0.045]"
          : "border-white/[0.07] bg-white/[0.012] hover:border-white/15 hover:bg-white/[0.025]"
      }`}
      aria-label={`Open ${name}, value rank ${rank}`}
    >
      <div className="flex items-start justify-between gap-5">
        <div className="min-w-0">
          <p className="text-xs tabular-nums text-zinc-500">#{rank}{country.iso3 ? <span className="ml-2 text-zinc-600">{country.iso3}</span> : null}</p>
          <h2 className={`${compact ? "text-lg" : "text-xl"} mt-1 truncate font-semibold tracking-tight text-white`}>{name}</h2>
        </div>

        <div className="shrink-0 text-right">
          <p className={`${compact ? "text-2xl" : "text-3xl"} font-semibold tabular-nums tracking-tight text-white`}>{formatScore(valueScore)}</p>
          <p className="mt-0.5 text-xs text-zinc-500">Value score</p>
        </div>
      </div>

      <div className={`grid grid-cols-2 gap-5 border-t border-white/[0.07] ${compact ? "mt-4 pt-3" : "mt-5 pt-4"}`}>
        <div>
          <p className="text-lg font-semibold tabular-nums text-zinc-100">{formatMultiplier(purchasingPower)}</p>
          <p className="mt-0.5 text-xs text-zinc-500">Purchasing power</p>
        </div>
        <div>
          <p className="text-lg font-semibold tabular-nums text-zinc-100">{formatFxRankingEffect(country)}</p>
          <p className="mt-0.5 text-xs text-zinc-500">FX effect</p>
        </div>
      </div>

      {!compact && conditions.length > 0 ? (
        <p className="mt-3 text-xs leading-5 text-zinc-500">{conditions.join(" · ")}</p>
      ) : null}

      <div className={compact ? "mt-4" : "mt-5"}>
        <p className="text-sm leading-5 text-zinc-300">{rankingExplanation(country)}</p>

        {drivers.length > 0 ? (
          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
            {drivers.map((driver) => (
              <span key={driver.key} className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
                {driver.direction === "help" ? (
                  <ArrowUpRight className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5 text-amber-200" aria-hidden="true" />
                )}
                <span>{driver.label}</span>
                <span className="font-medium tabular-nums text-zinc-200">{formatDriverEffect(driver.effectPct)}</span>
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs text-zinc-500">
        <span>{country.data_quality_grade ? `Data quality ${country.data_quality_grade}` : "Evidence available"}</span>
        <span className="inline-flex items-center gap-1.5 font-medium text-zinc-300 transition-colors group-hover:text-white">
          Explore <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </div>
    </button>
  );
}

export const DestinationResult = memo(DestinationResultComponent);
