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
  "structural_value_factor",
  "stability_penalty",
  "city_usability",
  "city_usability_coverage",
  "mobility",
  "digital_convenience",
  "amenity_depth",
  "service_depth",
  "basic_comfort",
  "fx_opportunity",
  "legacy_score_pre_phase7",
  "ppp_private_lcu_per_int",
];

const components = [
  ["Structural purchasing power", "Phase 7 now anchors ranking directly to current origin-relative private-consumption purchasing power. The ratio is symmetrically saturated before it becomes a ranking factor, so extreme PPP/FX observations cannot dominate indefinitely."],
  ["Basic comfort", "Phase 3 direct-services floor using water, sanitation, electricity, internet use and UHC service coverage. It acts as a preference-controlled shortfall penalty rather than a rich-country bonus."],
  ["Service depth", "Phase 4 accommodation / visitor-service supply. WEF TTDI is preferred; arrivals per resident remain only a lower-confidence fallback."],
  ["Stability", "Phase 7 applies WGI-led stability as an explicit shortfall penalty. Stability Priority = 0 is exactly neutral, and missing evidence is not treated as poor stability."],
  ["FX opportunity", "The Phase 2 1W / 1M / 3M / 1Y / 3Y bilateral timing overlay remains last and bounded, so recent currency moves cannot overwhelm structural value."],
  ["City amenity depth", "Phase 5 direct city POI density/diversity signal from GHS-WUP urban centres and Overture Places."],
  ["Mobility + digital", "Phase 6 context layers. Mobility uses a WEF national baseline plus positive GTFS evidence; Digital Convenience blends connectivity, digital payments and WEF ICT readiness."],
  ["City usability", "Phase 7 combines Amenity Depth (60%), Mobility (20%) and Digital Convenience (20%) geometrically, with separate evidence coverage. It helps compare returned city candidates but does not change the country ranking."],
  ["Quality-adjusted value", "The final country score is Structural Value Factor × Comfort penalty × Service Depth penalty × Stability penalty, followed by the bounded FX Opportunity overlay and 0–100 normalization."],
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
    const priority = priorityFields.map((field) => sourceRegistry[field]).filter((field): field is SourceField => Boolean(field));
    const prioritySet = new Set(priorityFields);
    const remaining = Object.values(sourceRegistry).filter((field) => !prioritySet.has(field.field_name));
    return [...priority, ...remaining].slice(0, 28);
  }, [sourceRegistry]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/75 p-4 backdrop-blur-sm sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl" initial={{ y: 28, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 28, scale: 0.98 }} onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Methodology · Phase 7</p><h2 className="mt-1 text-xl font-semibold text-white">Direct purchasing power first; usability as explicit floors and city context.</h2></div>
              <Button type="button" variant="outline" size="icon-sm" className="border-white/10 bg-white/5 text-zinc-300" onClick={onClose} aria-label="Close methodology"><X className="h-4 w-4" /></Button>
            </div>

            <div className="overflow-y-auto p-6">
              {isLoading && !methodology ? <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-sm text-zinc-400">Loading methodology...</div> : (
                <div className="space-y-8">
                  <section className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 md:col-span-2"><div className="flex items-start gap-3"><BookOpen className="mt-1 h-4 w-4 text-violet-400" /><div><h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-300">Current model</h3><p className="mt-2 text-sm leading-6 text-zinc-400">{methodology?.current_model_status ?? "Phase 7 rebuilt country ranking plus coverage-aware City Usability."}</p></div></div></div>
                    <div className="rounded-xl border border-white/10 bg-zinc-950/50 p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Target use</p><p className="mt-2 text-xs leading-5 text-zinc-300">{methodology?.target_user ?? "Globally mobile foreign-currency holder considering a stay of several weeks to several months."}</p></div>
                  </section>

                  <section><h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-300">Model components</h3><div className="grid gap-3 md:grid-cols-2">{components.map(([label, text]) => <div key={label} className="rounded-lg border border-white/10 bg-white/5 p-4"><p className="text-sm font-semibold text-white">{label}</p><p className="mt-2 text-xs leading-5 text-zinc-400">{text}</p></div>)}</div></section>

                  <section><h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-300">Known limitations</h3><div className="grid gap-2 md:grid-cols-2">{(methodology?.known_limitations ?? []).map((item) => <div key={item} className="rounded-lg border border-white/10 bg-zinc-950/50 p-3 text-xs leading-5 text-zinc-400">{item}</div>)}</div></section>

                  <section>
                    <div className="mb-3 flex items-center gap-2"><Database className="h-4 w-4 text-blue-400" /><h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-300">Source registry snapshot</h3></div>
                    <div className="overflow-hidden rounded-lg border border-white/10"><div className="grid grid-cols-[1.1fr_1fr_0.7fr] bg-zinc-950/80 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500"><span>Field</span><span>Source</span><span>Type</span></div>{sourceFields.map((field) => <div key={field.field_name} className="grid grid-cols-[1.1fr_1fr_0.7fr] gap-4 border-t border-white/10 px-4 py-3 text-xs"><div><p className="font-medium text-zinc-100">{field.label}</p><p className="mt-1 text-[10px] text-zinc-500">{field.indicator ?? field.field_name}</p></div><p className="leading-5 text-zinc-400">{field.source}</p><div><p className="text-zinc-300">{field.field_type}</p><p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-zinc-500">{field.recommended_confidence}</p></div></div>)}</div>
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
