"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus, Wallet, X } from "lucide-react";

import { CityIntelligencePanel } from "@/components/CityIntelligencePanel";
import { Button } from "@/components/ui/button";
import type { RankingRow } from "@/lib/types";

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

  const purchasingPower = country.structural_purchasing_power ?? country.value_multiplier_relative ?? null;
  const rank = country.rank ?? (allResults.findIndex((row) => row.iso3 === country.iso3) + 1 || null);
  const components: ComponentRow[] = [
    {
      label: "FX Opportunity",
      value: country.fx_opportunity ?? country.component_fx_tailwind,
      note: "Current bilateral currency timing signal. The production effect remains bounded.",
    },
    {
      label: "Basic Comfort",
      value: country.basic_comfort ?? country.component_comfort_floor,
      note: "Water, sanitation, electricity, internet and health-service baseline.",
    },
    {
      label: "Service Depth",
      value: country.service_depth ?? country.component_tourism_depth,
      note: "Country-level accommodation and established visitor-service supply.",
    },
    {
      label: "Stability",
      value: country.stability ?? country.component_safety_stability,
      note: "WGI-led political stability; not a complete personal-safety measure.",
    },
    {
      label: "Quality-Adjusted Value",
      value: country.quality_adjusted_value ?? country.component_overall_value ?? country.Score,
      note: "Phase 7 production value score after preference-controlled shortfall penalties and FX timing.",
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, scale: 0.97, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 16 }} className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl md:flex-row">
          <div className="relative h-48 w-full md:h-auto md:w-2/5">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: imageUrl ? `url(${imageUrl})` : "none" }}>
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent" />
            </div>
            <button onClick={onClose} className="absolute left-4 top-4 rounded-full bg-black/40 p-2 text-white hover:bg-black/60" aria-label="Close destination detail"><X className="h-5 w-5" /></button>
            <div className="absolute bottom-5 left-5 right-5 sm:bottom-6 sm:left-6 sm:right-6">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">{country.country ?? country.iso3}</h2>
              <div className="mt-2 flex items-center gap-2 text-sm text-zinc-300">
                {rank ? <span className="font-semibold uppercase tracking-widest text-emerald-400">Rank #{rank}</span> : null}
                <span className="text-zinc-500">{country.iso3 ?? ""}</span>
              </div>
            </div>
          </div>

          <div className="w-full overflow-y-auto p-5 sm:p-7 md:w-3/5 md:p-8">
            <div className="mb-7 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Structural purchasing power</p>
                <div className="mt-1 flex items-center gap-2"><Wallet className="h-5 w-5 text-emerald-400" /><p className="text-3xl font-bold text-white">{purchasingPower != null ? `${purchasingPower.toFixed(2)}x` : "N/A"}</p></div>
                <p className="mt-2 max-w-md text-xs leading-5 text-zinc-400">Broad destination consumption relative to your selected reference market. This is an index, not a predicted personal daily budget.</p>
              </div>
              <Button onClick={() => onCompare(country)} variant={isComparing ? "secondary" : "outline"} className={`h-10 shrink-0 gap-2 rounded-full border-white/10 px-4 ${isComparing ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-zinc-300"}`}>
                {isComparing ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{isComparing ? "Comparing" : "Compare"}
              </Button>
            </div>

            <div className="mb-7">
              <div className="mb-3 flex items-center justify-between gap-4">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Current evidence</h3>
                <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-300">Data {country.data_quality_grade ?? "N/A"} {country.data_quality_score != null ? Math.round(country.data_quality_score) : ""}</div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{components.map((component) => <ComponentBar key={component.label} {...component} />)}</div>
            </div>

            <CityIntelligencePanel iso3={country.iso3} />

            <div className="rounded-lg border border-white/10 bg-zinc-950/40 p-3 text-[10px] leading-5 text-zinc-500">
              Frontend v2 is being rebuilt in phases. This compatibility detail view remains available during the shell migration and will be replaced by the dedicated country page in Phase 5.
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
