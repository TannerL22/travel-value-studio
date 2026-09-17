"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus, TrendingUp, Wallet, X } from "lucide-react";

import { type RankingRow } from "@/app/page";
import { Button } from "@/components/ui/button";

type DestinationModalProps = {
  country: RankingRow;
  isOpen: boolean;
  onClose: () => void;
  allResults: RankingRow[];
  imageUrl?: string;
  onCompare: (country: RankingRow) => void;
  isComparing: boolean;
};

type ComponentRow = {
  label: string;
  value: number | null | undefined;
  note: string;
};

const clampScore = (value: number | null | undefined) => {
  if (value == null || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100, value));
};

const formatFxPercent = (value: number | null | undefined) => {
  if (value == null || !Number.isFinite(value)) return "N/A";
  const rounded = Math.round(value);
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
};

function ComponentBar({ label, value, note }: ComponentRow) {
  const score = clampScore(value);
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <div className="mb-1.5 flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.16em]">
        <span className="truncate text-zinc-400">{label}</span>
        <span className="shrink-0 font-semibold text-zinc-100">{score == null ? "N/A" : Math.round(score)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
        <div className="h-full rounded-full bg-white/70" style={{ width: `${score ?? 0}%` }} />
      </div>
      <p className="mt-2 text-[10px] leading-4 text-zinc-500">{note}</p>
    </div>
  );
}

export function DestinationModal({
  country,
  isOpen,
  onClose,
  allResults,
  imageUrl,
  onCompare,
  isComparing,
}: DestinationModalProps) {
  if (!isOpen) return null;

  const purchasingPower = country.structural_purchasing_power ?? country.value_multiplier_relative ?? null;
  const quality = ((country.service_depth ?? country.component_tourism_depth ?? 0) + (country.stability ?? country.component_safety_stability ?? 0)) / 200;
  const similar = allResults
    .filter((r) => r.iso3 !== country.iso3)
    .map((r) => ({
      ...r,
      qDiff: Math.abs(
        (((r.service_depth ?? r.component_tourism_depth ?? 0) + (r.stability ?? r.component_safety_stability ?? 0)) / 200) - quality
      ),
    }))
    .sort((a, b) => a.qDiff - b.qDiff)
    .slice(0, 3);

  const betterValue = allResults
    .filter((r) => r.iso3 !== country.iso3)
    .filter((r) => (r.quality_adjusted_value ?? r.Score ?? r.score ?? 0) > (country.quality_adjusted_value ?? country.Score ?? country.score ?? 0))
    .slice(0, 3);

  const components: ComponentRow[] = [
    {
      label: "FX Opportunity",
      value: country.fx_opportunity ?? country.component_fx_tailwind,
      note: "Origin-aware historical FX diagnostic where available. Phase 2 will add shorter horizons and make this directly affect ranking.",
    },
    {
      label: "PPP Advantage",
      value: country.component_ppp_advantage,
      note: "Broad local-price advantage from market FX versus private-consumption PPP.",
    },
    {
      label: "Basic Comfort",
      value: country.basic_comfort ?? country.component_comfort_floor,
      note: "Phase 1 still uses the legacy GDP-PPP development floor as a proxy.",
    },
    {
      label: "Service Depth",
      value: country.service_depth ?? country.component_tourism_depth,
      note: "Phase 1 still relies mainly on international arrivals as a service-availability proxy.",
    },
    {
      label: "Stability",
      value: country.stability ?? country.component_safety_stability,
      note: "Currently WGI-led political stability; not a complete personal-safety or crime measure.",
    },
    {
      label: "Quality-Adjusted Value",
      value: country.quality_adjusted_value ?? country.component_overall_value ?? country.Score,
      note: "Current production score, relabelled accurately in Phase 1; scoring architecture is rebuilt in later phases.",
    },
  ];

  const fxSource = country.component_fx_tailwind_source === "origin_historical_fx"
    ? "Origin FX"
    : country.component_fx_tailwind_source === "usd_historical_fx"
      ? "USD FX"
      : "Model proxy";
  const hasOriginFx =
    country.component_fx_tailwind_source === "origin_historical_fx" &&
    country.fx_tailwind_origin_source === "HISTORICAL_CROSS" &&
    country.fx_tailwind_origin_currency;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl sm:flex-row"
        >
          <div className="relative h-64 w-full sm:h-auto sm:w-2/5">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: imageUrl ? `url(${imageUrl})` : "none" }}>
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent" />
            </div>
            <button onClick={onClose} className="absolute left-4 top-4 rounded-full bg-black/40 p-2 text-white hover:bg-black/60" aria-label="Close destination detail">
              <X className="h-5 w-5" />
            </button>
            <div className="absolute bottom-6 left-6 right-6">
              <h2 className="mb-1 text-4xl font-bold text-white">{country.country}</h2>
              <div className="flex items-center gap-2 text-zinc-300">
                <span className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Rank #{allResults.findIndex((r) => r.iso3 === country.iso3) + 1}</span>
                <span className="text-zinc-500">/</span>
                <span className="text-sm">{country.iso3}</span>
              </div>
            </div>
          </div>

          <div className="w-full overflow-y-auto p-6 sm:w-3/5 sm:p-8">
            <div className="mb-7 flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-xs uppercase tracking-[0.2em] text-zinc-500">Structural Purchasing Power</p>
                <div className="flex items-center gap-2 text-emerald-400">
                  <Wallet className="h-5 w-5" />
                  <p className="text-3xl font-bold text-white">{purchasingPower != null ? `${purchasingPower.toFixed(2)}x` : "N/A"}</p>
                </div>
                <p className="mt-2 max-w-md text-xs leading-5 text-zinc-400">
                  Broad destination consumption relative to your selected origin. This is a purchasing-power index, not a predicted personal daily budget.
                </p>
              </div>
              <Button
                onClick={() => onCompare(country)}
                variant={isComparing ? "secondary" : "outline"}
                className={`h-10 gap-2 rounded-full border-white/10 px-4 ${isComparing ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-zinc-300"}`}
              >
                {isComparing ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {isComparing ? "Comparing" : "Compare"}
              </Button>
            </div>

            <div className="mb-7 rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300">FX Opportunity</p>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-zinc-400">{fxSource}</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-zinc-300">
                {hasOriginFx ? country.fx_tailwind_origin_interpretation : country.fx_tailwind_interpretation ?? "FX tailwind is using the current model proxy."}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-md bg-white/5 p-2">
                  <p className="text-[9px] uppercase tracking-[0.12em] text-zinc-500">1Y move</p>
                  <p className="mt-1 font-semibold text-white">{formatFxPercent(hasOriginFx ? country.fx_tailwind_origin_1y_pct : country.fx_tailwind_1y_pct)}</p>
                </div>
                <div className="rounded-md bg-white/5 p-2">
                  <p className="text-[9px] uppercase tracking-[0.12em] text-zinc-500">3Y move</p>
                  <p className="mt-1 font-semibold text-white">{formatFxPercent(hasOriginFx ? country.fx_tailwind_origin_3y_pct : country.fx_tailwind_3y_pct)}</p>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-4">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Current Components</h3>
                <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-300">
                  Data {country.data_quality_grade ?? "N/A"} {country.data_quality_score != null ? Math.round(country.data_quality_score) : ""}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {components.map((component) => <ComponentBar key={component.label} {...component} />)}
              </div>
            </div>

            <div className="mt-7">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">Similar Profile</h3>
              <div className="grid grid-cols-3 gap-2">
                {similar.map((r) => (
                  <div key={r.iso3} className="rounded-lg border border-white/5 bg-white/5 p-2 text-center">
                    <p className="truncate text-[10px] font-medium text-white">{r.country}</p>
                    <p className="text-[9px] text-zinc-500">{(r.structural_purchasing_power ?? r.value_multiplier_relative) != null ? `${(r.structural_purchasing_power ?? r.value_multiplier_relative)!.toFixed(2)}x PP` : "PP N/A"}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-7">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                <TrendingUp className="h-3 w-3 text-emerald-500" /> Higher Current Value Score
              </h3>
              <div className="space-y-2">
                {betterValue.map((r) => (
                  <div key={r.iso3} className="flex items-center justify-between rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-3">
                    <p className="text-xs font-medium text-white">{r.country}</p>
                    <p className="text-xs font-bold text-emerald-400">Score {Math.round(r.quality_adjusted_value ?? r.Score ?? 0)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
