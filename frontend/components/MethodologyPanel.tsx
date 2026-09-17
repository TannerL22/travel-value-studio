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

type ComponentMetadata = {
  label: string;
  current_definition: string;
  measures: string;
  caveat: string;
};

type MethodologySummary = {
  thesis: string;
  current_model_status: string;
  known_limitations: string[];
  component_fields: string[];
  data_quality_fields: string[];
  components: Record<string, ComponentMetadata>;
};

type MethodologyPanelProps = {
  apiUrl: (path: string) => string;
  isOpen: boolean;
  onClose: () => void;
};

const priorityFields = [
  "ppp_private_lcu_per_int",
  "tourism_pp_power",
  "fx_lcu_per_usd",
  "fx_tailwind_recent_ratio",
  "fx_tailwind_signal",
  "intl_arrivals",
  "wgi_political_stability",
  "currency",
];

const phaseOneComponents = [
  ["Structural purchasing power", "Broad destination purchasing power relative to the selected origin. It is an index, not a personal daily-budget estimate."],
  ["FX opportunity", "Existing origin-aware 1Y/3Y FX signal. Phase 2 will add shorter horizons and make FX opportunity directly affect ranking."],
  ["Basic comfort", "The current GDP-PPP comfort floor, relabelled as a temporary proxy until direct basic-services data replace it."],
  ["Service depth", "The current tourism-depth signal, relabelled as a temporary usability proxy. It is still mainly driven by arrivals."],
  ["Stability", "The current WGI-led political-stability signal. It should not be read as a complete crime or personal-safety measure."],
  ["Quality-adjusted value", "The current production score. Phase 1 changes semantics and outputs; it deliberately does not redesign the score."],
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
    return [...priority, ...remaining].slice(0, 12);
  }, [sourceRegistry]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/75 p-4 backdrop-blur-sm sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl" initial={{ y: 28, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 28, scale: 0.98 }} onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Methodology · Phase 1</p>
                <h2 className="mt-1 text-xl font-semibold text-white">Where does my foreign currency buy the most usable quality of life?</h2>
              </div>
              <Button type="button" variant="outline" size="icon-sm" className="border-white/10 bg-white/5 text-zinc-300" onClick={onClose} aria-label="Close methodology"><X className="h-4 w-4" /></Button>
            </div>

            <div className="overflow-y-auto p-6">
              {isLoading && !methodology ? (
                <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-sm text-zinc-400">Loading methodology...</div>
              ) : (
                <div className="space-y-8">
                  <section className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-5">
                    <div className="flex items-start gap-3">
                      <BookOpen className="mt-1 h-4 w-4 text-emerald-400" />
                      <div>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-200">Product question</h3>
                        <p className="mt-2 text-sm leading-6 text-zinc-300">
                          Travel Value Studio screens destinations for a globally mobile person who holds or earns in a foreign currency and may spend several weeks or months abroad. It asks where broad local prices are cheap in that currency, then applies adjustable penalties for weak comfort, service depth, and stability. Airfare and travel time are intentionally outside scope.
                        </p>
                        <p className="mt-3 text-xs leading-5 text-zinc-500">
                          Phase 1 removes the old home-daily-budget anchor and stops presenting macro purchasing power as an estimated daily trip cost. The underlying production ranking formula is otherwise unchanged.
                        </p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-300">Phase 1 component contract</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      {phaseOneComponents.map(([label, description]) => (
                        <div key={label} className="rounded-lg border border-white/10 bg-white/5 p-4">
                          <p className="text-sm font-semibold text-white">{label}</p>
                          <p className="mt-2 text-xs leading-5 text-zinc-400">{description}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-300">Current limitations</h3>
                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="rounded-lg border border-white/10 bg-zinc-950/50 p-3 text-xs leading-5 text-zinc-400">Private-consumption PPP is broad household consumption, not a furnished-rental or expat basket.</div>
                      <div className="rounded-lg border border-white/10 bg-zinc-950/50 p-3 text-xs leading-5 text-zinc-400">Basic comfort is still approximated from GDP PPP rather than direct water, sanitation, electricity, connectivity, and health data.</div>
                      <div className="rounded-lg border border-white/10 bg-zinc-950/50 p-3 text-xs leading-5 text-zinc-400">Service depth is still mainly an arrivals proxy and does not yet measure restaurants, housing, transit, amenities, or digital convenience directly.</div>
                      <div className="rounded-lg border border-white/10 bg-zinc-950/50 p-3 text-xs leading-5 text-zinc-400">Origin-aware FX is displayed but does not yet directly re-order the production score. That is Phase 2.</div>
                    </div>
                  </section>

                  <section>
                    <div className="mb-3 flex items-center gap-2">
                      <Database className="h-4 w-4 text-blue-400" />
                      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-300">Source registry snapshot</h3>
                    </div>
                    <div className="overflow-hidden rounded-lg border border-white/10">
                      <div className="grid grid-cols-[1fr_1fr_0.8fr] bg-zinc-950/80 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500"><span>Field</span><span>Source</span><span>Type</span></div>
                      {sourceFields.map((field) => (
                        <div key={field.field_name} className="grid grid-cols-[1fr_1fr_0.8fr] gap-4 border-t border-white/10 px-4 py-3 text-xs">
                          <div><p className="font-medium text-zinc-100">{field.label}</p><p className="mt-1 text-[10px] text-zinc-500">{field.field_name}</p></div>
                          <p className="leading-5 text-zinc-400">{field.source}</p>
                          <div><p className="text-zinc-300">{field.field_type}</p><p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-zinc-500">{field.recommended_confidence}</p></div>
                        </div>
                      ))}
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
