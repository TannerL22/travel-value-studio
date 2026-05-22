"use client";

import { useMemo } from "react";
import { Info } from "lucide-react";

import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface Origin {
  name: string;
  code: string;
  pp_multiplier: number;
  currency: string;
}

export interface FilterState {
  year: number;
  origin_iso3: string;
  budget_sens: number;
  comfort: number;
  supply_need: number;
  risk_pri: number;
  home_spend: number;
  scarcity_k: number;
}

type ControlPanelProps = {
  values: FilterState;
  setValues: (v: FilterState) => void;
  origins: Origin[];
};

const getCurrencySymbol = (currencyCode: string) => {
  try {
    return (0).toLocaleString("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .replace(/\d/g, "")
      .trim();
  } catch {
    return "$";
  }
};

const getSpendRange = (ppMultiplier: number) => {
  const m = ppMultiplier || 1.0;
  const min = Math.round(20 * m);
  const max = Math.round(1000 * m);

  let step = 1;
  if (max > 10000) step = 100;
  else if (max > 1000) step = 10;
  else if (max > 100) step = 5;

  return { min, max, step };
};

export function ControlPanel({ values, setValues, origins }: ControlPanelProps) {
  const setField = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setValues({ ...values, [key]: value });
  };

  const currentOrigin = useMemo(() => 
    origins.find(o => o.code === values.origin_iso3) || { name: "United States", code: "USA", pp_multiplier: 1.0, currency: "USD" }
  , [origins, values.origin_iso3]);

  const symbol = useMemo(() => getCurrencySymbol(currentOrigin.currency), [currentOrigin.currency]);

  // Dynamically calculate sane slider ranges based on the local cost of living (PP Multiplier)
  const range = useMemo(
    () => getSpendRange(currentOrigin.pp_multiplier),
    [currentOrigin.pp_multiplier]
  );

  return (
    <aside className="fixed left-0 top-0 h-screen w-80 border-r border-white/10 bg-zinc-950/50 backdrop-blur-xl">
      <TooltipProvider delayDuration={150}>
        <div className="flex h-full flex-col gap-6 p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Travel Value Studio
          </p>
          <p className="mt-2 text-sm text-zinc-300">
            Global Arbitrage Engine
          </p>
        </div>

        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            My Profile
          </p>

          <label className="flex flex-col gap-2 text-sm text-zinc-200">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-zinc-400">
              <span>Home Country</span>
            </div>
            <select
              className="h-9 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/70"
              value={values.origin_iso3}
              onChange={(event) => {
                const nextOriginCode = event.target.value;
                const nextOrigin = origins.find((origin) => origin.code === nextOriginCode);
                const nextRange = getSpendRange(nextOrigin?.pp_multiplier ?? 1.0);
                const nextHomeSpend = Math.min(
                  nextRange.max,
                  Math.max(nextRange.min, values.home_spend)
                );

                setValues({
                  ...values,
                  origin_iso3: nextOriginCode,
                  home_spend: nextHomeSpend,
                });
              }}
            >
              {origins.length === 0 ? (
                <option value="USA">Loading countries...</option>
              ) : (
                origins.map((o) => (
                  <option key={o.code} value={o.code} className="bg-zinc-900 text-zinc-200">
                    {o.name}
                  </option>
                ))
              )}
            </select>
          </label>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-zinc-400">
              <div className="flex items-center gap-2">
                <span>Daily Budget at Home</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-zinc-500 hover:text-zinc-200">
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs border border-white/10 bg-zinc-950/90 text-xs text-zinc-100">
                    What do you typically spend per day in your home country? This is the reference for all destination cost estimates.
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="text-zinc-200">{symbol}{values.home_spend}</span>
            </div>
            <Slider
              min={range.min}
              max={range.max}
              step={range.step}
              value={[values.home_spend]}
              onValueChange={(value) => setField("home_spend", value[0] ?? range.min)}
              className="[&_[data-slot=slider-range]]:bg-white/40 [&_[data-slot=slider-thumb]]:border-white [&_[data-slot=slider-thumb]]:ring-white/20"
            />
            <div className="flex justify-between text-[9px] text-zinc-600 uppercase tracking-tighter">
              <span>Low</span>
              <span>Average</span>
              <span>Luxury</span>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Value Filters
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-zinc-400">
              <div className="flex items-center gap-2">
                <span>Budget Sensitivity</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Budget sensitivity info"
                      className="text-zinc-500 transition hover:text-zinc-200"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs border border-white/10 bg-zinc-950/90 text-xs text-zinc-100">
                    Higher = Aggressively penalizes expensive countries.
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="text-zinc-200">{values.budget_sens.toFixed(2)}</span>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.05}
              value={[values.budget_sens]}
              onValueChange={(value) => setField("budget_sens", value[0] ?? 0)}
              className="[&_[data-slot=slider-range]]:bg-emerald-500 [&_[data-slot=slider-thumb]]:border-emerald-500 [&_[data-slot=slider-thumb]]:ring-emerald-500/40"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-zinc-400">
              <div className="flex items-center gap-2">
                <span>Comfort Floor</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Comfort floor info"
                      className="text-zinc-500 transition hover:text-zinc-200"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs border border-white/10 bg-zinc-950/90 text-xs text-zinc-100">
                    Higher = Filters out underdeveloped regions; requires modern
                    infrastructure.
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="text-zinc-200">{values.comfort.toFixed(2)}</span>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.05}
              value={[values.comfort]}
              onValueChange={(value) => setField("comfort", value[0] ?? 0)}
              className="[&_[data-slot=slider-range]]:bg-emerald-400/70 [&_[data-slot=slider-thumb]]:border-emerald-300 [&_[data-slot=slider-thumb]]:ring-emerald-500/30"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-zinc-400">
              <div className="flex items-center gap-2">
                <span>Safety Priority</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Safety priority info"
                      className="text-zinc-500 transition hover:text-zinc-200"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs border border-white/10 bg-zinc-950/90 text-xs text-zinc-100">
                    Higher = Heavily penalizes political instability and crime
                    risk.
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="text-zinc-200">{values.risk_pri.toFixed(2)}</span>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.05}
              value={[values.risk_pri]}
              onValueChange={(value) => setField("risk_pri", value[0] ?? 0)}
              className="[&_[data-slot=slider-range]]:bg-indigo-500 [&_[data-slot=slider-thumb]]:border-indigo-400 [&_[data-slot=slider-thumb]]:ring-indigo-500/40"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-zinc-400">
              <div className="flex items-center gap-2">
                <span>Tourism Depth</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Tourism depth info"
                      className="text-zinc-500 transition hover:text-zinc-200"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs border border-white/10 bg-zinc-950/90 text-xs text-zinc-100">
                    Higher = Prefers established tourist hubs over remote/raw
                    destinations.
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="text-zinc-200">{values.supply_need.toFixed(2)}</span>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.05}
              value={[values.supply_need]}
              onValueChange={(value) => setField("supply_need", value[0] ?? 0)}
              className="[&_[data-slot=slider-range]]:bg-zinc-200/60 [&_[data-slot=slider-thumb]]:border-zinc-200 [&_[data-slot=slider-thumb]]:ring-white/20"
            />
          </div>
        </section>

        <section className="mt-auto space-y-3 border-t border-white/10 pt-4">
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-zinc-400">
            <div className="flex items-center gap-2">
              <span>Scarcity Premium</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Scarcity premium info"
                    className="text-zinc-500 transition hover:text-zinc-200"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs border border-white/10 bg-zinc-950/90 text-xs text-zinc-100">
                  Penalizes destinations with very low visitor numbers, assuming they have higher logistics costs (flights/imports) despite cheap local goods.
                </TooltipContent>
              </Tooltip>
            </div>
            <span className="text-zinc-200">{values.scarcity_k.toFixed(2)}</span>
          </div>
          <Slider
            min={0}
            max={1.5}
            step={0.05}
            value={[values.scarcity_k]}
            onValueChange={(value) => setField("scarcity_k", value[0] ?? 0)}
            className="[&_[data-slot=slider-range]]:bg-zinc-300 [&_[data-slot=slider-thumb]]:border-zinc-200 [&_[data-slot=slider-thumb]]:ring-white/20"
          />
        </section>
        </div>
      </TooltipProvider>
    </aside>
  );
}
