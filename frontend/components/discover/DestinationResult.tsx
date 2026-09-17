"use client";

import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

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
  onClick?: () => void;
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

export function DestinationResult({
  country,
  index,
  onClick,
  onHoverChange,
  isActive = false,
  compact = false,
}: DestinationResultProps) {
  const name = country.country ?? country.iso3 ?? "Unknown";
  const rank = country.rank ?? index + 1;
  const valueScore = country.quality_adjusted_value ?? country.Score ?? country.score ?? null;
  const purchasingPower = country.structural_purchasing_power ?? country.value_multiplier_relative ?? null;
  const drivers = primaryRankingDrivers(country);

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.28, delay: Math.min(index, 8) * 0.025 }}
      onClick={onClick}
      onMouseEnter={() => onHoverChange?.(country)}
      onMouseLeave={() => onHoverChange?.(null)}
      onFocus={() => onHoverChange?.(country)}
      onBlur={() => onHoverChange?.(null)}
      className={`group flex h-full w-full flex-col rounded-2xl border p-5 text-left shadow-lg shadow-black/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 ${
        isActive
          ? "border-cyan-300/50 bg-cyan-950/25 ring-1 ring-cyan-300/15"
          : "border-white/10 bg-zinc-950/45 hover:border-white/20 hover:bg-zinc-900/60"
      }`}
      aria-label={`Open ${name}, value rank ${rank}`}
    >
      <div className="flex items-start justify-between gap-5">
        <div className="min-w-0">
          <p className="text-[11px] font-medium tabular-nums text-zinc-500">#{rank}</p>
          <h2 className={`${compact ? "text-lg" : "text-xl"} mt-1 truncate font-semibold tracking-tight text-white`}>{name}</h2>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">{country.iso3 ?? ""}</p>
        </div>

        <div className="shrink-0 text-right">
          <p className={`${compact ? "text-2xl" : "text-3xl"} font-semibold tabular-nums tracking-tight text-white`}>{formatScore(valueScore)}</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-zinc-500">Value score</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-y border-white/10 py-4">
        <div>
          <p className="text-lg font-semibold tabular-nums text-zinc-100">{formatMultiplier(purchasingPower)}</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-zinc-500">Purchasing power</p>
        </div>
        <div>
          <p className="text-lg font-semibold tabular-nums text-zinc-100">{formatFxRankingEffect(country)}</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-zinc-500">FX rank effect</p>
        </div>
      </div>

      {!compact ? (
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-300">
          {country.basic_comfort != null ? (
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1.5">Comfort {Math.round(country.basic_comfort)}</span>
          ) : null}
          {country.service_depth != null ? (
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1.5">Services {Math.round(country.service_depth)}</span>
          ) : null}
          {country.stability != null ? (
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1.5">Stability {Math.round(country.stability)}</span>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Why it ranks</p>
        <p className="mt-2 text-sm leading-5 text-zinc-300">{rankingExplanation(country)}</p>

        {drivers.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            {drivers.map((driver) => (
              <span key={driver.key} className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
                {driver.direction === "help" ? (
                  <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5 text-amber-300" />
                )}
                <span>{driver.label}</span>
                <span className="font-medium tabular-nums text-zinc-200">{formatDriverEffect(driver.effectPct)}</span>
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-zinc-500">
        <span>{country.data_quality_grade ? `Data quality ${country.data_quality_grade}` : "View evidence"}</span>
        <span className="inline-flex items-center gap-1.5 text-zinc-300 transition group-hover:text-white">
          Explore <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </motion.button>
  );
}
