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

type DetailRow = RankingRow & {
  fx_opportunity_signal?: number | null;
  fx_opportunity_multiplier?: number | null;
  fx_opportunity_coverage?: number | null;
  fx_opportunity_source?: string | null;
  fx_opportunity_interpretation?: string | null;
  fx_opportunity_latest_date?: string | null;
  fx_opportunity_1w_pct?: number | null;
  fx_opportunity_1m_pct?: number | null;
  fx_opportunity_3m_pct?: number | null;
  fx_opportunity_1y_pct?: number | null;
  fx_opportunity_3y_pct?: number | null;
  fx_opportunity_1w_date?: string | null;
  fx_opportunity_1m_date?: string | null;
  fx_opportunity_3m_date?: string | null;
  fx_opportunity_1y_date?: string | null;
  fx_opportunity_3y_date?: string | null;
  basic_comfort_direct?: number | null;
  basic_comfort_coverage?: number | null;
  basic_comfort_source?: string | null;
  basic_comfort_penalty?: number | null;
  comfort_water_score?: number | null;
  comfort_sanitation_score?: number | null;
  comfort_electricity_score?: number | null;
  comfort_internet_score?: number | null;
  comfort_health_score?: number | null;
  service_depth_direct?: number | null;
  service_depth_coverage?: number | null;
  service_depth_source?: string | null;
  service_depth_reference_year?: number | null;
  service_depth_penalty?: number | null;
  service_depth_requirement_threshold?: number | null;
  service_depth_ttdi_2024_value?: number | null;
  service_depth_ttdi_2024_rank?: number | null;
  service_depth_arrivals_per_100?: number | null;
  service_depth_arrivals_fallback_score?: number | null;
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
  const rounded = Math.round(value * 10) / 10;
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
};

const formatMultiplierImpact = (value: number | null | undefined) => {
  if (value == null || !Number.isFinite(value)) return "N/A";
  return formatFxPercent((value - 1) * 100);
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

export function DestinationModal({ country, isOpen, onClose, allResults, imageUrl, onCompare, isComparing }: DestinationModalProps) {
  if (!isOpen) return null;

  const detail = country as DetailRow;
  const purchasingPower = country.structural_purchasing_power ?? country.value_multiplier_relative ?? null;
  const quality = ((country.service_depth ?? country.component_tourism_depth ?? 0) + (country.stability ?? country.component_safety_stability ?? 0)) / 200;
  const similar = allResults
    .filter((row) => row.iso3 !== country.iso3)
    .map((row) => ({
      ...row,
      qDiff: Math.abs((((row.service_depth ?? row.component_tourism_depth ?? 0) + (row.stability ?? row.component_safety_stability ?? 0)) / 200) - quality),
    }))
    .sort((a, b) => a.qDiff - b.qDiff)
    .slice(0, 3);
  const betterValue = allResults
    .filter((row) => row.iso3 !== country.iso3)
    .filter((row) => (row.quality_adjusted_value ?? row.Score ?? row.score ?? 0) > (country.quality_adjusted_value ?? country.Score ?? country.score ?? 0))
    .slice(0, 3);

  const components: ComponentRow[] = [
    {
      label: "FX Opportunity",
      value: country.fx_opportunity ?? country.component_fx_tailwind,
      note: "Bilateral 1W/1M/3M/1Y/3Y timing signal. It affects ranking through a bounded overlay.",
    },
    {
      label: "PPP Advantage",
      value: country.component_ppp_advantage,
      note: "Broad local-price advantage from market FX versus private-consumption PPP.",
    },
    {
      label: "Basic Comfort",
      value: country.basic_comfort ?? country.component_comfort_floor,
      note: "Phase 3 direct-services composite: water, sanitation, electricity, internet and health, with GDP PPP only as a missing-data fallback.",
    },
    {
      label: "Service Depth",
      value: country.service_depth ?? country.component_tourism_depth,
      note: "Phase 4 supply signal. WEF TTDI Tourist Services & Infrastructure is preferred; arrivals per resident are only a reduced-confidence fallback.",
    },
    {
      label: "Stability",
      value: country.stability ?? country.component_safety_stability,
      note: "WGI-led political stability; not a complete personal-safety or crime measure.",
    },
    {
      label: "Quality-Adjusted Value",
      value: country.quality_adjusted_value ?? country.component_overall_value ?? country.Score,
      note: "Structural value after Basic Comfort and Service Depth shortfall penalties plus the bounded FX timing overlay.",
    },
  ];

  const fxSource = detail.fx_opportunity_source === "frankfurter_v2_origin_cross"
    ? "Frankfurter v2 · origin cross"
    : detail.fx_opportunity_source === "legacy_historical_fx"
      ? "Legacy historical FX"
      : "Unavailable";
  const horizons = [
    ["1W", detail.fx_opportunity_1w_pct, detail.fx_opportunity_1w_date],
    ["1M", detail.fx_opportunity_1m_pct, detail.fx_opportunity_1m_date],
    ["3M", detail.fx_opportunity_3m_pct, detail.fx_opportunity_3m_date],
    ["1Y", detail.fx_opportunity_1y_pct, detail.fx_opportunity_1y_date],
    ["3Y", detail.fx_opportunity_3y_pct, detail.fx_opportunity_3y_date],
  ] as const;
  const comfortPillars = [
    ["Water", detail.comfort_water_score],
    ["Sanitation", detail.comfort_sanitation_score],
    ["Electricity", detail.comfort_electricity_score],
    ["Internet", detail.comfort_internet_score],
    ["Health", detail.comfort_health_score],
  ] as const;
  const comfortSource = detail.basic_comfort_source === "direct_services"
    ? "Direct services"
    : detail.basic_comfort_source === "blended_direct_legacy"
      ? "Direct + legacy fallback"
      : "Legacy fallback";
  const serviceSource = detail.service_depth_source === "wef_ttdi_2024_tourist_services"
    ? "WEF TTDI 2024"
    : detail.service_depth_source === "arrivals_per_capita_fallback"
      ? "Arrivals fallback"
      : "Unavailable";
  const serviceEvidence = detail.service_depth_ttdi_2024_value != null
    ? `${detail.service_depth_ttdi_2024_value.toFixed(2)} / 7 TTDI`
    : detail.service_depth_arrivals_per_100 != null
      ? `${detail.service_depth_arrivals_per_100.toFixed(1)} arrivals / 100 residents`
      : "N/A";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl sm:flex-row">
          <div className="relative h-64 w-full sm:h-auto sm:w-2/5">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: imageUrl ? `url(${imageUrl})` : "none" }}>
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent" />
            </div>
            <button onClick={onClose} className="absolute left-4 top-4 rounded-full bg-black/40 p-2 text-white hover:bg-black/60" aria-label="Close destination detail"><X className="h-5 w-5" /></button>
            <div className="absolute bottom-6 left-6 right-6">
              <h2 className="mb-1 text-4xl font-bold text-white">{country.country}</h2>
              <div className="flex items-center gap-2 text-zinc-300">
                <span className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Rank #{allResults.findIndex((row) => row.iso3 === country.iso3) + 1}</span>
                <span className="text-zinc-500">/</span><span className="text-sm">{country.iso3}</span>
              </div>
            </div>
          </div>

          <div className="w-full overflow-y-auto p-6 sm:w-3/5 sm:p-8">
            <div className="mb-7 flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-xs uppercase tracking-[0.2em] text-zinc-500">Structural Purchasing Power</p>
                <div className="flex items-center gap-2 text-emerald-400"><Wallet className="h-5 w-5" /><p className="text-3xl font-bold text-white">{purchasingPower != null ? `${purchasingPower.toFixed(2)}x` : "N/A"}</p></div>
                <p className="mt-2 max-w-md text-xs leading-5 text-zinc-400">Broad destination consumption relative to your selected origin. This is a purchasing-power index, not a predicted personal daily budget.</p>
              </div>
              <Button onClick={() => onCompare(country)} variant={isComparing ? "secondary" : "outline"} className={`h-10 gap-2 rounded-full border-white/10 px-4 ${isComparing ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-zinc-300"}`}>
                {isComparing ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{isComparing ? "Comparing" : "Compare"}
              </Button>
            </div>

            <div className="mb-7 rounded-xl border border-violet-400/10 bg-violet-400/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-300">Basic Comfort · Phase 3</p><p className="mt-1 text-xs text-zinc-300">Does cheapness translate into a credible modern baseline?</p></div>
                <span className="rounded-full bg-white/5 px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-zinc-400">{comfortSource}</span>
              </div>
              <div className="mt-3 grid grid-cols-5 gap-2">
                {comfortPillars.map(([label, score]) => (
                  <div key={label} className="rounded-md bg-white/5 p-2 text-center">
                    <p className="text-[9px] uppercase tracking-[0.1em] text-zinc-500">{label}</p>
                    <p className="mt-1 text-xs font-semibold text-white">{score != null ? Math.round(score) : "N/A"}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
                <div className="rounded-md border border-white/5 p-2"><p className="uppercase tracking-[0.12em] text-zinc-500">Comfort score</p><p className="mt-1 font-semibold text-white">{detail.basic_comfort != null ? Math.round(detail.basic_comfort) : "N/A"}</p></div>
                <div className="rounded-md border border-white/5 p-2"><p className="uppercase tracking-[0.12em] text-zinc-500">Direct coverage</p><p className="mt-1 font-semibold text-white">{detail.basic_comfort_coverage != null ? `${Math.round(detail.basic_comfort_coverage * 100)}%` : "N/A"}</p></div>
                <div className="rounded-md border border-white/5 p-2"><p className="uppercase tracking-[0.12em] text-zinc-500">Rank impact</p><p className="mt-1 font-semibold text-white">{detail.basic_comfort_penalty != null ? formatFxPercent((detail.basic_comfort_penalty - 1) * 100) : "N/A"}</p></div>
              </div>
              <p className="mt-3 text-[10px] leading-4 text-zinc-500">Pillars saturate once a strong baseline is reached, so already-excellent countries do not receive endless development bonuses. Missing direct evidence blends toward the legacy GDP-PPP proxy rather than being scored as zero.</p>
            </div>

            <div className="mb-7 rounded-xl border border-blue-400/10 bg-blue-400/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-300">Service Depth · Phase 4</p><p className="mt-1 text-xs text-zinc-300">Can cheapness be converted into readily available accommodation and established services?</p></div>
                <span className="rounded-full bg-white/5 px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-zinc-400">{serviceSource}</span>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 text-[10px]">
                <div className="rounded-md border border-white/5 p-2"><p className="uppercase tracking-[0.12em] text-zinc-500">Service score</p><p className="mt-1 font-semibold text-white">{detail.service_depth != null ? Math.round(detail.service_depth) : "N/A"}</p></div>
                <div className="rounded-md border border-white/5 p-2"><p className="uppercase tracking-[0.12em] text-zinc-500">Evidence</p><p className="mt-1 font-semibold text-white">{serviceEvidence}</p></div>
                <div className="rounded-md border border-white/5 p-2"><p className="uppercase tracking-[0.12em] text-zinc-500">Coverage</p><p className="mt-1 font-semibold text-white">{detail.service_depth_coverage != null ? `${Math.round(detail.service_depth_coverage * 100)}%` : "N/A"}</p></div>
                <div className="rounded-md border border-white/5 p-2"><p className="uppercase tracking-[0.12em] text-zinc-500">Rank impact</p><p className="mt-1 font-semibold text-white">{detail.service_depth_penalty != null ? formatFxPercent((detail.service_depth_penalty - 1) * 100) : "N/A"}</p></div>
              </div>
              <p className="mt-3 text-[10px] leading-4 text-zinc-500">WEF TTDI 2024 is the preferred country-level supply benchmark. Arrivals per resident are used only outside TTDI coverage and receive 45% evidence weight. Missing evidence is neutral. Reference year: {detail.service_depth_reference_year ?? "N/A"}.</p>
            </div>

            <div className="mb-7 rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300">FX Opportunity · Phase 2</p><p className="mt-1 text-xs text-zinc-300">{detail.fx_opportunity_interpretation ?? "FX opportunity unavailable"}</p></div>
                <span className="rounded-full bg-white/5 px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-zinc-400">{fxSource}</span>
              </div>
              <div className="mt-3 grid grid-cols-5 gap-2">
                {horizons.map(([label, move, referenceDate]) => <div key={label} className="rounded-md bg-white/5 p-2 text-center" title={referenceDate ?? undefined}><p className="text-[9px] uppercase tracking-[0.12em] text-zinc-500">{label}</p><p className="mt-1 text-xs font-semibold text-white">{formatFxPercent(move)}</p></div>)}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
                <div className="rounded-md border border-white/5 p-2"><p className="uppercase tracking-[0.12em] text-zinc-500">FX score</p><p className="mt-1 font-semibold text-white">{detail.fx_opportunity != null ? Math.round(detail.fx_opportunity) : "N/A"}</p></div>
                <div className="rounded-md border border-white/5 p-2"><p className="uppercase tracking-[0.12em] text-zinc-500">Rank impact</p><p className="mt-1 font-semibold text-white">{formatMultiplierImpact(detail.fx_opportunity_multiplier)}</p></div>
                <div className="rounded-md border border-white/5 p-2"><p className="uppercase tracking-[0.12em] text-zinc-500">Coverage</p><p className="mt-1 font-semibold text-white">{detail.fx_opportunity_coverage != null ? `${Math.round(detail.fx_opportunity_coverage * 100)}%` : "N/A"}</p></div>
              </div>
              <p className="mt-3 text-[10px] leading-4 text-zinc-500">Positive moves mean your selected origin currency buys more destination currency than at that reference point. Latest reference: {detail.fx_opportunity_latest_date ?? "N/A"}. The ranking overlay is capped so FX timing cannot dominate structural value.</p>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-4"><h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Current Components</h3><div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-300">Data {country.data_quality_grade ?? "N/A"} {country.data_quality_score != null ? Math.round(country.data_quality_score) : ""}</div></div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{components.map((component) => <ComponentBar key={component.label} {...component} />)}</div>
            </div>

            <div className="mt-7"><h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">Similar Profile</h3><div className="grid grid-cols-3 gap-2">{similar.map((row) => <div key={row.iso3} className="rounded-lg border border-white/5 bg-white/5 p-2 text-center"><p className="truncate text-[10px] font-medium text-white">{row.country}</p><p className="text-[9px] text-zinc-500">{(row.structural_purchasing_power ?? row.value_multiplier_relative) != null ? `${(row.structural_purchasing_power ?? row.value_multiplier_relative)!.toFixed(2)}x PP` : "PP N/A"}</p></div>)}</div></div>

            <div className="mt-7"><h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-500"><TrendingUp className="h-3 w-3 text-emerald-500" /> Higher Current Value Score</h3><div className="space-y-2">{betterValue.map((row) => <div key={row.iso3} className="flex items-center justify-between rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-3"><p className="text-xs font-medium text-white">{row.country}</p><p className="text-xs font-bold text-emerald-400">Score {Math.round(row.quality_adjusted_value ?? row.Score ?? 0)}</p></div>)}</div></div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
