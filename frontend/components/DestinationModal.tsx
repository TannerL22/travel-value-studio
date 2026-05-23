"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, Building2, Wallet, TrendingUp, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type RankingRow } from "@/app/page";

type DestinationModalProps = {
  country: RankingRow;
  isOpen: boolean;
  onClose: () => void;
  allResults: RankingRow[];
  imageUrl?: string;
  currencySymbol: string;
  onCompare: (country: RankingRow) => void;
  isComparing: boolean;
};

type ComponentRow = {
  label: string;
  value: number | null | undefined;
  tone: string;
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

function ComponentBar({ label, value, tone }: ComponentRow) {
  const score = clampScore(value);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.16em]">
        <span className="truncate text-zinc-500">{label}</span>
        <span className="shrink-0 font-semibold text-zinc-200">
          {score == null ? "N/A" : Math.round(score)}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full rounded-full ${tone}`}
          style={{ width: `${score ?? 0}%` }}
        />
      </div>
    </div>
  );
}

export function DestinationModal({
  country,
  isOpen,
  onClose,
  allResults,
  imageUrl,
  currencySymbol,
  onCompare,
  isComparing
}: DestinationModalProps) {
  if (!isOpen) return null;

  const currentCost = country.est_daily_cost ?? 0;

  // Find similar countries: Same "Quality" (Infra + Safety) but potentially different price/score
  const quality = ((country.score_infra ?? 0) + (country.score_safety ?? 0)) / 2;
  const similar = allResults
    .filter((r) => r.iso3 !== country.iso3)
    .map((r) => ({
      ...r,
      qDiff: Math.abs(((r.score_infra ?? 0) + (r.score_safety ?? 0)) / 2 - quality)
    }))
    .sort((a, b) => a.qDiff - b.qDiff)
    .slice(0, 3);

  // Find better value: Higher overall Score, similar or better Quality
  const betterValue = allResults
    .filter((r) => r.iso3 !== country.iso3 && (r.Score ?? r.score ?? 0) > (country.Score ?? country.score ?? 0))
    .filter((r) => ((r.score_infra ?? 0) + (r.score_safety ?? 0)) / 2 >= quality * 0.9)
    .slice(0, 3);

  const components: ComponentRow[] = [
    {
      label: "FX Tailwind",
      value: country.component_fx_tailwind,
      tone: "bg-cyan-400",
    },
    {
      label: "PPP Advantage",
      value: country.component_ppp_advantage,
      tone: "bg-emerald-500",
    },
    {
      label: "Comfort Floor",
      value: country.component_comfort_floor,
      tone: "bg-violet-400",
    },
    {
      label: "Tourism Depth",
      value: country.component_tourism_depth,
      tone: "bg-blue-400",
    },
    {
      label: "Safety / Stability",
      value: country.component_safety_stability,
      tone: "bg-lime-400",
    },
    {
      label: "Overall Value",
      value: country.component_overall_value ?? country.Score,
      tone: "bg-white",
    },
  ];

  const qualityScore = clampScore(country.data_quality_score);
  const qualityFlags = country.data_quality_flags ?? [];
  const fxComponentSource =
    country.component_fx_tailwind_source === "historical_fx"
      ? "Historical FX"
      : "Model proxy";
  const fxReferenceLabel =
    country.fx_frankfurter_date && country.fx_frankfurter_1y_date && country.fx_frankfurter_3y_date
      ? `${country.fx_frankfurter_date} vs ${country.fx_frankfurter_1y_date} / ${country.fx_frankfurter_3y_date}`
      : "Historical references unavailable";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl flex flex-col sm:flex-row"
        >
          {/* Left Side: Visual & Quick Stats */}
          <div className="w-full sm:w-1/2 relative h-64 sm:h-auto">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${imageUrl})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent" />
            </div>
            
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="absolute bottom-6 left-6 right-6">
              <h2 className="text-4xl font-bold text-white mb-1">{country.country}</h2>
              <div className="flex items-center gap-2 text-zinc-300">
                <span className="text-sm uppercase tracking-widest text-emerald-400 font-semibold">
                  Rank #{allResults.findIndex(r => r.iso3 === country.iso3) + 1}
                </span>
                <span className="text-zinc-500">/</span>
                <span className="text-sm">{country.iso3}</span>
              </div>
            </div>
          </div>

          {/* Right Side: Deep Dive Content */}
          <div className="w-full sm:w-1/2 p-6 sm:p-8 overflow-y-auto">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-1">Estimated Cost</p>
                <p className="text-3xl font-bold text-white">{currencySymbol}{Math.round(currentCost)}<span className="text-sm font-normal text-zinc-400"> / day</span></p>
              </div>
              <Button
                onClick={() => onCompare(country)}
                variant={isComparing ? "secondary" : "outline"}
                className={`gap-2 h-10 px-4 rounded-full border-white/10 ${isComparing ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-zinc-300'}`}
              >
                {isComparing ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {isComparing ? "Comparing" : "Compare"}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5" /> Safety
                    </span>
                    <span className="text-white font-medium">{Math.round((country.score_safety ?? 0) * 100)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${(country.score_safety ?? 0) * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5" /> Infrastructure
                    </span>
                    <span className="text-white font-medium">{Math.round((country.score_infra ?? 0) * 100)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${(country.score_infra ?? 0) * 100}%` }} />
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                  <Wallet className="h-4 w-4" />
                  <span className="text-xl font-bold">{country.value_multiplier_relative?.toFixed(2)}x</span>
                </div>
                <p className="text-[10px] text-zinc-500 leading-tight uppercase tracking-wider">
                  Relative Value Power
                </p>
                <p className="mt-2 text-[9px] text-zinc-400 italic">
                  Your money goes {country.value_multiplier_relative?.toFixed(2)}x further than at home.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="mb-3 flex items-center justify-between gap-4">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                    Value Components
                  </h3>
                  <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-300">
                    Data {country.data_quality_grade ?? "N/A"}
                    {qualityScore != null ? ` ${Math.round(qualityScore)}` : ""}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {components.map((component) => (
                    <ComponentBar
                      key={component.label}
                      label={component.label}
                      value={component.value}
                      tone={component.tone}
                    />
                  ))}
                </div>
                <div className="mt-4 rounded-lg border border-white/10 bg-zinc-950/50 p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300">
                      FX Diagnostic
                    </p>
                    <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-zinc-400">
                      {fxComponentSource}
                    </span>
                  </div>
                  <p className="text-xs leading-5 text-zinc-300">
                    {country.fx_tailwind_interpretation ?? "FX tailwind is using the current model proxy."}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-md bg-white/5 p-2">
                      <p className="text-[9px] uppercase tracking-[0.12em] text-zinc-500">1Y USD move</p>
                      <p className="mt-1 font-semibold text-white">{formatFxPercent(country.fx_tailwind_1y_pct)}</p>
                    </div>
                    <div className="rounded-md bg-white/5 p-2">
                      <p className="text-[9px] uppercase tracking-[0.12em] text-zinc-500">3Y USD move</p>
                      <p className="mt-1 font-semibold text-white">{formatFxPercent(country.fx_tailwind_3y_pct)}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] leading-4 text-zinc-500">{fxReferenceLabel}</p>
                </div>
                {qualityFlags.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {qualityFlags.slice(0, 4).map((flag) => (
                      <span
                        key={flag}
                        className="rounded-full border border-white/10 bg-zinc-950/60 px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-zinc-500"
                      >
                        {flag.replaceAll("_", " ")}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Similar Destinations</h3>
                <div className="grid grid-cols-3 gap-2">
                  {similar.map((r) => (
                    <div key={r.iso3} className="bg-white/5 rounded-lg p-2 text-center border border-white/5 hover:border-white/10 transition-colors">
                      <p className="text-[10px] font-medium text-white truncate">{r.country}</p>
                      <p className="text-[9px] text-zinc-500">{currencySymbol}{Math.round(r.est_daily_cost ?? 0)}/day</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-3 w-3 text-emerald-500" /> Better Value Alternatives
                </h3>
                <div className="space-y-2">
                  {betterValue.map((r) => (
                    <div key={r.iso3} className="flex items-center justify-between bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/10">
                      <div>
                        <p className="text-xs font-medium text-white">{r.country}</p>
                        <p className="text-[10px] text-zinc-500">Similar quality, better price score.</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-emerald-400">Score {Math.round(r.Score ?? 0)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
