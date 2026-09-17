"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Database, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type SourceField = {
  field_name: string;
  label: string;
  source: string;
  indicator?: string | null;
  frequency: string;
  geographic_level: string;
  field_type: string;
  measures: string;
  caveat: string;
  recommended_confidence: string;
};

type MethodologySummary = {
  current_model_status?: string;
  known_limitations?: string[];
  product_question?: string;
  target_user?: string;
  scope?: string;
};

type MethodologyPanelProps = {
  apiUrl: (path: string) => string;
  isOpen: boolean;
  onClose: () => void;
};

const priorityFields = [
  "mobility",
  "mobility_gtfs_feed_count",
  "mobility_gtfs_official_feed_count",
  "digital_convenience",
  "digital_payments_pct",
  "digital_internet_users_pct",
  "digital_fixed_broadband_per_100",
  "digital_convenience_coverage",
  "amenity_depth",
  "amenity_rank_within_country",
  "amenity_total_per_10k",
  "amenity_query_success",
  "service_depth",
  "basic_comfort",
  "fx_opportunity",
  "ppp_private_lcu_per_int",
];

const components = [
  ["Structural purchasing power", "Broad destination purchasing power relative to the selected origin. This is the structural cheapness layer rather than a personal daily-budget estimate."],
  ["Basic comfort", "Phase 3 direct-services floor using water, sanitation, electricity, internet use and UHC service coverage."],
  ["Service depth", "Phase 4 country-level accommodation and established visitor-service supply, with WEF TTDI preferred over arrivals."],
  ["City amenity depth", "Phase 5 drill-down using harmonized urban centres and Overture POI density/diversity. It does not yet change the country ranking."],
  ["Mobility", "Phase 6 diagnostic. WEF Ground & Port Infrastructure provides the comparable baseline; MobilityDatabase GTFS matches are positive city evidence only. A missing feed is unknown, not bad transit."],
  ["Digital convenience", "Phase 6 country-level diagnostic combining internet use, fixed broadband, 2024 Global Findex digital-payment use and WEF ICT readiness."],
  ["FX opportunity", "Bilateral timing signal across 1W, 1M, 3M, 1Y and 3Y, capped so short-term currency moves cannot dominate structural value."],
  ["Quality-adjusted value", "The production country score remains the Phase 4 architecture until Phase 7 validates and rebuilds ranking weights using the newer city/usability evidence."],
] as const;

export function MethodologyPanel({ apiUrl, isOpen, onClose }: MethodologyPanelProps) {
  const [methodology, setMethodology] = useState<MethodologySummary | null>(null);
  const [sourceRegistry, setSourceRegistry] = useState<Record<string, SourceField>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || methodology) return;
    const controller = new AbortController();
    void Promise.resolve().then(() => !controller.signal.aborted && setIsLoading(true));
    Promise.all([
      fetch(apiUrl("/api/methodology"), { signal: controller.signal }).then((res) => res.json()),
      fetch(apiUrl("/api/source-registry"), { signal: controller.signal }).then((res) => res.json()),
    ])
      .then(([methodologyData, registryData]) => {
        setMethodology(methodologyData as MethodologySummary);
        setSourceRegistry(registryData as Record<string, SourceField>);
      })
      .finally(() => !controller.signal.aborted && setIsLoading(false));
    return () => controller.abort();
  }, [apiUrl, isOpen, methodology]);

  const sourceFields = useMemo(() => {
    const priority = priorityFields
      .map((field) => sourceRegistry[field])
      .filter((field): field is SourceField => Boolean(field));
    const prioritySet = new Set(priorityFields);
    const remaining = Object.values(sourceRegistry).filter((field) => !prioritySet.has(field.field_name));
    return [...priority, ...remaining].slice(0, 26);
  }, [sourceRegistry]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/75 p-4 backdrop-blur-sm sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl" initial={{ y: 28, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 28, scale: 0.98 }} onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Methodology · Phase 6</p>
                <h2 className="mt-1 text-xl font-semibold text-white">Where does my money buy the most usable life — and which cities make it easy to live?</h2>
              </div>
              <Button type="button" variant="outline" size="icon-sm" className="border-white/10 bg-white/5 text-zinc-300" onClick={onClose} aria-label="Close methodology"><X className="h-4 w-4" /></Button>
            </div>

            <div className="overflow-y-auto p-6">
              {isLoading && !methodology ? (
                <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-sm text-zinc-400">Loading methodology...</div>
              ) : (
                <div className="space-y-8">
                  <section className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 md:col-span-2">
                      <div className="flex items-start gap-3"><BookOpen className="mt-1 h-4 w-4 text-violet-400" /><div><h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-300">Current model</h3><p className="mt-2 text-sm leading-6 text-zinc-400">{methodology?.current_model_status ?? "Phase 6 country screening plus city amenity, mobility and digital diagnostics."}</p></div></div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-zinc-950/50 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Target use</p>
                      <p className="mt-2 text-xs leading-5 text-zinc-300">{methodology?.target_user ?? "Globally mobile foreign-currency holder considering a stay of several weeks to several months."}</p>
                    </div>
                  </section>

                  <section>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-300">Model components</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      {components.map(([label, text]) => <div key={label} className="rounded-lg border border-white/10 bg-white/5 p-4"><p className="text-sm font-semibold text-white">{label}</p><p className="mt-2 text-xs leading-5 text-zinc-400">{text}</p></div>)}
                    </div>
                  </section>

                  <section>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-300">Known limitations</h3>
                    <div className="grid gap-2 md:grid-cols-2">
                      {(methodology?.known_limitations ?? []).map((item) => <div key={item} className="rounded-lg border border-white/10 bg-zinc-950/50 p-3 text-xs leading-5 text-zinc-400">{item}</div>)}
                    </div>
                  </section>

                  <section>
                    <div className="mb-3 flex items-center gap-2"><Database className="h-4 w-4 text-blue-400" /><h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-300">Source registry snapshot</h3></div>
                    <div className="overflow-hidden rounded-lg border border-white/10">
                      <div className="grid grid-cols-[1.1fr_1fr_0.7fr] bg-zinc-950/80 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500"><span>Field</span><span>Source</span><span>Type</span></div>
                      {sourceFields.map((field) => <div key={field.field_name} className="grid grid-cols-[1.1fr_1fr_0.7fr] gap-4 border-t border-white/10 px-4 py-3 text-xs"><div><p className="font-medium text-zinc-100">{field.label}</p><p className="mt-1 text-[10px] text-zinc-500">{field.indicator ?? field.field_name}</p></div><p className="leading-5 text-zinc-400">{field.source}</p><div><p className="text-zinc-300">{field.field_type}</p><p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-zinc-500">{field.recommended_confidence}</p></div></div>)}
                    </div>
                  </section>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
